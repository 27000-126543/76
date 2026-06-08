import { cn } from '@/lib/utils';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeConfig: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
};

export function LoadingSpinner({
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label="loading"
      className={cn(
        'inline-block animate-spin rounded-full border-transparent border-t-primary-500 border-r-primary-500/50',
        sizeConfig[size],
        className
      )}
    />
  );
}

export interface LoadingOverlayProps {
  text?: string;
  className?: string;
}

export function LoadingOverlay({ text, className }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-3 bg-dark-900/70 backdrop-blur-sm z-50',
        className
      )}
    >
      <LoadingSpinner size="xl" />
      {text && (
        <span className="text-dark-200 text-sm font-medium">{text}</span>
      )}
    </div>
  );
}

export interface LoadingScreenProps {
  text?: string;
}

export function LoadingScreen({ text = '加载中...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-dark-950 z-50">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-dark-700" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary-500 border-r-primary-500/50 animate-spin" />
      </div>
      <span className="text-dark-200 text-base font-medium tracking-wide">
        {text}
      </span>
    </div>
  );
}
