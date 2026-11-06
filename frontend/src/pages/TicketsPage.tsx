import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, MessageSquare, User as UserIcon, ArrowUpDown } from 'lucide-react';
import type { Ticket, TicketStatus } from '../types';
import { TicketChat } from '../components/TicketChat';
import { api } from '../services/api';

interface TicketsPageProps {
    tickets: Ticket[];
    statusFilter: string;
    setStatusFilter: (st: string) => void;
    onStatusChange: (id: number, st: TicketStatus) => Promise<void>;
    onSendReply: (content: string, ticketId: number) => Promise<void>;
}

export const TicketsPage: React.FC<TicketsPageProps> = ({
    tickets,
    statusFilter,
    setStatusFilter,
    onStatusChange,
    onSendReply,
}) => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    const loadSelectedTicket = useCallback((ticketId: number) => {
        api.getTicketDetails(ticketId)
            .then((detail) => setSelectedTicket(detail))
            .catch(() => setSelectedTicket(null));
    }, []);

    useEffect(() => {
        if (id) {
            loadSelectedTicket(Number(id));
        } else {
            setSelectedTicket(null);
        }
    }, [id, loadSelectedTicket]);

    useEffect(() => {
        if (!id) return;
        const currentTicketId = Number(id);

        const handleRealtimeTicketEvent = (e: Event) => {
            const customEvent = e as CustomEvent;
            const targetId = customEvent.detail?.payload?.ticketId;

            if (!targetId || Number(targetId) === currentTicketId) {
                loadSelectedTicket(currentTicketId);
            }
        };

        window.addEventListener('abrit-ticket-event', handleRealtimeTicketEvent);
        return () => {
            window.removeEventListener('abrit-ticket-event', handleRealtimeTicketEvent);
        };
    }, [id, loadSelectedTicket]);

    const handleSelectTicket = (ticketId: number) => {
        navigate(`/tickets/${ticketId}`);
    };

    const handleBackToList = () => {
        navigate('/tickets');
    };

    const filtered = tickets
        .filter((t) => {
            const q = search.trim().toLowerCase();
            if (!q) return true;
            return (
                String(t.id).includes(q) ||
                t.subject.toLowerCase().includes(q) ||
                `${t.first_name} ${t.last_name}`.toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            const dateA = new Date(a.updated_at).getTime();
            const dateB = new Date(b.updated_at).getTime();
            return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
        });

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col lg:flex-row gap-5">
            <div
                className={`w-full lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col shrink-0 overflow-hidden ${selectedTicket ? 'hidden lg:flex' : 'flex h-full'
                    }`}
            >
                <div className="p-4 border-b border-slate-100 space-y-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جستجوی تیکت یا کاربر..."
                            className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold flex-1">
                            {[
                                { id: 'ALL', label: 'همه' },
                                { id: 'OPEN', label: 'باز' },
                                { id: 'IN_PROGRESS', label: 'بررسی' },
                                { id: 'CLOSED', label: 'بسته' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setStatusFilter(tab.id)}
                                    className={`py-1.5 rounded-lg transition ${statusFilter === tab.id
                                            ? 'bg-white text-blue-600 shadow-2xs font-bold'
                                            : 'text-slate-600'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                            title="تغییر مرتب‌سازی"
                        >
                            <ArrowUpDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-0 space-y-2 sm:space-y-0">
                    {filtered.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-xs">تیکتی یافت نشد.</div>
                    ) : (
                        filtered.map((t) => {
                            const isSelected = selectedTicket?.id === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => handleSelectTicket(t.id)}
                                    className={`w-full text-right p-3.5 sm:p-4 transition flex flex-col gap-2 rounded-xl sm:rounded-none hover:bg-blue-50/50 ${isSelected
                                            ? 'bg-blue-50/80 border-r-4 border-blue-600 shadow-xs'
                                            : 'bg-white sm:bg-transparent'
                                        }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="font-mono text-xs font-bold text-blue-600">#{t.id}</span>
                                        <span
                                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${t.status === 'OPEN'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : t.status === 'IN_PROGRESS'
                                                        ? 'bg-amber-50 text-amber-600'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}
                                        >
                                            {t.status === 'OPEN'
                                                ? '🤖 هوش مصنوعی'
                                                : t.status === 'IN_PROGRESS'
                                                    ? '👨‍💻 کارشناس'
                                                    : 'بسته'}
                                        </span>
                                    </div>
                                    <div className="font-bold text-xs text-slate-800 line-clamp-1">{t.subject}</div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                                            <UserIcon className="w-3 h-3 text-blue-600" /> {t.first_name} {t.last_name}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="w-3 h-3" /> {t.message_count || 1} پیام
                                        </span>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            <div className={`flex-1 flex flex-col overflow-hidden ${selectedTicket ? 'flex h-full' : 'hidden lg:flex'}`}>
                {!selectedTicket ? (
                    <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8 shadow-xs">
                        <MessageSquare className="w-12 h-12 text-slate-300 mb-3 stroke-[1.5]" />
                        <p className="text-sm font-medium text-slate-600">یک تیکت را از لیست انتخاب کنید</p>
                    </div>
                ) : (
                    <TicketChat
                        ticket={selectedTicket}
                        onBack={handleBackToList}
                        onStatusChange={async (ticketId, st) => {
                            await onStatusChange(ticketId, st);
                            loadSelectedTicket(ticketId);
                        }}
                        onSendReply={async (content) => {
                            await onSendReply(content, selectedTicket.id);
                            loadSelectedTicket(selectedTicket.id);
                        }}
                    />
                )}
            </div>
        </div>
    );
};