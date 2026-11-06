import pool from '../config/db.js';

export const settingsController = {
    async getAISettings(req, res) {
        try {
            const aiResult = await pool.query('SELECT * FROM ai_settings WHERE id = 1');
            const kbResult = await pool.query('SELECT * FROM knowledge_base ORDER BY created_at DESC');

            res.json({
                ai_settings: aiResult.rows[0] || {},
                knowledge_base: kbResult.rows || []
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async updateAISettings(req, res) {
        const { model_name, system_prompt, temperature } = req.body;
        const query = `
      INSERT INTO ai_settings (id, model_name, system_prompt, temperature)
      VALUES (1, $1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET model_name = EXCLUDED.model_name, system_prompt = EXCLUDED.system_prompt, temperature = EXCLUDED.temperature, updated_at = NOW() RETURNING *;
    `;
        const result = await pool.query(query, [model_name, system_prompt, temperature]);
        res.json(result.rows[0]);
    },
    async getKB(req, res) {
        const result = await pool.query('SELECT * FROM knowledge_base ORDER BY created_at DESC');
        res.json(result.rows);
    },
    async addKB(req, res) {
        const { category, title, content } = req.body;
        const result = await pool.query(`INSERT INTO knowledge_base (category, title, content) VALUES ($1, $2, $3) RETURNING *;`, [category, title, content]);
        res.json(result.rows[0]);
    },
    async deleteKB(req, res) {
        await pool.query('DELETE FROM knowledge_base WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    }
};