import { create } from 'zustand';
import api from '../api/client';

export interface Conversation {
  id: number;
  type: string;
  name: string | null;
  group_image: string | null;
  last_message_at: string;
  unread_count: number;
  other_user?: {
    id: number;
    username: string;
    display_name: string | null;
    is_active: boolean;
    last_seen: string | null;
  };
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: string;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  is_read?: boolean;
  sender?: {
    id: number;
    username: string;
    display_name: string | null;
  };
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: Record<number, Message[]>; // conversation_id -> messages
  isLoadingConversations: boolean;
  typingUsers: Record<number, number[]>; // conversation_id -> list of userIds
  onlineUsers: Record<number, boolean>;
  
  fetchConversations: () => Promise<void>;
  setActiveConversation: (id: number | null) => void;
  fetchMessages: (conversationId: number) => Promise<void>;
  addMessage: (message: Message) => void;
  updateConversationLastMessage: (conversationId: number, date: string) => void;
  createOrGetPrivateConversation: (userId: number) => Promise<number>;
  markAsRead: (conversationId: number, messageId: number) => Promise<void>;
  markMessagesAsReadLocally: (conversationId: number, upToMessageId: number) => void;
  updateMessage: (conversationId: number, messageId: number, content: string, editedAt: string) => void;
  deleteMessageLocally: (conversationId: number, messageId: number, deletedAt: string) => void;
  editMessage: (conversationId: number, messageId: number, content: string) => Promise<void>;
  deleteMessage: (conversationId: number, messageId: number) => Promise<void>;
  setTyping: (conversationId: number, userId: number, isTyping: boolean) => void;
  setPresence: (userId: number, isOnline: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isLoadingConversations: false,
  typingUsers: {},
  onlineUsers: {},
  
  markAsRead: async (conversationId: number, messageId: number) => {
    try {
      await api.post(`/conversations/${messageId}/read`);
      set((state) => ({
        conversations: state.conversations.map(c => 
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        )
      }));
    } catch(e) {
      console.error(e);
    }
  },

  markMessagesAsReadLocally: (conversationId: number, upToMessageId: number) => {
    set((state) => {
      const convMessages = state.messages[conversationId];
      if (!convMessages) return state;
      return {
        messages: {
          ...state.messages,
          [conversationId]: convMessages.map(m => 
            m.id <= upToMessageId ? { ...m, is_read: true } : m
          )
        }
      };
    });
  },

  setTyping: (conversationId: number, userId: number, isTyping: boolean) => {
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? Array.from(new Set([...current, userId]))
        : current.filter(id => id !== userId);
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updated
        }
      };
    });
  },

  setPresence: (userId: number, isOnline: boolean) => {
    set((state) => ({
      onlineUsers: {
        ...state.onlineUsers,
        [userId]: isOnline
      }
    }));
  },
  
  updateMessage: (conversationId, messageId, content, editedAt) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map(m =>
          m.id === messageId ? { ...m, content, edited_at: editedAt } : m
        )
      }
    }));
  },
  
  deleteMessageLocally: (conversationId, messageId, deletedAt) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map(m =>
          m.id === messageId ? { ...m, content: "This message was deleted", deleted_at: deletedAt } : m
        )
      }
    }));
  },
  
  editMessage: async (conversationId, messageId, content) => {
    try {
      const res = await api.patch(`/conversations/${messageId}`, { content });
      get().updateMessage(conversationId, messageId, content, res.data.edited_at);
    } catch(e) { console.error(e); }
  },
  
  deleteMessage: async (conversationId, messageId) => {
    try {
      await api.delete(`/conversations/${messageId}`);
      get().deleteMessageLocally(conversationId, messageId, new Date().toISOString());
    } catch(e) { console.error(e); }
  },
  
  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const response = await api.get('/conversations/');
      set({ conversations: response.data, isLoadingConversations: false });
    } catch (e) {
      set({ isLoadingConversations: false });
    }
  },
  
  setActiveConversation: (id: number | null) => {
    set({ activeConversationId: id });
    if (id && !get().messages[id]) {
      get().fetchMessages(id);
    }
  },
  
  fetchMessages: async (conversationId: number) => {
    try {
      const response = await api.get(`/conversations/${conversationId}/messages`);
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: response.data
        }
      }));
    } catch (e) {
      console.error("Failed to fetch messages");
    }
  },
  
  addMessage: (message: Message) => {
    set((state) => {
      const convMessages = state.messages[message.conversation_id] || [];
      // avoid duplicates
      if (convMessages.some(m => m.id === message.id)) return state;
      return {
        messages: {
          ...state.messages,
          [message.conversation_id]: [...convMessages, message]
        }
      };
    });
    get().updateConversationLastMessage(message.conversation_id, message.created_at);
  },
  
  updateConversationLastMessage: (conversationId: number, date: string) => {
    set((state) => ({
      conversations: state.conversations.map(c => 
        c.id === conversationId ? { ...c, last_message_at: date } : c
      ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    }));
  },
  
  createOrGetPrivateConversation: async (userId: number) => {
    const response = await api.post('/conversations/', {
      type: 'private',
      participant_id: userId
    });
    const newConv = response.data;
    set((state) => {
      const exists = state.conversations.some(c => c.id === newConv.id);
      if (!exists) {
        return { conversations: [newConv, ...state.conversations] };
      }
      return state;
    });
    return newConv.id;
  }
}));
