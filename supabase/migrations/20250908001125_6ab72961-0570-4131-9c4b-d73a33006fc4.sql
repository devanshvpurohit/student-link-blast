-- Create club_messages table for vanishing chat messages
CREATE TABLE public.club_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  viewed_by JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.club_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for club messages
CREATE POLICY "Club members can view messages in their clubs" 
ON public.club_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.club_members 
    WHERE club_id = club_messages.club_id 
    AND user_id = auth.uid() 
    AND status = 'approved'
  )
  AND expires_at > now()
);

CREATE POLICY "Club members can send messages to their clubs" 
ON public.club_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.club_members 
    WHERE club_id = club_messages.club_id 
    AND user_id = auth.uid() 
    AND status = 'approved'
  )
);

CREATE POLICY "Senders can update their own messages" 
ON public.club_messages 
FOR UPDATE 
USING (auth.uid() = sender_id);

-- Create function to automatically delete expired messages
CREATE OR REPLACE FUNCTION public.delete_expired_club_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.club_messages 
  WHERE expires_at <= now();
END;
$$;

-- Create function to mark message as viewed
CREATE OR REPLACE FUNCTION public.mark_club_message_viewed(message_id UUID, user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.club_messages 
  SET viewed_by = viewed_by || jsonb_build_array(user_id)
  WHERE id = message_id 
  AND NOT viewed_by ? user_id::text;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_club_messages_updated_at
BEFORE UPDATE ON public.club_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_club_messages_club_id ON public.club_messages(club_id);
CREATE INDEX idx_club_messages_expires_at ON public.club_messages(expires_at);

-- Enable realtime for club messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_messages;