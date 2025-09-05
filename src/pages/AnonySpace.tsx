import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowUp, ArrowDown, Plus, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface AnonPost {
  id: string;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  user_vote?: 'up' | 'down' | null;
}

const AnonySpace = () => {
  const [posts, setPosts] = useState<AnonPost[]>([]);
  const [content, setContent] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data: postsData, error: postsError } = await supabase
      .from('anon_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (postsError) {
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
      return;
    }

    // Get user votes if authenticated
    if (user && postsData) {
      const { data: votesData } = await supabase
        .from('anon_votes')
        .select('post_id, vote_type')
        .eq('user_id', user.id);

      const votesMap = new Map(votesData?.map(v => [v.post_id, v.vote_type]) || []);
      
      const postsWithVotes = postsData.map(post => ({
        ...post,
        user_vote: (votesMap.get(post.id) as 'up' | 'down') || null,
      }));
      
      setPosts(postsWithVotes);
    } else {
      setPosts(postsData || []);
    }
  };

  const createPost = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to post",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('anon_posts')
      .insert({
        content: content.trim(),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Anonymous post created!",
      });
      setContent('');
      setIsOpen(false);
      fetchPosts();
    }

    setLoading(false);
  };

  const vote = async (postId: string, voteType: 'up' | 'down') => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to vote",
        variant: "destructive",
      });
      return;
    }

    const currentPost = posts.find(p => p.id === postId);
    const currentVote = currentPost?.user_vote;

    // If same vote, remove it; if different vote, update it
    if (currentVote === voteType) {
      // Remove vote
      const { error } = await supabase
        .from('anon_votes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove vote",
          variant: "destructive",
        });
      }
    } else {
      // Add or update vote
      const { error } = await supabase
        .from('anon_votes')
        .upsert({
          post_id: postId,
          user_id: user.id,
          vote_type: voteType,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to vote",
          variant: "destructive",
        });
      }
    }

    // Refresh posts to get updated counts
    fetchPosts();
  };

  const getNetScore = (upvotes: number, downvotes: number) => {
    return upvotes - downvotes;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">AnonySpace</h1>
          <p className="text-muted-foreground">Share thoughts anonymously</p>
        </div>
        
        {user && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Anonymous Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Anonymously</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Textarea
                    placeholder="What's on your mind? (This will be posted anonymously)"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  <p>🔒 Your identity will remain completely anonymous. No one can trace this post back to you.</p>
                </div>
                
                <Button onClick={createPost} className="w-full" disabled={loading}>
                  {loading ? 'Posting...' : 'Post Anonymously'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-4">
        {posts.map((post) => {
          const netScore = getNetScore(post.upvotes, post.downvotes);
          
          return (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Voting Section */}
                  <div className="flex flex-col items-center gap-2 min-w-[60px]">
                    <Button
                      variant={post.user_vote === 'up' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => vote(post.id, 'up')}
                      disabled={!user}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    
                    <div className="text-center">
                      <div className={`font-bold ${netScore > 0 ? 'text-green-600' : netScore < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {netScore > 0 ? '+' : ''}{netScore}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {post.upvotes}↑ {post.downvotes}↓
                      </div>
                    </div>
                    
                    <Button
                      variant={post.user_vote === 'down' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => vote(post.id, 'down')}
                      disabled={!user}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">Anonymous</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {posts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No anonymous posts yet. Be the first to share!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AnonySpace;