import { useRef, useState } from 'react';
import { Invoice } from '@/types/accounting';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoiceDocumentProps {
  invoice: Invoice;
}

const InvoiceDocument = ({ invoice }: InvoiceDocumentProps) => {
  const { company } = useApp();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice_${invoice.invoiceNo}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 no-print">
        <Button onClick={handleDownloadPDF} disabled={downloading} className="gap-2">
          <Download className="w-4 h-4" />
          {downloading ? 'Generating PDF...' : 'Download PDF'}
        </Button>
      </div>

      <div ref={invoiceRef} className="bg-white border border-border p-6 max-w-4xl mx-auto text-sm" style={{ color: '#000' }}>
        <div className="text-center border-b border-gray-300 pb-4 mb-4">
          <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-gray-600">{company.address.join(', ')}</p>
          <p className="text-gray-600">GSTIN: {company.gstin}</p>
          <p className="text-gray-600">State: {company.state} | Code: {company.stateCode}</p>
        </div>
        <div className="text-center font-bold text-lg mb-4 border-b border-gray-300 pb-2 text-gray-900">TAX INVOICE</div>
        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
          <div className="space-y-1">
            <p className="text-gray-700"><span className="font-semibold text-gray-900">Invoice No:</span> {invoice.invoiceNo}</p>
            <p className="text-gray-700"><span className="font-semibold text-gray-900">Date:</span> {invoice.date}</p>
            <p className="text-gray-700"><span className="font-semibold text-gray-900">Mode:</span> {invoice.modeOfPayment || 'Credit'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-700"><span className="font-semibold text-gray-900">Buyer:</span> {invoice.party.name}</p>
            <p className="text-gray-700"><span className="font-semibold text-gray-900">Address:</span> {invoice.party.address.join(', ')}</p>
            <p className="text-gray-700"><span className="font-semibold text-gray-900">GSTIN:</span> {invoice.party.gstin || 'N/A'}</p>
            <p className="text-gray-700"><span className="font-semibold text-gray-900">State:</span> {invoice.party.state} | Code: {invoice.party.stateCode}</p>
          </div>
        </div>
        <table className="w-full border border-gray-300 text-xs mb-4">
          <thead><tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left text-gray-900">S.No</th>
            <th className="border border-gray-300 p-2 text-left text-gray-900">Description</th>
            <th className="border border-gray-300 p-2 text-right text-gray-900">Qty</th>
            <th className="border border-gray-300 p-2 text-right text-gray-900">Rate</th>
            <th className="border border-gray-300 p-2 text-right text-gray-900">Amount</th>
          </tr></thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.slNo}>
                <td className="border border-gray-300 p-2 text-gray-700">{item.slNo}</td>
                <td className="border border-gray-300 p-2 text-gray-700">{item.description}</td>
                <td className="border border-gray-300 p-2 text-right text-gray-700">{item.quantity} {item.unit}</td>
                <td className="border border-gray-300 p-2 text-right text-gray-700">{formatCurrency(item.rate)}</td>
                <td className="border border-gray-300 p-2 text-right text-gray-700">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="bg-gray-100 font-bold">
            <td colSpan={4} className="border border-gray-300 p-2 text-right text-gray-900">Grand Total</td>
            <td className="border border-gray-300 p-2 text-right text-gray-900">{formatCurrency(invoice.totalAmount)}</td>
          </tr></tfoot>
        </table>
        <div className="border border-gray-300 p-3 mb-4 bg-gray-100">
          <p className="text-xs text-gray-700"><span className="font-semibold text-gray-900">Amount in Words:</span> {invoice.amountInWords}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div></div>
          <div className="border border-gray-300 p-3 text-right">
            <p className="font-semibold mb-8 text-gray-900">For {company.name}</p>
            <p className="mt-8 text-gray-600">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDocument;
