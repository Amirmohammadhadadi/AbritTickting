import React, { useState } from 'react';
import {
    Ticket as TicketIcon, AlertCircle, Clock, CheckCircle2,
    ChevronLeft, User as UserIcon, ArrowUpDown
} from 'lucide-react';
import type { DashboardStats, TicketStatus } from '../types';

interface DashboardPageProps {
    stats: DashboardStats;
    onSelectTicket: (id: number) => void;
    onGoToTickets: () => void;
}

const statusConfig: Record<TicketStatus, { label: string; badgeClass: string; dotClass: string; icon: React.ReactNode }> = {
    OPEN: {
        label: 'باز (در انتظار)',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
        icon: <AlertCircle className="w-3.5 h-3.5 text-emerald-600" />,
    },
    IN_PROGRESS: {
        label: 'در حال بررسی',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
        icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    },
    CLOSED: {
        label: 'بسته شده',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        dotClass: 'bg-slate-400',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />,
    },
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ stats, onSelectTicket, onGoToTickets }) => {
    const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

    const sortedTickets = [...stats.recent_tickets].sort((a, b) => {
        const dateA = new Date(a.updated_at).getTime();
        const dateB = new Date(b.updated_at).getTime();
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-xs font-medium text-slate-500">کل تیکت‌ها</span>
                    <div className="text-3xl font-black text-slate-800 mt-3">{stats.total_tickets}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
                    <span className="text-xs font-medium text-emerald-700">تیکت‌های باز</span>
                    <div className="text-3xl font-black text-emerald-600 mt-3">{stats.open_tickets}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs">
                    <span className="text-xs font-medium text-amber-700">در حال بررسی</span>
                    <div className="text-3xl font-black text-amber-600 mt-3">{stats.in_progress_tickets}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-xs font-medium text-slate-500">بسته شده</span>
                    <div className="text-3xl font-black text-slate-600 mt-3">{stats.closed_tickets}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl text-white shadow-md sm:col-span-2 lg:col-span-1">
                    <span className="text-xs font-medium text-blue-100">کاربران تلگرام</span>
                    <div className="text-3xl font-black mt-3">{stats.total_users}</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                        <TicketIcon className="w-4 h-4 text-blue-600" />
                        آخرین درخواست‌های پشتیبانی (کلیک جهت باز کردن)
                    </h3>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600">
                            <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                            <span>مرتب‌سازی:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                            >
                                <option value="newest">جدیدترین</option>
                                <option value="oldest">قدیمی‌ترین</option>
                            </select>
                        </div>

                        <button onClick={onGoToTickets} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0">
                            مشاهده همه <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs border-b border-slate-100">
                            <tr>
                                <th className="py-3 px-6">شناسه</th>
                                <th className="py-3 px-6">کاربر</th>
                                <th className="py-3 px-6">موضوع</th>
                                <th className="py-3 px-6">وضعیت</th>
                                <th className="py-3 px-6 text-left">آخرین بروزرسانی</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedTickets.map((t) => (
                                <tr
                                    key={t.id}
                                    onClick={() => onSelectTicket(t.id)}
                                    className="hover:bg-blue-50/50 transition cursor-pointer"
                                >
                                    <td className="py-3.5 px-6 font-mono font-bold text-blue-600">#{t.id}</td>
                                    <td className="py-3.5 px-6 font-medium text-slate-800">{t.first_name} {t.last_name}</td>
                                    <td className="py-3.5 px-6 text-slate-700 max-w-xs truncate">{t.subject}</td>
                                    <td className="py-3.5 px-6">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig[t.status].badgeClass}`}>
                                            {statusConfig[t.status].icon}
                                            {statusConfig[t.status].label}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-6 text-left text-xs text-slate-500">
                                        {new Date(t.updated_at).toLocaleString('fa-IR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="block md:hidden divide-y divide-slate-100 p-4 space-y-3">
                    {sortedTickets.map((t) => (
                        <div
                            key={t.id}
                            onClick={() => onSelectTicket(t.id)}
                            className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 cursor-pointer active:scale-98 transition shadow-2xs"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-blue-600">#{t.id}</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig[t.status].badgeClass}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[t.status].dotClass}`} />
                                    {statusConfig[t.status].label}
                                </span>
                            </div>
                            <div className="font-bold text-xs text-slate-800">{t.subject}</div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                                <span className="flex items-center gap-1 font-medium text-slate-700">
                                    <UserIcon className="w-3 h-3 text-blue-600" /> {t.first_name} {t.last_name}
                                </span>
                                <span>{new Date(t.updated_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};