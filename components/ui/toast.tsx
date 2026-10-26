'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  toast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type = 'info', duration = 4000 }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, toast: showToast, removeToast }}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none p-4 sm:p-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3.5 rounded-2xl p-4 shadow-[0_12px_36px_-6px_rgba(15,23,42,0.18),0_2px_8px_rgba(0,0,0,0.06)] border backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-bottom-5',
              toast.type === 'success' && 'bg-white/95 border-emerald-200/90 text-emerald-950 ring-1 ring-emerald-500/20',
              toast.type === 'error' && 'bg-white/95 border-rose-200/90 text-rose-950 ring-1 ring-rose-500/20',
              toast.type === 'warning' && 'bg-white/95 border-amber-200/90 text-amber-950 ring-1 ring-amber-500/20',
              toast.type === 'info' && 'bg-white/95 border-slate-200/90 text-slate-900 ring-1 ring-indigo-500/15'
            )}
          >
            <span className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2.2]" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 stroke-[2.2]" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 stroke-[2.2]" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-600 stroke-[2.2]" />}
            </span>

            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-bold tracking-tight leading-snug">{toast.title}</h5>
              {toast.message && (
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{toast.message}</p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 p-1 rounded-lg hover:bg-slate-100/80 cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
