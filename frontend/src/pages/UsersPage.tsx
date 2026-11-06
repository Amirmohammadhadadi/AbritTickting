import React, { useState } from 'react';
import { Search, ArrowUpDown, Ticket, Calendar, Users as UsersGroupIcon } from 'lucide-react';
import type { User } from '../types';

interface UsersPageProps {
    users: User[];
}

export const UsersPage: React.FC<UsersPageProps> = ({ users }) => {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'tickets'>('newest');

    const filtered = users
        .filter((u) => {
            const q = search.trim().toLowerCase();
            if (!q) return true;
            return (
                `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
                (u.username && u.username.toLowerCase().includes(q)) ||
                u.telegram_id.includes(q)
            );
        })
        .sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            } else {
                return (b.ticket_count || 0) - (a.ticket_count || 0);
            }
        });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <UsersGroupIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base text-slate-800">کاربران ثبت‌شده در ربات تلگرام</h3>
                        <p className="text-xs text-slate-500 mt-0.5">مدیریت و مشاهده تعاملات کاربران با ربات پشتیبانی</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 px-3.5 py-2.5 rounded-2xl border border-slate-200/80 text-xs font-medium text-slate-600 w-full sm:w-auto transition">
                        <ArrowUpDown className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-slate-500">مرتب‌سازی:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'newest' | 'tickets')}
                            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer flex-1 sm:flex-initial"
                        >
                            <option value="newest">جدیدترین عضویت</option>
                            <option value="tickets">بیشترین تیکت‌ها</option>
                        </select>
                    </div>

                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جستجوی نام، یوزرنیم یا آیدی تلگرام..."
                            className="w-full pr-11 pl-4 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200/80 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-xs transition-all outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50/70 text-slate-500 text-xs border-b border-slate-100">
                            <tr>
                                <th className="py-4 px-6 font-semibold">نام کاربر</th>
                                <th className="py-4 px-6 font-semibold">یوزرنیم</th>
                                <th className="py-4 px-6 font-semibold">Telegram ID</th>
                                <th className="py-4 px-6 font-semibold">کل تیکت‌ها</th>
                                <th className="py-4 px-6 font-semibold">وضعیت تیکت فعال</th>
                                <th className="py-4 px-6 font-semibold">تاریخ عضویت</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((u) => (
                                <tr key={u.id} className="hover:bg-blue-50/40 transition">
                                    <td className="py-4 px-6 font-bold text-slate-800 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center text-xs font-black shadow-2xs">
                                            {u.first_name ? u.first_name.charAt(0) : 'U'}
                                        </div>
                                        <div>
                                            <span className="block">{u.first_name} {u.last_name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 font-mono text-xs text-blue-600 font-medium">
                                        {u.username ? `@${u.username}` : '—'}
                                    </td>
                                    <td className="py-4 px-6 font-mono text-xs text-slate-600">
                                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/60 text-slate-700">
                                            {u.telegram_id}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 font-bold text-slate-700">
                                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs">
                                            {u.ticket_count || 0} تیکت
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        {u.active_ticket_count && u.active_ticket_count > 0 ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                {u.active_ticket_count} تیکت باز
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-medium">بدون تیکت فعال</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                                        {new Date(u.created_at).toLocaleDateString('fa-IR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="block md:hidden space-y-3">
                {filtered.map((u) => (
                    <div key={u.id} className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center text-xs font-black">
                                    {u.first_name ? u.first_name.charAt(0) : 'U'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-xs text-slate-800">{u.first_name} {u.last_name}</h4>
                                    <span className="font-mono text-[11px] text-blue-600 font-medium">{u.username ? `@${u.username}` : `ID: ${u.telegram_id}`}</span>
                                </div>
                            </div>
                            {u.active_ticket_count && u.active_ticket_count > 0 ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    {u.active_ticket_count} فعال
                                </span>
                            ) : (
                                <span className="text-[10px] text-slate-400 font-medium">بدون فعال</span>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100 font-medium">
                            <span className="flex items-center gap-1.5 text-slate-700">
                                <Ticket className="w-3.5 h-3.5 text-blue-600" /> کل تیکت‌ها: {u.ticket_count || 0}
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-400">
                                <Calendar className="w-3.5 h-3.5" /> {new Date(u.created_at).toLocaleDateString('fa-IR')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};