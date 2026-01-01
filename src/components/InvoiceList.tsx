import { useState } from 'react';
import { Invoice } from '@/types/accounting';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/utils/formatters';
import { FileText, Eye, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddInvoiceForm from '@/components/AddInvoiceForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface InvoiceListProps {
  onSelectInvoice: (invoice: Invoice) => void;
  selectedInvoiceId?: string;
}

const InvoiceList = ({ onSelectInvoice, selectedInvoiceId }: InvoiceListProps) => {
  const { invoices, deleteInvoice, deleteLedgerEntry, ledgerEntries, loading } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (invoiceId: string) => {
    try {
      const invoice = invoices.find(i => i.id === invoiceId);
      if (invoice) {
        // Also delete related ledger entry
        const relatedEntry = ledgerEntries.find(
          e => e.voucherType === 'Sales' && e.voucherNo === invoice.invoiceNo
        );
        if (relatedEntry) {
          await deleteLedgerEntry(relatedEntry.id);
        }
      }
      await deleteInvoice(invoiceId);
      setDeleteConfirm(null);
      toast.success('Invoice deleted successfully');
    } catch (error) {
      toast.error('Failed to delete invoice');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">{invoices.length} invoices</span>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Invoices Created</h3>
          <p className="text-muted-foreground mb-4">
            Start by creating your first invoice
          </p>
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create First Invoice
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 font-semibold border-b border-border">Invoice No.</th>
                  <th className="text-left p-3 font-semibold border-b border-border">Date</th>
                  <th className="text-left p-3 font-semibold border-b border-border">Party Name</th>
                  <th className="text-right p-3 font-semibold border-b border-border">Amount</th>
                  <th className="text-center p-3 font-semibold border-b border-border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => (
                  <tr
                    key={invoice.id}
                    className={`hover:bg-muted/50 transition-colors ${
                      selectedInvoiceId === invoice.id ? 'bg-primary/10' : index % 2 === 1 ? 'bg-muted/30' : ''
                    }`}
                  >
                    <td className="p-3 border-b border-border font-mono font-semibold text-primary">
                      #{invoice.invoiceNo}
                    </td>
                    <td className="p-3 border-b border-border font-mono text-muted-foreground">
                      {invoice.date}
                    </td>
                    <td className="p-3 border-b border-border font-medium">
                      {invoice.party.name}
                    </td>
                    <td className="p-3 border-b border-border text-right font-mono font-semibold">
                      ₹ {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className="p-3 border-b border-border text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onSelectInvoice(invoice)} className="gap-1">
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(invoice.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted font-semibold">
                  <td colSpan={3} className="p-3 text-right">Total:</td>
                  <td className="p-3 text-right font-mono font-bold">
                    ₹ {formatCurrency(invoices.reduce((sum, inv) => sum + inv.totalAmount, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <AddInvoiceForm open={showAddForm} onClose={() => setShowAddForm(false)} />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice and its related ledger entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InvoiceList;
