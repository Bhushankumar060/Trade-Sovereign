import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button, Input, Badge, Spinner } from '../components/ui/DesignSystem';
import { useAuth } from '../contexts/AuthContext';
import { aiChat, listConversations, saveConversation, deleteConversation } from '../lib/api';
import { Bot, Send, Save, Trash2, Download, Plus, MessageSquare, Sparkles, ChevronRight, Lock } from 'lucide-react';

const STARTER_PROMPTS = [
  "Generate a high-performance crypto scalping strategy",
  "Analyze BTC market conditions for this week",
  "What are the best indicators for forex trading?",
  "Explain risk management for volatile assets",
  "Compare DeFi yield farming vs traditional trading",
];

export default function AiChat() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationTitle, setConversationTitle] = useState('');
  const [selectedConvId, setSelectedConvId] = useState(null);

  const { data: convsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: listConversations,
    enabled: !!user,
  });

  const chatMutation = useMutation({
    mutationFn: aiChat,
  });

  const saveMutation = useMutation({
    mutationFn: saveConversation,
    onSuccess: () => queryClient.invalidateQueries(['conversations']),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => queryClient.invalidateQueries(['conversations']),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          <Lock className="w-16 h-16 text-cyan-400 mb-6 opacity-60" />
          <h1 className="text-3xl font-display font-bold mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-8 max-w-md">Access the AI Trading Assistant for personalized insights and strategies.</p>
          <div className="flex gap-4">
            <Link to="/login"><Button>Sign In</Button></Link>
            <Link to="/register"><Button variant="glass">Create Account</Button></Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;

    setInput('');
    const userMsg = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    try {
      const res = await chatMutation.mutateAsync({ message: trimmed, history: messages });
      const assistantMsg = { role: 'assistant', content: res.reply };
      setMessages([...newMessages, assistantMsg]);

      if (!conversationTitle) {
        setConversationTitle(trimmed.slice(0, 50) + (trimmed.length > 50 ? '...' : ''));
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(newMessages.slice(0, -1));
      setInput(trimmed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSave = async () => {
    if (messages.length === 0) return;
    const title = conversationTitle || `Chat — ${new Date().toLocaleDateString()}`;
    await saveMutation.mutateAsync({ title, messages });
  };

  const handleExport = () => {
    if (messages.length === 0) return;
    const text = messages.map(m => `${m.role === 'user' ? 'You' : 'Trade Sovereign AI'}:\n${m.content}`).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversationTitle || 'chat'}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadConversation = (conv) => {
    setMessages(conv.messages || []);
    setConversationTitle(conv.title);
    setSelectedConvId(conv.id);
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationTitle('');
    setSelectedConvId(null);
    inputRef.current?.focus();
  };

  const conversations = convsData?.conversations || [];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8" data-testid="ai-chat">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-gradient mb-1">AI Trading Assistant</h1>
            <p className="text-gray-400 text-sm">Powered by Gemini AI — market analysis, strategy generation, and insights</p>
          </div>
          <div className="flex gap-2">
            <Button variant="glass" size="sm" onClick={handleExport} disabled={messages.length === 0}>
              <Download className="w-4 h-4 mr-2" />Export
            </Button>
            <Button variant="glass" size="sm" onClick={handleSave} isLoading={saveMutation.isPending} disabled={messages.length === 0}>
              <Save className="w-4 h-4 mr-2" />Save
            </Button>
            <Button size="sm" onClick={handleNewChat}>
              <Plus className="w-4 h-4 mr-2" />New Chat
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-280px)] min-h-[500px]">
          {/* Sidebar */}
          <Card className="p-0 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 bg-black/20">
              <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider">Saved Conversations</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No saved conversations yet
                </div>
              ) : conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-start gap-2 group transition-colors ${
                    selectedConvId === conv.id
                      ? 'bg-cyan-400/10 text-white border border-cyan-400/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span className="flex-1 line-clamp-2 text-xs leading-relaxed">{conv.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(conv.id); if (selectedConvId === conv.id) handleNewChat(); }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-0.5 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
          </Card>

          {/* Chat Area */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <Card className="p-0 flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-8">
                    <div>
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
                        <Sparkles className="w-10 h-10 text-black" />
                      </div>
                      <h2 className="text-2xl font-display font-bold mb-2">Trade Sovereign AI</h2>
                      <p className="text-gray-400 text-sm max-w-sm">Your personal AI trading assistant. Ask anything about markets, strategies, indicators, or risk management.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                      {STARTER_PROMPTS.map(prompt => (
                        <button
                          key={prompt}
                          onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                          className="text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-400/20 text-sm text-gray-400 hover:text-white transition-all group"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-cyan-400 inline-block mr-1.5 group-hover:translate-x-0.5 transition-transform" />
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {msg.role !== 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shrink-0 mt-1">
                            <Bot className="w-4 h-4 text-black" />
                          </div>
                        )}
                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-cyan-400 text-black rounded-tr-sm'
                            : 'glass rounded-tl-sm text-white'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatMutation.isPending && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-black" />
                        </div>
                        <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                          <div className="flex gap-1 items-center h-5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="p-4 border-t border-white/5 bg-black/20">
                <div className="flex gap-3">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about trading strategies, market analysis..."
                    className="flex-1 bg-black/40 border-cyan-400/20 focus-visible:ring-cyan-400"
                    disabled={chatMutation.isPending}
                    data-testid="chat-input"
                  />
                  <Button onClick={handleSend} isLoading={chatMutation.isPending} disabled={!input.trim()} data-testid="chat-send">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Trade Sovereign AI provides educational content only. Not financial advice.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
