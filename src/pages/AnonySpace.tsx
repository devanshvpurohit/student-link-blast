import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUp, ArrowDown, Plus, MessageCircle, Flag, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { getRandomQuote } from '@/utils/quotes';

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
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
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

  const reportPost = async () => {
    if (!selectedPostId || !reportReason.trim()) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to report posts",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('anon_post_reports')
      .insert({
        post_id: selectedPostId,
        reporter_id: user.id,
        reason: reportReason,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to report post",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Post reported successfully. Our team will review it.",
      });
      setReportDialogOpen(false);
      setSelectedPostId(null);
      setReportReason('');
    }
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
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Anonymous</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      {user && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPostId(post.id);
                                setReportDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Flag className="h-4 w-4 mr-2" />
                              Report Post
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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
          <Card className="border-dashed bg-white/5 border-white/10">
            <CardContent className="p-8 text-center space-y-6">
              <div className="bg-pop/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <MessageCircle className="h-8 w-8 text-pop" />
              </div>
              <div className="max-w-sm mx-auto space-y-2">
                <p className="text-muted-foreground text-sm font-medium">No anonymous posts yet.</p>
                <div className="pt-4 border-t border-white/5 italic text-lg font-handwriting tracking-tight">
                  "{getRandomQuote('thought-provoking')}"
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for reporting:</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="hate_speech">Hate Speech</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="misinformation">Misinformation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <p>🔒 Reports are reviewed by our moderation team. False reports may result in account restrictions.</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={reportPost}
                disabled={!reportReason}
                variant="destructive"
                className="flex-1"
              >
                Report Post
              </Button>
              <Button
                onClick={() => setReportDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnonySpace;