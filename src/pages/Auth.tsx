import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, ArrowRight, User, Mail, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get('reset') === 'true';

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(isResetMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signUp, signIn, resetPassword, updatePassword } = useAuth();

  useEffect(() => {
    if (isResetMode) {
      setIsResetPassword(true);
      setIsForgotPassword(false);
      setIsSignUp(false);
    }
  }, [isResetMode]);

  if (user && !isResetPassword) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        await resetPassword(email);
        setIsForgotPassword(false);
      } else if (isResetPassword) {
        if (newPassword !== confirmPassword) {
          // Toast error ideally here
          setLoading(false);
          return;
        }
        const result = await updatePassword(newPassword);
        if (!result.error) {
          setIsResetPassword(false);
          window.history.replaceState({}, '', '/auth');
        }
      } else if (isSignUp) {
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setIsResetPassword(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[150px] animate-float" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/20 blur-[150px] animate-float" style={{ animationDelay: '-4s' }} />
      </div>

      <div className="w-full max-w-md animate-scale-in z-10">
        <div className="glass-card rounded-3xl p-8 border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/25 mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">
              {isResetPassword ? 'Reset Password' : isForgotPassword ? 'Recovery' : isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-muted-foreground">
              {isResetPassword
                ? 'Enter your new password below'
                : isForgotPassword
                  ? 'We will send you a recovery link'
                  : isSignUp
                    ? 'Join the campus community today'
                    : 'Enter your credentials to access your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isResetPassword ? (
              <>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      className="pl-10 bg-black/20 border-white/10 focus:border-primary/50"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      className="pl-10 bg-black/20 border-white/10 focus:border-primary/50"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? <span className="animate-spin mr-2">⏳</span> : 'Update Password'}
                </Button>
              </>
            ) : isForgotPassword ? (
              <>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      className="pl-10 bg-black/20 border-white/10 focus:border-primary/50"
                      placeholder="student@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? <span className="animate-spin mr-2">⏳</span> : 'Send Reset Link'}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setIsForgotPassword(false)}>
                  Back to Sign In
                </Button>
              </>
            ) : (
              <>
                {isSignUp && (
                  <div className="space-y-2 animate-fade-in">
                    <Label>Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        className="pl-10 bg-black/20 border-white/10 focus:border-primary/50"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      className="pl-10 bg-black/20 border-white/10 focus:border-primary/50"
                      placeholder="student@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Password</Label>
                    {!isSignUp && (
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setIsSignUp(false);
                        }}
                      >
                        Forgot password?
                      </Button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      className="pl-10 bg-black/20 border-white/10 focus:border-primary/50"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow" disabled={loading}>
                  {loading ? (
                    <span className="animate-spin mr-2">⏳</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {isSignUp ? 'Create Account' : 'Sign In'}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </>
            )}
          </form>

          {!isResetPassword && !isForgotPassword && (
            <div className="mt-6 text-center animate-fade-in">
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <p className="text-muted-foreground text-sm">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
                <button
                  type="button"
                  className="ml-1 text-primary hover:underline font-medium focus:outline-none"
                  onClick={toggleMode}
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;