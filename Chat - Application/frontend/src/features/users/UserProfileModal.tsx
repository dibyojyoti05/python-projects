import React from 'react';
import { X, MessageSquare, Mail, User as UserIcon } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';

interface Props {
  user: {
    id: number;
    username: string;
    display_name?: string | null;
    email?: string | null;
    bio?: string | null;
    is_active?: boolean;
    last_seen?: string | null;
  };
  onClose: () => void;
}

export const UserProfileModal: React.FC<Props> = ({ user, onClose }) => {
  const { createOrGetPrivateConversation, setActiveConversation, onlineUsers } = useChatStore();

  const isOnline = onlineUsers[user.id] ?? user.is_active;

  const handleStartChat = async () => {
    const convId = await createOrGetPrivateConversation(user.id);
    setActiveConversation(convId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <h3 className="font-semibold text-white text-base">User Info</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user.username?.[0]?.toUpperCase()}
            </div>
            <span
              className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${
                isOnline ? 'bg-green-500' : 'bg-gray-500'
              }`}
              title={isOnline ? 'Online' : 'Offline'}
            />
          </div>

          <div>
            <h4 className="text-lg font-bold text-white">{user.display_name || user.username}</h4>
            <p className="text-sm text-gray-400">@{user.username}</p>
          </div>

          {user.bio && (
            <div className="w-full bg-gray-800/60 p-3 rounded-xl border border-gray-700/50 text-xs text-gray-300 text-left">
              <span className="font-semibold text-gray-400 block mb-1">About</span>
              <p className="whitespace-pre-wrap">{user.bio}</p>
            </div>
          )}

          <div className="w-full space-y-2 text-xs text-gray-400 text-left pt-2">
            {user.email && (
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-500" />
                <span>{user.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <UserIcon size={14} className="text-gray-500" />
              <span>Status: {isOnline ? 'Active Now' : 'Offline'}</span>
            </div>
          </div>

          <button
            onClick={handleStartChat}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-xl shadow transition"
          >
            <MessageSquare size={16} />
            <span>Send Message</span>
          </button>
        </div>
      </div>
    </div>
  );
};
