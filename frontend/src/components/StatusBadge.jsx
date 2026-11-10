import React from 'react';
import { Clock, Eye, Wrench, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const statusConfig = {
  'Submitted': {
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: Clock,
    label: 'Submitted',
  },
  'Under Review': {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Eye,
    label: 'Under Review',
  },
  'In Progress': {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Wrench,
    label: 'In Progress',
  },
  'Resolved': {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
    label: 'Resolved',
  },
  'Rejected': {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
    label: 'Rejected',
  },
};

export const StatusBadge = ({ status, size = 'sm', showIcon = true }) => {
  const config = statusConfig[status] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: AlertCircle,
    label: status || 'Unknown',
  };

  const Icon = config.icon;
  const sizeClasses = size === 'lg' 
    ? 'px-3 py-1.5 text-sm font-semibold' 
    : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses} transition-colors`}
    >
      {showIcon && <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
