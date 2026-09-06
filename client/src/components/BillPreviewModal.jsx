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

  useEffect(() => {
    setBill(initialBill);
    setShowPaymentForm(false);
  }, [initialBill]);

  useEffect(() => {
    if (!bill?._id || !isOpen) return;

    const fetchPayments = async () => {
      try {
        const res = await api.get(`/payments/bill/${bill._id}`);
        setPayments(res.data.payments || []);
        setTotalPaidSoFar(res.data.totalPaidSoFar || 0);
      } catch {
        // Fallback for temporary or offline instances
        setPayments([]);
        setTotalPaidSoFar(bill.status === 'Paid' ? (bill.totalAmount || 0) : 0);
      }
    };

    fetchPayments();
  }, [bill?._id, isOpen, bill?.status, bill?.totalAmount]);

  if (!bill) return null;

  const rent = bill.rent || 0;
  const electricity = bill.electricity || 0;
  const water = bill.water || 0;
  const maintenance = bill.maintenance || 0;
  const otherCharges = bill.otherCharges || 0;
  const discount = bill.discount || 0;
  const totalAmount = bill.totalAmount ?? (rent + electricity + water + maintenance + otherCharges - discount);

  const remainingBalance = Math.max(0, totalAmount - totalPaidSoFar);

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const handlePrint = () => {
    window.print();
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

    try {
      setSubmittingPayment(true);
      const res = await api.post('/payments', {
        billId: bill._id,
        amountPaid: amount,
        method: paymentForm.method,
        transactionRef: paymentForm.transactionRef
      });

      toast.success('Payment recorded successfully!');
      
      const newPayment = res.data.payment;
      const updatedBill = res.data.bill || { ...bill, status: amount >= remainingBalance ? 'Paid' : 'Partial' };

      setPayments(prev => [newPayment, ...prev]);
      setTotalPaidSoFar(res.data.totalPaidSoFar || (totalPaidSoFar + amount));
      setBill(updatedBill);
      setShowPaymentForm(false);

      if (onUpdate) onUpdate(updatedBill);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {/* Header */}
        <DialogHeader className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">Invoice Detail</span>
            <StatusBadge status={bill.status || 'Pending'} />
          </div>
          <DialogTitle>{bill.invoiceNumber || 'INV-PREVIEW'}</DialogTitle>
          <DialogDescription>
            Billing Month: <span className="font-semibold text-white">{bill.month}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 max-h-[70vh]">
          {/* Tenant / Unit Meta Card */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/70 flex justify-between text-xs">
            <div>
              <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px]">Rental Unit</span>
              <span className="font-bold text-gray-800 text-sm mt-0.5 block">
                {bill.unitId && typeof bill.unitId === 'object' ? `Unit ${bill.unitId.unitNumber}` : 'Rental Unit'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px]">Issue Date</span>
              <span className="font-semibold text-gray-700 mt-0.5 block">
                {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Breakdown List */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Itemized Breakdown</h3>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white text-sm">
              <div className="p-3.5 flex justify-between items-center hover:bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-medium text-gray-700">Base Rent</span>
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(rent)}</span>
              </div>

              <div className="p-3.5 flex justify-between items-center hover:bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-medium text-gray-700">Electricity Charges</span>
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(electricity)}</span>
              </div>

              <div className="p-3.5 flex justify-between items-center hover:bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span className="font-medium text-gray-700">Water Utility</span>
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(water)}</span>
              </div>

              <div className="p-3.5 flex justify-between items-center hover:bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="font-medium text-gray-700">Maintenance Fee</span>
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(maintenance)}</span>
              </div>

              {otherCharges > 0 && (
                <div className="p-3.5 flex justify-between items-center hover:bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="font-medium text-gray-700">Other Charges</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(otherCharges)}</span>
                </div>
              )}

              {discount > 0 && (
                <div className="p-3.5 flex justify-between items-center bg-emerald-50/40 text-emerald-900">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-medium">Discount Applied</span>
                  </div>
                  <span className="font-bold text-emerald-700">-{formatCurrency(discount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Grand Total & Payment Summary Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs uppercase tracking-wider text-blue-100 font-semibold block">Total Amount Due</span>
                <span className="text-2xl font-black tracking-tight mt-0.5 block">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="text-right text-xs text-blue-100">
                <span>Paid: <strong className="text-emerald-300 font-bold text-sm">{formatCurrency(totalPaidSoFar)}</strong></span>
                <p className="font-semibold text-white text-xs mt-0.5">
                  Balance: <span className="font-bold text-amber-200 text-sm">{formatCurrency(remainingBalance)}</span>
                </p>
              </div>
            </div>

            {/* Payment Progress Bar */}
            {totalAmount > 0 && (
              <div>
                <div className="flex justify-between text-[10px] text-blue-100 mb-1 font-semibold">
                  <span>Payment Progress</span>
                  <span>{Math.min(100, Math.round((totalPaidSoFar / totalAmount) * 100))}% Paid</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((totalPaidSoFar / totalAmount) * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Record Payment Section */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Records</h3>
              {!showPaymentForm && bill.status !== 'Paid' && (
                <Button variant="success" size="sm" onClick={handleOpenPaymentForm} className="text-xs h-8">
                  + Record Payment
                </Button>
              )}
            </div>

            {/* Record Payment Form */}
            {showPaymentForm && (
              <form onSubmit={handleRecordPayment} className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-4 mb-4">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Record New Payment Entry</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="amountPaid">Amount Paid (₹)</Label>
                    <Input
                      id="amountPaid"
                      type="number"
                      placeholder="e.g. 5000"
                      required
                      min="1"
                      value={paymentForm.amountPaid}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
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
                  <Label htmlFor="transactionRef">Transaction Ref / Note (Optional)</Label>
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

            {/* Payments List */}
            {payments.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No payments recorded yet for this invoice.</p>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden text-xs bg-white">
                {payments.map((p, idx) => (
                  <div key={p._id || idx} className="p-3 flex justify-between items-center hover:bg-gray-50/50">
                    <div>
                      <span className="font-bold text-emerald-700">{formatCurrency(p.amountPaid)}</span>
                      <span className="text-gray-400 mx-2">&bull;</span>
                      <Badge variant="secondary" className="text-[10px] py-0 px-2">{p.method || 'Cash'}</Badge>
                      {p.transactionRef && (
                        <p className="text-[11px] text-gray-500 mt-0.5">Ref: {p.transactionRef}</p>
                      )}
                    </div>
                    <span className="text-gray-400 text-[11px]">
                      {p.paymentDate || p.createdAt ? new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handlePrint} size="sm" className="gap-1.5">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save
          </Button>

          <Button onClick={onClose} size="sm">
            Close Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
