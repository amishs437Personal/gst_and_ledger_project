import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/utils/formatters';
import { FileText, TrendingUp, Users, IndianRupee, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { invoices, parties, ledgerEntries, loading } = useApp();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCredits = ledgerEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const totalDebits = ledgerEntries.reduce((sum, e) => sum + (e.debit || 0), 0);

  const stats = [
    { label: 'Total Sales', value: `₹ ${formatCurrency(totalSales) || '0.00'}`, icon: IndianRupee },
    { label: 'Invoices', value: invoices.length.toString(), icon: FileText },
    { label: 'Parties', value: parties.length.toString(), icon: Users },
    { label: 'Avg. Invoice', value: invoices.length ? `₹ ${formatCurrency(totalSales / invoices.length)}` : '₹ 0.00', icon: TrendingUp },
  ];

  return (
    <div className="animate-fade-in">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1 font-mono">{stat.value}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Invoices</h2>
          </div>
          <div className="divide-y divide-border">
            {invoices.length === 0 ? (
              <p className="p-4 text-muted-foreground text-center">No invoices yet</p>
            ) : (
              invoices.slice(-5).reverse().map((invoice) => (
                <div key={invoice.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/50">
                  <div>
                    <p className="font-medium">#{invoice.invoiceNo} - {invoice.party.name}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                  <p className="font-mono font-semibold">₹ {formatCurrency(invoice.totalAmount)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground">Business Summary</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Total Receivables (Debit)</span>
              <span className="font-mono font-semibold text-red-600">₹ {formatCurrency(totalDebits) || '0.00'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Total Payments (Credit)</span>
              <span className="font-mono font-semibold text-green-600">₹ {formatCurrency(totalCredits) || '0.00'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Net Balance</span>
              <span className="font-mono font-bold text-primary">
                ₹ {formatCurrency(Math.abs(totalCredits - totalDebits))} {totalCredits >= totalDebits ? 'Cr' : 'Dr'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
