import { useState } from 'react';
import { Party } from '@/types/accounting';
import { useApp } from '@/context/AppContext';
import { Users, MapPin, Building2, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddPartyForm from '@/components/AddPartyForm';
import { toast } from 'sonner';
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

const PartyList = () => {
  const { parties, addParty, updateParty, deleteParty, loading } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSave = async (partyData: Omit<Party, 'id'>) => {
    try {
      if (editingParty) {
        await updateParty(editingParty.id, partyData);
      } else {
        await addParty(partyData);
      }
      setEditingParty(undefined);
    } catch (error) {
      toast.error('Failed to save party');
      console.error(error);
    }
  };

  const handleEdit = (party: Party) => {
    setEditingParty(party);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteParty(id);
      setDeleteConfirm(null);
      toast.success('Party deleted successfully');
    } catch (error) {
      toast.error('Failed to delete party');
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
          <Users className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">{parties.length} parties</span>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Party
        </Button>
      </div>

      {parties.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Parties Added</h3>
          <p className="text-muted-foreground mb-4">
            Start by adding your customers and vendors
          </p>
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Your First Party
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {parties.map((party) => (
            <div
              key={party.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{party.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{party.district}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {party.state} (Code: {party.stateCode})
                    </div>
                    {party.gstin && (
                      <div className="text-xs font-mono text-primary mt-2">
                        GSTIN: {party.gstin}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(party)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteConfirm(party.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddPartyForm
        open={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setEditingParty(undefined);
        }}
        onSave={handleSave}
        editParty={editingParty}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Party?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the party.
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

export default PartyList;
