import { ticketStore } from '../store/ticketStore.js';
import { messageStore } from '../store/messageStore.js';
import { sendAdminMessageToTelegram } from '../bot/index.js';

export const ticketController = {
    async getStats(req, res) {
        try {
            const stats = await ticketStore.getDashboardStats();
            res.json(stats);
        } catch (err) {
            console.error("❌ Error in getStats:", err.message);
            res.status(500).json({ error: err.message });
        }
    },

    async getTickets(req, res) {
        try {
            const tickets = await ticketStore.getAllTickets(req.query.status);
            res.json(tickets);
        } catch (err) {
            console.error("❌ Error in getTickets:", err.message);
            res.status(500).json({ error: err.message });
        }
    },

    async getTicket(req, res) {
        try {
            const ticketId = req.params.id;

            if (!ticketId || ticketId === 'undefined' || isNaN(Number(ticketId))) {
                return res.status(400).json({ error: 'شناسه تیکت نامعتبر است.' });
            }

            const ticket = await ticketStore.getTicketById(Number(ticketId));
            if (!ticket) return res.status(404).json({ error: 'تیکت یافت نشد' });
            res.json(ticket);
        } catch (err) {
            console.error("❌ Error in getTicket:", err.message);
            res.status(500).json({ error: err.message });
        }
    },

    async updateStatus(req, res) {
        try {
            const ticketId = req.params.id;
            if (!ticketId || ticketId === 'undefined' || isNaN(Number(ticketId))) {
                return res.status(400).json({ error: 'شناسه تیکت نامعتبر است.' });
            }

            const numId = Number(ticketId);
            const updated = await ticketStore.updateStatus(numId, req.body.status);
            const ticket = await ticketStore.getTicketById(numId);

            if (ticket && ticket.telegram_id) {
                await sendAdminMessageToTelegram(ticket.telegram_id, `وضعیت تیکت شما (#${ticket.id}) به **${req.body.status}** تغییر یافت.`);
            }
            res.json(updated);
        } catch (err) {
            console.error("❌ Error in updateStatus:", err.message);
            res.status(500).json({ error: err.message });
        }
    },

    async replyToTicket(req, res) {
        try {
            const ticketId = req.params.id;
            if (!ticketId || ticketId === 'undefined' || isNaN(Number(ticketId))) {
                return res.status(400).json({ error: 'شناسه تیکت نامعتبر است.' });
            }

            const numId = Number(ticketId);
            const { content } = req.body;

            if (!content || !content.trim()) {
                return res.status(400).json({ error: 'متن پاسخ نمی‌تواند خالی باشد.' });
            }

            const message = await messageStore.addMessage(numId, 'ADMIN', content);
            const ticket = await ticketStore.getTicketById(numId);

            if (ticket && ticket.telegram_id) {
                console.log(`📤 Sending admin message to user telegram ID ${ticket.telegram_id}...`);
                await sendAdminMessageToTelegram(ticket.telegram_id, content);
            }
            res.json(message);
        } catch (err) {
            console.error("❌ Error in replyToTicket:", err.message);
            res.status(500).json({ error: err.message });
        }
    }
};