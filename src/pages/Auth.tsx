import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

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

    if (isForgotPassword) {
      await resetPassword(email);
      setIsForgotPassword(false);
    } else if (isResetPassword) {
      if (newPassword !== confirmPassword) {
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

    setLoading(false);
  };

  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setIsResetPassword(false);
  };

  const handleForgotPassword = () => {
    setIsForgotPassword(true);
    setIsSignUp(false);
    setIsResetPassword(false);
  };

  const handleBackToSignIn = () => {
    setIsForgotPassword(false);
    setIsResetPassword(false);
    setIsSignUp(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center px-4 sm:px-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">Bazinga</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {isResetPassword 
              ? 'Reset your password' 
              : isForgotPassword 
              ? 'Reset your password' 
              : isSignUp 
              ? 'Create your account' 
              : 'Welcome back'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isResetPassword ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Loading...' : 'Update Password'}
                </Button>
              </>
            ) : isForgotPassword ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Loading...' : 'Send Reset Link'}
                </Button>
              </>
            ) : (
              <>
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {!isSignUp && (
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 h-auto text-xs sm:text-sm"
                    onClick={handleForgotPassword}
                  >
                    Forgot password?
                  </Button>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                </Button>
              </>
            )}
          </form>
          
          {!isResetPassword && (
            <>
              <Separator className="my-4" />
              
              <div className="text-center">
                {isForgotPassword ? (
                  <Button
                    variant="ghost"
                    onClick={handleBackToSignIn}
                  >
                    Back to sign in
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleModeSwitch}
                  >
                    {isSignUp 
                      ? 'Already have an account? Sign in' 
                      : "Don't have an account? Sign up"
                    }
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;