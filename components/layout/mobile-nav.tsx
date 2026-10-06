'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './sidebar';
import { UserRole } from '@/types/roles';

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
}

export function MobileNav({ isOpen, onClose, role }: MobileNavProps) {
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
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200">
        <div className="absolute top-3.5 right-3.5 z-20">
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Sidebar
          role={role}
          isCollapsed={false}
          onToggleCollapse={() => {}}
          onItemClick={onClose}
          className="w-full h-full border-r-0"
        />
      </div>
    </div>
  );
}
