export default function BillPreviewModal({ bill, isOpen, onClose }) {
  if (!isOpen || !bill) return null;

  const rent = bill.rent || 0;
  const electricity = bill.electricity || 0;
  const water = bill.water || 0;
  const maintenance = bill.maintenance || 0;
  const otherCharges = bill.otherCharges || 0;
  const discount = bill.discount || 0;
  const totalAmount = bill.totalAmount ?? (rent + electricity + water + maintenance + otherCharges - discount);

  const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">Invoice</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {bill.status || 'Generated'}
              </span>
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
                {typeof bill.unitId === 'object' ? `Unit ${bill.unitId.unitNumber}` : 'Rental Unit'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px]">Issue Date</span>
              <span className="font-semibold text-gray-700 mt-0.5 block">
                {new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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

          {/* Grand Total Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md flex justify-between items-center">
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-100 font-semibold block">Total Amount Due</span>
              <span className="text-2xl font-black tracking-tight mt-0.5 block">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="text-right text-xs text-blue-100">
              <span>Due Date:</span>
              <p className="font-bold text-white text-sm">
                {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN') : 'End of Month'}
              </p>
            </div>
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
