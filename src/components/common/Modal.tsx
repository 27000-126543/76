import {
  useEffect,
  type ReactNode,
  type MouseEvent,
} from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './Button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closable?: boolean;
  maskClosable?: boolean;
  showFooter?: boolean;
  onOk?: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  okLoading?: boolean;
  okDisabled?: boolean;
  className?: string;
  contentClassName?: string;
}

const sizeConfig: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closable = true,
  maskClosable = true,
  showFooter = true,
  onOk,
  onCancel,
  okText = '确定',
  cancelText = '取消',
  okLoading = false,
  okDisabled = false,
  className,
  contentClassName,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleMaskClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (maskClosable) {
      onClose();
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const handleOk = () => {
    onOk?.();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleMaskClick}
      />

      <div
        className={cn(
          'relative w-full rounded-xl border border-dark-700 bg-dark-800 shadow-2xl',
          'flex flex-col max-h-[90vh]',
          'animate-in zoom-in-95 fade-in duration-200',
          sizeConfig[size],
          className
        )}
      >
        {(title || closable) && (
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-dark-700/60">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold text-white">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-dark-400">{description}</p>
              )}
            </div>
            {closable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 -mr-2 -mt-1 text-dark-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}

        <div
          className={cn(
            'flex-1 overflow-y-auto px-6 py-4',
            contentClassName
          )}
        >
          {children}
        </div>

        {showFooter && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-700/60 bg-dark-800/50">
            {footer ?? (
              <>
                <Button variant="secondary" onClick={handleCancel}>
                  {cancelText}
                </Button>
                <Button
                  onClick={handleOk}
                  loading={okLoading}
                  disabled={okDisabled}
                >
                  {okText}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
