import { Response } from 'express';
import { Ticket } from '../models/Ticket';
import { getAIChatResponse } from '../services/aiService';

// --- CUSTOMER TICKETS ---
export const createTicket = async (req: any, res: Response): Promise<void> => {
  try {
    const { subject, message } = req.body;

    const ticket = await Ticket.create({
      user: req.user.id,
      subject,
      message,
      replies: [],
    });

    res.status(201).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create support ticket' });
  }
};

export const getTickets = async (req: any, res: Response): Promise<void> => {
  try {
    // If admin or seller, fetch all tickets. Otherwise, fetch user-specific tickets.
    let tickets;
    if (req.user.role === 'admin') {
      tickets = await Ticket.find()
        .populate('user', 'name email profilePic')
        .sort({ updatedAt: -1 });
    } else {
      tickets = await Ticket.find({ user: req.user.id })
        .sort({ updatedAt: -1 });
    }

    res.status(200).json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load support tickets' });
  }
};

export const replyToTicket = async (req: any, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    // Ensure authorization (User owns the ticket or is admin)
    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    ticket.replies.push({
      sender: req.user.id,
      message,
      timestamp: new Date(),
    });

    ticket.status = req.user.role === 'admin' ? 'in-progress' : 'open';
    await ticket.save();

    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add reply to ticket' });
  }
};

export const closeTicket = async (req: any, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found' });
      return;
    }

    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    ticket.status = 'resolved';
    await ticket.save();

    res.status(200).json({ success: true, message: 'Ticket closed successfully', ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resolve ticket' });
  }
};

// --- CHATBOT ASSISTANT ---
export const askChatbot = async (req: any, res: Response): Promise<void> => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ success: false, message: 'Message is required' });
      return;
    }

    const reply = await getAIChatResponse(message);
    res.status(200).json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Chatbot service error' });
  }
};
