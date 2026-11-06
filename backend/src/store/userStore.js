import pool from '../config/db.js';

export const userStore = {
    async findOrCreateByTelegramId(telegramId, username, firstName, lastName) {
        const query = `
            INSERT INTO users (telegram_id, username, first_name, last_name)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (telegram_id) DO UPDATE SET
                username = EXCLUDED.username,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name
            RETURNING *;
        `;
        const values = [telegramId, username || null, firstName || '', lastName || ''];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async getAllUsers() {
        const query = `
            SELECT u.*, 
                   COUNT(t.id) AS ticket_count,
                   COUNT(t.id) FILTER (WHERE t.status != 'CLOSED') AS active_ticket_count
            FROM users u
            LEFT JOIN tickets t ON u.id = t.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC;
        `;
        const result = await pool.query(query);
        return result.rows;
    }
};