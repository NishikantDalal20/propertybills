import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import BillPreviewModal from '../components/BillPreviewModal';

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [previewBill, setPreviewBill] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bills');
      setBills(res.data);
    } catch {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleStatusUpdate = async (billId, newStatus) => {
    try {
      setUpdatingId(billId);
      const res = await api.patch(`/bills/${billId}/status`, { status: newStatus });
      setBills(prev => prev.map(b => b._id === billId ? res.data : b));
      toast.success(`Bill marked as ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update bill status');
    } finally {
      setUpdatingId(null);
    }
  };

  const monthsList = Array.from(new Set(bills.map(b => b.month))).sort().reverse();

  const filteredBills = bills.filter(bill => {
    const matchesMonth = selectedMonth === 'All' || bill.month === selectedMonth;
    const matchesStatus = selectedStatus === 'All' || bill.status === selectedStatus;

    const unitName = bill.unitId?.unitNumber ? `Unit ${bill.unitId.unitNumber}` : '';
    const tenantName = bill.tenantId?.name || '';
    const invNum = bill.invoiceNumber || '';
    const query = searchQuery.toLowerCase().trim();

    const matchesQuery = !query ||
      invNum.toLowerCase().includes(query) ||
      unitName.toLowerCase().includes(query) ||
      tenantName.toLowerCase().includes(query);

    return matchesMonth && matchesStatus && matchesQuery;
  });

  const totalAmountSum = filteredBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const paidAmountSum = filteredBills.filter(b => b.status === 'Paid').reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const pendingCount = filteredBills.filter(b => b.status === 'Pending' || b.status === 'Overdue').length;

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Billing Invoices</h1>
            <p className="text-sm text-gray-500 mt-1">View, track, filter, and manage property bills and invoices.</p>
          </div>

          <button
            onClick={fetchBills}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 self-start md:self-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Metrics Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Invoices</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-bold text-gray-900">{filteredBills.length}</span>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                ₹{totalAmountSum.toLocaleString('en-IN')} Total
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Collected Revenue</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-bold text-emerald-600">₹{paidAmountSum.toLocaleString('en-IN')}</span>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Paid
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Pending Collections</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-bold text-amber-600">{pendingCount}</span>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                Action Required
              </span>
            </div>
          </div>
        </div>

        {/* Filters & Search Control Bar */}
        <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Search invoice, unit, tenant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-gray-50/50 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 bg-gray-50/50 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="All">All Months</option>
                {monthsList.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-gray-50/50 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          {(selectedMonth !== 'All' || selectedStatus !== 'All' || searchQuery) && (
            <button
              onClick={() => { setSelectedMonth('All'); setSelectedStatus('All'); setSearchQuery(''); }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer self-end md:self-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Bills Table Container */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <LoadingSpinner size="lg" color="blue" label="Loading bills database..." />
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="py-16 text-center p-8">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center text-xl mb-3">
                🧾
              </div>
              <h3 className="text-sm font-bold text-gray-900">No Bills Found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                No generated bills match your current filter selection. Record meter readings to generate new bills.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200/80">
                  <tr>
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Month</th>
                    <th className="py-3.5 px-4">Rental Unit</th>
                    <th className="py-3.5 px-4">Tenant</th>
                    <th className="py-3.5 px-4 text-right">Rent</th>
                    <th className="py-3.5 px-4 text-right">Electricity</th>
                    <th className="py-3.5 px-4 text-right">Total Amount</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBills.map(bill => {
                    const unitLabel = bill.unitId?.unitNumber ? `Unit ${bill.unitId.unitNumber}` : 'Rental Unit';
                    const tenantLabel = bill.tenantId?.name || '—';
                    const isPaid = bill.status === 'Paid';

                    return (
                      <tr key={bill._id} className="hover:bg-gray-50/60 transition-all">
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {bill.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-600">
                          {bill.month}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-800">
                          {unitLabel}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {tenantLabel}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-gray-700">
                          ₹{(bill.rent || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-gray-700">
                          ₹{(bill.electricity || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-gray-900 text-sm">
                          ₹{(bill.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : bill.status === 'Overdue'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleStatusUpdate(bill._id, isPaid ? 'Pending' : 'Paid')}
                              disabled={updatingId === bill._id}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${isPaid
                                  ? 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                }`}
                            >
                              {updatingId === bill._id ? 'Updating...' : isPaid ? 'Mark Pending' : 'Mark Paid'}
                            </button>

                            <button
                              onClick={() => { setPreviewBill(bill); setShowPreview(true); }}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all cursor-pointer"
                            >
                              Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Bill Breakdown Modal */}
      <BillPreviewModal
        bill={previewBill}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
}
