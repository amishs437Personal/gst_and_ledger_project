import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Company, Party, Invoice, LedgerEntry, InvoiceItem } from '@/types/accounting';
import { companyData as defaultCompany } from '@/data/sampleData';
import { supabase } from '@/integrations/supabase/client';

interface AppState {
  company: Company;
  parties: Party[];
  invoices: Invoice[];
  ledgerEntries: LedgerEntry[];
  loading: boolean;
}

interface AppContextType extends AppState {
  setCompany: (company: Company) => void;
  addParty: (party: Omit<Party, 'id'>) => Promise<Party>;
  updateParty: (id: string, party: Partial<Party>) => Promise<void>;
  deleteParty: (id: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<Invoice>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id'>) => Promise<LedgerEntry>;
  updateLedgerEntry: (id: string, entry: Partial<LedgerEntry>) => Promise<void>;
  deleteLedgerEntry: (id: string) => Promise<void>;
  getNextInvoiceNo: () => number;
  getNextVoucherNo: (type: string) => number;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>({
    company: defaultCompany,
    parties: [],
    invoices: [],
    ledgerEntries: [],
    loading: true,
  });

  const fetchData = async () => {
    try {
      // Fetch company
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .maybeSingle();

      // Fetch parties
      const { data: partiesData } = await supabase
        .from('parties')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*, parties(*)')
        .order('invoice_no', { ascending: true });

      // Fetch ledger entries
      const { data: ledgerData } = await supabase
        .from('ledger_entries')
        .select('*')
        .order('date', { ascending: true });

      const parties: Party[] = (partiesData || []).map(p => ({
        id: p.id,
        name: p.name,
        email: p.email || undefined,
        address: p.address || [],
        district: p.district,
        state: p.state,
        stateCode: p.state_code,
        gstin: p.gstin || undefined,
      }));

      const invoices: Invoice[] = (invoicesData || []).map(inv => ({
        id: inv.id,
        invoiceNo: inv.invoice_no,
        date: inv.date,
        party: inv.parties ? {
          id: inv.parties.id,
          name: inv.parties.name,
          email: inv.parties.email || undefined,
          address: inv.parties.address || [],
          district: inv.parties.district,
          state: inv.parties.state,
          stateCode: inv.parties.state_code,
          gstin: inv.parties.gstin || undefined,
        } : parties.find(p => p.id === inv.party_id) || {
          id: '', name: 'Unknown', address: [], district: '', state: '', stateCode: ''
        },
        modeOfPayment: inv.mode_of_payment || undefined,
        destination: inv.destination || undefined,
        items: (inv.items as unknown as InvoiceItem[]) || [],
        totalQuantity: Number(inv.total_quantity) || 0,
        totalAmount: Number(inv.total_amount) || 0,
        amountInWords: inv.amount_in_words || '',
      }));

      const ledgerEntries: LedgerEntry[] = (ledgerData || []).map(e => ({
        id: e.id,
        date: e.date,
        partyId: e.party_id,
        particulars: e.particulars,
        voucherType: e.voucher_type as LedgerEntry['voucherType'],
        voucherNo: e.voucher_no,
        debit: e.debit ? Number(e.debit) : undefined,
        credit: e.credit ? Number(e.credit) : undefined,
      }));

      setState(prev => ({
        ...prev,
        company: companyData ? {
          id: companyData.id,
          name: companyData.name,
          address: companyData.address || [],
          gstin: companyData.gstin,
          state: companyData.state,
          stateCode: companyData.state_code,
        } : defaultCompany,
        parties,
        invoices,
        ledgerEntries,
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const setCompany = async (company: Company) => {
    try {
      if (state.company.id) {
        await supabase
          .from('companies')
          .update({
            name: company.name,
            address: company.address,
            gstin: company.gstin,
            state: company.state,
            state_code: company.stateCode,
          })
          .eq('id', state.company.id);
      }
      setState(prev => ({ ...prev, company }));
    } catch (error) {
      console.error('Error updating company:', error);
    }
  };

  const addParty = async (partyData: Omit<Party, 'id'>): Promise<Party> => {
    const { data, error } = await supabase
      .from('parties')
      .insert({
        name: partyData.name,
        email: partyData.email || null,
        address: partyData.address,
        district: partyData.district,
        state: partyData.state,
        state_code: partyData.stateCode,
        gstin: partyData.gstin || null,
      })
      .select()
      .single();

    if (error) throw error;

    const newParty: Party = {
      id: data.id,
      name: data.name,
      email: data.email || undefined,
      address: data.address || [],
      district: data.district,
      state: data.state,
      stateCode: data.state_code,
      gstin: data.gstin || undefined,
    };

    setState(prev => ({ ...prev, parties: [newParty, ...prev.parties] }));
    return newParty;
  };

  const updateParty = async (id: string, partyData: Partial<Party>) => {
    const updateData: Record<string, unknown> = {};
    if (partyData.name !== undefined) updateData.name = partyData.name;
    if (partyData.email !== undefined) updateData.email = partyData.email || null;
    if (partyData.address !== undefined) updateData.address = partyData.address;
    if (partyData.district !== undefined) updateData.district = partyData.district;
    if (partyData.state !== undefined) updateData.state = partyData.state;
    if (partyData.stateCode !== undefined) updateData.state_code = partyData.stateCode;
    if (partyData.gstin !== undefined) updateData.gstin = partyData.gstin || null;

    const { error } = await supabase
      .from('parties')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    setState(prev => ({
      ...prev,
      parties: prev.parties.map(p => (p.id === id ? { ...p, ...partyData } : p)),
    }));
  };

  const deleteParty = async (id: string) => {
    const { error } = await supabase.from('parties').delete().eq('id', id);
    if (error) throw error;

    setState(prev => ({
      ...prev,
      parties: prev.parties.filter(p => p.id !== id),
    }));
  };

  const addInvoice = async (invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> => {
    const { data, error } = await supabase
      .from('invoices')
      .insert([{
        invoice_no: invoiceData.invoiceNo,
        date: invoiceData.date,
        party_id: invoiceData.party.id,
        mode_of_payment: invoiceData.modeOfPayment || null,
        destination: invoiceData.destination || null,
        items: JSON.parse(JSON.stringify(invoiceData.items)),
        total_quantity: invoiceData.totalQuantity,
        total_amount: invoiceData.totalAmount,
        amount_in_words: invoiceData.amountInWords,
      }])
      .select()
      .single();

    if (error) throw error;

    const newInvoice: Invoice = { ...invoiceData, id: data.id };
    setState(prev => ({ ...prev, invoices: [...prev.invoices, newInvoice] }));
    return newInvoice;
  };

  const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
    const updateData: Record<string, unknown> = {};
    if (invoiceData.invoiceNo !== undefined) updateData.invoice_no = invoiceData.invoiceNo;
    if (invoiceData.date !== undefined) updateData.date = invoiceData.date;
    if (invoiceData.modeOfPayment !== undefined) updateData.mode_of_payment = invoiceData.modeOfPayment;
    if (invoiceData.destination !== undefined) updateData.destination = invoiceData.destination;
    if (invoiceData.items !== undefined) updateData.items = invoiceData.items;
    if (invoiceData.totalQuantity !== undefined) updateData.total_quantity = invoiceData.totalQuantity;
    if (invoiceData.totalAmount !== undefined) updateData.total_amount = invoiceData.totalAmount;
    if (invoiceData.amountInWords !== undefined) updateData.amount_in_words = invoiceData.amountInWords;

    const { error } = await supabase.from('invoices').update(updateData).eq('id', id);
    if (error) throw error;

    setState(prev => ({
      ...prev,
      invoices: prev.invoices.map(i => (i.id === id ? { ...i, ...invoiceData } : i)),
    }));
  };

  const deleteInvoice = async (id: string) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;

    setState(prev => ({
      ...prev,
      invoices: prev.invoices.filter(i => i.id !== id),
    }));
  };

  const addLedgerEntry = async (entryData: Omit<LedgerEntry, 'id'>): Promise<LedgerEntry> => {
    const { data, error } = await supabase
      .from('ledger_entries')
      .insert({
        date: entryData.date,
        party_id: entryData.partyId,
        particulars: entryData.particulars,
        voucher_type: entryData.voucherType,
        voucher_no: entryData.voucherNo,
        debit: entryData.debit || null,
        credit: entryData.credit || null,
      })
      .select()
      .single();

    if (error) throw error;

    const newEntry: LedgerEntry = { ...entryData, id: data.id };
    setState(prev => ({ ...prev, ledgerEntries: [...prev.ledgerEntries, newEntry] }));
    return newEntry;
  };

  const updateLedgerEntry = async (id: string, entryData: Partial<LedgerEntry>) => {
    const updateData: Record<string, unknown> = {};
    if (entryData.date !== undefined) updateData.date = entryData.date;
    if (entryData.partyId !== undefined) updateData.party_id = entryData.partyId;
    if (entryData.particulars !== undefined) updateData.particulars = entryData.particulars;
    if (entryData.voucherType !== undefined) updateData.voucher_type = entryData.voucherType;
    if (entryData.voucherNo !== undefined) updateData.voucher_no = entryData.voucherNo;
    if (entryData.debit !== undefined) updateData.debit = entryData.debit;
    if (entryData.credit !== undefined) updateData.credit = entryData.credit;

    const { error } = await supabase.from('ledger_entries').update(updateData).eq('id', id);
    if (error) throw error;

    setState(prev => ({
      ...prev,
      ledgerEntries: prev.ledgerEntries.map(e => (e.id === id ? { ...e, ...entryData } : e)),
    }));
  };

  const deleteLedgerEntry = async (id: string) => {
    const { error } = await supabase.from('ledger_entries').delete().eq('id', id);
    if (error) throw error;

    setState(prev => ({
      ...prev,
      ledgerEntries: prev.ledgerEntries.filter(e => e.id !== id),
    }));
  };

  const getNextInvoiceNo = (): number => {
    if (state.invoices.length === 0) return 1;
    return Math.max(...state.invoices.map(i => i.invoiceNo)) + 1;
  };

  const getNextVoucherNo = (type: string): number => {
    const entriesOfType = state.ledgerEntries.filter(e => e.voucherType === type);
    if (entriesOfType.length === 0) return 1;
    return Math.max(...entriesOfType.map(e => e.voucherNo)) + 1;
  };

  const refreshData = async () => {
    await fetchData();
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        setCompany,
        addParty,
        updateParty,
        deleteParty,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addLedgerEntry,
        updateLedgerEntry,
        deleteLedgerEntry,
        getNextInvoiceNo,
        getNextVoucherNo,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
