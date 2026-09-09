'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Send, 
  User, 
  RefreshCw, 
  Mail, 
  ArrowUpRight 
} from 'lucide-react';
import { assistantAPI, EmailCitation } from '@/lib/api';
import styles from './AIAssistant.module.css';

let msgCounter = 0;
const nextMsgId = () => `msg_${++msgCounter}_${Math.random().toString(36).slice(2, 7)}`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: EmailCitation[];
  suggestedActions?: string[];
  timestamp: string;
}

export const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content: (
        "Hello! I am your MailMind executive assistant. I continuously read, categorize, and prioritize your emails.\n\n" +
        "You can ask me anything about your inbox, like:\n" +
        "• Which clients need an urgent response?\n" +
        "• What interviews or meetings are coming up?\n" +
        "• Summarize my pending action items."
      ),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'Which clients need a response?',
        'Do I have any interviews scheduled?',
        'What are my pending tasks?'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: nextMsgId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await assistantAPI.chat(userMsg.content, historyPayload);

      const aiMsg: Message = {
        id: nextMsgId(),
        role: 'assistant',
        content: res.reply,
        citations: res.citations,
        suggestedActions: res.suggested_actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errorMsg: Message = {
        id: nextMsgId(),
        role: 'assistant',
        content: "I encountered an error analyzing your mailbox. Please make sure the backend is connected or seed demo emails from the sidebar.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'init-cleared',
        role: 'assistant',
        content: "Chat history cleared. How can I help you with your inbox today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const samplePrompts = [
    "Which clients need a response?",
    "Do I have any interviews scheduled?",
    "What are my pending tasks?",
    "Summarize urgent messages",
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1>Executive AI Assistant</h1>
            <span className={styles.modelPill}>Gemini 2.5 Flash</span>
          </div>
          <p>Instant answers, smart extraction, and contextual reasoning across all your communications.</p>
        </div>
        <button onClick={clearChat} className={styles.clearBtn} title="Clear conversation">
          <RefreshCw size={13} />
          <span>Reset</span>
        </button>
      </header>

      {/* Suggested starter chips */}
      <div className={styles.promptChips}>
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className={styles.promptChip}
          >
            <Sparkles size={12} className={styles.chipIcon} />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      <div className={styles.chatArea}>
        <div className={styles.messagesContainer}>
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`${styles.messageRow} ${isUser ? styles.userRow : styles.aiRow}`}
              >
                <div className={`${styles.avatar} ${isUser ? styles.userAvatar : styles.aiAvatar}`}>
                  {isUser ? <User size={16} /> : <Sparkles size={16} />}
                </div>

                <div className={styles.bubbleWrapper}>
                  <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.aiBubble}`}>
                    <div className={styles.bubbleText}>{m.content}</div>

                    {/* Email Citations */}
                    {m.citations && m.citations.length > 0 && (
                      <div className={styles.citationsContainer}>
                        <span className={styles.citationsTitle}>
                          <Mail size={12} /> Referenced Communications:
                        </span>
                        <div className={styles.citationsGrid}>
                          {m.citations.map((c) => (
                            <Link
                              key={c.id}
                              href={`/inbox?id=${c.id}`}
                              className={styles.citationCard}
                            >
                              <div className={styles.citationHeader}>
                                <span className={styles.citationSender}>{c.sender.split('<')[0].trim()}</span>
                                <span className={styles.citationDate}>{c.date}</span>
                              </div>
                              <div className={styles.citationSubject}>{c.subject}</div>
                              {c.priority && (
                                <span className={`${styles.citationBadge} ${c.priority === 'URGENT' ? styles.badgeRed : ''}`}>
                                  {c.priority}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick follow-up suggestions */}
                    {m.suggestedActions && m.suggestedActions.length > 0 && (
                      <div className={styles.suggestedActions}>
                        {m.suggestedActions.map((action, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(action)}
                            disabled={loading}
                            className={styles.actionPill}
                          >
                            <span>{action}</span>
                            <ArrowUpRight size={11} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className={styles.timestamp}>{m.timestamp}</span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className={`${styles.messageRow} ${styles.aiRow}`}>
              <div className={`${styles.avatar} ${styles.aiAvatar}`}>
                <Sparkles size={16} className={styles.pulse} />
              </div>
              <div className={styles.loadingBubble}>
                <div className={styles.typingIndicator}>
                  <span></span><span></span><span></span>
                </div>
                <span>Analyzing mailbox & formulating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className={styles.inputArea}>
          <input
            type="text"
            className={styles.input}
            placeholder="Ask about clients, proposals, deadlines, or request a draft..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={styles.sendBtn}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
