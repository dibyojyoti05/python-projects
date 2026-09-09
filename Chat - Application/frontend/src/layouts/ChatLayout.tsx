import React, { useEffect } from 'react';
import { Sidebar } from '../features/chat/Sidebar';
import { ChatWindow } from '../features/chat/ChatWindow';
import { useAuthStore } from '../store/authStore';
import { useWebSocketStore } from '../store/websocketStore';

export const ChatLayout: React.FC = () => {
  const { token } = useAuthStore();
  const { connect, disconnect } = useWebSocketStore();

  useEffect(() => {
    if (token) {
      connect(token);
    }
    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900 text-gray-100 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-[#0b1120]">
        <ChatWindow />
      </main>
    </div>
  );
};
