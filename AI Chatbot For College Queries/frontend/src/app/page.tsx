"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, Bot, User, MessageSquarePlus, LogOut, FileText, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "./chat.module.css";
import Link from "next/link";

interface Conversation {
  id: number;
  title: string;
}

interface Message {
  role: string;
  content: string;
  citations?: string;
}

export default function StudentPortal() {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !activeConvId) {
          setActiveConvId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [token, activeConvId]);

  const fetchMessages = useCallback(async (convId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/chat/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchConversations();
  }, [token, fetchConversations]);

  useEffect(() => {
    if (activeConvId && token) {
      fetchMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId, token, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    // Initialize SpeechRecognition
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setHasSpeechRecognition(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current = new (SpeechRecognition as any)();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any).continuous = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any).interimResults = false;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any).onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any).onerror = () => {
        setIsListening(false);
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any).onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any)?.stop();
      setIsListening(false);
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (recognitionRef.current as any)?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };



  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleSend = async () => {
    if (!input.trim() || !token) return;
    
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/chat/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_id: activeConvId
        }),
      });

      if (!res.ok) throw new Error("Failed to send");
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      const botMessage = { role: "assistant", content: "" };
      setMessages(prev => [...prev, botMessage]);

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        botMessage.content += chunk;
        
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { ...botMessage };
          return newMsgs;
        });
      }

      // Automatically read out the response if text-to-speech is enabled
      // Just leaving the function available for manual click for now to avoid spam
      
      fetchConversations(); // Refresh history
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className="font-bold text-xl text-gradient">AI Assistant</div>
        </div>
        <div className="p-4 border-b border-white/10">
          <button onClick={startNewChat} className={styles.newChatBtn}>
            <MessageSquarePlus size={18} />
            New Conversation
          </button>
        </div>
        <div className={styles.historyList}>
          <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">History</div>
          {conversations.map(conv => (
            <div 
              key={conv.id} 
              className={`${styles.historyItem} ${activeConvId === conv.id ? styles.active : ""}`}
              onClick={() => setActiveConvId(conv.id)}
            >
              {conv.title || "New Chat"}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center font-bold">
              {user.full_name.charAt(0)}
            </div>
            <div className="text-sm font-medium truncate w-32">{user.full_name}</div>
          </div>
          <button onClick={logout} className="text-secondary hover:text-white">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Chat */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div className="font-semibold">{activeConvId ? conversations.find(c => c.id === activeConvId)?.title : "New Conversation"}</div>
          {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
            <Link href="/admin" className="text-sm text-accent-primary hover:underline">
              Go to Admin Portal
            </Link>
          )}
        </header>

        <div className={styles.chatContainer}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <Bot size={64} className="mb-4 text-accent-primary opacity-50" />
              <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
              <p className="text-secondary">Ask me about courses, policies, notices, or any college-related queries.</p>
            </div>
          ) : (
            messages.map((msg: Message, idx) => (
              <div key={idx} className={`${styles.message} ${msg.role === "user" ? styles.user : styles.bot}`}>
                <div className={`${styles.avatar} ${msg.role === "user" ? styles.user : styles.bot}`}>
                  {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={styles.bubble}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  
                  {msg.role === "assistant" && msg.citations && (
                    <div className={styles.citations}>
                      <div className="flex items-center gap-1 font-semibold mb-1">
                        <FileText size={12} /> Sources used:
                      </div>
                      <div className="flex flex-col gap-1">
                        {JSON.parse(msg.citations).map((cit: { document_id: number; page: number }, i: number) => (
                          <div key={i}>• Document {cit.document_id} (Page {cit.page})</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.role === "assistant" && (
                    <div className="mt-2 pt-2 border-t border-white/5 flex justify-end">
                       <button 
                         onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.content)}
                         className="text-secondary hover:text-white transition-colors"
                         title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                       >
                         {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                       </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className={`${styles.message} ${styles.bot}`}>
               <div className={`${styles.avatar} ${styles.bot}`}><Bot size={20} /></div>
               <div className={`${styles.bubble} flex gap-1 items-center h-12`}>
                 <span className="w-2 h-2 bg-secondary rounded-full animate-bounce"></span>
                 <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                 <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputContainer}>
          <div className={styles.inputWrapper}>
            <textarea
              className={styles.textarea}
              placeholder="Message the AI Assistant..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              style={{ minHeight: '50px' }}
            />
            {hasSpeechRecognition && (
              <button 
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors mx-1 ${isListening ? 'bg-red-500/20 text-red-500' : 'text-secondary hover:text-white'}`}
                onClick={toggleListening}
                title="Voice Input"
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}
            <button 
              className={styles.sendBtn} 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
