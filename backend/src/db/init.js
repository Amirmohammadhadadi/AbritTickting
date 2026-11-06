import pool from '../config/db.js';

export const initDatabase = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id VARCHAR(64) UNIQUE NOT NULL,
        username VARCHAR(128),
        first_name VARCHAR(128),
        last_name VARCHAR(128),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // ۲. جدول تیکت‌ها
        await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        const ticketCountRes = await client.query(`SELECT COUNT(*) FROM tickets`);
        if (parseInt(ticketCountRes.rows[0].count, 10) === 0) {
            await client.query(`ALTER SEQUENCE tickets_id_seq RESTART WITH 1001;`);
        }

        await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        sender_type VARCHAR(16) NOT NULL CHECK (sender_type IN ('USER', 'AI', 'ADMIN')),
        content TEXT NOT NULL,
        telegram_message_id VARCHAR(64) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS ai_settings (
        id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        model_name VARCHAR(128) NOT NULL,
        system_prompt TEXT NOT NULL,
        temperature FLOAT NOT NULL DEFAULT 0.3,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id SERIAL PRIMARY KEY,
        category VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        const settingsRes = await client.query(`SELECT COUNT(*) FROM ai_settings`);
        if (parseInt(settingsRes.rows[0].count, 10) === 0) {
            const defaultPrompt = `تو دستیار هوشمند پشتیبانی شرکت «ابریت کلود» (ارائه‌دهنده سرورهای ابری، هاستینگ و خدمات دواپس) هستی.
وظایف تو:
۱. همیشه مودبانه، حرفه‌ای، خلاصه و به زبان فارسی پاسخ بده.
۲. هر زمان کاربر سوالی درباره قوانین شرکت، بازگشت وجه، تعرفه‌ها، ساعات پشتیبانی یا مشکلات فنی سرور پرسید، حتماً از ابزار search_company_knowledge استفاده کن و بر اساس اطلاعات واقعی شرکت پاسخ بده.
۳. اگر کاربر وضعیت تیکت‌هایش را پرسید، از ابزار get_user_tickets_status استفاده کن.
۴. اگر کاربر صراحتاً درخواست صحبت با اپراتور/کارشناس انسانی داشت یا مشکلش با راهنمایی تو حل نشد و عصبانی بود، از ابزار escalate_to_human استفاده کن تا وضعیت تیکت به «در حال بررسی» تغییر کند.`;

            await client.query(
                `INSERT INTO ai_settings (id, model_name, system_prompt, temperature)
         VALUES (1, $1, $2, $3)`,
                ['openai/gpt-4o-mini', defaultPrompt, 0.3]
            );
        }

        const kbRes = await client.query(`SELECT COUNT(*) FROM knowledge_base`);
        if (parseInt(kbRes.rows[0].count, 10) === 0) {
            await client.query(`
        INSERT INTO knowledge_base (category, title, content) VALUES
        ('RULES', 'قوانین بازگشت وجه و لغو سرویس', 'کاربران ابریت کلود می‌توانند تا ۷ روز پس از خرید اولیه سرور ابری یا هاست، بدون قید و شرط درخواست لغو سرویس و بازگشت کامل وجه (۱۰۰٪) ثبت کنند. مبالغ به صورت آنی به کیف پول یا ظرف ۴۸ ساعت کاری به شماره شبای بانکی واریز می‌شود. دامنه و لایسنس‌های نرم‌افزاری شامل بازگشت وجه نمی‌شوند.'),
        ('PRICING', 'تعرفه سرورهای ابری و پلن‌ها', 'سرور ابری پایه (۲ هسته CPU و ۴ گیگابایت رم): ماهیانه ۳۵۰ هزار تومان. سرور ابری حرفه‌ای (۴ هسته CPU و ۸ گیگابایت رم): ماهیانه ۶۸۰ هزار تومان. ترافیک داخلی نیم‌بها محاسبه می‌شود و تمام سرورها دارای دیسک NVMe و پورت ۱ گیگابیت هستند.'),
        ('TECHNICAL', 'راهنمای رفع مشکل قطعی یا کندی سرور (SSH / Ping)', 'در صورت عدم دسترسی به سرور از طریق SSH: ۱. ابتدا از بخش کنسول تحت وب (VNC) در پنل ابریت وضعیت سرور را چک کنید. ۲. فایروال UFW یا iptables سرور خود را بررسی کنید تا پورت 22 مسدود نشده باشد. ۳. اگر آی‌پی شما به دلیل تلاش ناموفق بلاک شده، سرور را یک بار از پنل Reboot نمایید.'),
        ('GENERAL', 'ساعات کاری پشتیبانی و SLA', 'پشتیبانی فنی و تیکتینگ ابریت کلود به صورت ۲۴ ساعته در ۷ روز هفته (24/7) فعال است. واحد مالی و اداری از شنبه تا چهارشنبه ساعت ۹ الی ۱۷ و پنجشنبه‌ها ساعت ۹ الی ۱۳ پاسخگو هستند. تضمین آپتایم (SLA) سرورهای ابریت ۹۹.۹٪ است و در صورت قطعی بیش از حد مجاز، به ازای هر ساعت قطعی ۱ روز اعتبار رایگان به کاربر تعلق می‌گیرد.');
      `);
        }

        if (parseInt(ticketCountRes.rows[0].count, 10) === 0) {
            const usersInsert = await client.query(`
        INSERT INTO users (telegram_id, username, first_name, last_name) VALUES
        ('100000001', 'ali_rezayi', 'علی', 'رضایی'),
        ('100000002', 'sara_mhm', 'سارا', 'محمدی'),
        ('100000003', 'kamran_dev', 'کامران', 'نوری')
        RETURNING id;
      `);

            const [user1, user2, user3] = usersInsert.rows;

            const t1 = await client.query(
                `INSERT INTO tickets (user_id, subject, status) VALUES ($1, $2, 'OPEN') RETURNING id`,
                [user1.id, 'عدم اتصال به سرور ابری از طریق SSH']
            );
            const t2 = await client.query(
                `INSERT INTO tickets (user_id, subject, status) VALUES ($1, $2, 'IN_PROGRESS') RETURNING id`,
                [user2.id, 'پیگیری واریز وجه سرویس لغو شده']
            );
            const t3 = await client.query(
                `INSERT INTO tickets (user_id, subject, status) VALUES ($1, $2, 'CLOSED') RETURNING id`,
                [user3.id, 'سوال در مورد تعرفه سرور ۴ هسته‌ای']
            );

            await client.query(
                `INSERT INTO messages (ticket_id, sender_type, content, telegram_message_id) VALUES
         ($1, 'USER', 'سلام، من سرور ابری پایه خریدم ولی از طریق ترمینال نمیتونم به SSH وصل بشم و تایم‌اوت میده.', 'seed_msg_1'),
         ($1, 'AI', 'سلام جناب رضایی عزیز! برای بررسی مشکل عدم اتصال به SSH، لطفاً ابتدا از طریق کنسول تحت وب (VNC) در پنل کاربری ابریت وارد سرور شوید و بررسی کنید که سرویس SSH فعال باشد و فایروال (UFW) پورت 22 را مسدود نکرده باشد. آیا به کنسول VNC دسترسی دارید؟', 'seed_msg_2')`,
                [t1.rows[0].id]
            );

            await client.query(
                `INSERT INTO messages (ticket_id, sender_type, content, telegram_message_id) VALUES
         ($1, 'USER', 'سلام وقت بخیر، دیروز درخواست لغو سرور دادم. کی مبلغ به شماره شبای من واریز میشه؟ لطفاً به واحد مالی ارجاع بدید.', 'seed_msg_3'),
         ($1, 'AI', 'سلام سرکار خانم محمدی. طبق قوانین ابریت کلود، بازگشت وجه به شماره شبا حداکثر ظرف ۴۸ ساعت کاری انجام می‌شود. من وضعیت تیکت شما را به «در حال بررسی» تغییر دادم تا همکاران واحد مالی زمان دقیق پایا را به شما اطلاع دهند.', 'seed_msg_4')`,
                [t2.rows[0].id]
            );

            await client.query(
                `INSERT INTO messages (ticket_id, sender_type, content, telegram_message_id) VALUES
         ($1, 'USER', 'سلام، قیمت سرور ابری با ۴ هسته پردازنده و ۸ گیگ رم چقدره؟', 'seed_msg_5'),
         ($1, 'AI', 'سلام! تعرفه سرور ابری حرفه‌ای (۴ هسته CPU و ۸ گیگابایت رم با دیسک NVMe) ماهیانه ۶۸۰ هزار تومان است و ترافیک داخلی آن نیز نیم‌بها محاسبه می‌شود.', 'seed_msg_6'),
         ($1, 'USER', 'خیلی ممنون، کامل متوجه شدم.', 'seed_msg_7'),
         ($1, 'ADMIN', 'تیکت شما با تشکر از همراهی‌تان بسته شد. در صورت بروز هرگونه سوال جدید کافیست پیام دهید.', 'seed_msg_8')`,
                [t3.rows[0].id]
            );
        }

        await client.query('COMMIT');
        console.log('✅ PostgreSQL database and seed data initialized successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error during initial database setup:', error);

        throw error;
    } finally {
        client.release();
    }
};