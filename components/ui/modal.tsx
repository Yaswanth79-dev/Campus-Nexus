'use client';

import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-3xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Frosted Glass Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
      />

      {/* Modal Card */}
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 z-10 transition-all duration-300 transform animate-in fade-in zoom-in-95 overflow-hidden',
          'shadow-[0_24px_60px_-12px_rgba(15,23,42,0.28),inset_0_1px_0_rgba(255,255,255,0.95)]',
          sizeClasses[size]
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-slate-100/90 bg-white">
            <div>
              {title && (
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
            )}
          </div>
        )}

        <div className="p-5 sm:p-6 max-h-[calc(85vh-130px)] overflow-y-auto scrollbar-thin">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 p-5 sm:p-6 pt-3.5 border-t border-slate-100/90 bg-slate-50/70">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

