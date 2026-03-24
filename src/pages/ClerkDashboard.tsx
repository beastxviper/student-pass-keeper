import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle, Eye, FileText } from 'lucide-react';
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

export default function ClerkDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = async () => {
    const { data } = await (supabase as any)
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    setApplications(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchApplications(); }, []);

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!selectedApp || !user) return;
    setActionLoading(true);

    const { error } = await (supabase as any)
      .from('applications')
      .update({
        status,
        clerk_remarks: remarks,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', selectedApp.id);

    if (!error) {
      await (supabase as any).from('notifications').insert({
        user_id: selectedApp.student_id,
        title: `Application ${status}`,
        message: `Your pass application to ${selectedApp.destination} has been ${status}.${remarks ? ` Remarks: ${remarks}` : ''}`,
        application_id: selectedApp.id,
      });

      toast({ title: `Application ${status}`, description: `Successfully ${status} the application.` });
      setSelectedApp(null);
      setRemarks('');
      fetchApplications();
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setActionLoading(false);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success border-success/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <DashboardLayout title="Clerk Portal" roleLabel="Clerk">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', count: counts.all, color: 'bg-primary/10 text-primary' },
            { label: 'Pending', count: counts.pending, color: 'bg-warning/10 text-warning' },
            { label: 'Approved', count: counts.approved, color: 'bg-success/10 text-success' },
            { label: 'Rejected', count: counts.rejected, color: 'bg-destructive/10 text-destructive' },
          ].map((s) => (
            <Card key={s.label} className="glass-card">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-display font-bold text-foreground">{s.count}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No applications found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((app) => (
              <Card key={app.id} className="glass-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedApp(app); setRemarks(app.clerk_remarks || ''); }}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{app.full_name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{app.department} · {app.year} · {app.destination}</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                    <Eye className="h-4 w-4" /> Review
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedApp} onOpenChange={(open) => { if (!open) setSelectedApp(null); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Application</DialogTitle>
            </DialogHeader>
            {selectedApp && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Name', selectedApp.full_name],
                    ['Department', selectedApp.department],
                    ['Year', selectedApp.year],
                    ['Class', selectedApp.class],
                    ['DOB', selectedApp.date_of_birth],
                    ['Issue Date', selectedApp.issue_date],
                    ['Time Period', selectedApp.time_period],
                    ['Destination', selectedApp.destination],
                    ['Voucher', selectedApp.voucher_number || 'N/A'],
                    ['Status', selectedApp.status],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-muted-foreground text-xs">{label}</p>
                      <p className="font-medium text-foreground">{value}</p>
                    </div>
                  ))}
                </div>

                {selectedApp.address_proof_url && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Address Proof</p>
                    <a href={selectedApp.address_proof_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">View Document</a>
                  </div>
                )}

                {selectedApp.status === 'pending' && (
                  <>
                    <div className="space-y-2">
                      <Label>Remarks</Label>
                      <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add your remarks..." />
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="destructive" onClick={() => handleAction('rejected')} disabled={actionLoading} className="gap-1.5">
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        Reject
                      </Button>
                      <Button onClick={() => handleAction('approved')} disabled={actionLoading} className="gap-1.5">
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Approve
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
