// Core accounting types for GST Invoice & Ledger Management

export interface Company {
  id: string;
  name: string;
  address: string[];
  gstin: string;
  state: string;
  stateCode: string;
}

export interface Party {
  id: string;
  name: string;
  email?: string;
  address: string[];
  district: string;
  state: string;
  stateCode: string;
  gstin?: string;
}

export interface InvoiceItem {
  slNo: number;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  per: string;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNo: number;
  date: string;
  party: Party;
  deliveryNote?: string;
  modeOfPayment?: string;
  referenceNo?: string;
  referenceDate?: string;
  otherReferences?: string;
  buyerOrderNo?: string;
  buyerOrderDate?: string;
  dispatchDocNo?: string;
  deliveryNoteDate?: string;
  dispatchedThrough?: string;
  destination?: string;
  termsOfDelivery?: string;
  items: InvoiceItem[];
  totalQuantity: number;
  totalAmount: number;
  amountInWords: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  partyId: string;
  particulars: string;
  voucherType: 'Receipt' | 'Payment' | 'Sales' | 'Purchase' | 'Journal' | 'Contra';
  voucherNo: number;
  debit?: number;
  credit?: number;
}

export interface LedgerAccount {
  party: Party;
  company: Company;
  periodFrom: string;
  periodTo: string;
  openingBalance: number;
  openingBalanceType: 'Dr' | 'Cr';
  entries: LedgerEntry[];
  closingBalance: number;
  closingBalanceType: 'Dr' | 'Cr';
}

export type ViewMode = 'dashboard' | 'invoice' | 'ledger' | 'parties';
