import { ViewMode } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, BookOpen, Users, Printer } from 'lucide-react';

interface NavigationProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onPrint: () => void;
}

const Navigation = ({ currentView, onViewChange, onPrint }: NavigationProps) => {
  const navItems: { view: ViewMode; label: string; icon: React.ReactNode }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { view: 'invoice', label: 'Invoices', icon: <FileText className="w-4 h-4" /> },
    { view: 'ledger', label: 'Ledger', icon: <BookOpen className="w-4 h-4" /> },
    { view: 'parties', label: 'Parties', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <header className="border-b border-border bg-card no-print">
      <div className="container flex items-center justify-between py-3 max-w-7xl">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold text-primary">Kavita Seed GST Manager</h1>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <Button
                key={item.view}
                variant={currentView === item.view ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange(item.view)}
                className="gap-2"
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
        <Button variant="outline" size="sm" onClick={onPrint} className="gap-2">
          <Printer className="w-4 h-4" />
          Print
        </Button>
      </div>
    </header>
  );
};

export default Navigation;
