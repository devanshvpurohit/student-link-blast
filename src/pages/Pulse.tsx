import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Megaphone, Newspaper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  title: string;
  content: string;
  type: 'news' | 'event' | 'announcement' | 'general';
  is_admin_post: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
}

const Pulse = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'news' | 'event' | 'announcement' | 'general'>('general');
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles(full_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } else {
      setPosts((data || []) as Post[]);
    }
  };

  const createPost = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('posts')
      .insert({
        title: title.trim(),
        content: content.trim(),
        type,
        created_by: user?.id,
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
        description: "Post created successfully!",
      });
      setTitle('');
      setContent('');
      setType('general');
      setIsOpen(false);
      fetchPosts();
    }
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'news': return <Newspaper className="h-4 w-4 text-blue-500" />;
      case 'event': return <Calendar className="h-4 w-4 text-green-500" />;
      case 'announcement': return <Megaphone className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'news': return 'bg-blue-500';
      case 'event': return 'bg-green-500';
      case 'announcement': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Campus Pulse</h1>
        
        {user && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Post title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <Select value={type} onValueChange={(value: any) => setType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select post type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Textarea
                    placeholder="What's happening on campus?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <Button onClick={createPost} className="w-full">
                  Publish Post
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={post.profiles.avatar_url} />
                    <AvatarFallback>
                      {post.profiles.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{post.profiles.full_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {post.is_admin_post && (
                    <Badge variant="destructive">Admin</Badge>
                  )}
                  <Badge variant="secondary" className="gap-1">
                    {getPostIcon(post.type)}
                    {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <CardTitle className="text-xl">{post.title}</CardTitle>
            </CardHeader>
            
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
            </CardContent>
          </Card>
        ))}
        
        {posts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Pulse;