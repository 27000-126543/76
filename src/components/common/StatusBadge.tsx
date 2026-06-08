import { cn } from '@/lib/utils';

export type StatusType =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'pending'
  | 'running'
  | 'idle'
  | 'fault'
  | 'completed'
  | 'processing';

export interface StatusBadgeProps {
  status: StatusType;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  success: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/30',
    dot: 'bg-success',
    label: '成功',
  },
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/30',
    dot: 'bg-warning',
    label: '警告',
  },
  danger: {
    bg: 'bg-danger/10',
    text: 'text-danger',
    border: 'border-danger/30',
    dot: 'bg-danger',
    label: '危险',
  },
  info: {
    bg: 'bg-primary-500/10',
    text: 'text-primary-500',
    border: 'border-primary-500/30',
    dot: 'bg-primary-500',
    label: '信息',
  },
  pending: {
    bg: 'bg-dark-400/10',
    text: 'text-dark-400',
    border: 'border-dark-400/30',
    dot: 'bg-dark-400',
    label: '待处理',
  },
  running: {
    bg: 'bg-primary-500/10',
    text: 'text-primary-500',
    border: 'border-primary-500/30',
    dot: 'bg-primary-500',
    label: '运行中',
  },
  idle: {
    bg: 'bg-dark-500/10',
    text: 'text-dark-500',
    border: 'border-dark-500/30',
    dot: 'bg-dark-500',
    label: '空闲',
  },
  fault: {
    bg: 'bg-danger/10',
    text: 'text-danger',
    border: 'border-danger/30',
    dot: 'bg-danger',
    label: '故障',
  },
  completed: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/30',
    dot: 'bg-success',
    label: '已完成',
  },
  processing: {
    bg: 'bg-accent-500/10',
    text: 'text-accent-500',
    border: 'border-accent-500/30',
    dot: 'bg-accent-500',
    label: '处理中',
  },
};

const sizeConfig = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const dotSizeConfig = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export function StatusBadge({
  status,
  text,
  size = 'md',
  pulse = false,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-medium',
        config.bg,
        config.text,
        config.border,
        sizeConfig[size],
        className
      )}
    >
      <span
        className={cn(
          'rounded-full',
          config.dot,
          dotSizeConfig[size],
          pulse && 'animate-pulse'
        )}
      />
      {text ?? config.label}
    </span>
  );
}
