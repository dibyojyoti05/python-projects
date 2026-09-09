import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useWebSocket } from '../../store/useWebSocket';
import { BACKEND_URL } from '../../api/client';
import { Send, Image as ImageIcon, Paperclip, Edit2, Trash2, X, Check, CheckCheck, Users } from 'lucide-react';
import { format } from 'date-fns';
import { GroupDetailsModal } from './GroupDetailsModal';

export const ChatWindow: React.FC = () => {
  const {
    activeConversationId,
    conversations,
    messages,
    editMessage,
    deleteMessage,
    onlineUsers,
    typingUsers,
  } = useChatStore();
  const { user } = useAuthStore();
  const { sendMessage, sendTyping } = useWebSocket();
  const [content, setContent] = useState('');
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const activeMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    if (activeMessages.length > 0 && activeConversationId) {
      const latest = activeMessages[activeMessages.length - 1];
      if (latest.sender_id !== user?.id) {
        useChatStore.getState().markAsRead(activeConversationId, latest.id);
      }
    }
  }, [activeMessages, activeConversationId, user]);

  if (!activeConversationId || !activeConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-800 text-gray-400">
        <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <Send size={32} className="text-gray-500 ml-1" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">Your Messages</h3>
        <p>Select a conversation or start a new one.</p>
      </div>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (editingMsgId) {
      editMessage(activeConversationId, editingMsgId, content);
      setEditingMsgId(null);
    } else {
      sendMessage(activeConversationId, content);
    }
    setContent('');
    sendTyping(activeConversationId, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      sendTyping(activeConversationId, true);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(activeConversationId, false);
      typingTimeoutRef.current = null;
    }, 1500);
  };

  const startEdit = (msgId: number, currentContent: string) => {
    setEditingMsgId(msgId);
    setContent(currentContent);
  };

  const cancelEdit = () => {
    setEditingMsgId(null);
    setContent('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { default: api } = await import('../../api/client');
      const res = await api.post('/attachments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { url, filename, is_image } = res.data;
      const fileFullUrl = `${BACKEND_URL}${url}`;
      const msgContent = is_image ? `![${filename}](${fileFullUrl})` : `[${filename}](${fileFullUrl})`;

      sendMessage(activeConversationId, msgContent);
    } catch (err) {
      console.error('Upload failed', err);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderMessageContent = (msgContent: string) => {
    if (msgContent === 'This message was deleted') {
      return <span className="italic">{msgContent}</span>;
    }
    const imgMatch = msgContent.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      return (
        <div className="flex flex-col gap-1">
          <img
            src={imgMatch[2]}
            alt={imgMatch[1]}
            className="max-w-[250px] max-h-[250px] rounded-lg object-cover"
          />
        </div>
      );
    }
    const fileMatch = msgContent.match(/^\[(.*?)\]\((.*?)\)$/);
    if (fileMatch) {
      return (
        <a
          href={fileMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 underline text-blue-200 hover:text-blue-100"
        >
          <Paperclip size={16} /> {fileMatch[1]}
        </a>
      );
    }
    return <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msgContent}</p>;
  };

  const displayName =
    activeConv.type === 'private'
      ? activeConv.other_user?.display_name || activeConv.other_user?.username
      : activeConv.name;

  const otherUserId = activeConv.other_user?.id;
  const isOtherOnline = otherUserId ? onlineUsers[otherUserId] ?? activeConv.other_user?.is_active : false;
  const isSomeoneTyping = (typingUsers[activeConversationId] || []).length > 0;

  return (
    <div className="flex-1 flex flex-col bg-[#0b1120] h-full shadow-2xl relative">
      {/* Header */}
      <div className="h-16 px-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold relative">
            {displayName?.[0]?.toUpperCase()}
            {activeConv.type === 'private' && (
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                  isOtherOnline ? 'bg-green-500' : 'bg-gray-500'
                }`}
              ></span>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-100">{displayName}</h2>
            {activeConv.type === 'private' ? (
              <p className="text-xs text-gray-400">{isOtherOnline ? 'Online' : 'Offline'}</p>
            ) : (
              <p className="text-xs text-purple-400">Group Conversation</p>
            )}
          </div>
        </div>

        {activeConv.type === 'group' && (
          <button
            onClick={() => setShowGroupDetails(true)}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/60 py-1.5 px-3 rounded-xl transition"
          >
            <Users size={15} />
            <span>Group Info</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {activeMessages.map((msg, idx) => {
          const isMine = msg.sender_id === user?.id;
          const showAvatar =
            !isMine && (idx === 0 || activeMessages[idx - 1].sender_id !== msg.sender_id);
          const isDeleted = msg.content === 'This message was deleted';

          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'} group relative`}
            >
              {!isMine && (
                <div className="w-8 flex-shrink-0 mr-3">
                  {showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white font-bold shadow-md">
                      {msg.sender?.display_name?.[0]?.toUpperCase() ||
                        msg.sender?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              )}

              <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl shadow-sm relative ${
                    isMine
                      ? isDeleted
                        ? 'bg-gray-800 text-gray-500 rounded-br-none italic'
                        : 'bg-blue-600 text-white rounded-br-none'
                      : isDeleted
                      ? 'bg-gray-800 text-gray-500 rounded-bl-none italic'
                      : 'bg-gray-800 text-gray-100 border border-gray-700/50 rounded-bl-none'
                  }`}
                >
                  {renderMessageContent(msg.content)}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 px-1">
                  <span className="text-[11px] text-gray-500 font-medium tracking-wide">
                    {format(new Date(msg.created_at), 'HH:mm')}
                    {msg.edited_at && !isDeleted && ' (edited)'}
                  </span>
                  {isMine && !isDeleted && (
                    <span className="inline-flex items-center" title={msg.is_read ? 'Read' : 'Delivered'}>
                      {msg.is_read ? (
                        <CheckCheck size={14} className="text-blue-400" />
                      ) : (
                        <Check size={14} className="text-gray-500" />
                      )}
                    </span>
                  )}
                </div>
              </div>

              {isMine && !isDeleted && (
                <div className="absolute top-0 right-full mr-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <button
                    onClick={() => startEdit(msg.id, msg.content)}
                    className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded-full shadow"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteMessage(activeConversationId, msg.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 bg-gray-800 rounded-full shadow"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {isSomeoneTyping && (
        <div className="px-6 py-1 flex items-center gap-2 text-xs text-blue-400 italic">
          <span className="animate-pulse">Someone is typing...</span>
        </div>
      )}

      {/* Composer */}
      <div className="p-4 bg-gray-900/80 backdrop-blur-md border-t border-gray-800 flex flex-col gap-2">
        {editingMsgId && (
          <div className="max-w-4xl mx-auto w-full px-2 flex justify-between items-center text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <Edit2 size={14} /> Editing message
            </span>
            <button onClick={cancelEdit} className="hover:text-white flex items-center gap-1">
              <X size={16} /> Cancel
            </button>
          </div>
        )}
        <form
          onSubmit={handleSend}
          className="max-w-4xl mx-auto w-full flex items-end gap-2 bg-gray-800 p-2 rounded-2xl border border-gray-700 shadow-inner"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-xl transition"
          >
            <Paperclip size={20} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-xl transition"
          >
            <ImageIcon size={20} />
          </button>

          <input
            type="text"
            className="flex-1 bg-transparent text-gray-100 px-2 py-3 focus:outline-none placeholder-gray-500"
            placeholder="Write a message..."
            value={content}
            onChange={handleTyping}
          />

          <button
            type="submit"
            disabled={!content.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:text-blue-200/50 text-white rounded-xl transition shadow-md flex items-center justify-center"
          >
            <Send size={18} className={content.trim() ? 'translate-x-0.5' : ''} />
          </button>
        </form>
      </div>

      {showGroupDetails && activeConv.type === 'group' && (
        <GroupDetailsModal
          conversationId={activeConv.id}
          groupName={displayName || 'Group'}
          onClose={() => setShowGroupDetails(false)}
        />
      )}
    </div>
  );
};

