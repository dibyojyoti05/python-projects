import { create } from 'zustand';
import { WS_BASE_URL } from '../api/client';
import { useChatStore } from './chatStore';

interface WebSocketState {
  isConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  sendMessage: (conversationId: number, content: string) => void;
  sendTyping: (conversationId: number, isTyping: boolean) => void;
}

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let currentToken: string | null = null;
let isIntentionallyClosed = false;

export const useWebSocketStore = create<WebSocketState>((set) => ({
  isConnected: false,

  connect: (token: string) => {
    if (!token) return;
    currentToken = token;
    isIntentionallyClosed = false;

    // If socket is already OPEN or CONNECTING with the same token, do not create another
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (socket) {
      try {
        socket.close();
      } catch (e) {
        // ignore
      }
      socket = null;
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    try {
      const url = `${WS_BASE_URL}?token=${encodeURIComponent(token)}`;
      socket = new WebSocket(url);

      socket.onopen = () => {
        set({ isConnected: true });
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          if (type === 'message:new') {
            const { activeConversationId, addMessage } = useChatStore.getState();
            addMessage(payload);

            // Browser push notification if conversation is not active or window not focused
            if (activeConversationId !== payload.conversation_id) {
              if (typeof Notification !== 'undefined') {
                if (Notification.permission === 'granted') {
                  new Notification(`New message from ${payload.sender?.display_name || payload.sender?.username || 'someone'}`, {
                    body: payload.content,
                  });
                } else if (Notification.permission !== 'denied') {
                  Notification.requestPermission();
                }
              }
            }
          } else if (type === 'message:edited') {
            useChatStore.getState().updateMessage(
              payload.conversation_id,
              payload.message_id,
              payload.content,
              payload.edited_at
            );
          } else if (type === 'message:deleted') {
            useChatStore.getState().deleteMessageLocally(
              payload.conversation_id,
              payload.message_id,
              payload.deleted_at
            );
          } else if (type === 'message:read') {
            useChatStore.getState().markMessagesAsReadLocally(
              payload.conversation_id,
              payload.message_id
            );
          } else if (type === 'typing:start') {
            useChatStore.getState().setTyping(payload.conversation_id, payload.user_id, true);
          } else if (type === 'typing:stop') {
            useChatStore.getState().setTyping(payload.conversation_id, payload.user_id, false);
          } else if (type === 'presence:update') {
            useChatStore.getState().setPresence(payload.user_id, payload.is_online);
          } else if (type === 'conversation:new') {
            useChatStore.getState().fetchConversations();
          }
        } catch (err) {
          console.error('[WebSocket] Message parsing error:', err);
        }
      };

      socket.onclose = () => {
        set({ isConnected: false });
        socket = null;
        if (!isIntentionallyClosed && currentToken) {
          reconnectTimer = setTimeout(() => {
            if (currentToken && !isIntentionallyClosed) {
              useWebSocketStore.getState().connect(currentToken);
            }
          }, 3000);
        }
      };

      socket.onerror = (err) => {
        console.error('[WebSocket] Connection error:', err);
        socket?.close();
      };
    } catch (e) {
      console.error('[WebSocket] Failed to initialize socket:', e);
      set({ isConnected: false });
    }
  },

  disconnect: () => {
    isIntentionallyClosed = true;
    currentToken = null;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (socket) {
      socket.close();
      socket = null;
    }
    set({ isConnected: false });
  },

  sendMessage: (conversationId: number, content: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'message:send',
        payload: {
          conversation_id: conversationId,
          content: content,
        }
      }));
    } else {
      console.warn('[WebSocket] Cannot send message: Socket is not connected');
    }
  },

  sendTyping: (conversationId: number, isTyping: boolean) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: isTyping ? 'typing:start' : 'typing:stop',
        payload: {
          conversation_id: conversationId,
        }
      }));
    }
  },
}));
