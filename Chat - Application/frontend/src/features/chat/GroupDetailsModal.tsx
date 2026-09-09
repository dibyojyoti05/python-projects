import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { X, Users, UserPlus, Trash2, LogOut, Shield, Search } from 'lucide-react';

interface GroupMember {
  user_id: number;
  role: string;
  joined_at: string;
  user: {
    id: number;
    username: string;
    display_name: string | null;
  } | null;
}

interface Props {
  conversationId: number;
  groupName: string;
  onClose: () => void;
}

export const GroupDetailsModal: React.FC<Props> = ({ conversationId, groupName, onClose }) => {
  const { user } = useAuthStore();
  const { fetchConversations, setActiveConversation } = useChatStore();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add member search state
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get(`/conversations/${conversationId}/members`);
      setMembers(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load group members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [conversationId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.get(`/users/search?query=${encodeURIComponent(searchQuery)}`);
        const existingIds = new Set(members.map((m) => m.user_id));
        setSearchResults(res.data.filter((u: any) => !existingIds.has(u.id)));
      } catch (e) {
        console.error('Failed to search users', e);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, members]);

  const currentMemberRole = members.find((m) => m.user_id === user?.id)?.role;
  const isManager = currentMemberRole === 'OWNER' || currentMemberRole === 'ADMIN';

  const handleAddMember = async (targetUserId: number) => {
    try {
      await api.post(`/conversations/${conversationId}/members`, { user_id: targetUserId });
      setSearchQuery('');
      setSearchResults([]);
      setIsAddingMember(false);
      await fetchMembers();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (targetUserId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/conversations/${conversationId}/members/${targetUserId}`);
      await fetchMembers();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to remove member');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    if (!user) return;
    try {
      await api.delete(`/conversations/${conversationId}/members/${user.id}`);
      await fetchConversations();
      setActiveConversation(null);
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to leave group');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-sm">
              <Users size={16} />
            </div>
            <h3 className="font-semibold text-white text-base truncate max-w-[280px]">
              {groupName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Members ({members.length})
            </span>
            {isManager && !isAddingMember && (
              <button
                onClick={() => setIsAddingMember(true)}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium py-1 px-2 rounded-lg hover:bg-blue-500/10 transition"
              >
                <UserPlus size={14} /> Add Member
              </button>
            )}
          </div>

          {/* Add member search box */}
          {isAddingMember && (
            <div className="p-3 bg-gray-800/80 rounded-xl border border-gray-700/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300 font-medium">Add New Member</span>
                <button
                  onClick={() => {
                    setIsAddingMember(false);
                    setSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Search dropdown results */}
              {searchResults.length > 0 && (
                <div className="max-h-36 overflow-y-auto divide-y divide-gray-700/50 bg-gray-900 rounded-lg border border-gray-700">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="p-2 flex items-center justify-between hover:bg-gray-800 transition"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{u.display_name || u.username}</p>
                        <p className="text-xs text-gray-400">@{u.username}</p>
                      </div>
                      <button
                        onClick={() => handleAddMember(u.id)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2.5 py-1 rounded-md transition"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {isSearching && <p className="text-xs text-gray-400 text-center py-1">Searching...</p>}
            </div>
          )}

          {/* Member List */}
          {isLoading ? (
            <div className="py-8 text-center text-sm text-gray-400">Loading members...</div>
          ) : error ? (
            <div className="py-4 text-center text-sm text-red-400">{error}</div>
          ) : (
            <div className="space-y-1.5">
              {members.map((m) => {
                const isCurrent = m.user_id === user?.id;
                return (
                  <div
                    key={m.user_id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-800/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {m.user?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-white">
                            {m.user?.display_name || m.user?.username}
                            {isCurrent && <span className="text-xs text-gray-400 ml-1">(You)</span>}
                          </p>
                          {m.role === 'OWNER' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300">
                              <Shield size={10} /> Owner
                            </span>
                          )}
                          {m.role === 'ADMIN' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">@{m.user?.username}</p>
                      </div>
                    </div>

                    {isManager && !isCurrent && m.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Remove member"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800 bg-gray-900/40 flex justify-between items-center">
          <button
            onClick={handleLeaveGroup}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium py-1.5 px-3 rounded-lg hover:bg-red-500/10 transition"
          >
            <LogOut size={15} /> Leave Group
          </button>
          <button
            onClick={onClose}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 py-1.5 px-4 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
