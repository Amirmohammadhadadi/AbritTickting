import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { SocksProxyAgent } from 'socks-proxy-agent';
import https from 'https';
import pool from '../config/db.js';
import { createTicketTools } from './tools.js';

const PROXY_URL = process.env.SOCKS_PROXY || 'socks5h://127.0.0.1:10808';
const proxyAgent = new SocksProxyAgent(PROXY_URL);

const OPENROUTER_KEY = (
    process.env.OPENROUTER_API_KEY ||
    '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'
).trim();

const proxiedFetch = (url, options = {}) => {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);

        const rawHeaders = {};
        if (options.headers) {
            if (typeof options.headers.forEach === 'function') {
                options.headers.forEach((value, key) => {
                    rawHeaders[key] = value;
                });
            } else if (typeof options.headers.entries === 'function') {
                for (const [key, value] of options.headers.entries()) {
                    rawHeaders[key] = value;
                }
            } else {
                Object.assign(rawHeaders, options.headers);
            }
        }

        rawHeaders['authorization'] = `Bearer ${OPENROUTER_KEY}`;
        rawHeaders['content-type'] = rawHeaders['content-type'] || 'application/json';

        delete rawHeaders['content-length'];
        delete rawHeaders['host'];

        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'POST',
            headers: rawHeaders,
            agent: proxyAgent,
        };

        const req = https.request(reqOptions, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const bodyBuffer = Buffer.concat(chunks);
                const bodyText = bodyBuffer.toString('utf-8');
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    headers: new Headers(res.headers),
                    text: async () => bodyText,
                    json: async () => JSON.parse(bodyText),
                });
            });
        });

        req.on('error', (err) => reject(err));

        if (options.body) {
            const bodyData = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
            req.write(bodyData);
        }
        req.end();
    });
};

export const generateTicketAIResponse = async ({ ticketId, userId }) => {
    const settingsRes = await pool.query(`SELECT * FROM ai_settings WHERE id = 1`);
    const settings = settingsRes.rows[0] || {
        model_name: 'google/gemma-4-31b-it',
        system_prompt: 'تو دستیار پشتیبانی هوشمند شرکت ابریت هستی و به کاربران با دقت، خوش‌رویی و به زبان فارسی پاسخ می‌دهی.',
        temperature: 0.3,
    };

    const cleanModelName = (settings.model_name || 'google/gemma-4-31b-it').replace(':free', '').trim();

    const kbRes = await pool.query(`SELECT category, title, content FROM knowledge_base ORDER BY id DESC`);
    const kbContext = kbRes.rows.length > 0
        ? kbRes.rows.map((r) => `- [${r.category}] ${r.title}: ${r.content}`).join('\n')
        : 'قانون خاصی ثبت نشده است.';

    const historyRes = await pool.query(
        `SELECT sender_type, content FROM messages WHERE ticket_id = $1 ORDER BY created_at ASC, id ASC`,
        [ticketId]
    );

    const messages = [
        new SystemMessage(
            `${settings.system_prompt}\n\n` +
            `[اطلاعات سیستمی: شماره تیکت فعلی کاربر #${ticketId} است.]\n` +
            `[پایگاه دانش و قوانین شرکت ابریت:\n${kbContext}]`
        ),
    ];

    for (const row of historyRes.rows) {
        if (row.sender_type === 'USER') {
            messages.push(new HumanMessage(row.content));
        } else if (row.sender_type === 'AI') {
            messages.push(new AIMessage(row.content));
        } else if (row.sender_type === 'ADMIN') {
            messages.push(new AIMessage(`[پاسخ کارشناس پشتیبانی]: ${row.content}`));
        }
    }

    const llm = new ChatOpenAI({
        model: cleanModelName,
        temperature: Number(settings.temperature) || 0.3,
        apiKey: OPENROUTER_KEY,
        configuration: {
            baseURL: 'https://openrouter.ai/api/v1',
            fetch: proxiedFetch,
            defaultHeaders: {
                'HTTP-Referer': 'https://abrit.ir',
                'X-Title': 'Abrit AI Ticketing System',
            },
        },
    });

    const tools = createTicketTools(userId, ticketId);
    const toolsByName = Object.fromEntries(tools.map((t) => [t.name, t]));
    const llmWithTools = llm.bindTools(tools);

    let aiResponse;
    try {
        aiResponse = await llmWithTools.invoke(messages);
    } catch (apiErr) {
        console.warn('⚠️ هشدار در فراخوانی با ابزار (تلاش مجدد بدون Tool Calling):', apiErr.message);
        try {
            aiResponse = await llm.invoke(messages);
        } catch (fallbackErr) {
            console.error('❌ Error communicating with OpenRouter API:', fallbackErr.message);
            return 'متاسفانه در حال حاضر سرویس هوش مصنوعی با محدودیت مواجه شده است. پیام شما ثبت گردید و به زودی توسط کارشناسان بررسی خواهد شد.';
        }
    }

    let iterations = 0;
    while (aiResponse.tool_calls && aiResponse.tool_calls.length > 0 && iterations < 3) {
        iterations++;
        messages.push(aiResponse);

        for (const toolCall of aiResponse.tool_calls) {
            const selectedTool = toolsByName[toolCall.name];
            if (selectedTool) {
                console.log(`🤖 Agent executing tool [${toolCall.name}] for ticket #${ticketId}...`);
                try {
                    const toolResult = await selectedTool.invoke(toolCall.args);
                    messages.push(
                        new ToolMessage({
                            tool_call_id: toolCall.id,
                            content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
                        })
                    );
                } catch (toolErr) {
                    console.error(`❌ Error executing tool ${toolCall.name}:`, toolErr);
                    messages.push(
                        new ToolMessage({
                            tool_call_id: toolCall.id,
                            content: 'خطا در اجرای ابزار مورد نظر.',
                        })
                    );
                }
            }
        }

        try {
            aiResponse = await llmWithTools.invoke(messages);
        } catch (err) {
            console.error('❌ Error in subsequent step of agent response:', err.message);
            break;
        }
    }

    return aiResponse.content || 'متاسفانه نتوانستم پاسخ مناسبی تولید کنم. همکاران ما بررسی خواهند کرد.';
};