'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { HelpCircle, Send, MessageSquare, Plus, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

export default function SupportPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Chatbot State
  const [chatbotMessages, setChatbotMessages] = useState<any[]>([
    { sender: 'bot', text: 'Hello! I am your ShopCraft AI assistant. How can I help you today? You can ask me about return policies, delivery times, payment channels, or store registration.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ticket creation state
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  // Active expanded ticket state
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [replyInput, setReplyInput] = useState('');

  // 1. Fetch User Tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => api.get('/support/tickets').then((res) => res.data.tickets),
    enabled: isAuthenticated,
  });

  // Create Ticket Mutation
  const createTicketMutation = useMutation({
    mutationFn: () =>
      api.post('/support/tickets', { subject: ticketSubject, message: ticketMessage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      setShowTicketForm(false);
      setTicketSubject('');
      setTicketMessage('');
      alert('Support ticket created successfully!');
    },
  });

  // Reply Mutation
  const replyMutation = useMutation({
    mutationFn: ({ tId, msg }: { tId: string; msg: string }) =>
      api.post(`/support/tickets/${tId}/reply`, { message: msg }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      setReplyInput('');
      // Update expanded ticket state with new replies
      setActiveTicket(res.data.ticket);
    },
  });

  // Close Ticket Mutation
  const closeTicketMutation = useMutation({
    mutationFn: (tId: string) => api.post(`/support/tickets/${tId}/close`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      setActiveTicket(res.data.ticket);
      alert('Ticket resolved and marked closed.');
    },
  });

  // AI Chatbot message sender
  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatbotMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatbotLoading(true);

    try {
      const res = await api.post('/support/chatbot', { message: userMsg });
      if (res.data.success) {
        setChatbotMessages((prev) => [...prev, { sender: 'bot', text: res.data.reply }]);
      }
    } catch (err) {
      setChatbotMessages((prev) => [...prev, { sender: 'bot', text: "Error connecting to AI Chatbot. Please check your internet connection." }]);
    } finally {
      setChatbotLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-8">
        <HelpCircle className="h-6 w-6 text-indigo-500" />
        <span>Customer Care Center</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* TICKETS MANAGER COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-xs">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                <span>Support Tickets</span>
              </h2>
              {mounted && isAuthenticated && (
                <button
                  onClick={() => setShowTicketForm(!showTicketForm)}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-1.5 px-4 rounded-xl text-xs flex items-center gap-1 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Submit Ticket</span>
                </button>
              )}
            </div>

            {(!mounted || !isAuthenticated) && (
              <p className="text-xs text-slate-400 py-4">Please login to view and create customer support tickets.</p>
            )}

            {/* Create Ticket Inline Form */}
            {showTicketForm && (
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 p-5 rounded-xl space-y-3 text-xs font-semibold">
                <h4 className="text-xs font-black uppercase text-slate-400">File Support Ticket</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Ticket Topic / Subject (e.g. Order #123 Broken Item)"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2"
                  />
                  <textarea
                    rows={4}
                    placeholder="Provide details about your query..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3"
                  />
                </div>
                <button
                  onClick={() => createTicketMutation.mutate()}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-2 px-6 rounded-xl text-xs transition"
                >
                  Submit Ticket
                </button>
              </div>
            )}

            {/* Ticket Threads list */}
            {isAuthenticated && (
              <div className="space-y-3">
                {ticketsLoading ? (
                  <p className="text-xs text-slate-400 py-4 text-center animate-pulse">Retrieving support threads...</p>
                ) : tickets && tickets.length > 0 ? (
                  tickets.map((t: any) => (
                    <div
                      key={t._id}
                      onClick={() => setActiveTicket(activeTicket?._id === t._id ? null : t)}
                      className={`p-4 rounded-xl border cursor-pointer transition text-xs font-semibold ${
                        activeTicket?._id === t._id
                          ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-4">
                        <span className="font-extrabold text-slate-800 dark:text-slate-100 truncate">{t.subject}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-sm ${
                          t.status === 'open'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/20'
                            : t.status === 'resolved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/20'
                            : 'bg-indigo-100 text-indigo-850 dark:bg-indigo-950/20'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Updated on: {new Date(t.updatedAt).toLocaleDateString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-450 py-4 text-center">No tickets created. Use "Submit Ticket" to start.</p>
                )}
              </div>
            )}
          </div>

          {/* Active Ticket Expanded Thread */}
          {activeTicket && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-6 shadow-xs text-xs font-semibold">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-slate-850 dark:text-slate-100">Ticket Thread: {activeTicket.subject}</h3>
                {activeTicket.status !== 'resolved' && (
                  <button
                    onClick={() => closeTicketMutation.mutate(activeTicket._id)}
                    className="border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 py-1.5 px-3 rounded-lg font-bold transition"
                  >
                    Close &amp; Resolve
                  </button>
                )}
              </div>

              {/* Chat timeline message */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {/* Initial message */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] font-black text-slate-450 uppercase block">Customer Inquiry</span>
                  <p className="text-slate-700 dark:text-slate-350">{activeTicket.message}</p>
                </div>

                {/* Replies */}
                {activeTicket.replies?.map((rep: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl space-y-1 ${
                      rep.sender === activeTicket.user
                        ? 'bg-slate-50 dark:bg-slate-950 ml-6'
                        : 'bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-150 mr-6'
                    }`}
                  >
                    <span className="text-[10px] font-black text-slate-450 uppercase block">
                      {rep.sender === activeTicket.user ? 'Customer' : 'Support Help'}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">{rep.message}</p>
                    <span className="text-[9px] text-slate-400 block pt-0.5">{new Date(rep.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              {activeTicket.status !== 'resolved' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!replyInput.trim()) return;
                    replyMutation.mutate({ tId: activeTicket._id, msg: replyInput });
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Type your reply response here..."
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    className="flex-1 bg-slate-55 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-4 py-2"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-650 text-white font-bold p-2.5 rounded-xl hover:bg-indigo-700 transition"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* AI CHATBOT DIALOG COLUMN */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col h-[550px]">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sparkles className="h-5 w-5 text-indigo-500 fill-indigo-100 animate-pulse" />
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">ShopCraft AI</h2>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Groq Enabled</span>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1 select-text">
            {chatbotMessages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed font-semibold ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white ml-auto rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {chatbotLoading && (
              <div className="bg-slate-100 dark:bg-slate-800 text-slate-450 p-3 rounded-2xl text-xs w-fit rounded-tl-none font-bold animate-pulse">
                Thinking...
              </div>
            )}
          </div>

          {/* Chat Form */}
          <form onSubmit={handleChatSend} className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <input
              type="text"
              placeholder="Ask anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={chatbotLoading}
              className="bg-indigo-600 hover:bg-indigo-755 text-white p-2.5 rounded-xl transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
