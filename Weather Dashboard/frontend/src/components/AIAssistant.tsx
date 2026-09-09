"use client";

import React, { useState } from 'react';
import { Bot, Send, Loader2, Sparkles, Shirt, CloudRain, Dumbbell } from 'lucide-react';
import { aiApi } from '@/lib/api';

interface Props {
  weatherContext: unknown;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export function AIAssistant({ weatherContext }: Props) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "Hi! I'm your Gemini-powered Weather Assistant. Ask me anything about today's forecast, what to wear, or travel advice!"
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (textToAsk: string) => {
    if (!textToAsk.trim() || loading) return;

    const userMessage: Message = { sender: 'user', text: textToAsk };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const res = await aiApi.ask(textToAsk, JSON.stringify(weatherContext));
      setMessages(prev => [...prev, { sender: 'ai', text: res }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'ai', text: "Unable to reach the weather assistant at this moment. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(query);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950/60 via-purple-950/50 to-slate-900/60 backdrop-blur-xl border border-indigo-500/20 p-6 rounded-3xl shadow-2xl flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
            <Bot className="text-indigo-400 w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-indigo-100 flex items-center gap-2">
              Gemini Weather AI
              <span className="text-[10px] uppercase font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                Live
              </span>
            </h3>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => handleAsk("What should I wear today based on this weather?")}
          className="flex items-center gap-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
        >
          <Shirt className="w-3.5 h-3.5 text-indigo-400" />
          What to wear?
        </button>
        <button
          type="button"
          onClick={() => handleAsk("Will it rain today and do I need an umbrella?")}
          className="flex items-center gap-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
        >
          <CloudRain className="w-3.5 h-3.5 text-blue-400" />
          Rain & Umbrella?
        </button>
        <button
          type="button"
          onClick={() => handleAsk("Are conditions good for an outdoor run or workout?")}
          className="flex items-center gap-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
        >
          <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
          Workout advice
        </button>
      </div>

      {/* Chat Messages */}
      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
              m.sender === 'user'
                ? 'bg-indigo-600/30 text-indigo-100 border border-indigo-500/20 ml-8'
                : 'bg-black/30 text-slate-200 border border-white/5 mr-4'
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-indigo-300 text-xs p-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Gemini is analyzing the forecast...</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative mt-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about the weather..."
          className="w-full pl-4 pr-12 py-3 rounded-2xl bg-black/30 border border-indigo-500/30 text-white placeholder-indigo-300/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
        <button 
          type="submit" 
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1.5 p-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/30 rounded-xl transition-colors cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
        </button>
      </form>
    </div>
  );
}
