import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import StatusBadge from './StatusBadge';

export default function BillPreviewModal({ bill: initialBill, isOpen, onClose, onUpdate }) {
  const [bill, setBill] = useState(initialBill);
  const [payments, setPayments] = useState([]);
  const [totalPaidSoFar, setTotalPaidSoFar] = useState(0);

  // Record Payment Form State
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: '',
    method: 'UPI',
    transactionRef: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    setBill(initialBill);
    setShowPaymentForm(false);
  }, [initialBill]);

  const isRealObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

  useEffect(() => {
    if (!bill?._id || !isOpen) return;

    const fetchPayments = async () => {
      if (!isRealObjectId(bill._id)) {
        setPayments([]);
        setTotalPaidSoFar(bill.status === 'Paid' ? (bill.totalAmount || 0) : 0);
        return;
      }

      try {
        const res = await api.get(`/payments/bill/${bill._id}`);
        const paymentList = Array.isArray(res.data)
          ? res.data
          : (res.data.payments || []);

        const paidTotal = paymentList.reduce(
          (sum, payment) => sum + Number(payment.amountPaid || 0),
          0
        );

        setPayments(paymentList);
        setTotalPaidSoFar(paidTotal);
      } catch {
        setPayments([]);
        setTotalPaidSoFar(bill.status === 'Paid' ? (bill.totalAmount || 0) : 0);
      }
    };

    fetchPayments();
  }, [bill?._id, isOpen, bill?.status, bill?.totalAmount]);

  if (!bill) return null;

  const rent = Number(bill.rent || 0);
  const electricity = Number(bill.electricity || 0);
  const water = Number(bill.water || 0);
  const maintenance = Number(bill.maintenance || 0);
  const otherCharges = Number(bill.otherCharges || 0);
  const discount = Number(bill.discount || 0);
  const subtotal = rent + electricity + water + maintenance + otherCharges;
  const totalAmount = bill.totalAmount !== undefined ? Number(bill.totalAmount) : (subtotal - discount);

  const remainingBalance = Math.max(0, totalAmount - totalPaidSoFar);
  const paymentPercent = totalAmount > 0 ? Math.min(100, Math.round((totalPaidSoFar / totalAmount) * 100)) : 0;

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!bill?._id) return;
    try {
      setDownloadingPdf(true);
      if (isRealObjectId(bill._id)) {
        const res = await api.get(`/invoices/${bill._id}`, { responseType: 'blob' });
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${bill.invoiceNumber || bill._id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('PDF Invoice downloaded!');
      } else {
        toast.error('Save bill first to download PDF invoice');
      }
    } catch (err) {
      console.error('Failed to download PDF invoice:', err);
      toast.error('Failed to download PDF invoice');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleOpenPaymentForm = () => {
    setPaymentForm({
      amountPaid: remainingBalance > 0 ? remainingBalance : '',
      method: 'UPI',
      transactionRef: ''
    });
    setShowPaymentForm(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amount = Number(paymentForm.amountPaid);
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (amount > remainingBalance) {
      toast.error(`Payment cannot exceed the remaining balance of ${formatCurrency(remainingBalance)}`);
      return;
    }

    if (!isRealObjectId(bill._id)) {
      const newPayment = {
        _id: `pay-temp-${Date.now()}`,
        billId: bill._id,
        amountPaid: amount,
        method: paymentForm.method,
        transactionRef: paymentForm.transactionRef,
        paymentDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const newTotalPaid = totalPaidSoFar + amount;
      const newStatus = newTotalPaid >= totalAmount ? 'Paid' : 'Partial';
      const updatedBill = { ...bill, status: newStatus };

      setPayments((prev) => [newPayment, ...prev]);
      setTotalPaidSoFar(newTotalPaid);
      setBill(updatedBill);
      setShowPaymentForm(false);
      setPaymentForm({ amountPaid: '', method: 'UPI', transactionRef: '' });

      if (onUpdate) {
        onUpdate(updatedBill);
      }

      toast.success('Payment recorded successfully!');
      return;
    }

    try {
      setSubmittingPayment(true);
      const res = await api.post('/payments', {
        billId: bill._id,
        amountPaid: amount,
        method: paymentForm.method,
        transactionRef: paymentForm.transactionRef
      });

      const { payment, billStatus, remaining, totalPaidSoFar: backendPaidSoFar, bill: backendBill } = res.data;

      const newTotalPaid = backendPaidSoFar !== undefined
        ? backendPaidSoFar
        : totalAmount - Number(remaining || 0);

      const updatedBill = backendBill || {
        ...bill,
        status: billStatus || (newTotalPaid >= totalAmount ? 'Paid' : newTotalPaid > 0 ? 'Partial' : bill.status)
      };

      setPayments((prev) => [payment, ...prev]);
      setTotalPaidSoFar(newTotalPaid);
      setBill(updatedBill);
      setShowPaymentForm(false);
      setPaymentForm({ amountPaid: '', method: 'UPI', transactionRef: '' });

      if (onUpdate) {
        onUpdate(updatedBill);
      }

      toast.success('Payment recorded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Safe Resolution of Tenant & Unit Meta
  const tenantObj = typeof bill.tenantId === 'object' ? bill.tenantId : null;
  const unitObj = typeof bill.unitId === 'object' ? bill.unitId : null;
  const unitNumberLabel = unitObj?.unitNumber ? `Unit ${unitObj.unitNumber}` : (bill.unitId ? `Unit ${bill.unitId}` : 'Rental Unit');
  
  const issueDateFormatted = bill.createdAt
    ? new Date(bill.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden print:max-w-none print:w-full print:border-none print:shadow-none">
        
        {/* Invoice Header */}
        <DialogHeader className="p-6 border-b border-gray-100 bg-gray-50/60 flex flex-row items-center justify-between space-y-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-black tracking-tight text-gray-900">PROPERTYBILLS</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100/70 text-blue-700 px-2 py-0.5 rounded border border-blue-200/50">
                Property Management
              </span>
            </div>
            <DialogDescription className="text-xs text-gray-500">
              Official Rental Invoice & Utility Breakdown
            </DialogDescription>
          </div>

          <div className="text-right space-y-1">
            <div className="flex items-center justify-end gap-2">
              <DialogTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">
                INVOICE
              </DialogTitle>
              <StatusBadge status={bill.status || 'Pending'} />
            </div>
            <p className="text-base font-bold text-gray-900 font-mono tracking-tight">
              {bill.invoiceNumber || 'INV-PREVIEW'}
            </p>
          </div>
        </DialogHeader>

        {/* Invoice Body Container */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm font-sans">
          
          {/* Bill & Billed To Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50/80 border border-gray-200/70 text-xs">
            <div>
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                Billed To
              </span>
              {tenantObj?.name ? (
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-900 text-sm">{tenantObj.name}</p>
                  {tenantObj.phone && <p className="text-gray-600">📞 {tenantObj.phone}</p>}
                  {tenantObj.email && <p className="text-gray-600">✉️ {tenantObj.email}</p>}
                </div>
              ) : (
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-900 text-sm">{unitNumberLabel}</p>
                  <p className="text-gray-500 italic">Tenant Information Unassigned</p>
                </div>
              )}
            </div>

            <div className="sm:text-right space-y-1 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200/60">
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                Invoice Details
              </span>
              <p><span className="text-gray-500">Billing Month:</span> <strong className="text-gray-800">{bill.month}</strong></p>
              <p><span className="text-gray-500">Rental Unit:</span> <strong className="text-gray-800">{unitNumberLabel}</strong></p>
              <p><span className="text-gray-500">Issue Date:</span> <span className="text-gray-700">{issueDateFormatted}</span></p>
            </div>
          </div>

          {/* Itemized Charges Table */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Itemized Breakdown
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/70 border-b border-gray-200/80 text-gray-600 font-semibold text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  <tr>
                    <td className="py-2.5 px-4 font-medium">Base Rent</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{formatCurrency(rent)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium">Electricity Charges</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{formatCurrency(electricity)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium">Water Utility</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{formatCurrency(water)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium">Maintenance Fee</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{formatCurrency(maintenance)}</td>
                  </tr>
                  {otherCharges > 0 && (
                    <tr>
                      <td className="py-2.5 px-4 font-medium">Other Charges</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{formatCurrency(otherCharges)}</td>
                    </tr>
                  )}
                  {discount > 0 && (
                    <tr className="bg-emerald-50/40 text-emerald-900">
                      <td className="py-2.5 px-4 font-semibold">Discount Applied</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-700">-{formatCurrency(discount)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subtotal & Total Amount Due Summary Box */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-end gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50/40 text-xs">
            <div className="space-y-1 text-gray-600">
              <p>Subtotal: <strong className="text-gray-800">{formatCurrency(subtotal)}</strong></p>
              {discount > 0 && <p className="text-emerald-700 font-semibold">Discount: -{formatCurrency(discount)}</p>}
            </div>
            <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Total Amount Due
              </span>
              <span className="text-2xl font-black text-gray-900 tracking-tight">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Payment Summary
            </h3>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Total Amount</span>
                <span className="text-sm font-bold text-gray-900 mt-0.5 block">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/70">
                <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">Paid</span>
                <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">{formatCurrency(totalPaidSoFar)}</span>
              </div>
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70">
                <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider block">Remaining</span>
                <span className="text-sm font-extrabold text-amber-700 mt-0.5 block">{formatCurrency(remainingBalance)}</span>
              </div>
            </div>

            {/* Payment Progress Bar */}
            {totalAmount > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-gray-500">
                  <span>Payment Progress</span>
                  <span className="text-emerald-700 font-bold">{paymentPercent}% Paid</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${paymentPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment History & Record Payment Section */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Payment History
              </h3>
              {!showPaymentForm && bill.status !== 'Paid' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleOpenPaymentForm}
                  className="text-xs h-7 px-3 print:hidden"
                >
                  + Record Payment
                </Button>
              )}
            </div>

            {/* Record Payment Form */}
            {showPaymentForm && (
              <form onSubmit={handleRecordPayment} className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-3 print:hidden">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Record New Payment Entry
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="amountPaid" className="text-xs">Amount Paid (₹)</Label>
                    <Input
                      id="amountPaid"
                      type="number"
                      placeholder="e.g. 5000"
                      required
                      min="1"
                      max={remainingBalance}
                      value={paymentForm.amountPaid}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod" className="text-xs">Payment Method</Label>
                    <Select
                      id="paymentMethod"
                      value={paymentForm.method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    >
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Card">Credit/Debit Card</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="transactionRef" className="text-xs">Transaction Ref / Note (Optional)</Label>
                  <Input
                    id="transactionRef"
                    placeholder="e.g. UPI Ref #9283748291"
                    value={paymentForm.transactionRef}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowPaymentForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="success" size="sm" disabled={submittingPayment}>
                    {submittingPayment ? <Spinner size="sm" className="mr-1.5" /> : null}
                    {submittingPayment ? 'Saving...' : 'Save Payment'}
                  </Button>
                </div>
              </form>
            )}

            {/* Payments List Table */}
            {payments.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">
                No payments recorded yet for this invoice.
              </p>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-500 font-semibold text-[10px] uppercase tracking-wider">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3">Reference</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((p, idx) => {
                      const pDateFormatted = p.paymentDate || p.createdAt
                        ? new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : 'Recently';

                      return (
                        <tr key={p._id || idx} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-3 font-medium text-gray-600">{pDateFormatted}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant="secondary" className="text-[10px] py-0 px-2 font-normal">
                              {p.method || 'Cash'}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">
                            {p.transactionRef || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                            {formatCurrency(p.amountPaid)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              size="sm"
              className="gap-1.5 text-xs border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/70"
            >
              {downloadingPdf ? (
                <Spinner size="sm" />
              ) : (
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {downloadingPdf ? 'Downloading PDF...' : 'Download PDF Invoice'}
            </Button>

            <Button variant="outline" onClick={handlePrint} size="sm" className="gap-1.5 text-xs">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save
            </Button>
          </div>

          <Button onClick={onClose} size="sm" className="text-xs">
            Close Preview
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
