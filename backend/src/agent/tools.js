import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import pool from '../config/db.js';

export const createTicketTools = (userId, currentTicketId) => {
    const searchKnowledgeTool = tool(
        async ({ query, category }) => {
            try {
                let sql = `SELECT category, title, content FROM knowledge_base WHERE title ILIKE $1 OR content ILIKE $1`;
                const params = [`%${query}%`];

                if (category) {
                    sql += ` OR category = $2`;
                    params.push(category);
                }

                const res = await pool.query(sql, params);

                if (res.rows.length === 0) {
                    const allDocs = await pool.query(`SELECT category, title, content FROM knowledge_base`);
                    return JSON.stringify(allDocs.rows);
                }

                return JSON.stringify(res.rows);
            } catch (err) {
                return 'خطا در خواندن پایگاه دانش.';
            }
        },
        {
            name: 'search_company_knowledge',
            description:
                'Use this tool WHENEVER the user asks about Abrit Cloud policies, refund rules, pricing, plans, SLA, support hours, or technical troubleshooting (SSH, server down).',
            schema: z.object({
                query: z.string().describe('کلیدواژه فارسی برای جستجو در قوانین شرکت مثل: بازگشت وجه، تعرفه، قطعی، ساعت کاری'),
                category: z.enum(['RULES', 'PRICING', 'TECHNICAL', 'GENERAL']).optional(),
            }),
        }
    );

    const getUserTicketsStatusTool = tool(
        async () => {
            try {
                const res = await pool.query(
                    `SELECT id, subject, status, created_at FROM tickets WHERE user_id = $1 ORDER BY id DESC LIMIT 5`,
                    [userId]
                );
                return JSON.stringify(res.rows);
            } catch (err) {
                return 'خطا در دریافت وضعیت تیکت‌ها.';
            }
        },
        {
            name: 'get_user_tickets_status',
            description:
                'Use this tool when the user asks about the status of their current or previous support tickets.',
            schema: z.object({}),
        }
    );

    const escalateToHumanTool = tool(
        async ({ reason }) => {
            try {
                await pool.query(
                    `UPDATE tickets SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                    [currentTicketId]
                );
                return `وضعیت تیکت شماره #${currentTicketId} با موفقیت به «در حال بررسی» (IN_PROGRESS) تغییر یافت تا کارشناس انسانی بررسی کند. علت: ${reason}`;
            } catch (err) {
                return 'خطا در تغییر وضعیت تیکت.';
            }
        },
        {
            name: 'escalate_to_human',
            description:
                'Use this tool when the user explicitly asks to speak with a human agent/operator, or when the issue requires manual financial/technical check by staff.',
            schema: z.object({
                reason: z.string().describe('خلاصه دلیل ارجاع به کارشناس انسانی'),
            }),
        }
    );

    return [searchKnowledgeTool, getUserTicketsStatusTool, escalateToHumanTool];
};