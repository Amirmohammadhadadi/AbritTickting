import express from 'express';
import { ticketController } from '../controllers/ticket.controller.js';
import { userController } from '../controllers/user.controller.js';
import { settingsController } from '../controllers/settings.controller.js';
import { realtime } from '../utils/realtime.js';

const router = express.Router();


router.get('/dashboard/stats', ticketController.getStats);

// ==========================================
router.get('/tickets', ticketController.getTickets);
router.get('/tickets/:id', ticketController.getTicket);
router.patch('/tickets/:id/status', ticketController.updateStatus);
router.post('/tickets/:id/reply', ticketController.replyToTicket);

// ==========================================
router.get('/users', userController.getUsers);

// ==========================================
router.get('/settings', settingsController.getAISettings);
router.post('/settings', settingsController.updateAISettings);
router.get('/settings/kb', settingsController.getKB);
router.post('/settings/kb', settingsController.addKB);
router.delete('/settings/kb/:id', settingsController.deleteKB);


router.get('/events', realtime.subscribe);

export default router;