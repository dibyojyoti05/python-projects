"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { API_BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Send, 
  Upload, 
  Settings, 
  LogOut, 
  MessageSquare, 
  Trash2, 
  Plus, 
  Copy, 
  Check, 
  FileText, 
  Bot, 
  User as UserIcon, 
  Loader2
} from "lucide-react";

interface Message {
  id?: number;
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatItem {
  id: number;
  title: string;
  created_at: string;
  model_name?: string;
}

function renderInlineText(text: string) {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g);
  return tokens.map((token, i) => {
    if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-blue-300 font-mono text-xs">
          {token.slice(1, -1)}
        </code>
      );
    }
    if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
      return (
        <strong key={i} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) {
      return (
        <em key={i} className="italic text-zinc-200">
          {token.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{token}</span>;
  });
}

function FormattedMessage({ content }: { content: string }) {
  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          const lang = lines[0]?.match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : "";
          const code = lang ? lines.slice(1).join("\n") : lines.join("\n");
          return (
            <pre key={index} className="my-2 p-3 bg-zinc-900/80 rounded-xl border border-white/10 font-mono text-xs overflow-x-auto text-zinc-200">
              <code>{code}</code>
            </pre>
          );
        }

        const lines = part.split("\n");
        return (
          <span key={index}>
            {lines.map((line, lineIdx) => (
              <span key={lineIdx}>
                {renderInlineText(line)}
                {lineIdx < lines.length - 1 && <br />}
              </span>
            ))}
          </span>
        );
      })}
    </>
  );
}

