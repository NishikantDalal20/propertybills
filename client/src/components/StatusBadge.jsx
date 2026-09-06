import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function StatusBadge({ status }) {
  const currentStatus = status || 'Vacant';

  const statusVariantMap = {
    Occupied: 'success',
    Active: 'success',
    Paid: 'success',
    Vacant: 'warning',
    Pending: 'warning',
    Partial: 'default',
    Inactive: 'secondary',
    Overdue: 'destructive',
  };

  const variant = statusVariantMap[currentStatus] || 'secondary';

  const dotColorMap = {
    Occupied: 'bg-emerald-500',
    Active: 'bg-emerald-500',
    Paid: 'bg-emerald-500',
    Vacant: 'bg-amber-500',
    Pending: 'bg-amber-500',
    Partial: 'bg-blue-500',
    Inactive: 'bg-gray-400',
    Overdue: 'bg-rose-500',
  };

  const dotColor = dotColorMap[currentStatus] || 'bg-gray-400';

  return (
    <Badge variant={variant}>
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${dotColor}`} />
      {currentStatus}
    </Badge>
  );
}
