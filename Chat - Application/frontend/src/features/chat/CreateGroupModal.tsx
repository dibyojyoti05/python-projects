import React, { useState, useEffect } from 'react';
import { X, Search, Check } from 'lucide-react';
import api from '../../api/client';
import { useChatStore } from '../../store/chatStore';

interface CreateGroupModalProps {
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const { fetchConversations, setActiveConversation } = useChatStore();
  const [loading, setLoading] = useState(false);

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

  const toggleUser = (user: any) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    
    setLoading(true);
    try {
      const res = await api.post('/conversations/group', {
        name: groupName,
        participant_ids: selectedUsers.map(u => u.id)
      });
      await fetchConversations();
      setActiveConversation(res.data.id);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md shadow-2xl border border-gray-700 flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Create Group Chat</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="E.g., Engineering Team"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Add Members</label>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Search users..."
              />
            </div>
            
            {/* Selected Users Chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-1 bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium border border-blue-500/30">
                    {u.display_name || u.username}
                    <button onClick={() => toggleUser(u)} className="hover:text-blue-200">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Search Results */}
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {searchResults.map(u => {
                const isSelected = selectedUsers.some(su => su.id === u.id);
                return (
                  <div 
                    key={u.id} 
                    onClick={() => toggleUser(u)}
                    className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-gray-200 text-sm">
                        {(u.display_name?.[0] || u.username[0]).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{u.display_name || u.username}</p>
                        <p className="text-xs text-gray-400">@{u.username}</p>
                      </div>
                    </div>
                    {isSelected && <Check size={16} className="text-blue-500" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedUsers.length === 0 || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};
