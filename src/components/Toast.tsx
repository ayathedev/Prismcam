import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onAction?: () => void;
  actionLabel?: string;
}

export const Toast: React.FC<ToastProps> = ({ message, onAction, actionLabel }) => {
  if (!message) return null;

  return (
    <div className="fixed top-16 inset-x-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="pointer-events-auto max-w-sm w-full bg-neutral-900/70 backdrop-blur-xl border border-white/20 text-white rounded-2xl px-4 py-2.5 shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-white truncate">{message}</span>
        </div>
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wider shrink-0 px-2 py-1 rounded bg-white/10"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
