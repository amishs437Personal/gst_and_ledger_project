import { useState } from 'react';
import { LedgerEntry } from '@/types/accounting';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { z } from 'zod';

const voucherTypes = ['Receipt', 'Payment', 'Sales', 'Purchase', 'Journal', 'Contra'] as const;

const entrySchema = z.object({
  partyId: z.string().min(1, 'Please select a party'),
  date: z.string().min(1, 'Date is required'),
  voucherType: z.enum(voucherTypes),
  amount: z.number().positive('Amount must be positive'),
  transactionType: z.enum(['debit', 'credit']),
});

interface AddLedgerEntryFormProps {
  open: boolean;
  onClose: () => void;
}

const AddLedgerEntryForm = ({ open, onClose }: AddLedgerEntryFormProps) => {
  const { parties, addLedgerEntry, getNextVoucherNo } = useApp();
  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherType, setVoucherType] = useState<typeof voucherTypes[number]>('Receipt');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'debit' | 'credit'>('credit');
  const [particulars, setParticulars] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatDateForDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
  };

  const handleSave = async () => {
    const validation = entrySchema.safeParse({ partyId, date, voucherType, amount: parseFloat(amount) || 0, transactionType });
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => { if (err.path[0]) newErrors[err.path[0] as string] = err.message; });
      setErrors(newErrors);
      return;
    }
    const party = parties.find(p => p.id === partyId);
    if (!party) { toast.error('Please select a valid party'); return; }
    try {
      const voucherNo = getNextVoucherNo(voucherType);
      const amountValue = parseFloat(amount) || 0;
      await addLedgerEntry({
        date: formatDateForDisplay(date),
        partyId,
        particulars: particulars || `${transactionType === 'credit' ? 'By' : 'To'} ${party.name}`,
        voucherType,
        voucherNo,
        debit: transactionType === 'debit' ? amountValue : undefined,
        credit: transactionType === 'credit' ? amountValue : undefined,
      });
      toast.success('Ledger entry added successfully');
      handleClose();
    } catch (error) { toast.error('Failed to add entry'); console.error(error); }
  };

  const handleClose = () => {
    setPartyId(''); setDate(new Date().toISOString().split('T')[0]); setVoucherType('Receipt');
    setAmount(''); setTransactionType('credit'); setParticulars(''); setErrors({}); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add Ledger Entry</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Party *</Label>
            <Select value={partyId} onValueChange={setPartyId}>
              <SelectTrigger className={errors.partyId ? 'border-destructive' : ''}><SelectValue placeholder="Select party" /></SelectTrigger>
              <SelectContent>
                {parties.length === 0 ? <SelectItem value="none" disabled>No parties added</SelectItem> : parties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.partyId && <p className="text-xs text-destructive">{errors.partyId}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Date *</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Voucher Type *</Label>
              <Select value={voucherType} onValueChange={(v) => setVoucherType(v as typeof voucherTypes[number])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{voucherTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Transaction Type *</Label>
              <Select value={transactionType} onValueChange={(v) => setTransactionType(v as 'debit' | 'credit')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="credit">Credit (By)</SelectItem><SelectItem value="debit">Debit (To)</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Amount (₹) *</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={errors.amount ? 'border-destructive' : ''} />{errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}</div>
          </div>
          <div className="space-y-2"><Label>Particulars (Optional)</Label><Input value={particulars} onChange={(e) => setParticulars(e.target.value)} placeholder="e.g., By IDBI, To Sales" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={handleClose}>Cancel</Button><Button onClick={handleSave} disabled={parties.length === 0}>Add Entry</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddLedgerEntryForm;
