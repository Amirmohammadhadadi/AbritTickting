import pool from '../config/db.js';

export const ticketStore = {
    async createTicket(userId, subject) {
        const query = `INSERT INTO tickets (user_id, subject, status) VALUES ($1, $2, 'OPEN') RETURNING *;`;
        const result = await pool.query(query, [userId, subject]);
        return result.rows[0];
    },

    async getActiveTicketByUserId(userId) {
        const query = `SELECT * FROM tickets WHERE user_id = $1 AND status IN ('OPEN', 'IN_PROGRESS') ORDER BY updated_at DESC LIMIT 1;`;
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    },

    async getAllTickets(status) {
        let query = `
            SELECT t.*, u.first_name, u.last_name, u.username, u.telegram_id,
                   (SELECT COUNT(*) FROM messages m WHERE m.ticket_id = t.id) AS message_count
            FROM tickets t
            JOIN users u ON t.user_id = u.id
        `;
        const params = [];
        if (status && status !== 'ALL') {
            query += ` WHERE t.status = $1`;
            params.push(status);
        }
        query += ` ORDER BY t.updated_at DESC;`;
        const result = await pool.query(query, params);
        return result.rows;
    },

    async getTicketById(ticketId) {
        const ticketQuery = `
            SELECT t.*, u.first_name, u.last_name, u.username, u.telegram_id
            FROM tickets t JOIN users u ON t.user_id = u.id WHERE t.id = $1;
        `;
        const ticketRes = await pool.query(ticketQuery, [ticketId]);
        if (ticketRes.rows.length === 0) return null;

        const msgQuery = `SELECT * FROM messages WHERE ticket_id = $1 ORDER BY created_at ASC;`;
        const msgRes = await pool.query(msgQuery, [ticketId]);

        return { ...ticketRes.rows[0], messages: msgRes.rows };
    },

    async updateStatus(ticketId, status) {
        const query = `UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`;
        const result = await pool.query(query, [status, ticketId]);
        return result.rows[0];
    },

    async getDashboardStats() {
        const total = await pool.query(`SELECT COUNT(*) FROM tickets;`);
        const open = await pool.query(`SELECT COUNT(*) FROM tickets WHERE status = 'OPEN';`);
        const prog = await pool.query(`SELECT COUNT(*) FROM tickets WHERE status = 'IN_PROGRESS';`);
        const closed = await pool.query(`SELECT COUNT(*) FROM tickets WHERE status = 'CLOSED';`);
        const users = await pool.query(`SELECT COUNT(*) FROM users;`);
        const recent = await pool.query(`
            SELECT t.*, u.first_name, u.last_name, u.username 
            FROM tickets t JOIN users u ON t.user_id = u.id 
            ORDER BY t.updated_at DESC LIMIT 5;
        `);

        return {
            total_tickets: parseInt(total.rows[0].count),
            open_tickets: parseInt(open.rows[0].count),
            in_progress_tickets: parseInt(prog.rows[0].count),
            closed_tickets: parseInt(closed.rows[0].count),
            total_users: parseInt(users.rows[0].count),
            recent_tickets: recent.rows,
        };
    },

    async getTicketsByUserId(userId, limit = 10) {
        const query = `SELECT id, subject, status, created_at FROM tickets WHERE user_id = $1 ORDER BY id DESC LIMIT $2`;
        const result = await pool.query(query, [userId, limit]);
        return result.rows;
    },

    async closeAllActiveTicketsForUser(userId) {
        const query = `UPDATE tickets SET status = 'CLOSED', updated_at = NOW() WHERE user_id = $1 AND status IN ('OPEN', 'IN_PROGRESS')`;
        await pool.query(query, [userId]);
    }
};