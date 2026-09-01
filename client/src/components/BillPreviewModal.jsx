import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import StatusBadge from './StatusBadge';
import LoadingSpinner from './LoadingSpinner';

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

  if (!isOpen || !bill) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">Invoice</span>
              <StatusBadge status={bill.status || 'Generated'} />
            </div>
            <h2 className="text-xl font-black tracking-tight">{bill.invoiceNumber || 'INV-PREVIEW'}</h2>
            <p className="text-xs text-gray-300 mt-1">Billing Month: <span className="font-semibold text-white">{bill.month}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
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
                {new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Itemized Breakdown List */}
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
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md flex justify-between items-center">
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

          {/* Record Payment Section */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Records</h3>
              {!showPaymentForm && bill.status !== 'Paid' && (
                <button
                  type="button"
                  onClick={handleOpenPaymentForm}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  + Record Payment
                </button>
              )}
            </div>

            {/* Record Payment Form */}
            {showPaymentForm && (
              <form onSubmit={handleRecordPayment} className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-3.5 mb-4">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Record Payment Form</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Amount Paid (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      required
                      min="1"
                      value={paymentForm.amountPaid}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Payment Method <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={paymentForm.method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Card">Credit/Debit Card</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Transaction Ref (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI UTR #9283748291"
                    value={paymentForm.transactionRef}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200/60 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {submittingPayment ? <LoadingSpinner size="sm" color="white" label="Saving..." /> : 'Save Payment'}
                  </button>
                </div>
              </form>
            )}

            {/* Past Payment History */}
            {payments.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No payments recorded yet for this invoice.</p>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden text-xs bg-white">
                {payments.map((p, idx) => (
                  <div key={p._id || idx} className="p-3 flex justify-between items-center hover:bg-gray-50/50">
                    <div>
                      <span className="font-bold text-emerald-700 text-sm">{formatCurrency(p.amountPaid)}</span>
                      <span className="text-gray-400 mx-2">&bull;</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                        {p.method || 'Cash'}
                      </span>
                      {p.transactionRef && (
                        <p className="text-[11px] text-gray-500 mt-0.5">Ref: {p.transactionRef}</p>
                      )}
                    </div>
                    <span className="text-gray-400 text-[11px]">
                      {new Date(p.paymentDate || p.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
