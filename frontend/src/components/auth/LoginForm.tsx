
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { LockIcon, MailIcon, UserIcon, PillIcon, PackageIcon } from 'lucide-react';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both username and password"
      });
      return;
    }

    setIsPending(true);

    try {
      await login(username, password);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in."
      });
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid credentials. Please try again.';
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage
      });
    } finally {
      setIsPending(false);
    }
  };

  // Example login credentials
  const handleDemoLogin = (role: string) => {
    switch (role) {
      case 'patient':
        setUsername('patient@example.com');
        setPassword('password');
        break;
      case 'receptionist':
        setUsername('receptionist@example.com');
        setPassword('password');
        break;
      case 'clinician':
        setUsername('clinician@example.com');
        setPassword('password');
        break;
      case 'pharmacy':
        setUsername('pharmacy@example.com');
        setPassword('password');
        break;
      case 'warehousemanager':
        setUsername('warehouse@example.com');
        setPassword('password');
        break;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto glass-panel">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">Enter your credentials to sign in</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Username or Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-muted-foreground text-center">
          Demo Accounts (Click to autofill)
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDemoLogin('patient')}
            className="flex-1"
          >
            <UserIcon className="mr-2 h-4 w-4" />
            Patient
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDemoLogin('receptionist')}
            className="flex-1"
          >
            <UserIcon className="mr-2 h-4 w-4" />
            Receptionist
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDemoLogin('clinician')}
            className="flex-1"
          >
            <UserIcon className="mr-2 h-4 w-4" />
            Clinician
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDemoLogin('pharmacy')}
            className="flex-1"
          >
            <PillIcon className="mr-2 h-4 w-4" />
            Pharmacy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDemoLogin('warehousemanager')}
            className="flex-1"
          >
            <PackageIcon className="mr-2 h-4 w-4" /> {/* Using PackageIcon for warehouse */}
            Warehouse Manager
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
