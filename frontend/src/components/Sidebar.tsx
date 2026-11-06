import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ticket as TicketIcon, Users, Bot, X, Cpu } from 'lucide-react';

interface SidebarProps {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    openTicketCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileMenuOpen, setMobileMenuOpen, openTicketCount = 0 }) => {
    const navItems = [
        { to: '/', label: 'داشبورد تحلیلی', icon: <LayoutDashboard className="w-5 h-5" /> },
        { to: '/tickets', label: 'تیکت‌ها و گفتگوها', icon: <TicketIcon className="w-5 h-5" />, badge: openTicketCount },
        { to: '/users', label: 'کاربران تلگرام', icon: <Users className="w-5 h-5" /> },
        { to: '/settings', label: 'تنظیمات AI و RAG', icon: <Bot className="w-5 h-5" /> },
    ];

    return (
        <>
            {mobileMenuOpen && (
                <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden" />
            )}
            <aside
                className={`fixed lg:static inset-y-0 right-0 z-50 w-72 bg-slate-900 text-slate-100 flex flex-col justify-between shrink-0 shadow-2xl transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
                    }`}
            >
                <div>
                    <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-600/30">
                                A
                            </div>
                            <div>
                                <h1 className="font-bold text-base text-white tracking-tight">ابریت کلود</h1>
                                <p className="text-[11px] text-slate-400 mt-0.5">پشتیبانی هوشمند تلگرام</p>
                            </div>
                        </div>
                        <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="p-4 space-y-1.5">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/'}
                                onClick={() => setMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-all ${isActive
                                        ? 'bg-gradient-to-l from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/25'
                                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className="flex items-center gap-3">
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </div>
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${isActive ? 'bg-white text-blue-700' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="p-4 m-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            LangChain Agent
                        </span>
                        <Cpu className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                        حافظه مجزا به ازای هر تیکت + پایگاه دانش RAG.
                    </p>
                </div>
            </aside>
        </>
    );
};