import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, ClipboardList, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('student');

  // Student form
  const [studentLoginNumber, setStudentLoginNumber] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [isStudentSignUp, setIsStudentSignUp] = useState(false);
  const [studentName, setStudentName] = useState('');

  // Clerk form
  const [clerkId, setClerkId] = useState('');
  const [clerkPassword, setClerkPassword] = useState('');

  // Admin form
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const email = `${studentLoginNumber}@student.pass`;
    
    if (isStudentSignUp) {
      const { error } = await signUp(email, studentPassword, 'student', {
        login_number: studentLoginNumber,
        full_name: studentName,
      });
      if (error) {
        toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Account created!', description: 'You can now log in.' });
        setIsStudentSignUp(false);
      }
    } else {
      const { error } = await signIn(email, studentPassword);
      if (error) {
        toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
      } else {
        navigate('/student');
      }
    }
    setLoading(false);
  };

  const handleClerkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const email = `${clerkId}@clerk.pass`;
    const { error } = await signIn(email, clerkPassword);
    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } else {
      navigate('/clerk');
    }
    setLoading(false);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(adminEmail, adminPassword);
    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } else {
      navigate('/admin');
    }
    setLoading(false);
  };

  const roleIcons = {
    student: <GraduationCap className="h-5 w-5" />,
    clerk: <ClipboardList className="h-5 w-5" />,
    admin: <Shield className="h-5 w-5" />,
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Student Pass System</h1>
          <p className="text-muted-foreground mt-2">Sign in to manage your applications</p>
        </div>

        <Card className="glass-card">
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="student" className="gap-1.5 text-xs sm:text-sm">
                  {roleIcons.student} Student
                </TabsTrigger>
                <TabsTrigger value="clerk" className="gap-1.5 text-xs sm:text-sm">
                  {roleIcons.clerk} Clerk
                </TabsTrigger>
                <TabsTrigger value="admin" className="gap-1.5 text-xs sm:text-sm">
                  {roleIcons.admin} Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student" className="mt-6">
                <CardTitle className="text-lg">Student Login</CardTitle>
                <CardDescription>Enter your login number and password</CardDescription>
                <form onSubmit={handleStudentAuth} className="mt-4 space-y-4">
                  {isStudentSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="student-name">Full Name</Label>
                      <Input id="student-name" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="John Doe" required />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="login-number">Login Number</Label>
                    <Input id="login-number" value={studentLoginNumber} onChange={(e) => setStudentLoginNumber(e.target.value)} placeholder="STU2024001" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <Input id="student-password" type="password" value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} placeholder="••••••••" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isStudentSignUp ? 'Create Account' : 'Sign In'}
                  </Button>
                  <button type="button" onClick={() => setIsStudentSignUp(!isStudentSignUp)} className="w-full text-sm text-muted-foreground hover:text-primary transition-colors">
                    {isStudentSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="clerk" className="mt-6">
                <CardTitle className="text-lg">Clerk Login</CardTitle>
                <CardDescription>Enter your clerk ID and password</CardDescription>
                <form onSubmit={handleClerkLogin} className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clerk-id">Clerk ID</Label>
                    <Input id="clerk-id" value={clerkId} onChange={(e) => setClerkId(e.target.value)} placeholder="CLK001" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clerk-password">Password</Label>
                    <Input id="clerk-password" type="password" value={clerkPassword} onChange={(e) => setClerkPassword(e.target.value)} placeholder="••••••••" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin" className="mt-6">
                <CardTitle className="text-lg">Admin Login</CardTitle>
                <CardDescription>Secure administrator access</CardDescription>
                <form onSubmit={handleAdminLogin} className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input id="admin-email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input id="admin-password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
