import { useWebSocketStore } from './websocketStore';

export const useWebSocket = () => {
  const isConnected = useWebSocketStore((state) => state.isConnected);
  const sendMessage = useWebSocketStore((state) => state.sendMessage);
  const sendTyping = useWebSocketStore((state) => state.sendTyping);

  return { sendMessage, sendTyping, isConnected };
};
