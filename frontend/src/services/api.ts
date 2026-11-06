import axios from 'axios';
import type {
    DashboardStats,
    Ticket,
    TicketStatus,
    User,
    Message,
    AISettings,
    KnowledgeBaseItem,
} from '../types';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

API.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.error || error.message || 'خطای ناشناخته در ارتباط با سرور';
        return Promise.reject(new Error(message));
    }
);

export const api = {
    getStats: async (): Promise<DashboardStats> => {
        return API.get('/dashboard/stats');
    },

    getTickets: async (status?: string): Promise<Ticket[]> => {
        const url = status && status !== 'ALL' ? `/tickets?status=${status}` : '/tickets';
        return API.get(url);
    },

    getTicketDetails: async (id: number): Promise<Ticket> => {
        return API.get(`/tickets/${id}`);
    },

    updateTicketStatus: async (id: number, status: TicketStatus): Promise<Ticket> => {
        return API.patch(`/tickets/${id}/status`, { status });
    },

    // ارسال پاسخ ادمین (دقت کنید کلید content دقیقاً به بک‌اند می‌رسد)
    replyToTicket: async (id: number, content: string): Promise<Message> => {
        return API.post(`/tickets/${id}/reply`, { content });
    },

    getUsers: async (): Promise<User[]> => {
        return API.get('/users');
    },

    getSettings: async (): Promise<{ ai_settings: AISettings; knowledge_base: KnowledgeBaseItem[] }> => {
        return API.get('/settings');
    },

    updateAISettings: async (data: Partial<AISettings>): Promise<AISettings> => {
        return API.post('/settings', data);
    },

    addKBItem: async (data: { category: string; title: string; content: string }): Promise<KnowledgeBaseItem> => {
        return API.post('/settings/kb', data);
    },

    deleteKBItem: async (id: number): Promise<void> => {
        return API.delete(`/settings/kb/${id}`);
    },
};