import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, UserPlus, Trash2, CheckCircle2, XCircle, Eye, Users, FileText, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Application {
  id: string;
  student_id: string;
  full_name: string;
  department: string;
  year: string;
  class: string;
  date_of_birth: string;
  address_proof_url: string | null;
  issue_date: string;
  time_period: string;
  destination: string;
  voucher_number: string | null;
  status: string;
  clerk_remarks: string | null;
  admin_remarks: string | null;
  created_at: string;
}

interface Clerk {
  id: string;
  user_id: string;
  clerk_id: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('analytics');
  const [applications, setApplications] = useState<Application[]>([]);
  const [clerks, setClerks] = useState<Clerk[]>([]);
  const [loading, setLoading] = useState(true);

  const [newClerkId, setNewClerkId] = useState('');
  const [newClerkName, setNewClerkName] = useState('');
  const [newClerkPassword, setNewClerkPassword] = useState('');
  const [addingClerk, setAddingClerk] = useState(false);

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    const [appsRes, clerksRes] = await Promise.all([
      (supabase as any).from('applications').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('clerks').select('*').order('created_at', { ascending: false }),
    ]);
    setApplications(appsRes.data || []);
    setClerks(clerksRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddClerk = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingClerk(true);
    const email = `${newClerkId}@clerk.pass`;

    const { data, error } = await supabase.auth.signUp({ email, password: newClerkPassword });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setAddingClerk(false);
      return;
    }

    if (data.user) {
      await (supabase as any).from('user_roles').insert({ user_id: data.user.id, role: 'clerk' });
      await (supabase as any).from('clerks').insert({
        user_id: data.user.id,
        clerk_id: newClerkId,
        full_name: newClerkName,
      });
    }

    toast({ title: 'Clerk added!', description: `${newClerkName} (${newClerkId}) has been added.` });
    setNewClerkId(''); setNewClerkName(''); setNewClerkPassword('');
    setAddingClerk(false);
    fetchData();
  };

  const handleRemoveClerk = async (clerk: Clerk) => {
    await (supabase as any).from('clerks').update({ is_active: false }).eq('id', clerk.id);
    toast({ title: 'Clerk deactivated', description: `${clerk.full_name} has been deactivated.` });
    fetchData();
  };

  const handleOverride = async (status: 'approved' | 'rejected') => {
    if (!selectedApp || !user) return;
    setActionLoading(true);

    await (supabase as any).from('applications').update({
      status,
      admin_remarks: adminRemarks,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', selectedApp.id);

    await (supabase as any).from('notifications').insert({
      user_id: selectedApp.student_id,
      title: `Application ${status} (Admin)`,
      message: `Your application to ${selectedApp.destination} was ${status} by admin.${adminRemarks ? ` Remarks: ${adminRemarks}` : ''}`,
      application_id: selectedApp.id,
    });

    toast({ title: `Application ${status}` });
    setSelectedApp(null);
    setAdminRemarks('');
    setActionLoading(false);
    fetchData();
  };

  const counts = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success border-success/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Admin Portal" roleLabel="Admin">
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Portal" roleLabel="Admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Analytics</TabsTrigger>
            <TabsTrigger value="applications" className="gap-1.5"><FileText className="h-4 w-4" /> Applications</TabsTrigger>
            <TabsTrigger value="clerks" className="gap-1.5"><Users className="h-4 w-4" /> Clerks</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Applications', count: counts.total, bg: 'gradient-primary' },
                { label: 'Pending', count: counts.pending, bg: 'gradient-warning' },
                { label: 'Approved', count: counts.approved, bg: 'gradient-success' },
                { label: 'Rejected', count: counts.rejected, bg: 'gradient-danger' },
              ].map((s) => (
                <Card key={s.label} className={`${s.bg} border-0`}>
                  <CardContent className="p-5 text-center">
                    <p className="text-3xl font-display font-bold text-primary-foreground">{s.count}</p>
                    <p className="text-sm text-primary-foreground/80">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="glass-card">
              <CardHeader><CardTitle>Active Clerks</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-foreground">{clerks.filter(c => c.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Currently managing applications</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-4 mt-6">
            <h2 className="text-xl font-display font-bold text-foreground">All Applications</h2>
            {applications.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No applications yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {applications.map((app) => (
                  <Card key={app.id} className="glass-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedApp(app); setAdminRemarks(app.admin_remarks || ''); }}>
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{app.full_name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(app.status)}`}>{app.status}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{app.department} · {app.destination}</p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1.5 shrink-0"><Eye className="h-4 w-4" /> Review</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="clerks" className="space-y-6 mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Add New Clerk</CardTitle>
                <CardDescription>Create a new clerk account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddClerk} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Clerk ID</Label>
                    <Input value={newClerkId} onChange={(e) => setNewClerkId(e.target.value)} placeholder="CLK001" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={newClerkName} onChange={(e) => setNewClerkName(e.target.value)} placeholder="Jane Smith" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={newClerkPassword} onChange={(e) => setNewClerkPassword(e.target.value)} placeholder="••••••••" required />
                  </div>
                  <div className="md:col-span-3">
                    <Button type="submit" disabled={addingClerk} className="gap-1.5">
                      {addingClerk ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                      Add Clerk
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {clerks.map((clerk) => (
                <Card key={clerk.id} className="glass-card">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{clerk.full_name}</h3>
                      <p className="text-sm text-muted-foreground">ID: {clerk.clerk_id} · {clerk.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                    {clerk.is_active && (
                      <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => handleRemoveClerk(clerk)}>
                        <Trash2 className="h-4 w-4" /> Deactivate
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedApp} onOpenChange={(open) => { if (!open) setSelectedApp(null); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Admin Review</DialogTitle></DialogHeader>
            {selectedApp && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Name', selectedApp.full_name],
                    ['Department', selectedApp.department],
                    ['Year', selectedApp.year],
                    ['Class', selectedApp.class],
                    ['DOB', selectedApp.date_of_birth],
                    ['Destination', selectedApp.destination],
                    ['Time Period', selectedApp.time_period],
                    ['Status', selectedApp.status],
                    ['Clerk Remarks', selectedApp.clerk_remarks || 'N/A'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-muted-foreground text-xs">{label}</p>
                      <p className="font-medium text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Admin Remarks</Label>
                  <Textarea value={adminRemarks} onChange={(e) => setAdminRemarks(e.target.value)} placeholder="Add admin remarks..." />
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="destructive" onClick={() => handleOverride('rejected')} disabled={actionLoading} className="gap-1.5">
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject
                  </Button>
                  <Button onClick={() => handleOverride('approved')} disabled={actionLoading} className="gap-1.5">
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
