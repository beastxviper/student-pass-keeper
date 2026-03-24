import { ReactNode, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { NotificationsPanel } from '@/components/NotificationsPanel';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  roleLabel: string;
}

export function DashboardLayout({ children, title, roleLabel }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-display font-bold text-foreground">{title}</h1>
            <Badge variant="secondary" className="text-xs">{roleLabel}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {showNotifications && (
        <NotificationsPanel onClose={() => setShowNotifications(false)} />
      )}

      <main className="container px-4 py-6 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
