import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Sparkles, Users, PenTool } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (isSignUp: boolean, e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "Oops!", description: error.message, variant: "destructive" });
    } else {
      if (isSignUp) toast({ title: "Check your inbox! 📬", description: "We sent you a confirmation email." });
      else navigate('/');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Brand Side - Notebook Style */}
      <div className="bg-primary text-primary-foreground p-8 lg:p-12 flex flex-col justify-between order-first relative overflow-hidden">
        {/* Decorative notebook lines */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full" style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, currentColor 27px, currentColor 28px)',
            backgroundPosition: '0 8px'
          }} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 font-handwriting text-3xl mb-12">
            <div className="h-10 w-10 bg-accent text-accent-foreground rounded-lg flex items-center justify-center font-bold">
              B
            </div>
            Bazinga
          </div>
          
          <h1 className="font-handwriting text-5xl lg:text-6xl mb-6" style={{ transform: 'rotate(-1deg)' }}>
            Your Campus
            <br />
            <span className="text-accent">Notebook</span> ✏️
          </h1>
          
          <p className="text-primary-foreground/80 font-handwritingAlt text-xl max-w-md leading-relaxed">
            Connect with classmates, find your match, and never miss what's happening on campus!
          </p>
          
          {/* Feature highlights */}
          <div className="mt-12 space-y-4">
            {[
              { icon: Heart, text: "Find your campus crush" },
              { icon: Users, text: "Connect with classmates" },
              { icon: Sparkles, text: "Discover campus events" },
            ].map((item, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 font-scribble text-lg"
                style={{ transform: `rotate(${i % 2 === 0 ? '-0.5' : '0.5'}deg)` }}
              >
                <item.icon className="h-5 w-5 text-accent" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="hidden lg:block text-sm opacity-60 font-scribble relative z-10">
          © 2024 Bazinga — Made with ❤️ for students
        </div>
      </div>

      {/* Form Side - Paper Style */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex items-center gap-2 justify-center lg:justify-start text-muted-foreground font-scribble text-sm mb-4">
              <PenTool className="h-4 w-4" />
              Sign in to continue
            </div>
            <h2 className="font-handwriting text-4xl">Let's get started!</h2>
            <p className="text-muted-foreground font-handwritingAlt text-lg">
              Use your university email to join ✨
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 font-handwritingAlt text-base">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={(e) => handleAuth(false, e)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-handwritingAlt text-base">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@university.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="bg-muted/30 border-2 border-dashed focus:border-solid focus:border-accent font-scribble"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-handwritingAlt text-base">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="bg-muted/30 border-2 border-dashed focus:border-solid focus:border-accent"
                  />
                </div>
                <Button type="submit" className="w-full font-handwritingAlt text-lg h-12" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Log In →"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={(e) => handleAuth(true, e)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="s-email" className="font-handwritingAlt text-base">Email</Label>
                  <Input
                    id="s-email"
                    type="email"
                    placeholder="you@university.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="bg-muted/30 border-2 border-dashed focus:border-solid focus:border-accent font-scribble"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-password" className="font-handwritingAlt text-base">Create Password</Label>
                  <Input
                    id="s-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="bg-muted/30 border-2 border-dashed focus:border-solid focus:border-accent"
                  />
                </div>
                <Button type="submit" className="w-full font-handwritingAlt text-lg h-12" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up →"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-dashed border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-scribble">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full font-handwritingAlt border-2 border-dashed hover:border-solid">
              Google
            </Button>
            <Button variant="outline" className="w-full font-handwritingAlt border-2 border-dashed hover:border-solid">
              GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
