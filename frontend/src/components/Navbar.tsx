import React from 'react';
import { Menu, RefreshCw, Bell, ShieldCheck } from 'lucide-react';

interface NavbarProps {
    title: string;
    onMenuClick: () => void;
    onRefresh: () => void;
    loading: boolean;
    userName?: string;
    userRole?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
    title,
    onMenuClick,
    onRefresh,
    loading,
    userName = 'علی رضایی',
    userRole = 'مدیر سیستم'
}) => (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-3.5">
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2.5 rounded-2xl border border-slate-200/80 text-slate-600 hover:bg-slate-100 transition active:scale-95"
            >
                <Menu className="w-5 h-5" />
            </button>
            <div>
                <h2 className="font-extrabold text-base sm:text-lg text-slate-800 tracking-tight">{title}</h2>
                <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">سیستم هوشمند مدیریت و پاسخگویی تیکت‌ها</p>
            </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
            <button
                onClick={onRefresh}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 text-xs font-semibold transition shadow-2xs active:scale-95 cursor-pointer"
                title="بروزرسانی اطلاعات"
            >
                <RefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">بروزرسانی</span>
            </button>

            <div className="relative hidden sm:block">
                <button className="p-2.5 rounded-2xl border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 transition">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                </button>
            </div>

            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/70 px-3.5 py-2 rounded-2xl transition cursor-pointer">
                <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/20">
                        {userName.charAt(0)}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>

                <div className="hidden sm:block text-right">
                    <div className="font-bold text-xs text-slate-800 flex items-center gap-1">
                        {userName}
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 mt-0.5">{userRole}</div>
                </div>
            </div>
        </div>
    </header>
);