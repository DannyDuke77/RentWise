'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertOctagon, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

const Toast = ({ 
  message, 
  description, 
  type = 'info', 
  duration = 6000, 
  onClose 
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isProgressActive, setIsProgressActive] = useState(false);

  useEffect(() => {
    // Triggers mount animation
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      setIsProgressActive(true);
    }, 20);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-200/80',
      accentBg: 'bg-emerald-100/80',
      bar: 'bg-emerald-500',
      progress: 'bg-emerald-500',
      ring: 'focus:ring-emerald-500/30'
    },
    error: {
      icon: <AlertOctagon className="w-5 h-5 text-rose-600" />,
      bg: 'bg-rose-50/70',
      border: 'border-rose-200/80',
      accentBg: 'bg-rose-100/80',
      bar: 'bg-rose-500',
      progress: 'bg-rose-500',
      ring: 'focus:ring-rose-500/30'
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50/70',
      border: 'border-amber-200/80',
      accentBg: 'bg-amber-100/80',
      bar: 'bg-amber-500',
      progress: 'bg-amber-500',
      ring: 'focus:ring-amber-500/30'
    },
    info: {
      icon: <Info className="w-5 h-5 text-sky-600" />,
      bg: 'bg-sky-50/60',
      border: 'border-sky-200/80',
      accentBg: 'bg-sky-100/80',
      bar: 'bg-sky-500',
      progress: 'bg-sky-500',
      ring: 'focus:ring-sky-500/30'
    }
  };

  const active = config[type];

  return (
    <div 
      className={`
        fixed top-5 right-0 md:right-5 w-full max-w-sm z-50 pointer-events-auto
        transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isVisible 
          ? 'translate-x-0 scale-100' 
          : 'translate-x-full scale-95 pointer-events-none'
        }
      `}
    >
      <div 
        className={`
          relative overflow-hidden rounded-xl border p-4 shadow-lg shadow-slate-900/5
          backdrop-blur-xl transition-colors ${active.bg} ${active.border}
        `}
      >
        {/* Left Vertical Accent Bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${active.bar}`} />

        <div className="flex items-start gap-3.5 pl-1.5 pb-1">
          {/* Icon Badge */}
          <div className={`flex-shrink-0 p-1.5 rounded-lg ${active.accentBg}`}>
            {active.icon}
          </div>

          {/* Typography */}
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-sm font-semibold text-slate-900 leading-snug">
              {message}
            </p>
            {description && (
              <p className="text-sm font-normal text-slate-600 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            aria-label="Close notification"
            className={`
              flex-shrink-0 -mr-1 -mt-1 p-1.5 rounded-md text-slate-600 
              hover:text-slate-700 hover:bg-slate-100 
              transition-colors focus:outline-none focus:ring-2 ${active.ring}
            `}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar Track & Fill */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 overflow-hidden">
          <div 
            className={`h-full transition-all linear ${active.progress}`}
            style={{ 
              width: isProgressActive ? '0%' : '100%',
              transitionDuration: `${duration}ms`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Toast;