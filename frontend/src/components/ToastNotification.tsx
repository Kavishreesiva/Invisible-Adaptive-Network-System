import React, { useEffect } from 'react';
import { Bell, ShieldAlert, CheckCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'alert';
  title: string;
  message: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        onDismiss(toasts[0].id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full">
      {toasts.map((toast) => {
        const isAlert = toast.type === 'alert';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            className={`neu-raised p-4 flex items-start space-x-3 transition-all transform translate-y-0 shadow-2xl border ${
              isAlert
                ? 'border-red-500/40 bg-[#1A1315]'
                : isSuccess
                ? 'border-emerald-500/40 bg-[#121E19]'
                : 'border-cyan-500/40 bg-[#131920]'
            }`}
          >
            {isAlert && <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-bounce" />}
            {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {!isAlert && !isSuccess && <Bell className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />}

            <div className="flex-1">
              <h4
                className={`text-xs font-extrabold uppercase tracking-wide ${
                  isAlert ? 'text-red-400' : isSuccess ? 'text-emerald-400' : 'text-cyan-400'
                }`}
              >
                {toast.title}
              </h4>
              <p className="text-xs text-[#E8EEF0] mt-0.5 font-medium">{toast.message}</p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#8D9AA0] hover:text-[#E8EEF0] p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
