import { Telegraf, Markup } from 'telegraf';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { userStore } from '../store/userStore.js';
import { ticketStore } from '../store/ticketStore.js';
import { messageStore } from '../store/messageStore.js';
import { generateTicketAIResponse } from '../agent/index.js';
import { realtime } from '../utils/realtime.js';

let botInstance = null;

const PROXY_URL = process.env.SOCKS_PROXY || 'socks5h://127.0.0.1:10808';
const agent = new SocksProxyAgent(PROXY_URL, {
    keepAlive: false,
    timeout: 60000,
});

const safeTelegramCall = async (fn, retries = 4, delay = 1500) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const isNetworkError =
                err.message?.includes('socket disconnected') ||
                err.message?.includes('ECONNRESET') ||
                err.message?.includes('ETIMEDOUT') ||
                err.message?.includes('ECONNREFUSED') ||
                err.message?.includes('fetch failed');

            if (attempt === retries || !isNetworkError) {
                throw err;
            }
            console.warn(`⚠️ نوسان شبکه در ارسال به تلگرام (تلاش ${attempt} از ${retries})...`);
            await new Promise((res) => setTimeout(res, delay));
        }
    }
};

export const statusLabels = {
    OPEN: '🟢 باز (پاسخگوی هوشمند 🤖)',
    IN_PROGRESS: '🟡 در حال بررسی توسط کارشناس 👨‍💻',
    CLOSED: '🔴 بسته شده',
};

const mainKeyboard = Markup.keyboard([
    ['📝 ثبت تیکت جدید', '📋 وضعیت تیکت‌های من'],
    ['🤖 گفتگو با دستیار هوشمند', '👨‍💻 ارتباط با کارشناس پشتیبانی'],
]).resize();

