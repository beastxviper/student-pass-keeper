import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Application {
  id: string;
  full_name: string;
  department: string;
  year: string;
  class: string;
  destination: string;
  status: string;
  clerk_remarks: string | null;
  admin_remarks: string | null;
  created_at: string;
  issue_date: string;
  time_period: string;
  voucher_number: string | null;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [className, setClassName] = useState('');
  const [dob, setDob] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [timePeriod, setTimePeriod] = useState('');
  const [destination, setDestination] = useState('');
  const [voucherNumber, setVoucherNumber] = useState('');
  const [addressProof, setAddressProof] = useState<File | null>(null);

  const fetchApplications = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('applications')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });
    setApplications(data || []);
    setFetchLoading(false);
  };

  useEffect(() => { fetchApplications(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    let addressProofUrl = '';
    if (addressProof) {
      const ext = addressProof.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(path, addressProof);
      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
      addressProofUrl = urlData.publicUrl;
    }

    const { error } = await (supabase as any).from('applications').insert({
      student_id: user.id,
      full_name: fullName,
      department,
      year,
      class: className,
      date_of_birth: dob,
      issue_date: issueDate,
      time_period: timePeriod,
      destination,
      voucher_number: voucherNumber || null,
      address_proof_url: addressProofUrl || null,
    });

    if (error) {
      toast({ title: 'Submission failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Application submitted!', description: 'Your pass application is now pending review.' });
      setShowForm(false);
      resetForm();
      fetchApplications();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFullName(''); setDepartment(''); setYear(''); setClassName('');
    setDob(''); setIssueDate(''); setTimePeriod(''); setDestination('');
    setVoucherNumber(''); setAddressProof(null);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success border-success/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  return (
    <DashboardLayout title="Student Portal" roleLabel="Student">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">My Applications</h2>
            <p className="text-muted-foreground text-sm">Submit and track your pass applications</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" /> New Application
          </Button>
        </div>

        {showForm && (
          <Card className="glass-card animate-fade-in">
            <CardHeader>
              <CardTitle>New Pass Application</CardTitle>
              <CardDescription>Fill in all required details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Computer Science" required />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st">1st Year</SelectItem>
                      <SelectItem value="2nd">2nd Year</SelectItem>
                      <SelectItem value="3rd">3rd Year</SelectItem>
                      <SelectItem value="4th">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="CS-A" required />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Time Period</Label>
                  <Input value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)} placeholder="3 months" required />
                </div>
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Mumbai Central" required />
                </div>
                <div className="space-y-2">
                  <Label>Voucher Number (optional)</Label>
                  <Input value={voucherNumber} onChange={(e) => setVoucherNumber(e.target.value)} placeholder="VCH-001" />
                </div>
                <div className="space-y-2">
                  <Label>Address Proof</Label>
                  <Input type="file" accept="image/*,.pdf" onChange={(e) => setAddressProof(e.target.files?.[0] || null)} className="file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:text-sm" />
                </div>
                <div className="md:col-span-2 flex gap-3 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {fetchLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : applications.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No applications yet</p>
              <p className="text-sm text-muted-foreground/70">Click "New Application" to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <Card key={app.id} className="glass-card hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{app.destination}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{app.department} · {app.year} · {app.class} · {app.time_period}</p>
                      <p className="text-xs text-muted-foreground mt-1">Submitted {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</p>
                    </div>
                    {(app.clerk_remarks || app.admin_remarks) && (
                      <div className="text-sm bg-muted/50 rounded-lg p-2 max-w-xs">
                        {app.clerk_remarks && <p className="text-muted-foreground"><span className="font-medium">Clerk:</span> {app.clerk_remarks}</p>}
                        {app.admin_remarks && <p className="text-muted-foreground"><span className="font-medium">Admin:</span> {app.admin_remarks}</p>}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
