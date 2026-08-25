export default function LoadingSpinner({
  size = 'md',
  color = 'blue',
  label = null,
  fullPage = false,
  center = false,
  className = ''
}) {
  const sizeClass = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-3' }[size] || 'w-6 h-6 border-2';
  const colorClass = {
    blue: 'border-blue-600 border-t-transparent text-blue-600',
    white: 'border-white border-t-transparent text-white',
    current: 'border-current border-t-transparent text-current'
  }[color] || 'border-blue-600 border-t-transparent text-blue-600';

  const spinner = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`animate-spin rounded-full ${sizeClass} ${colorClass}`} role="status" aria-label="loading" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col items-center gap-4 text-center max-w-sm w-full">
          <div className="animate-spin rounded-full w-10 h-10 border-3 border-blue-600 border-t-transparent" />
          {label && <p className="text-sm font-semibold text-gray-700">{label}</p>}
        </div>
      </div>
    );
  }

  return center ? <div className="py-12 flex flex-col items-center justify-center text-center w-full">{spinner}</div> : spinner;
}
