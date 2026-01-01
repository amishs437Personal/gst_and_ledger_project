import { useState } from 'react';
import { ViewMode, Invoice } from '@/types/accounting';
import { AppProvider, useApp } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import InvoiceDocument from '@/components/InvoiceDocument';
import InvoiceList from '@/components/InvoiceList';
import LedgerView from '@/components/LedgerView';
import PartyList from '@/components/PartyList';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AppContent = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handlePrint = () => window.print();

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'invoice':
        if (selectedInvoice) {
          return (
            <div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)} className="mb-4 gap-2 no-print">
                <ArrowLeft className="w-4 h-4" />
                Back to Invoice List
              </Button>
              <InvoiceDocument invoice={selectedInvoice} />
            </div>
          );
        }
        return <InvoiceList onSelectInvoice={setSelectedInvoice} selectedInvoiceId={selectedInvoice?.id} />;
      case 'ledger':
        return <LedgerView />;
      case 'parties':
        return <PartyList />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        currentView={currentView}
        onViewChange={(view) => { setCurrentView(view); setSelectedInvoice(null); }}
        onPrint={handlePrint}
      />
      <main className="container py-6 max-w-7xl">
        <div className="mb-6 no-print">
          <h1 className="text-2xl font-bold text-foreground">
            {currentView === 'dashboard' && 'Dashboard'}
            {currentView === 'invoice' && (selectedInvoice ? `Invoice #${selectedInvoice.invoiceNo}` : 'Invoice Register')}
            {currentView === 'ledger' && 'Ledger Account'}
            {currentView === 'parties' && 'Party Master'}
          </h1>
        </div>
        {renderContent()}
      </main>
      <footer className="border-t border-border py-4 mt-8 no-print">
        <div className="container text-center text-sm text-muted-foreground">
          Kavita Seed GST Manager — Data stored in cloud
        </div>
      </footer>
    </div>
  );
};

const Index = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default Index;
