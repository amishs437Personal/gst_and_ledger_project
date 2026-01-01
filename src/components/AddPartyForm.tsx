import { useState, useEffect } from 'react';
import { Party } from '@/types/accounting';
import { indianStates } from '@/data/sampleData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { z } from 'zod';

const partySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().trim().email('Invalid email').optional().or(z.literal('')),
  address: z.string().trim().max(500, 'Address too long'),
  district: z.string().trim().min(1, 'District is required').max(100, 'District too long'),
  state: z.string().min(1, 'State is required'),
  gstin: z.string().trim().max(15, 'Invalid GSTIN').optional(),
});

interface AddPartyFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (party: Omit<Party, 'id'>) => void;
  editParty?: Party;
}

const AddPartyForm = ({ open, onClose, onSave, editParty }: AddPartyFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [gstin, setGstin] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editParty) {
      setName(editParty.name);
      setEmail(editParty.email || '');
      setAddress(editParty.address.join('\n'));
      setDistrict(editParty.district);
      setState(editParty.state);
      setGstin(editParty.gstin || '');
    }
  }, [editParty]);

  const handleSave = () => {
    const validation = partySchema.safeParse({ name, email, address, district, state, gstin });

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    const selectedState = indianStates.find(s => s.name === state);

    const partyData: Omit<Party, 'id'> = {
      name: name.trim(),
      email: email.trim() || undefined,
      address: address.split('\n').filter(line => line.trim()),
      district: district.trim(),
      state,
      stateCode: selectedState?.code || '',
      gstin: gstin.trim() || undefined,
    };

    onSave(partyData);
    toast.success(editParty ? 'Party updated successfully' : 'Party added successfully');
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setAddress('');
    setDistrict('');
    setState('');
    setGstin('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editParty ? 'Edit Party' : 'Add New Party'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Party Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter party name"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address (one line per field)"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">District *</Label>
            <Input
              id="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Enter district"
              className={errors.district ? 'border-destructive' : ''}
            />
            {errors.district && <p className="text-xs text-destructive">{errors.district}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className={errors.state ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {indianStates.map((s) => (
                  <SelectItem key={s.code} value={s.name}>
                    {s.name} ({s.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN (Optional)</Label>
            <Input
              id="gstin"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="e.g., 36AAGCK0178A2ZV"
              maxLength={15}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave}>{editParty ? 'Update' : 'Add Party'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPartyForm;
