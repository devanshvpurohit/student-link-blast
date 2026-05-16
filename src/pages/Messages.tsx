import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { VoiceNoteRecorder } from '@/components/VoiceNoteRecorder';
import { VoiceNotePlayer } from '@/components/VoiceNotePlayer';
import { ImagePicker } from '@/components/ImagePicker';
import { ImageMessage } from '@/components/ImageMessage';

interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  connection_type: string;
  other_profile: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
    voice_note_url?: string;
    image_url?: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  voice_note_url?: string;
  voice_note_duration?: number;
  image_url?: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
}

const Messages = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConnection) {
      fetchMessages(selectedConnection.id);
      
      const subscription = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `connection_id=eq.${selectedConnection.id}`,
          },
          (payload) => {
            fetchMessages(selectedConnection.id);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedConnection]);

  const fetchConnections = async () => {
    const { data, error } = await supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey(id, full_name, avatar_url),
        receiver:profiles!connections_receiver_id_fkey(id, full_name, avatar_url)
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user?.id},receiver_id.eq.${user?.id}`);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load connections",
        variant: "destructive",
      });
      return;
    }

    const connectionsWithMessages = await Promise.all(
      (data || []).map(async (connection) => {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at, sender_id, voice_note_url, image_url')
          .eq('connection_id', connection.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const otherProfile = connection.requester_id === user?.id 
          ? connection.receiver 
          : connection.requester;

        return {
          ...connection,
          other_profile: otherProfile,
          last_message: lastMessage,
        };
      })
    );

    setConnections(connectionsWithMessages);
  };

  const fetchMessages = async (connectionId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles(full_name, avatar_url)
      `)
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } else {
      setMessages(data || []);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !selectedConnection || !user) return;

    setLoading(true);

    try {
      let imageUrl: string | null = null;

      if (selectedImage) {
        const fileName = `${user.id}/${Date.now()}-${selectedImage.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('chat-images')
          .getPublicUrl(uploadData.path);

        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          connection_id: selectedConnection.id,
          sender_id: user.id,
          content: newMessage.trim() || (imageUrl ? '' : ''),
          image_url: imageUrl,
        });

      if (error) throw error;

      setNewMessage('');
      setSelectedImage(null);
      fetchMessages(selectedConnection.id);
      fetchConnections();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSendVoiceNote = async (audioBlob: Blob, duration: number) => {
    if (!selectedConnection || !user) return;

    setLoading(true);

    try {
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-notes')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('voice-notes')
        .getPublicUrl(uploadData.path);

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          connection_id: selectedConnection.id,
          sender_id: user.id,
          content: '',
          voice_note_url: urlData.publicUrl,
          voice_note_duration: duration,
        });

      if (messageError) throw messageError;

      fetchMessages(selectedConnection.id);
      fetchConnections();
      setShowVoiceRecorder(false);
      
      toast({
        title: "Sent",
        description: "Voice message delivered",
      });
      
    } catch (error) {
      console.error('Error sending voice note:', error);
      toast({
        title: "Error",
        description: "Failed to send voice message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row animate-in">
      {/* Connections Sidebar */}
      <div className="lg:w-80 border-r lg:border-b-0 border-b bg-card">
        <div className="p-4 border-b">
          <p className="text-sm text-muted-foreground mb-1">Your Chats</p>
          <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
        </div>
        
        <ScrollArea className="h-48 lg:h-[calc(100vh-100px)]">
          <div className="p-2">
            {connections.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-muted-foreground">No connections yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start connecting with others</p>
              </div>
            ) : (
              connections.map((connection) => (
                <div
                  key={connection.id}
                  className={`p-3 rounded-md cursor-pointer transition-colors mb-1 ${
                    selectedConnection?.id === connection.id 
                      ? 'bg-accent/10' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedConnection(connection)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={connection.other_profile.avatar_url} />
                      <AvatarFallback className="bg-accent/10 text-accent">
                        {connection.other_profile.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm truncate">
                          {connection.other_profile.full_name}
                        </h3>
                        <Badge variant="secondary" className="text-xs hidden lg:block">
                          {connection.connection_type}
                        </Badge>
                      </div>
                      
                      {connection.last_message && (
                        <div className="text-xs text-muted-foreground">
                          <p className="truncate">
                            {connection.last_message.sender_id === user?.id && 'You: '}
                            {connection.last_message.voice_note_url 
                              ? 'Voice message' 
                              : connection.last_message.image_url 
                                ? 'Photo'
                                : connection.last_message.content}
                          </p>
                          <p className="text-xs mt-0.5">
                            {formatDistanceToNow(new Date(connection.last_message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConnection ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 border border-accent/20">
                  <AvatarImage src={selectedConnection.other_profile.avatar_url} />
                  <AvatarFallback className="bg-accent/10 text-accent">
                    {selectedConnection.other_profile.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedConnection.other_profile.full_name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {selectedConnection.connection_type}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isMe = message.sender_id === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[85%] lg:max-w-[70%] ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Avatar className="h-8 w-8 flex-shrink-0 border border-border">
                          <AvatarImage src={message.profiles.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {message.profiles.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`rounded-lg p-3 ${isMe ? 'bg-accent text-accent-foreground' : 'bg-muted'}`}>
                          {message.voice_note_url ? (
                            <VoiceNotePlayer 
                              audioUrl={message.voice_note_url} 
                              duration={message.voice_note_duration}
                            />
                          ) : message.image_url ? (
                            <ImageMessage imageUrl={message.image_url} />
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}
                          <p className={`text-xs mt-1 ${isMe ? 'text-accent-foreground/70' : 'text-muted-foreground'}`}>
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-card">
              {showVoiceRecorder ? (
                <VoiceNoteRecorder
                  onSendVoiceNote={handleSendVoiceNote}
                  onCancel={() => setShowVoiceRecorder(false)}
                />
              ) : (
                <div className="space-y-2">
                  {selectedImage && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <div className="relative w-12 h-12 rounded overflow-hidden">
                        <img 
                          src={URL.createObjectURL(selectedImage)} 
                          alt="Selected" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground flex-1 truncate">
                        {selectedImage.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedImage(null)}
                        className="h-8 w-8 p-0"
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      disabled={loading}
                    />
                    <div className="flex space-x-1">
                      <ImagePicker
                        onImageSelect={setSelectedImage}
                        selectedImage={null}
                        onClear={() => setSelectedImage(null)}
                        disabled={loading}
                      />
                      <VoiceNoteRecorder
                        onSendVoiceNote={handleSendVoiceNote}
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={loading || (!newMessage.trim() && !selectedImage)}
                        size="sm"
                        className="btn-accent px-4"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8 card-elevated max-w-sm mx-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground text-sm">Choose a connection to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;