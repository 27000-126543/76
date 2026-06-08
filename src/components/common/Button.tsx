import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'ghost'
  | 'outline';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantConfig: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 border border-primary-500/50',
  secondary:
    'bg-dark-700 text-dark-100 hover:bg-dark-600 border border-dark-600 hover:border-dark-500',
  success:
    'bg-success text-white hover:bg-success/90 shadow-lg shadow-success/25 hover:shadow-success/40 border border-success/50',
  danger:
    'bg-danger text-white hover:bg-danger/90 shadow-lg shadow-danger/25 hover:shadow-danger/40 border border-danger/50',
  warning:
    'bg-warning text-dark-900 hover:bg-warning/90 shadow-lg shadow-warning/25 hover:shadow-warning/40 border border-warning/50',
  ghost:
    'bg-transparent text-dark-200 hover:bg-dark-700/50 hover:text-white border border-transparent',
  outline:
    'bg-transparent text-dark-100 border border-dark-500 hover:bg-dark-700/50 hover:border-dark-400',
};

const sizeConfig: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-10 w-10 p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
          variantConfig[variant],
          sizeConfig[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {size !== 'icon' && children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
