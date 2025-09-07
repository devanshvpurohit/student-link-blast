-- Add voice message support to messages table
ALTER TABLE public.messages 
ADD COLUMN voice_note_url TEXT,
ADD COLUMN voice_note_duration INTEGER;

-- Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', false);

-- Create policies for voice notes storage
CREATE POLICY "Users can upload voice notes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view voice notes in their conversations" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their voice notes" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);