export default function ChatDashboard() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I am your Enterprise AI Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadNotification, setUploadNotification] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialLoadRef = useRef(false);

  // Helper to reliably retrieve the JWT token even before Zustand finishes hydrating
  const getAuthToken = useCallback((): string | null => {
    if (token) return token;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("auth-storage");
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed?.state?.token || null;
        }
      } catch {
        return null;
      }
    }
    return null;
  }, [token]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Select chat and load its messages
  const selectChat = useCallback(async (id: number) => {
    if (isStreaming) return; // Prevent switching mid-stream
    const authToken = getAuthToken();
    if (!authToken) return;

    setChatId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/chats/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const chatData = await res.json();
        if (chatData.messages && chatData.messages.length > 0) {
          setMessages(chatData.messages);
        } else {
          setMessages([
            { role: "assistant", content: "Hello! I am your Enterprise AI Assistant. How can I help you today?" }
          ]);
        }
      }
    } catch (err) {
      console.error("Error fetching chat messages:", err);
    }
  }, [isStreaming, getAuthToken]);

  // Create a new chat
  const createNewChat = useCallback(async () => {
    if (isStreaming) return;
    const authToken = getAuthToken();
    if (!authToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/chats/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ title: "New Chat", model_name: "gemini/gemini-3.6-flash" })
      });
      if (!res.ok) throw new Error("Failed to create chat");
      const newChat: ChatItem = await res.json();
      setChats(prev => [newChat, ...prev]);
      setChatId(newChat.id);
      setMessages([
        { role: "assistant", content: "Hello! I am your Enterprise AI Assistant. How can I help you today?" }
      ]);
      return newChat;
    } catch (err) {
      console.error("Error creating chat:", err);
    }
  }, [isStreaming, getAuthToken]);

  // Auth guard & initial chat list fetching (runs cleanly once on mount)
  useEffect(() => {
    const authToken = getAuthToken();
    if (!authToken) {
      router.push("/login");
      return;
    }

    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const loadInitialData = async () => {
      setLoadingChats(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/chats/`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.status === 401) {
          logout();
          router.push("/login");
          return;
        }
        if (!res.ok) {
          console.warn("Failed to load chats, will create initial conversation");
          await createNewChat();
          return;
        }
        const chatList: ChatItem[] = await res.json();
        setChats(chatList);

        if (chatList.length > 0) {
          await selectChat(chatList[0].id);
        } else {
          await createNewChat();
        }
      } catch (err) {
        console.error("Error loading initial chats:", err);
      } finally {
        setLoadingChats(false);
      }
    };

    loadInitialData();
  }, [router, logout, selectChat, createNewChat, getAuthToken]);

  // Delete a chat
  const deleteChat = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isStreaming && chatId === id) return;
    const authToken = getAuthToken();
    if (!authToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/chats/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const remaining = chats.filter(c => c.id !== id);
        setChats(remaining);
        if (chatId === id) {
          if (remaining.length > 0) {
            selectChat(remaining[0].id);
          } else {
            createNewChat();
          }
        }
      }
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Send message and handle SSE stream
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !chatId || isStreaming) return;

    const authToken = getAuthToken();
    if (!authToken) {
      router.push("/login");
      return;
    }

    // Optimistically update UI
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chats/${chatId}/messages/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ content: text })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep trailing incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          const dataStr = trimmed.slice(6).trim();
          if (dataStr === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.content) {
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.role === "assistant") {
                  next[next.length - 1] = {
                    ...last,
                    content: last.content + parsed.content
                  };
                }
                return next;
              });
            }
            if (parsed.error) {
              console.error("Stream payload error:", parsed.error);
            }
          } catch {
            // Incomplete JSON or malformed token chunk - wait for buffer
          }
        }
      }

      // Re-fetch chat list to reflect updated title if changed from "New Chat"
      try {
        const listRes = await fetch(`${API_BASE_URL}/api/v1/chats/`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (listRes.ok) {
          const updatedList = await listRes.json();
          setChats(updatedList);
        }
      } catch (e) {
        console.error("Failed to refresh chat list:", e);
      }

    } catch (error) {
      console.error("Streaming error:", error);
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Sorry, I encountered an issue connecting to the Enterprise AI service. Please make sure the backend is active."
        };
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  // Document upload for RAG
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const authToken = getAuthToken();
    if (!authToken) return;

    setUploading(true);
    setUploadNotification(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspace_id", "1"); // Default workspace

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: formData
      });

      if (res.ok) {
        setUploadNotification(`"${file.name}" successfully indexed into knowledge base!`);
        setTimeout(() => setUploadNotification(null), 5000);
      } else {
        setUploadNotification(`Failed to upload "${file.name}".`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadNotification("Error uploading document.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2500);
    } catch (err) {
      console.error("Failed to copy text:", err);
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2500);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept=".txt,.md,.pdf,.csv,.json"
      />

      {/* Sidebar */}
      <div className="w-72 glass border-r border-white/10 flex flex-col z-20">
        {/* Brand header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-600/30">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-300">
                Enterprise AI
              </h2>
              <span className="text-[10px] text-zinc-500 block -mt-0.5">v2.0 Local Engine</span>
            </div>
          </div>
        </div>
        
        {/* New Chat Action */}
        <div className="p-3">
          <button 
            onClick={createNewChat}
            disabled={isStreaming}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-900/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
          <div className="px-2 py-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Conversations
          </div>

          {loadingChats ? (
            <div className="flex items-center justify-center py-8 text-zinc-500 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading chats...
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-6 text-zinc-600 text-xs">
              No conversations yet
            </div>
          ) : (
            chats.map((c) => {
              const isSelected = c.id === chatId;
              return (
                <div
                  key={c.id}
                  onClick={() => selectChat(c.id)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white/15 text-white font-medium shadow-sm border border-white/10"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-blue-400" : "text-zinc-500"}`} />
                    <span className="truncate">{c.title || "New Chat"}</span>
                  </div>
                  <button
                    onClick={(e) => deleteChat(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition-opacity"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
        
        {/* User Profile Bar */}
        <div className="p-3 border-t border-white/10 bg-black/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate pr-2">
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-zinc-300">
                {user.email[0].toUpperCase()}
              </div>
              <div className="truncate">
                <span className="block text-xs font-medium text-zinc-200 truncate">{user.email}</span>
                <span className="block text-[10px] text-green-400">Online • Local AI</span>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              title="Sign Out"
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-zinc-950/80">
        {/* Top bar */}
        <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Active Model:</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[11px]">
              {chats.find(c => c.id === chatId)?.model_name || "gemini/gemini-3.6-flash"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {uploadNotification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                {uploadNotification}
              </motion.div>
            )}
            <div className="glass px-3 py-1.5 rounded-lg text-xs text-zinc-400 flex items-center gap-1.5 border border-white/10">
              <Settings className="w-3.5 h-3.5" />
              <span>Context: 128k</span>
            </div>
          </div>
        </div>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  key={i} 
                  className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-semibold ${
                    isUser 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" 
                      : "bg-zinc-800 text-zinc-300 border border-white/10 shadow-sm"
                  }`}>
                    {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4 text-blue-400" />}
                  </div>

                  {/* Bubble */}
                  <div className={`relative group max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed select-text ${
                    isUser 
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-none shadow-md shadow-blue-950/40" 
                      : "glass text-zinc-100 rounded-tl-none border border-white/10 shadow-lg shadow-black/40"
                  }`}>
                    <div className="whitespace-pre-wrap break-words select-text font-normal">
                      {msg.content ? (
                        <FormattedMessage content={msg.content} />
                      ) : isStreaming && i === messages.length - 1 ? (
                        <span className="inline-flex items-center gap-1.5 text-zinc-400 py-1">
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </span>
                      ) : null}
                    </div>

                    {/* Action bar for assistant messages */}
                    {!isUser && msg.content && (
                      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs select-none">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                          <span>Gemini 3.6 Flash</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.content, i)}
                          title="Copy answer to clipboard"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all text-xs font-medium cursor-pointer border border-white/10 hover:border-white/20 active:scale-95 shadow-sm"
                        >
                          {copiedIndex === i ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Quick copy for user messages on hover */}
                    {isUser && msg.content && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.content, i)}
                        title="Copy message"
                        className="absolute -bottom-2.5 -left-2.5 p-1 rounded-md text-zinc-400 hover:text-white bg-zinc-900 border border-white/15 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md select-none"
                      >
                        {copiedIndex === i ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="max-w-4xl mx-auto relative">
            <div className="glass rounded-2xl p-2 flex items-end border border-white/15 focus-within:border-blue-500/60 shadow-2xl shadow-black/80 transition-all bg-black/50">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Index document for RAG"
                className="p-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin text-blue-400" /> : <Upload className="w-5 h-5" />}
              </button>
              
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isStreaming ? "AI is generating a response..." : "Ask Enterprise AI anything... (Shift+Enter for new line)"}
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-36 min-h-[44px] py-3 px-3 text-white placeholder:text-zinc-500 outline-none text-sm leading-relaxed"
                rows={1}
                disabled={isStreaming}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              
              <button 
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
                className="p-3 bg-gradient-to-tr from-white to-zinc-200 text-black font-semibold rounded-xl hover:opacity-90 transition-all m-1 disabled:opacity-30 disabled:cursor-not-allowed shadow-md cursor-pointer shrink-0"
                title="Send message"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Send className="w-4 h-4 text-black" />
                )}
              </button>
            </div>
            
            <p className="text-center text-[11px] text-zinc-500 mt-2.5">
              Enterprise AI powered securely by Google Gemini cloud intelligence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
