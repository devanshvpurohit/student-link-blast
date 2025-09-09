import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Timer, Eye, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ClubMessage {
  id: string;
  content: string;
  message_type: string;
  expires_at: string;
  viewed_by: any; // JSONB array from database
  created_at: string;
  sender_id: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ClubChatProps {
  clubId: string;
  clubName: string;
}

const ClubChat = ({ clubId, clubName }: ClubChatProps) => {
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [expirationTime, setExpirationTime] = useState('60'); // seconds
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    setupRealtimeSubscription();
    
    // Set up interval to check for expired messages
    const interval = setInterval(removeExpiredMessages, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [clubId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('club_messages')
      .select(`
        *,
        profiles(full_name, avatar_url)
      `)
      .eq('club_id', clubId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      // Process viewed_by field to ensure it's an array
      const processedMessages = (data || []).map(msg => ({
        ...msg,
        viewed_by: Array.isArray(msg.viewed_by) ? msg.viewed_by : []
      }));
      setMessages(processedMessages);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('club-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'club_messages',
          filter: `club_id=eq.${clubId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          // Fetch the complete message with profile data
          fetchMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'club_messages',
          filter: `club_id=eq.${clubId}`,
        },
        (payload) => {
          console.log('Message updated:', payload);
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, ...payload.new }
                : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const removeExpiredMessages = () => {
    const now = new Date();
    setMessages(prev => 
      prev.filter(msg => new Date(msg.expires_at) > now)
    );
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + parseInt(expirationTime));

    const { error } = await supabase
      .from('club_messages')
      .insert({
        club_id: clubId,
        sender_id: user?.id,
        content: newMessage.trim(),
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage('');
    }
  };

  const markAsViewed = async (messageId: string) => {
    if (!user?.id) return;

    const { error } = await supabase.rpc(
      'mark_club_message_viewed',
      { 
        message_id: messageId,
        user_id: user.id 
      }
    );

    if (error) {
      console.error('Error marking message as viewed:', error);
    }
  };

  const formatTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const timeLeft = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 1000));
    
    if (timeLeft < 60) {
      return `${timeLeft}s`;
    } else {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      return `${minutes}m ${seconds}s`;
    }
  };

  const getExpirationColor = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const timeLeft = Math.floor((expiry.getTime() - now.getTime()) / 1000);
    
    if (timeLeft < 10) return 'text-destructive';
    if (timeLeft < 30) return 'text-orange-500 dark:text-orange-400';
    return 'text-muted-foreground';
  };

  return (
    <Card className="h-[500px] sm:h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Timer className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">{clubName} Chat</span>
          <span className="sm:hidden">Chat</span>
          <span className="text-xs sm:text-sm font-normal text-muted-foreground">
            <span className="hidden sm:inline">(Messages vanish after viewing)</span>
            <span className="sm:hidden">(Vanish)</span>
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 bg-muted/30 rounded">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Timer className="h-8 w-8 mx-auto mb-2" />
              <p>No messages yet. Start a conversation!</p>
              <p className="text-sm">Messages will disappear after the timer expires</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${
                  message.sender_id === user?.id 
                    ? 'bg-primary/10 ml-4 sm:ml-8' 
                    : 'bg-background mr-4 sm:mr-8'
                } hover:shadow-sm transition-all cursor-pointer`}
                onClick={() => markAsViewed(message.id)}
              >
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                  <AvatarImage src={message.profiles.avatar_url} />
                  <AvatarFallback>
                    {message.profiles.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-1">
                    <span className="text-xs sm:text-sm font-medium truncate">
                      {message.profiles.full_name}
                    </span>
                    <div className={`flex items-center gap-1 text-xs ${getExpirationColor(message.expires_at)}`}>
                      <Clock className="h-3 w-3" />
                      {formatTimeLeft(message.expires_at)}
                    </div>
                    {Array.isArray(message.viewed_by) && message.viewed_by.includes(user?.id || '') && (
                      <Eye className="h-3 w-3 text-blue-500" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm break-words">{message.content}</p>
                  {Array.isArray(message.viewed_by) && message.viewed_by.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Viewed by {message.viewed_by.length} member(s)
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="space-y-3">
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Expires in:</span>
            <Select value={expirationTime} onValueChange={setExpirationTime}>
              <SelectTrigger className="w-32 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 seconds</SelectItem>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
                <SelectItem value="600">10 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubChat;