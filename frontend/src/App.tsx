import { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { api } from './services/api';
import type { DashboardStats, Ticket, TicketStatus, User, AISettings, KnowledgeBaseItem } from './types';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Toast } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { TicketsPage } from './pages/TicketsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';

const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
  }
};

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' } | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [users, setUsers] = useState<User[]>([]);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    id: 1,
    model_name: 'google/gemma-4-31b-it',
    system_prompt: '',
    temperature: 0.3,
    updated_at: '',
  });
  const [kbItems, setKbItems] = useState<KnowledgeBaseItem[]>([]);

  const prevTicketsMapRef = useRef<Record<number, { count: number; updatedAt: string; status: string }>>({});
  const isFirstLoadRef = useRef(true);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statsData, allTickets] = await Promise.all([
        api.getStats(),
        api.getTickets(statusFilter),
      ]);

      setStats(statsData);

      if (!isFirstLoadRef.current) {
        for (const t of allTickets) {
          const prev = prevTicketsMapRef.current[t.id];
          const currentMsgCount = Number((t as any).message_count || 0);
          const currentUpdated = t.updated_at || '';

          if (!prev) {
            playNotificationSound();
            showToast(`🎫 تیکت جدید #${t.id} توسط «${t.first_name || 'کاربر'}» ثبت شد!`);
            window.dispatchEvent(new CustomEvent('abrit-ticket-event', { detail: { payload: { ticketId: t.id } } }));
            break;
          } else if (
            currentMsgCount > prev.count ||
            (currentUpdated !== prev.updatedAt && currentUpdated > prev.updatedAt)
          ) {
            playNotificationSound();
            showToast(`💬 پیام یا پاسخ جدید در تیکت #${t.id} ثبت شد.`);
            window.dispatchEvent(new CustomEvent('abrit-ticket-event', { detail: { payload: { ticketId: t.id } } }));
            break;
          } else if (prev.status !== 'IN_PROGRESS' && t.status === 'IN_PROGRESS') {
            playNotificationSound();
            showToast(`👨‍💻 کاربر در تیکت #${t.id} درخواست کارشناس انسانی دارد!`);
            window.dispatchEvent(new CustomEvent('abrit-ticket-event', { detail: { payload: { ticketId: t.id } } }));
            break;
          }
        }
      }

      const nextMap: Record<number, { count: number; updatedAt: string; status: string }> = {};
      for (const t of allTickets) {
        nextMap[t.id] = {
          count: Number((t as any).message_count || 0),
          updatedAt: t.updated_at || '',
          status: t.status,
        };
      }
      prevTicketsMapRef.current = nextMap;
      isFirstLoadRef.current = false;

      setTickets(allTickets);

      if (location.pathname === '/users' && !silent) {
        const usersData = await api.getUsers();
        setUsers(usersData);
      } else if (location.pathname === '/settings' && !silent) {
        const settingsData = await api.getSettings();
        if (settingsData) {
          if ((settingsData as any).model_name) {
            setAiSettings(settingsData as any);
          } else if (settingsData.ai_settings) {
            setAiSettings(settingsData.ai_settings);
          }
          setKbItems(settingsData.knowledge_base || []);
        }
      }
    } catch (err: any) {
      if (!silent) showToast(err.message, 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [location.pathname, statusFilter, showToast]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:5000/api/events');

    eventSource.onmessage = async (e) => {
      try {
        const { event, payload } = JSON.parse(e.data);

        const [statsData, allTickets] = await Promise.all([
          api.getStats(),
          api.getTickets(statusFilter),
        ]);

        const nextMap: Record<number, { count: number; updatedAt: string; status: string }> = {};
        for (const t of allTickets) {
          nextMap[t.id] = {
            count: Number((t as any).message_count || 0),
            updatedAt: t.updated_at || '',
            status: t.status,
          };
        }
        prevTicketsMapRef.current = nextMap;

        setStats(statsData);
        setTickets(allTickets);

        if (event === 'NEW_TICKET') {
          playNotificationSound();
          showToast(`🎫 تیکت جدید #${payload.ticketId} توسط «${payload.userName}» ثبت شد!`);
        } else if (event === 'NEW_MESSAGE') {
          playNotificationSound();
          if (payload.sender === 'USER') {
            showToast(`💬 پیام جدید از «${payload.userName}» در تیکت #${payload.ticketId}`);
          } else if (payload.sender === 'AI') {
            showToast(`🤖 پاسخ دستیار هوشمند در تیکت #${payload.ticketId} ارسال شد.`);
          }
        } else if (event === 'HUMAN_REQUESTED') {
          playNotificationSound();
          showToast(`👨‍💻 «${payload.userName}» در تیکت #${payload.ticketId} درخواست کارشناس انسانی دارد!`);
        }

        window.dispatchEvent(new CustomEvent('abrit-ticket-event', { detail: { event, payload } }));
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [statusFilter, showToast]);

  const handleStatusChange = async (id: number, status: TicketStatus) => {
    try {
      await api.updateTicketStatus(id, status);
      showToast('وضعیت تیکت تغییر یافت و به کاربر اطلاع داده شد.');
      await fetchData(true);
      window.dispatchEvent(new CustomEvent('abrit-ticket-event', { detail: { payload: { ticketId: id } } }));
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSendReply = async (content: string, ticketId: number) => {
    try {
      await api.replyToTicket(ticketId, content);
      showToast('پاسخ شما با موفقیت به تلگرام کاربر ارسال شد.');
      await fetchData(true);
      window.dispatchEvent(new CustomEvent('abrit-ticket-event', { detail: { payload: { ticketId } } }));
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'داشبورد تحلیلی';
      case '/tickets':
      case location.pathname.match(/^\/tickets\/\d+/)?.input:
        return 'مدیریت تیکت‌ها و گفتگوها';
      case '/users':
        return 'کاربران تلگرام';
      case '/settings':
        return 'تنظیمات هوش مصنوعی و پایگاه دانش RAG';
      default:
        return 'پنل مدیریت ابریت کلود';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        openTicketCount={stats?.open_tickets}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar
          title={getPageTitle()}
          onMenuClick={() => setMobileMenuOpen(true)}
          onRefresh={() => fetchData(false)}
          loading={loading}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route
              path="/"
              element={
                stats && (
                  <DashboardPage
                    stats={stats}
                    onSelectTicket={(id) => navigate(`/tickets/${id}`)}
                    onGoToTickets={() => navigate('/tickets')}
                  />
                )
              }
            />
            <Route
              path="/tickets"
              element={
                <TicketsPage
                  tickets={tickets}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  onStatusChange={handleStatusChange}
                  onSendReply={handleSendReply}
                />
              }
            />
            <Route
              path="/tickets/:id"
              element={
                <TicketsPage
                  tickets={tickets}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  onStatusChange={handleStatusChange}
                  onSendReply={handleSendReply}
                />
              }
            />
            <Route path="/users" element={<UsersPage users={users} />} />
            <Route
              path="/settings"
              element={
                <SettingsPage
                  aiSettings={aiSettings}
                  setAiSettings={setAiSettings}
                  onSaveAI={async (e) => {
                    e.preventDefault();
                    await api.updateAISettings(aiSettings);
                    showToast('تنظیمات هوش مصنوعی با موفقیت ذخیره شد.');
                  }}
                  kbItems={kbItems}
                  onAddKB={async (data) => {
                    const created = await api.addKBItem(data);
                    setKbItems([created, ...kbItems]);
                    showToast('آیتم جدید به پایگاه دانش اضافه شد.');
                  }}
                  onDeleteKB={async (id) => {
                    await api.deleteKBItem(id);
                    setKbItems(kbItems.filter((i) => i.id !== id));
                    showToast('آیتم با موفقیت حذف شد.');
                  }}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}