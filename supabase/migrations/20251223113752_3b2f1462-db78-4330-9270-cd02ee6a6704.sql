-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT[] NOT NULL DEFAULT '{}',
  gstin TEXT NOT NULL,
  state TEXT NOT NULL,
  state_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parties table
CREATE TABLE public.parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  address TEXT[] NOT NULL DEFAULT '{}',
  district TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL,
  state_code TEXT NOT NULL,
  gstin TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_no INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  delivery_note TEXT,
  mode_of_payment TEXT,
  reference_no TEXT,
  reference_date DATE,
  other_references TEXT,
  buyer_order_no TEXT,
  buyer_order_date DATE,
  dispatch_doc_no TEXT,
  delivery_note_date DATE,
  dispatched_through TEXT,
  destination TEXT,
  terms_of_delivery TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total_quantity NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  amount_in_words TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ledger_entries table
CREATE TABLE public.ledger_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  particulars TEXT NOT NULL,
  voucher_type TEXT NOT NULL CHECK (voucher_type IN ('Receipt', 'Payment', 'Sales', 'Purchase', 'Journal', 'Contra')),
  voucher_no INTEGER NOT NULL,
  debit NUMERIC,
  credit NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- Create public read/write policies for all tables (since this is a single-user app without auth)
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Anyone can insert companies" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update companies" ON public.companies FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete companies" ON public.companies FOR DELETE USING (true);

CREATE POLICY "Anyone can view parties" ON public.parties FOR SELECT USING (true);
CREATE POLICY "Anyone can insert parties" ON public.parties FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update parties" ON public.parties FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete parties" ON public.parties FOR DELETE USING (true);

CREATE POLICY "Anyone can view invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Anyone can insert invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update invoices" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete invoices" ON public.invoices FOR DELETE USING (true);

CREATE POLICY "Anyone can view ledger_entries" ON public.ledger_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert ledger_entries" ON public.ledger_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update ledger_entries" ON public.ledger_entries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete ledger_entries" ON public.ledger_entries FOR DELETE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parties_updated_at
  BEFORE UPDATE ON public.parties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ledger_entries_updated_at
  BEFORE UPDATE ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default company data
INSERT INTO public.companies (name, address, gstin, state, state_code)
VALUES (
  'KAVITHA SEEDS PRIVATE LIMITED',
  ARRAY['PLOT NO. 37 PART,, NEAR SHANTHA BIOTECH,', 'BOARDWAY VENTURE, ATHVELLY VILLAGE,', 'Medchal Malkajgiri, Telangana- 501401'],
  '36AAGCK0178A2ZV',
  'Telangana',
  '36'
);