export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type SenderType = 'USER' | 'AI' | 'ADMIN';

export interface User {
    id: number;
    telegram_id: string;
    username: string | null;
    first_name: string;
    last_name: string;
    created_at: string;
    ticket_count?: number;
    active_ticket_count?: number;
}

export interface Message {
    id: number;
    ticket_id: number;
    sender_type: SenderType;
    content: string;
    telegram_message_id?: string | null;
    created_at: string;
}

export interface Ticket {
    id: number;
    user_id: number;
    subject: string;
    status: TicketStatus;
    created_at: string;
    updated_at: string;
    first_name: string;
    last_name: string;
    username: string | null;
    telegram_id: string;
    message_count?: number;
    messages?: Message[];
}

export interface DashboardStats {
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    closed_tickets: number;
    total_users: number;
    recent_tickets: Ticket[];
}

export interface AISettings {
    id: number;
    model_name: string;
    system_prompt: string;
    temperature: number;
    updated_at: string;
}

export interface KnowledgeBaseItem {
    id: number;
    category: string;
    title: string;
    content: string;
    created_at?: string;
}