export const initTelegramBot = () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
        console.warn('⚠️ Telegram token not found in .env file. Telegram bot is disabled.');
        return null;
    }

    const bot = new Telegraf(token, {
        handlerTimeout: 120000,
        telegram: {
            agent: agent,
            attachmentAgent: agent,
        },
    });
    botInstance = bot;

    bot.catch((err, ctx) => {
        console.error(`❌ خطای سراسری ربات تلگرام برای آپدیت ${ctx.updateType}:`, err.message);
    });

    bot.start(async (ctx) => {
        try {
            const user = await userStore.findOrCreateByTelegramId(
                String(ctx.from.id),
                ctx.from.username,
                ctx.from.first_name,
                ctx.from.last_name
            );
            await safeTelegramCall(() =>
                ctx.reply(
                    `سلام ${user.first_name || 'کاربر'} عزیز! 👋\nبه سامانه پشتیبانی هوشمند شرکت ابریت خوش آمدید.\n\nکافیست سوال یا مشکل خود را بنویسید تا تیکت شما ثبت شود. همچنین می‌توانید از منوی زیر مشخص کنید که ربات هوشمند پاسخگوی شما باشد یا کارشناس انسانی:`,
                    mainKeyboard
                )
            );
        } catch (err) {
            console.error('❌ Error in /start command:', err.message);
        }
    });

    bot.hears('👨‍💻 ارتباط با کارشناس پشتیبانی', async (ctx) => {
        try {
            const user = await userStore.findOrCreateByTelegramId(
                String(ctx.from.id),
                ctx.from.username,
                ctx.from.first_name,
                ctx.from.last_name
            );
            let ticket = await ticketStore.getActiveTicketByUserId(user.id);
            if (!ticket) {
                ticket = await ticketStore.createTicket(user.id, 'درخواست گفتگو با کارشناس پشتیبانی');
            }
            await ticketStore.updateStatus(ticket.id, 'IN_PROGRESS');

            realtime.emit('HUMAN_REQUESTED', {
                ticketId: ticket.id,
                userName: user.first_name || 'کاربر',
            });

            await safeTelegramCall(() =>
                ctx.reply(
                    `👨‍💻 تیکت شماره #${ticket.id} به بخش پشتیبانی انسانی منتقل شد.\n\nلطفاً پیام یا توضیحات تکمیلی خود را بنویسید؛ دستیار هوشمند در این تیکت غیرفعال شد و همکاران ما به زودی پاسخگوی شما خواهند بود.`,
                    mainKeyboard
                )
            );
        } catch (err) {
            console.error('❌ خطا در تغییر به کارشناس:', err.message);
        }
    });

    bot.hears('🤖 گفتگو با دستیار هوشمند', async (ctx) => {
        try {
            const user = await userStore.findOrCreateByTelegramId(
                String(ctx.from.id),
                ctx.from.username,
                ctx.from.first_name,
                ctx.from.last_name
            );
            let ticket = await ticketStore.getActiveTicketByUserId(user.id);
            if (!ticket) {
                ticket = await ticketStore.createTicket(user.id, 'گفتگو با دستیار هوشمند');
            }
            await ticketStore.updateStatus(ticket.id, 'OPEN');

            realtime.emit('STATUS_CHANGED', { ticketId: ticket.id, status: 'OPEN' });

            await safeTelegramCall(() =>
                ctx.reply(
                    `🤖 حالت پاسخگویی تیکت #${ticket.id} روی دستیار هوشمند (AI) قرار گرفت.\nهر سوالی دارید بپرسید تا بلافاصله پاسخ دهم!`,
                    mainKeyboard
                )
            );
        } catch (err) {
            console.error('❌ خطا در تغییر به هوش مصنوعی:', err.message);
        }
    });

    bot.hears('📋 وضعیت تیکت‌های من', async (ctx) => {
        try {
            const user = await userStore.findOrCreateByTelegramId(
                String(ctx.from.id),
                ctx.from.username,
                ctx.from.first_name,
                ctx.from.last_name
            );
            const tickets = await ticketStore.getTicketsByUserId(user.id, 10);

            if (tickets.length === 0) {
                return await safeTelegramCall(() =>
                    ctx.reply('شما هنوز هیچ تیکتی ثبت نکرده‌اید. برای شروع، پیام خود را ارسال کنید.', mainKeyboard)
                );
            }

            const listText = tickets
                .map(
                    (t) =>
                        `🔹 تیکت #${t.id}\n📌 موضوع: ${t.subject}\n📊 وضعیت: ${statusLabels[t.status] || t.status}\n`
                )
                .join('\n──────────────\n');

            await safeTelegramCall(() =>
                ctx.reply(`📋 فهرست آخرین تیکت‌های شما:\n\n${listText}`, mainKeyboard)
            );
        } catch (err) {
            console.error('❌ خطا در نمایش وضعیت تیکت‌ها:', err.message);
        }
    });

    bot.hears('📝 ثبت تیکت جدید', async (ctx) => {
        try {
            const user = await userStore.findOrCreateByTelegramId(
                String(ctx.from.id),
                ctx.from.username,
                ctx.from.first_name,
                ctx.from.last_name
            );
            await ticketStore.closeAllActiveTicketsForUser(user.id);
            realtime.emit('TICKET_UPDATED', {});

            await safeTelegramCall(() =>
                ctx.reply(
                    '✅ تیکت‌های قبلی بسته شدند و آماده ثبت تیکت جدید هستیم!\nلطفاً مشکل یا سوال جدید خود را در قالب یک پیام بنویسید:',
                    mainKeyboard
                )
            );
        } catch (err) {
            console.error('❌ خطا در دکمه تیکت جدید:', err.message);
        }
    });

    bot.action(/^close_ticket_(\d+)$/, async (ctx) => {
        try {
            const ticketId = Number(ctx.match[1]);
            await ticketStore.updateStatus(ticketId, 'CLOSED');
            realtime.emit('STATUS_CHANGED', { ticketId, status: 'CLOSED' });

            await safeTelegramCall(() => ctx.answerCbQuery('تیکت بسته شد.')).catch(() => { });
            await safeTelegramCall(() =>
                ctx.reply(
                    `🔴 تیکت شماره #${ticketId} به درخواست شما بسته شد. اگر سوال جدیدی دارید، پیام بفرستید تا تیکت جدیدی باز شود.`,
                    mainKeyboard
                )
            );
        } catch (err) {
            console.error('❌ خطا در بستن تیکت:', err.message);
        }
    });

    bot.action(/^human_support_(\d+)$/, async (ctx) => {
        try {
            const ticketId = Number(ctx.match[1]);
            await ticketStore.updateStatus(ticketId, 'IN_PROGRESS');
            realtime.emit('HUMAN_REQUESTED', {
                ticketId,
                userName: ctx.from.first_name || 'کاربر',
            });

            await safeTelegramCall(() => ctx.answerCbQuery('به کارشناس انسانی ارجاع داده شد.')).catch(() => { });
            await safeTelegramCall(() =>
                ctx.reply(
                    `👨‍💻 تیکت #${ticketId} به کارشناس پشتیبانی ارجاع داده شد. همکاران ما گفتگو را بررسی کرده و در همین‌جا به شما پاسخ می‌دهند.`
                )
            );
        } catch (err) {
            console.error('❌ خطا در ارجاع شیشه‌ای به کارشناس:', err.message);
        }
    });

    bot.on('text', async (ctx) => {
        const messageId = String(ctx.message.message_id);
        const text = ctx.message.text.trim();

        try {
            const user = await userStore.findOrCreateByTelegramId(
                String(ctx.from.id),
                ctx.from.username,
                ctx.from.first_name,
                ctx.from.last_name
            );
            let ticket = await ticketStore.getActiveTicketByUserId(user.id);
            let isNewTicket = false;

            if (!ticket) {
                const subject = text.length > 60 ? text.slice(0, 60) + '...' : text;
                ticket = await ticketStore.createTicket(user.id, subject);
                isNewTicket = true;
            }

            const savedMessage = await messageStore.addMessage(ticket.id, 'USER', text, messageId);
            if (savedMessage.is_duplicate) return;

            realtime.emit(isNewTicket ? 'NEW_TICKET' : 'NEW_MESSAGE', {
                ticketId: ticket.id,
                sender: 'USER',
                userName: user.first_name || 'کاربر',
                message: savedMessage,
            });

            if (ticket.status === 'IN_PROGRESS') {
                await safeTelegramCall(() =>
                    ctx.reply(
                        `📩 پیام شما در تیکت #${ticket.id} برای کارشناس پشتیبانی ثبت شد. لطفاً منتظر پاسخ همکاران ما باشید.`,
                        Markup.inlineKeyboard([
                            [Markup.button.callback(`✅ مشکلم حل شد (بستن تیکت #${ticket.id})`, `close_ticket_${ticket.id}`)],
                        ])
                    )
                );
                return;
            }

            let waitingMsg = null;
            if (isNewTicket) {
                waitingMsg = await safeTelegramCall(() =>
                    ctx.reply(`🎫 تیکت جدید شما با شناسه #${ticket.id} ثبت شد.\n⏳ دستیار هوشمند در حال بررسی و نگارش پاسخ است...`)
                ).catch(() => null);
            } else {
                waitingMsg = await safeTelegramCall(() =>
                    ctx.reply(`⏳ پیام شما دریافت شد. دستیار هوشمند در حال بررسی و نگارش پاسخ برای تیکت #${ticket.id} است...`)
                ).catch(() => null);
            }

            await safeTelegramCall(() => ctx.sendChatAction('typing')).catch(() => { });

            let aiReplyText = '';
            try {
                aiReplyText = await generateTicketAIResponse({ ticketId: ticket.id, userId: user.id });
                const savedAiMsg = await messageStore.addMessage(ticket.id, 'AI', aiReplyText);

                realtime.emit('NEW_MESSAGE', {
                    ticketId: ticket.id,
                    sender: 'AI',
                    userName: 'دستیار هوشمند',
                    message: savedAiMsg,
                });
            } catch (aiError) {
                console.error('❌ خطا در ارتباط با OpenRouter API:', aiError.message);
                aiReplyText = `پیام شما ثبت شد. در حال حاضر دستیار هوشمند در دسترس نیست، اما کارشناسان ما پاسخ خواهند داد.`;
            }

            if (waitingMsg && waitingMsg.message_id) {
                await safeTelegramCall(() => ctx.telegram.deleteMessage(ctx.chat.id, waitingMsg.message_id)).catch(() => { });
            }

            const updatedTicket = await ticketStore.getTicketById(ticket.id);

            await safeTelegramCall(() =>
                ctx.reply(
                    `🤖 پاسخ پشتیبانی هوشمند (تیکت #${ticket.id}):\n\n${aiReplyText}\n\n📊 وضعیت: ${statusLabels[updatedTicket.status]}`,
                    Markup.inlineKeyboard([
                        [Markup.button.callback(`👨‍💻 نیاز به گفتگو با کارشناس انسانی دارم`, `human_support_${ticket.id}`)],
                        [Markup.button.callback(`✅ مشکلم حل شد (بستن تیکت #${ticket.id})`, `close_ticket_${ticket.id}`)],
                    ])
                )
            );
        } catch (err) {
            console.error('❌ خطا در پردازش پیام تلگرام:', err.message);
            await safeTelegramCall(() =>
                ctx.reply('پیام شما در سیستم ثبت شد. به زودی پاسخ را دریافت خواهید کرد.')
            ).catch(() => { });
        }
    });

    const startPolling = async () => {
        try {
            await bot.launch();
            console.log('🚀 Telegram bot successfully activated via SOCKS Proxy on port 10808!');
        } catch (err) {
            console.error('⚠️ Error starting Telegram bot (retrying in 5 seconds):', err.message);
            setTimeout(startPolling, 5000);
        }
    };

    startPolling();

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    return bot;
};

export const sendAdminMessageToTelegram = async (telegramId, messageText) => {
    if (!botInstance) return false;
    if (['100000001', '100000002', '100000003'].includes(String(telegramId))) return true;

    try {
        await safeTelegramCall(() =>
            botInstance.telegram.sendMessage(
                telegramId,
                `👨‍💻 پاسخ کارشناس پشتیبانی:\n\n${messageText}`
            )
        );
        return true;
    } catch (err) {
        console.error(`❌ خطا در ارسال پیام ادمین به تلگرام ${telegramId}:`, err.message);
        return false;
    }
};