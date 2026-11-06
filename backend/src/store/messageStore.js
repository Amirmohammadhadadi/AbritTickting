import pool from '../config/db.js';

export const messageStore = {
    async addMessage(ticketId, senderType, content, telegramMessageId = null) {
        if (telegramMessageId) {
            const check = await pool.query(`SELECT id FROM messages WHERE telegram_message_id = $1`, [telegramMessageId]);
            if (check.rows.length > 0) return { ...check.rows[0], is_duplicate: true };
        }

        const query = `
            INSERT INTO messages (ticket_id, sender_type, content, telegram_message_id)
            VALUES ($1, $2, $3, $4) RETURNING *;
        `;
        const result = await pool.query(query, [ticketId, senderType, content, telegramMessageId]);
        await pool.query(`UPDATE tickets SET updated_at = NOW() WHERE id = $1`, [ticketId]);
        return { ...result.rows[0], is_duplicate: false };
    }
};