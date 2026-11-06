import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes.js';
import pool from './config/db.js';
import { initTelegramBot } from './bot/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware ها
app.use(cors());
app.use(express.json());

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection error:', err);
    } else {
        console.log('✅ PostgreSQL database connection successful.');
    }
});

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('سرور سیستم تیکتینگ ابریت کلود فعال است.');
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}.`);

    if (process.env.TELEGRAM_BOT_TOKEN) {
        initTelegramBot(process.env.TELEGRAM_BOT_TOKEN);
    } else {
        console.warn('⚠️ Telegram bot token not found! The bot will not be activated.');
    }
});