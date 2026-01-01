import { useState } from 'react';
import { Invoice, InvoiceItem, Party } from '@/types/accounting';
import { useApp } from '@/context/AppContext';
import { numberToWords } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const invoiceSchema = z.object({
  partyId: z.string().min(1, 'Please select a party'),
  date: z.string().min(1, 'Date is required'),
  items: z.array(z.object({
    description: z.string().min(1, 'Description required'),
    quantity: z.number().positive('Quantity must be positive'),
    rate: z.number().positive('Rate must be positive'),
  })).min(1, 'At least one item is required'),
});

interface AddInvoiceFormProps {
  open: boolean;
  onClose: () => void;
}

const AddInvoiceForm = ({ open, onClose }: AddInvoiceFormProps) => {
  const { parties, addInvoice, getNextInvoiceNo, addLedgerEntry, getNextVoucherNo } = useApp();
  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<Array<{ description: string; quantity: string; unit: string; rate: string }>>([
    { description: '', quantity: '', unit: 'kg', rate: '' }
  ]);
  const [modeOfPayment, setModeOfPayment] = useState('');
  const [destination, setDestination] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: '', unit: 'kg', rate: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return sum + (qty * rate);
    }, 0);
  };

  const calculateTotalQuantity = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
  };

  const handleSave = async () => {
    const parsedItems = items.map(item => ({
      description: item.description,
      quantity: parseFloat(item.quantity) || 0,
      rate: parseFloat(item.rate) || 0,
    }));

    const validation = invoiceSchema.safeParse({
      partyId,
      date,
      items: parsedItems,
    });

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        newErrors[err.path.join('.')] = err.message;
      });
      setErrors(newErrors);
      toast.error('Please fix the errors');
      return;
    }

    const party = parties.find(p => p.id === partyId);
    if (!party) {
      toast.error('Please select a valid party');
      return;
    }

    try {
      const invoiceNo = getNextInvoiceNo();
      const totalAmount = calculateTotal();
      const totalQuantity = calculateTotalQuantity();

      const invoiceItems: InvoiceItem[] = items.map((item, index) => ({
        slNo: index + 1,
        description: item.description,
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit,
        rate: parseFloat(item.rate) || 0,
        per: item.unit,
        amount: (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0),
      }));

      const invoiceData: Omit<Invoice, 'id'> = {
        invoiceNo,
        date: formatDateForDisplay(date),
        party,
        items: invoiceItems,
        totalQuantity,
        totalAmount,
        amountInWords: numberToWords(totalAmount),
        modeOfPayment,
        destination,
      };

      await addInvoice(invoiceData);

      // Auto-create ledger entry
      await addLedgerEntry({
        date: formatDateForDisplay(date),
        partyId: party.id,
        particulars: `To Sales`,
        voucherType: 'Sales',
        voucherNo: invoiceNo,
        debit: totalAmount,
      });

      toast.success(`Invoice #${invoiceNo} created successfully`);
      handleClose();
    } catch (error) {
      toast.error('Failed to create invoice');
      console.error(error);
    }
  };

  const handleClose = () => {
    setPartyId('');
    setDate(new Date().toISOString().split('T')[0]);
    setItems([{ description: '', quantity: '', unit: 'kg', rate: '' }]);
    setModeOfPayment('');
    setDestination('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Party and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Party *</Label>
              <Select value={partyId} onValueChange={setPartyId}>
                <SelectTrigger className={errors.partyId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select party" />
                </SelectTrigger>
                <SelectContent>
                  {parties.length === 0 ? (
                    <SelectItem value="none" disabled>No parties added. Add a party first.</SelectItem>
                  ) : (
                    parties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.partyId && <p className="text-xs text-destructive">{errors.partyId}</p>}
            </div>

            <div className="space-y-2">
              <Label>Invoice Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={errors.date ? 'border-destructive' : ''}
              />
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mode of Payment</Label>
              <Input
                value={modeOfPayment}
                onChange={(e) => setModeOfPayment(e.target.value)}
                placeholder="e.g., Cash, Credit, Bank Transfer"
              />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Delivery destination"
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Items *</Label>
              <Button variant="outline" size="sm" onClick={addItem} className="gap-1">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-muted rounded-lg">
                  <div className="col-span-4 space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Unit</Label>
                    <Select value={item.unit} onValueChange={(v) => updateItem(index, 'unit', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="pcs">pcs</SelectItem>
                        <SelectItem value="nos">nos</SelectItem>
                        <SelectItem value="bags">bags</SelectItem>
                        <SelectItem value="ltrs">ltrs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Rate</Label>
                    <Input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">
                      ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toLocaleString('en-IN')}
                    </span>
                    {items.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="bg-primary/5 rounded-lg p-4 text-right">
              <div className="text-sm text-muted-foreground">Total Quantity: {calculateTotalQuantity().toLocaleString('en-IN')} {items[0]?.unit}</div>
              <div className="text-2xl font-bold font-mono text-primary">
                ₹ {calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{numberToWords(calculateTotal())}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={parties.length === 0}>
            Create Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddInvoiceForm;
