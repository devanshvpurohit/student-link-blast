import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Trophy, Rocket, Github, ExternalLink, ThumbsUp, Plus, Award, Sparkles, Trash2,
} from 'lucide-react';
import { getRandomQuote } from '@/utils/quotes';

type Project = Database['public']['Tables']['projects']['Row'] & {
  submitter: {
    full_name: string | null;
    avatar_url: string | null;
    department: string | null;
  } | null;
};

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

const Projects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteBusy, setVoteBusy] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [{ data, error }, { data: votes }] = await Promise.all([
      supabase
        .from('projects')
        .select('*, submitter:profiles!projects_submitted_by_fkey(full_name, avatar_url, department)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('project_votes')
        .select('project_id')
        .eq('user_id', user.id),
    ]);

    if (error) {
      console.error('Error loading projects:', error);
    } else {
      setProjects((data || []) as Project[]);
    }
    setMyVotes(new Set((votes || []).map(v => v.project_id)));
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const winner = useMemo(() => {
    const thisMonth = projects.filter(p => p.month === currentMonth);
    const ranked = [...thisMonth].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return ranked[0] || null;
  }, [projects, currentMonth]);

  const toggleVote = async (project: Project) => {
    if (!user || voteBusy) return;
    const projectId = project.id;
    const hasVoted = myVotes.has(projectId);
    setVoteBusy(projectId);

    const { error } = hasVoted
      ? await supabase
          .from('project_votes')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', user.id)
      : await supabase
          .from('project_votes')
          .insert({ project_id: projectId, user_id: user.id });

    if (error) {
      toast({ title: 'Error', description: 'Could not update vote', variant: 'destructive' });
    } else {
      setMyVotes(prev => {
        const next = new Set(prev);
        if (hasVoted) next.delete(projectId);
        else next.add(projectId);
        return next;
      });
      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? { ...p, likes: Math.max(0, (p.likes || 0) + (hasVoted ? -1 : 1)) }
            : p
        )
      );
    }
    setVoteBusy(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !description.trim()) {
      toast({ title: 'Almost there', description: 'Title and description are required', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase
      .from('projects')
      .insert({
        title: title.trim(),
        description: description.trim(),
        tech_stack: techStack.split(',').map(t => t.trim()).filter(Boolean),
        github_url: githubUrl.trim() || null,
        demo_url: demoUrl.trim() || null,
        submitted_by: user.id,
      });

    if (error) {
      toast({ title: 'Error', description: 'Could not submit project', variant: 'destructive' });
    } else {
      toast({ title: 'Project submitted!', description: 'Good luck — the campus will vote on it.' });
      setIsOpen(false);
      setTitle('');
      setDescription('');
      setTechStack('');
      setGithubUrl('');
      setDemoUrl('');
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    setIsDeleting(true);
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', deleteTarget.id)
      .eq('submitted_by', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Could not remove project', variant: 'destructive' });
    } else {
      toast({ title: 'Project removed' });
      setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
    setIsDeleting(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            Projects of the Month
          </h1>
          <p className="text-muted-foreground text-sm">
            Show off your builds. The campus votes — the best one takes the crown.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Submit a Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Submit your project
              </DialogTitle>
              <DialogDescription>
                Anyone can post. The most-liked project this month becomes the Project of the Month.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Campus Food Finder"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">What does it do?</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Short pitch — what problem it solves, how it works..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tech">Tech stack (comma separated)</Label>
                <Input
                  id="tech"
                  value={techStack}
                  onChange={e => setTechStack(e.target.value)}
                  placeholder="React, Supabase, Python"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub URL</Label>
                  <Input
                    id="github"
                    value={githubUrl}
                    onChange={e => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo">Demo URL</Label>
                  <Input
                    id="demo"
                    value={demoUrl}
                    onChange={e => setDemoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Project'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Winner banner */}
      {winner && (
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-amber-50/60">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-amber-400/20 flex items-center justify-center shrink-0">
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-amber-400 text-amber-950 hover:bg-amber-400 gap-1">
                  <Award className="h-3 w-3" /> Project of the Month
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {MONTH_FORMATTER.format(new Date(`${winner.month}-01T00:00:00`))}
                </span>
              </div>
              <h2 className="text-xl font-bold mt-2 truncate">{winner.title}</h2>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{winner.description}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">
                  by {winner.submitter?.full_name || 'Anonymous'}
                </span>
                {winner.tech_stack?.slice(0, 4).map(t => (
                  <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            </div>
            <Button
              variant={myVotes.has(winner.id) ? 'default' : 'outline'}
              className="shrink-0 gap-2"
              onClick={() => toggleVote(winner)}
              disabled={!!voteBusy}
            >
              <ThumbsUp className="h-4 w-4" />
              {winner.likes || 0} {myVotes.has(winner.id) ? 'Voted' : 'Vote'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* All projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="col-span-full text-center py-12 text-muted-foreground animate-pulse">
            Loading projects...
          </p>
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center py-16 border border-dashed rounded-3xl bg-white/5 border-white/10 space-y-6">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <div className="max-w-xs mx-auto space-y-2 px-4">
              <p className="text-muted-foreground text-sm font-medium">No projects yet — be the first!</p>
              <div className="pt-4 border-t border-white/5 italic text-base font-handwriting tracking-tight text-foreground/80">
                "{getRandomQuote('motivational')}"
              </div>
            </div>
          </div>
        ) : (
          projects.map(project => (
            <Card key={project.id} className="hover:border-primary/40 transition-colors flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg leading-snug">{project.title}</CardTitle>
                  {project.id === winner?.id && (
                    <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
                  )}
                </div>
                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {project.tech_stack.slice(0, 4).map(t => (
                      <Badge key={t} variant="secondary" className="text-[10px] px-1.5">{t}</Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
                <p className="text-xs text-muted-foreground/70 mt-3">
                  by {project.submitter?.full_name || 'Anonymous'}
                  {project.submitter?.department ? ` · ${project.submitter.department}` : ''}
                </p>
                {project.month && project.month !== currentMonth && (
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    {MONTH_FORMATTER.format(new Date(`${project.month}-01T00:00:00`))}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2 pt-0">
                <div className="flex gap-1">
                  {project.github_url && (
                    <Button size="icon" variant="ghost" asChild>
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer" title="GitHub">
                        <Github className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {project.demo_url && (
                    <Button size="icon" variant="ghost" asChild>
                      <a href={project.demo_url} target="_blank" rel="noopener noreferrer" title="Live demo">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {project.submitted_by === user?.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Remove project" onClick={() => setDeleteTarget(project)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove this project?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{project.title}" and all its votes will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isDeleting}
                            onClick={handleDelete}
                          >
                            {isDeleting ? 'Removing...' : 'Remove'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={myVotes.has(project.id) ? 'default' : 'outline'}
                  className="gap-1.5"
                  onClick={() => toggleVote(project)}
                  disabled={!!voteBusy}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {project.likes || 0}
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Projects;