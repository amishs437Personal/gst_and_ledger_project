import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/utils/formatters';
import { BookOpen, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import AddLedgerEntryForm from '@/components/AddLedgerEntryForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const LedgerView = () => {
  const { company, parties, ledgerEntries, deleteLedgerEntry, loading } = useApp();
  const [selectedPartyId, setSelectedPartyId] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredEntries = selectedPartyId === 'all' ? ledgerEntries : ledgerEntries.filter(e => e.partyId === selectedPartyId);
  const selectedParty = parties.find(p => p.id === selectedPartyId);
  const totalDebits = filteredEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredits = filteredEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const balance = totalCredits - totalDebits;

  const handleDelete = async (id: string) => { try { await deleteLedgerEntry(id); setDeleteConfirm(null); toast.success('Entry deleted successfully'); } catch { toast.error('Failed to delete entry'); } };
  const getPartyName = (partyId: string) => parties.find(p => p.id === partyId)?.name || 'Unknown';

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /><span className="text-sm text-muted-foreground">{filteredEntries.length} entries</span></div>
          <div className="flex items-center gap-2"><Label className="text-sm">Filter by Party:</Label>
            <Select value={selectedPartyId} onValueChange={setSelectedPartyId}><SelectTrigger className="w-48"><SelectValue placeholder="All parties" /></SelectTrigger><SelectContent><SelectItem value="all">All Parties</SelectItem>{parties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2"><Plus className="w-4 h-4" />Add Entry</Button>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center"><BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><h3 className="font-semibold text-lg mb-2">No Ledger Entries</h3><p className="text-muted-foreground mb-4">{parties.length === 0 ? 'Add a party first, then record ledger entries' : 'Start recording your transactions'}</p><Button onClick={() => setShowAddForm(true)} className="gap-2" disabled={parties.length === 0}><Plus className="w-4 h-4" />Add First Entry</Button></div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {selectedParty && <div className="text-center p-4 border-b border-border bg-muted"><div className="font-bold">{company.name}</div><div className="font-semibold mt-2">{selectedParty.name}</div><div className="text-sm text-muted-foreground">Ledger Account</div></div>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted"><th className="text-left p-3 font-semibold border-b border-border w-24">Date</th><th className="text-left p-3 font-semibold border-b border-border">Particulars</th>{selectedPartyId === 'all' && <th className="text-left p-3 font-semibold border-b border-border">Party</th>}<th className="text-left p-3 font-semibold border-b border-border w-24">Vch Type</th><th className="text-center p-3 font-semibold border-b border-border w-20">Vch No.</th><th className="text-right p-3 font-semibold border-b border-border w-32">Debit</th><th className="text-right p-3 font-semibold border-b border-border w-32">Credit</th><th className="text-center p-3 font-semibold border-b border-border w-16">Actions</th></tr></thead>
              <tbody>{filteredEntries.map((entry, index) => (<tr key={entry.id} className={index % 2 === 1 ? 'bg-muted/30' : ''}><td className="p-3 border-b border-border font-mono text-xs">{entry.date}</td><td className="p-3 border-b border-border">{entry.particulars}</td>{selectedPartyId === 'all' && <td className="p-3 border-b border-border text-muted-foreground">{getPartyName(entry.partyId)}</td>}<td className="p-3 border-b border-border">{entry.voucherType}</td><td className="p-3 border-b border-border text-center font-mono">{entry.voucherNo}</td><td className="p-3 border-b border-border text-right font-mono text-red-600">{formatCurrency(entry.debit)}</td><td className="p-3 border-b border-border text-right font-mono text-green-600">{formatCurrency(entry.credit)}</td><td className="p-3 border-b border-border text-center"><Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(entry.id)} className="text-destructive hover:text-destructive h-8 w-8"><Trash2 className="w-4 h-4" /></Button></td></tr>))}</tbody>
              <tfoot><tr className="bg-muted"><td colSpan={selectedPartyId === 'all' ? 5 : 4} className="p-3 text-right font-semibold">Totals:</td><td className="p-3 text-right font-mono font-semibold text-red-600">{formatCurrency(totalDebits) || '—'}</td><td className="p-3 text-right font-mono font-semibold text-green-600">{formatCurrency(totalCredits) || '—'}</td><td></td></tr><tr className="bg-muted"><td colSpan={selectedPartyId === 'all' ? 5 : 4} className="p-3 text-right font-bold">{balance >= 0 ? 'Closing Balance (Cr):' : 'Closing Balance (Dr):'}</td><td colSpan={2} className="p-3 text-right font-mono font-bold text-primary">₹ {formatCurrency(Math.abs(balance))}</td><td></td></tr></tfoot>
            </table>
          </div>
        </div>
      )}
      <AddLedgerEntryForm open={showAddForm} onClose={() => setShowAddForm(false)} />
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Entry?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
};

export default LedgerView;
