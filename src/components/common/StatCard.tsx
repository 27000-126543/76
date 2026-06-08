import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from 'lucide-react';

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface StatCardProps {
  title: string;
  value: ReactNode;
  unit?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: number;
  trendDirection?: TrendDirection;
  trendLabel?: string;
  glowColor?: string;
  className?: string;
  footer?: ReactNode;
}

const trendIconConfig: Record<TrendDirection, { icon: typeof TrendingUp; color: string }> = {
  up: { icon: TrendingUp, color: 'text-success' },
  down: { icon: TrendingDown, color: 'text-danger' },
  neutral: { icon: Minus, color: 'text-dark-400' },
};

export function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  iconColor = 'text-primary-500',
  trend,
  trendDirection = 'neutral',
  trendLabel,
  glowColor,
  className,
  footer,
}: StatCardProps) {
  const trendConfig = trendIconConfig[trendDirection];
  const TrendIcon = trendConfig.icon;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-dark-700 bg-dark-800/50 p-5',
        'transition-all duration-300 hover:border-dark-600 hover:bg-dark-800',
        className
      )}
      style={{
        boxShadow: glowColor
          ? `0 0 40px -12px ${glowColor}`
          : undefined,
      }}
    >
      {glowColor && (
        <div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: glowColor }}
        />
      )}

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-dark-400 mb-1">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-white tracking-tight">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-dark-400 font-medium">
                {unit}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-lg bg-dark-700/50',
              iconColor
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {(trend !== undefined || footer) && (
        <div className="relative mt-4 pt-4 border-t border-dark-700/50">
          {trend !== undefined ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendIcon
                  className={cn('w-4 h-4', trendConfig.color)}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    trendConfig.color
                  )}
                >
                  {trend > 0 ? '+' : ''}
                  {trend}%
                </span>
              </div>
              {trendLabel && (
                <span className="text-xs text-dark-500">
                  {trendLabel}
                </span>
              )}
            </div>
          ) : (
            footer
          )}
        </div>
      )}
    </div>
  );
}
