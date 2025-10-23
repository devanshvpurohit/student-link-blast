-- Allow users to delete their own connections
CREATE POLICY "Users can delete their connections"
ON public.connections
FOR DELETE
USING ((auth.uid() = requester_id) OR (auth.uid() = receiver_id));