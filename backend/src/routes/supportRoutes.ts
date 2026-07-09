import { Router } from 'express';
import {
  createTicket,
  getTickets,
  replyToTicket,
  closeTicket,
  askChatbot,
} from '../controllers/supportController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Chatbot assistant is accessible publicly or by users
router.post('/chatbot', askChatbot);

// Ticket routes require user authentication
router.post('/tickets', protect, createTicket);
router.get('/tickets', protect, getTickets);
router.post('/tickets/:ticketId/reply', protect, replyToTicket);
router.post('/tickets/:ticketId/close', protect, closeTicket);

export default router;
