import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { VoiceNoteRecorder } from '@/components/VoiceNoteRecorder';
import { VoiceNotePlayer } from '@/components/VoiceNotePlayer';

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
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  voice_note_url?: string;
  voice_note_duration?: number;
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
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConnection) {
      fetchMessages(selectedConnection.id);
      
      // Set up real-time subscription for messages
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

    // Get last message for each connection
    const connectionsWithMessages = await Promise.all(
      (data || []).map(async (connection) => {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at, sender_id, voice_note_url')
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
    if (!newMessage.trim() || !selectedConnection) return;

    setLoading(true);

    const { error } = await supabase
      .from('messages')
      .insert({
        connection_id: selectedConnection.id,
        sender_id: user?.id,
        content: newMessage.trim(),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage('');
      fetchMessages(selectedConnection.id);
      fetchConnections(); // Update last message in sidebar
    }

    setLoading(false);
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
      // Upload voice note to storage
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-notes')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('voice-notes')
        .getPublicUrl(uploadData.path);

      // Insert message with voice note URL
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          connection_id: selectedConnection.id,
          sender_id: user.id,
          content: '', // Empty content for voice messages
          voice_note_url: urlData.publicUrl,
          voice_note_duration: duration,
        });

      if (messageError) throw messageError;

      fetchMessages(selectedConnection.id);
      fetchConnections();
      setShowVoiceRecorder(false);
      
      toast({
        title: "Voice message sent",
        description: "Your voice message has been sent successfully",
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
    <div className="h-screen flex flex-col lg:flex-row">
      {/* Connections Sidebar */}
      <div className="lg:w-80 border-r lg:border-b-0 border-b bg-card">
        <div className="p-3 lg:p-4 border-b">
          <h2 className="text-base lg:text-lg font-semibold">Messages</h2>
        </div>
        
        <ScrollArea className="h-48 lg:h-[calc(100vh-80px)]">
          <div className="p-2">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className={`p-2 lg:p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                  selectedConnection?.id === connection.id ? 'bg-accent' : ''
                }`}
                onClick={() => setSelectedConnection(connection)}
              >
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
                    <AvatarImage src={connection.other_profile.avatar_url} />
                    <AvatarFallback className="text-xs lg:text-sm">
                      {connection.other_profile.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm lg:text-base font-medium truncate">
                        {connection.other_profile.full_name}
                      </h3>
                      <Badge variant="secondary" className="text-xs hidden lg:block">
                        {connection.connection_type}
                      </Badge>
                    </div>
                    
                    {connection.last_message && (
                      <div className="text-xs lg:text-sm text-muted-foreground">
                        <p className="truncate">
                          {connection.last_message.sender_id === user?.id && 'You: '}
                          {connection.last_message.voice_note_url ? '🎤 Voice message' : connection.last_message.content}
                        </p>
                        <p className="text-xs">
                          {formatDistanceToNow(new Date(connection.last_message.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConnection ? (
          <>
            {/* Chat Header */}
            <div className="p-3 lg:p-4 border-b bg-card">
              <div className="flex items-center space-x-2 lg:space-x-3">
                <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
                  <AvatarImage src={selectedConnection.other_profile.avatar_url} />
                  <AvatarFallback className="text-xs lg:text-sm">
                    {selectedConnection.other_profile.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm lg:text-base font-semibold">{selectedConnection.other_profile.full_name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {selectedConnection.connection_type} connection
                  </Badge>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-2 lg:p-4">
              <div className="space-y-3 lg:space-y-4">
                {messages.map((message) => {
                  const isMe = message.sender_id === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[85%] lg:max-w-[70%] ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Avatar className="h-6 w-6 lg:h-8 lg:w-8 flex-shrink-0">
                          <AvatarImage src={message.profiles.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {message.profiles.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`rounded-lg p-2 lg:p-3 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {message.voice_note_url ? (
                            <VoiceNotePlayer 
                              audioUrl={message.voice_note_url} 
                              duration={message.voice_note_duration}
                            />
                          ) : (
                            <p className="text-sm lg:text-base whitespace-pre-wrap">{message.content}</p>
                          )}
                          <p className={`text-xs mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
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
            <div className="p-3 lg:p-4 border-t bg-card">
              {showVoiceRecorder ? (
                <VoiceNoteRecorder
                  onSendVoiceNote={handleSendVoiceNote}
                  onCancel={() => setShowVoiceRecorder(false)}
                />
              ) : (
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={loading}
                    className="text-sm lg:text-base"
                  />
                  <div className="flex space-x-1">
                    <VoiceNoteRecorder
                      onSendVoiceNote={handleSendVoiceNote}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={loading || !newMessage.trim()}
                      size="sm"
                      className="px-2 lg:px-4"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
              <p className="text-muted-foreground">Choose a connection to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;