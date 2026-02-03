import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Loader2, Volleyball } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen sand-texture flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8 gap-3">
          <div className="w-12 h-12 bg-ocean rounded-xl flex items-center justify-center">
            <Volleyball className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-navy tracking-tight">
            VOLLEYPRO
          </h1>
        </div>

        <Card className="border-stone-200/60 shadow-soft">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-heading text-2xl text-navy">WELCOME BACK</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to manage your tournaments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-navy font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-stone-50 border-stone-200 focus:border-ocean focus:ring-ocean/20"
                  data-testid="login-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-navy font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-stone-50 border-stone-200 focus:border-ocean focus:ring-ocean/20"
                  data-testid="login-password-input"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-sunset hover:bg-sunset/90 text-white rounded-full font-semibold shadow-sunset"
                data-testid="login-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-ocean font-medium hover:underline"
                  data-testid="register-link"
                >
                  Create one
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
