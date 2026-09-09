import React, { useEffect, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useWebSocket } from '../../store/useWebSocket';
import api from '../../api/client';
import { LogOut, Search, User as UserIcon, Plus, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CreateGroupModal } from './CreateGroupModal';
import { SettingsModal } from '../settings/SettingsModal';

export const Sidebar: React.FC = () => {
  const { conversations, fetchConversations, activeConversationId, setActiveConversation, createOrGetPrivateConversation, onlineUsers } = useChatStore();
  const { user, logout } = useAuthStore();
  const { isConnected } = useWebSocket();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (search.length > 0) {
        try {
          const res = await api.get(`/users/search?query=${search}`);
          setSearchResults(res.data);
        } catch (e) {
          console.error(e);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleStartChat = async (userId: number) => {
    const convId = await createOrGetPrivateConversation(userId);
    setActiveConversation(convId);
    setSearch('');
    setSearchResults([]);
  };

  return (
    <div className="w-80 flex flex-col bg-gray-900 border-r border-gray-800 h-full relative">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg relative">
            {user?.username?.[0].toUpperCase()}
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </div>
          <div>
            <h2 className="font-semibold text-white leading-tight">{user?.display_name || user?.username}</h2>
            <p className="text-xs text-gray-400">{isConnected ? 'Connected' : 'Disconnected'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowSettings(true)} 
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition" 
            title="Profile Settings"
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={logout} 
            className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-800 transition" 
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Search and Create Group */}
      <div className="p-3 flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-500" />
          </div>
          <input
            type="text"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowCreateGroup(true)}
          className="bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 rounded-lg p-2 transition flex-shrink-0"
          title="Create Group"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {search.length > 0 ? (
          <div className="p-2 space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">Search Results</h3>
            {searchResults.map(u => (
              <div 
                key={u.id} 
                onClick={() => handleStartChat(u.id)}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-800 transition"
              >
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300">
                  <UserIcon size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{u.display_name || u.username}</p>
                  <p className="text-xs text-gray-400">@{u.username}</p>
                </div>
              </div>
            ))}
            {searchResults.length === 0 && <p className="text-center text-gray-500 text-sm mt-4">No users found</p>}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">Conversations</h3>
            {conversations.map(conv => {
              const displayName = conv.type === 'private' ? (conv.other_user?.display_name || conv.other_user?.username) : conv.name;
              const isActive = activeConversationId === conv.id;
              
              const otherUserId = conv.other_user?.id;
              const isOtherOnline = otherUserId ? (onlineUsers[otherUserId] ?? conv.other_user?.is_active) : false;
              
              return (
                <div 
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={`relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${isActive ? 'bg-blue-600/10 border border-blue-500/20' : 'hover:bg-gray-800'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg relative">
                    {displayName?.[0]?.toUpperCase()}
                    {conv.type === 'private' && (
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${isOtherOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-blue-400' : 'text-gray-200'}`}>
                        {displayName}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), {addSuffix: true}) : ''}
                      </span>
                    </div>
                    {conv.unread_count > 0 && (
                      <div className="absolute right-3 bottom-3 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {conv.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {conversations.length === 0 && <p className="text-center text-gray-500 text-sm mt-10">No conversations yet</p>}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};
