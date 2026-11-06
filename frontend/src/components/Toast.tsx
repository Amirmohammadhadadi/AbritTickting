import React from 'react';
import { Sparkles } from 'lucide-react';

interface ToastProps {
    msg: string;
    type?: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ msg, type = 'success' }) => (
    <div
        className={`fixed bottom-5 left-5 z-50 max-w-md px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 transition-all duration-300 ${type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-800'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
    >
        <Sparkles className={`w-5 h-5 shrink-0 ${type === 'error' ? 'text-rose-400' : 'text-indigo-400'}`} />
        <span className="text-xs sm:text-sm font-medium leading-relaxed">{msg}</span>
    </div>
);