import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, ArrowRight, ShieldCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { Ticket, TicketStatus } from '../types';

interface TicketChatProps {
    ticket: Ticket;
    onBack: () => void;
    onStatusChange: (ticketId: number, status: TicketStatus) => void;
    onSendReply: (content: string) => Promise<void>;
}

const statusConfig: Record<
    TicketStatus,
    { label: string; badgeClass: string; icon: React.ReactNode }
> = {
    OPEN: {
        label: 'باز (در انتظار)',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <AlertCircle className="w-3.5 h-3.5 text-emerald-600" />,
    },
    IN_PROGRESS: {
        label: 'در حال بررسی',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    },
    CLOSED: {
        label: 'بسته شده',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />,
    },
};

export const TicketChat: React.FC<TicketChatProps> = ({
    ticket,
    onBack,
    onStatusChange,
    onSendReply,
}) => {
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [ticket.messages?.length]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || sending || !ticket?.id) return;

        const currentText = replyText;
        setReplyText('');
        setSending(true);

        const optimisticMessage = {
            id: Date.now(),
            ticket_id: ticket.id,
            sender_type: 'ADMIN' as const,
            content: currentText,
            created_at: new Date().toISOString()
        };

        if (ticket.messages) {
            ticket.messages.push(optimisticMessage);
        }

        try {
            await onSendReply(currentText);
        } catch (err: any) {
            alert(err.message || 'خطا در ارسال پیام');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden h-full">
            <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="lg:hidden p-2 rounded-xl border border-slate-200 bg-white text-slate-600"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-indigo-600">تیکت #{ticket.id}</span>
                            <span className="text-slate-300">|</span>
                            <span className="font-bold text-sm text-slate-800">
                                {ticket.first_name} {ticket.last_name}
                            </span>
                            {ticket.username && (
                                <span className="text-xs text-slate-400 font-mono">(@{ticket.username})</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ticket.subject}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                    {(['OPEN', 'IN_PROGRESS', 'CLOSED'] as TicketStatus[]).map((st) => {
                        const active = ticket.status === st;
                        return (
                            <button
                                key={st}
                                onClick={() => onStatusChange(ticket.id, st)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${active ? statusConfig[st].badgeClass : 'text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                {statusConfig[st].icon}
                                <span>{statusConfig[st].label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
                {ticket.messages?.map((m) => {
                    const isUser = m.sender_type === 'USER';
                    const isAI = m.sender_type === 'AI';
                    return (
                        <div
                            key={m.id}
                            className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'mr-auto items-end' : 'ml-auto items-start'
                                }`}
                        >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                                {isUser && (
                                    <span className="text-[11px] font-bold text-slate-600">
                                        👤 کاربر ({ticket.first_name})
                                    </span>
                                )}
                                {isAI && (
                                    <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">
                                        <Bot className="w-3.5 h-3.5" />
                                        دستیار هوشمند
                                    </span>
                                )}
                                {m.sender_type === 'ADMIN' && (
                                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        کارشناس پشتیبانی
                                    </span>
                                )}
                                <span className="text-[10px] text-slate-400">
                                    {new Date(m.created_at).toLocaleTimeString('fa-IR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>

                            <div
                                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-2xs ${isUser
                                    ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                                    : isAI
                                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                                        : 'bg-emerald-600 text-white rounded-tr-xs'
                                    }`}
                            >
                                {m.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-3">
                <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`ارسال پاسخ مستقیم کارشناس به تلگرام ${ticket.first_name}...`}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition shadow-sm"
                >
                    <Send className="w-4 h-4" />
                    <span>ارسال به تلگرام</span>
                </button>
            </form>
        </div>
    );
};