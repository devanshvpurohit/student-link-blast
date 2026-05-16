import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Megaphone, Newspaper, Image as ImageIcon, Trash2, X, MessageSquare, Heart, Share2, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Post {
  id: string;
  title: string;
  content: string;
  type: 'news' | 'event' | 'announcement' | 'general';
  is_admin_post: boolean;
  created_at: string;
  created_by: string;
  image_url?: string;
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(fileName, file);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(data.path);

    return publicUrl;
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

    setIsUploading(true);

    let imageUrl = null;
    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
      if (!imageUrl) {
        setIsUploading(false);
        return;
      }
    }

    const { error } = await supabase
      .from('posts')
      .insert({
        title: title.trim(),
        content: content.trim(),
        type,
        created_by: user?.id,
        image_url: imageUrl,
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
      setSelectedImage(null);
      setImagePreview(null);
      setIsOpen(false);
      fetchPosts();
    }

    setIsUploading(false);
  };

  const deletePost = async (postId: string, imageUrl?: string) => {
    if (imageUrl) {
      const imagePath = imageUrl.split('/').pop();
      if (imagePath) {
        await supabase.storage
          .from('post-images')
          .remove([`${user?.id}/${imagePath}`]);
      }
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Post deleted successfully!",
      });
      fetchPosts();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'news': return <Newspaper className="h-4 w-4 text-blue-400" />;
      case 'event': return <Calendar className="h-4 w-4 text-green-400" />;
      case 'announcement': return <Megaphone className="h-4 w-4 text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 px-4">
      <div className="flex items-center justify-between mb-8 sticky top-20 z-30 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Campus Pulse</h1>
          <p className="text-sm text-muted-foreground">What's happening around you</p>
        </div>

        {user && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Post</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Give your post a title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white/5 border-white/10 focus:border-primary/50 text-lg font-medium"
                />

                <Select value={type} onValueChange={(value: any) => setType(value)}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="bg-white/5 border-white/10 focus:border-primary/50 resize-none"
                />

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 bg-white/5 border-white/10 hover:bg-white/10"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Add Image
                  </Button>
                </div>

                {imagePreview && (
                  <div className="relative rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <Button
                  onClick={createPost}
                  className="w-full"
                  disabled={isUploading}
                >
                  {isUploading ? 'Publishing...' : 'Publish Post'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-6">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="glass-card rounded-3xl p-6 animate-scale-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 ring-2 ring-white/10">
                  <AvatarImage src={post.profiles.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-600/20 text-primary">
                    {post.profiles.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm leading-none">{post.profiles.full_name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {post.is_admin_post && (
                  <Badge variant="destructive" className="h-5 px-2 text-[10px]">Admin</Badge>
                )}
                <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 gap-1 h-6">
                  {getPostIcon(post.type)}
                  <span className="text-xs font-normal">
                    {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                  </span>
                </Badge>

                {post.created_by === user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePost(post.id, post.image_url)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <h2 className="text-xl font-bold mb-2">{post.title}</h2>

            <div className="mb-4 text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm">
              {post.content}
            </div>

            {post.image_url && (
              <div className="mb-4 rounded-xl overflow-hidden border border-white/5">
                <img
                  src={post.image_url}
                  alt="Post content"
                  className="w-full object-cover max-h-[500px]"
                />
              </div>
            )}

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-red-400 hover:bg-red-400/10 gap-2">
                  <Heart className="h-4 w-4" />
                  <span className="text-xs">Like</span>
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">Comment</span>
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-white hover:bg-white/10">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="glass-card rounded-3xl p-12 text-center animate-fade-in">
            <div className="mx-auto h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Megaphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Likely Story</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              It looks like there are no posts yet. Be the first to share something with the campus!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pulse;