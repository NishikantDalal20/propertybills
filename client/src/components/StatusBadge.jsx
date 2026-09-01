export default function StatusBadge({ status }) {
  const currentStatus = status || 'Vacant';

  const badgeStyles = {
    Occupied: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Vacant: 'bg-amber-50 text-amber-700 border-amber-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Partial: 'bg-blue-50 text-blue-700 border-blue-200',
    Inactive: 'bg-gray-100 text-gray-700 border-gray-200',
    Overdue: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const dotColors = {
    Occupied: 'bg-emerald-500',
    Active: 'bg-emerald-500',
    Paid: 'bg-emerald-500',
    Vacant: 'bg-amber-500',
    Pending: 'bg-amber-500',
    Partial: 'bg-blue-500',
    Inactive: 'bg-gray-400',
    Overdue: 'bg-rose-500',
  };

  const style = badgeStyles[currentStatus] || 'bg-gray-100 text-gray-700 border-gray-200';
  const dot = dotColors[currentStatus] || 'bg-gray-400';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${style}`}>
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${dot}`} />
      {currentStatus}
    </span>
  );
}
