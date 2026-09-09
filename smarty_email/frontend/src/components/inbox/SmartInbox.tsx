'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Star, 
  Mail, 
  CheckCircle2, 
  Sparkles, 
  CornerUpLeft, 
  Plus, 
  RefreshCw, 
  Calendar, 
  User, 
  Send,
  Flame,
  Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { emailsAPI, tasksAPI, searchAPI, EmailMessage } from '@/lib/api';
import styles from './SmartInbox.module.css';

export const SmartInbox = () => {
  const { user, loginAsGuest } = useAuth();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyDraft, setReplyDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [addedTasks, setAddedTasks] = useState<Record<string, boolean>>({});

  const fetchEmails = React.useCallback(async (currentFilter = filter) => {
    setLoading(true);
    try {
      let filterParam: string | undefined = undefined;
      let categoryParam: string | undefined = undefined;

      const f = currentFilter.toLowerCase();
      if (['urgent', 'important', 'needs_action', 'starred'].includes(f)) {
        filterParam = f;
      } else if (f !== 'all') {
        categoryParam = currentFilter;
      }

      const data = await emailsAPI.getEmails({ 
        filter: filterParam, 
        category: categoryParam 
      });
      setEmails(data);
      if (data.length > 0 && (!selectedEmail || !data.some(e => e.id === selectedEmail.id))) {
        setSelectedEmail(data[0]);
        if (data[0].analysis?.suggested_response) {
          setReplyDraft(data[0].analysis.suggested_response);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter, selectedEmail]);

  useEffect(() => {
    fetchEmails();
  }, [user, fetchEmails]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchEmails();
      return;
    }
    setLoading(true);
    try {
      const results = await searchAPI.search(searchQuery);
      setEmails(results);
      if (results.length > 0) {
        setSelectedEmail(results[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmail = async (email: EmailMessage) => {
    setSelectedEmail(email);
    setReplyDraft(email.analysis?.suggested_response || '');
    if (!email.is_read) {
      try {
        await emailsAPI.updateEmail(email.id, { is_read: true });
        setEmails(emails.map(e => e.id === email.id ? { ...e, is_read: true } : e));
      } catch {
        // ignore
      }
    }
  };

  const handleToggleStar = async (email: EmailMessage, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = !email.is_starred;
    try {
      await emailsAPI.updateEmail(email.id, { is_starred: nextVal });
      setEmails(emails.map(e => e.id === email.id ? { ...e, is_starred: nextVal } : e));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail({ ...selectedEmail, is_starred: nextVal });
      }
    } catch {
      // ignore
    }
  };

  const handleAddActionItemToTask = async (item: string) => {
    if (!selectedEmail) return;
    try {
      await tasksAPI.createTask({
        title: item,
        description: `From email: "${selectedEmail.subject}"`,
        source_email_id: selectedEmail.id,
        priority: selectedEmail.analysis?.priority === 'URGENT' ? 'HIGH' : 'MEDIUM',
      });
      setAddedTasks(prev => ({ ...prev, [item]: true }));
    } catch {
      // ignore
    }
  };

  const handleSeed = async () => {
    if (!user) {
      await loginAsGuest();
    } else {
      await emailsAPI.seedDemo();
    }
    await fetchEmails();
  };

  const copyReply = () => {
    if (!replyDraft) return;
    navigator.clipboard.writeText(replyDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filters = ['All', 'Urgent', 'Needs Action', 'Important', 'Starred', 'Client', 'Interview', 'Project'];

  return (
    <div className={styles.inboxWrapper}>
      {/* Left Column: Email List */}
      <div className={styles.listPane}>
        <div className={styles.listHeader}>
          <div className={styles.titleRow}>
            <h1>Smart Inbox</h1>
            <button onClick={() => fetchEmails()} className={styles.refreshBtn} title="Refresh">
              <RefreshCw size={14} className={loading ? styles.spinning : ''} />
            </button>
          </div>

          <form onSubmit={handleSearch} className={styles.searchBar}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search sender, topic, or AI intent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </form>

          <div className={styles.filtersScroll}>
            {filters.map((f) => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.activeFilter : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'Urgent' && <Flame size={12} className={styles.urgentFlame} />}
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.emailList}>
          {loading ? (
            <div className={styles.emptyState}>Loading smart emails...</div>
          ) : emails.length === 0 ? (
            <div className={styles.emptyState}>
              <Mail size={32} />
              <p>No emails found matching your filter.</p>
              <button onClick={handleSeed} className={styles.seedBtn}>
                Load Demo Inbox
              </button>
            </div>
          ) : (
            emails.map((email) => {
              const isSelected = selectedEmail?.id === email.id;
              const priority = email.analysis?.priority || 'LOW';
              return (
                <div
                  key={email.id}
                  onClick={() => handleSelectEmail(email)}
                  className={`${styles.emailItem} ${isSelected ? styles.selectedItem : ''} ${!email.is_read ? styles.unreadItem : ''}`}
                >
                  <div className={`${styles.priorityIndicator} ${styles[`priority_${priority}`]}`} />

                  <div className={styles.itemContent}>
                    <div className={styles.itemTop}>
                      <span className={styles.sender}>{email.sender.split('<')[0].trim()}</span>
                      <div className={styles.topRight}>
                        <span className={styles.date}>
                          {new Date(email.received_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                        <button
                          onClick={(e) => handleToggleStar(email, e)}
                          className={`${styles.starBtn} ${email.is_starred ? styles.starred : ''}`}
                        >
                          <Star size={13} fill={email.is_starred ? '#f59e0b' : 'none'} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.subject}>{email.subject}</div>
                    <div className={styles.snippet}>
                      {email.analysis?.short_summary || email.body_text?.slice(0, 100)}
                    </div>

                    <div className={styles.pillRow}>
                      {email.analysis?.category && (
                        <span className={styles.categoryBadge}>{email.analysis.category}</span>
                      )}
                      {email.analysis?.priority && (
                        <span className={`${styles.priorityBadge} ${styles[`badge_${priority}`]}`}>
                          {email.analysis.priority}
                        </span>
                      )}
                      {email.analysis?.requires_response && (
                        <span className={styles.actionBadge}>Reply Needed</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Selected Email Detailed View */}
      <div className={styles.detailPane}>
        {selectedEmail ? (
          <div className={styles.detailContent}>
            {/* Header / Subject */}
            <div className={styles.detailHeader}>
              <div className={styles.detailSubjectRow}>
                <h2>{selectedEmail.subject}</h2>
                <div className={styles.detailBadges}>
                  {selectedEmail.analysis?.category && (
                    <span className={styles.categoryBadge}>{selectedEmail.analysis.category}</span>
                  )}
                  {selectedEmail.analysis?.priority && (
                    <span className={`${styles.priorityBadge} ${styles[`badge_${selectedEmail.analysis.priority}`]}`}>
                      {selectedEmail.analysis.priority} Priority
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.senderCard}>
                <div className={styles.senderAvatar}>
                  <User size={18} />
                </div>
                <div className={styles.senderInfo}>
                  <div className={styles.senderName}>{selectedEmail.sender}</div>
                  <div className={styles.recipientLine}>
                    To: {selectedEmail.recipients.join(', ')}
                  </div>
                </div>
                <div className={styles.emailTimestamp}>
                  <Calendar size={13} />
                  <span>{new Date(selectedEmail.received_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* AI Summary Banner */}
            {selectedEmail.analysis && (
              <div className={styles.aiInsightBanner}>
                <div className={styles.aiBannerHeader}>
                  <div className={styles.aiBannerTitle}>
                    <Sparkles size={16} className={styles.sparkleIcon} />
                    <span>Executive AI Summary</span>
                  </div>
                  {selectedEmail.analysis.intent && (
                    <span className={styles.intentTag}>Intent: {selectedEmail.analysis.intent}</span>
                  )}
                </div>

                <p className={styles.aiSummaryText}>
                  {selectedEmail.analysis.short_summary}
                </p>

                {selectedEmail.analysis.key_points && selectedEmail.analysis.key_points.length > 0 && (
                  <div className={styles.keyPointsSection}>
                    <span className={styles.subSectionTitle}>Key Highlights:</span>
                    <ul className={styles.pointsList}>
                      {selectedEmail.analysis.key_points.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Extracted Action Items */}
                {selectedEmail.analysis.action_items && selectedEmail.analysis.action_items.length > 0 && (
                  <div className={styles.actionItemsSection}>
                    <span className={styles.subSectionTitle}>Detected Action Items:</span>
                    <div className={styles.actionItemsGrid}>
                      {selectedEmail.analysis.action_items.map((item, idx) => {
                        const isAdded = addedTasks[item];
                        return (
                          <div key={idx} className={styles.actionItemChip}>
                            <span>{item}</span>
                            <button
                              onClick={() => handleAddActionItemToTask(item)}
                              disabled={isAdded}
                              className={`${styles.addToListBtn} ${isAdded ? styles.addedBtn : ''}`}
                            >
                              {isAdded ? <Check size={12} /> : <Plus size={12} />}
                              <span>{isAdded ? 'Added' : 'Create Task'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Email Body Content */}
            <div className={styles.emailBodyCard}>
              <div className={styles.bodyPre}>
                {selectedEmail.body_text || 'No text content.'}
              </div>
            </div>

            {/* Suggested Reply Box */}
            <div className={styles.replyBox}>
              <div className={styles.replyBoxHeader}>
                <div className={styles.replyTitle}>
                  <CornerUpLeft size={16} />
                  <span>AI Drafted Response</span>
                </div>
                <button onClick={copyReply} className={styles.copyReplyBtn}>
                  {copied ? <CheckCircle2 size={14} /> : null}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Draft'}</span>
                </button>
              </div>

              <textarea
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                placeholder="Write or refine your reply..."
                className={styles.replyTextarea}
                rows={4}
              />

              <div className={styles.replyActions}>
                <span className={styles.replyHint}>Generated with Gemini AI contextual reasoning</span>
                <button onClick={copyReply} className={styles.sendReplyBtn}>
                  <Send size={14} />
                  <span>Send Response</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.noSelection}>
            <Mail size={42} />
            <p>Select an email from the list to view detailed AI analysis, action items, and intelligent drafts.</p>
          </div>
        )}
      </div>
    </div>
  );
};
