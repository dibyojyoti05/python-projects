'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Inbox, 
  Flame, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  ArrowRight, 
  Plus, 
  Sparkles, 
  Mail, 
  Trash2 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { emailsAPI, tasksAPI, EmailStats, EmailMessage, Task } from '@/lib/api';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
  const { user, loginAsGuest } = useAuth();
  const [stats, setStats] = useState<EmailStats>({
    total: 0,
    unread: 0,
    urgent: 0,
    important: 0,
    needs_action: 0,
  });
  const [recentEmails, setRecentEmails] = useState<EmailMessage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [statsData, emailsData, tasksData] = await Promise.all([
        emailsAPI.getStats(),
        emailsAPI.getEmails({ limit: 4 }),
        tasksAPI.getTasks(),
      ]);
      setStats(statsData);
      setRecentEmails(emailsData);
      setTasks(tasksData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await tasksAPI.updateTask(task.id, { status: nextStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    } catch {
      // ignore
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await tasksAPI.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch {
      // ignore
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const created = await tasksAPI.createTask({ title: newTaskTitle.trim(), priority: 'MEDIUM' });
      setTasks([created, ...tasks]);
      setNewTaskTitle('');
    } catch {
      // ignore
    }
  };

  const handleSeedEmails = async () => {
    if (!user) {
      await loginAsGuest();
    } else {
      await emailsAPI.seedDemo();
    }
    await loadDashboardData();
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerTitles}>
          <h1>
            Good day, {user?.full_name ? user.full_name.split(' ')[0] : 'there'}.
          </h1>
          <p>Here is an AI-powered digest of your executive inbox and pending actions.</p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/assistant" className={styles.assistantBtn}>
            <Sparkles size={16} />
            <span>Ask AI Assistant</span>
          </Link>
          {stats.total === 0 && (
            <button onClick={handleSeedEmails} className={styles.seedBtn}>
              <Mail size={16} />
              <span>Load Demo Inbox</span>
            </button>
          )}
        </div>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.cardTop}>
            <span className={styles.statLabel}>Total Emails</span>
            <Inbox size={18} className={styles.iconBlue} />
          </div>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statSub}>{stats.unread} unread in inbox</span>
        </div>

        <div className={`${styles.statCard} ${styles.urgentCard}`}>
          <div className={styles.cardTop}>
            <span className={styles.statLabel}>Urgent Priority</span>
            <Flame size={18} className={styles.iconRed} />
          </div>
          <span className={styles.statValue}>{stats.urgent}</span>
          <span className={styles.statSub}>Requires immediate reply</span>
        </div>

        <div className={`${styles.statCard} ${styles.actionCard}`}>
          <div className={styles.cardTop}>
            <span className={styles.statLabel}>Needs Action</span>
            <AlertCircle size={18} className={styles.iconCyan} />
          </div>
          <span className={styles.statValue}>{stats.needs_action}</span>
          <span className={styles.statSub}>Action items identified by AI</span>
        </div>

        <div className={`${styles.statCard} ${styles.importantCard}`}>
          <div className={styles.cardTop}>
            <span className={styles.statLabel}>Pending Tasks</span>
            <CheckCircle2 size={18} className={styles.iconYellow} />
          </div>
          <span className={styles.statValue}>
            {tasks.filter(t => t.status !== 'COMPLETED').length}
          </span>
          <span className={styles.statSub}>{tasks.filter(t => t.status === 'COMPLETED').length} completed</span>
        </div>
      </div>

      {/* Main Grid: Left preview, Right Tasks */}
      <div className={styles.mainGrid}>
        {/* Left: Recent Smart Emails */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2>Priority Inbox Feed</h2>
              <span className={styles.sectionBadge}>AI Classified</span>
            </div>
            <Link href="/inbox" className={styles.viewAllLink}>
              View Smart Inbox <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className={styles.loadingPlaceholder}>Loading smart emails...</div>
          ) : recentEmails.length === 0 ? (
            <div className={styles.emptyState}>
              <Mail size={36} className={styles.emptyIcon} />
              <p>Your mailbox is currently empty.</p>
              <button onClick={handleSeedEmails} className={styles.primarySeedBtn}>
                Load Realistic Demo Emails
              </button>
            </div>
          ) : (
            <div className={styles.emailList}>
              {recentEmails.map((email) => {
                const priority = email.analysis?.priority || 'LOW';
                return (
                  <Link 
                    key={email.id} 
                    href={`/inbox?id=${email.id}`}
                    className={`${styles.emailRow} ${email.is_read ? styles.readEmail : ''}`}
                  >
                    <div className={`${styles.priorityBar} ${styles[`priority_${priority}`]}`} />
                    <div className={styles.emailBody}>
                      <div className={styles.emailHeaderRow}>
                        <span className={styles.emailSender}>{email.sender.split('<')[0].trim()}</span>
                        <span className={styles.emailDate}>
                          {new Date(email.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={styles.emailSubject}>{email.subject}</div>
                      <div className={styles.emailSnippet}>
                        {email.analysis?.short_summary || email.body_text?.slice(0, 100)}
                      </div>
                    </div>
                    <div className={styles.emailPills}>
                      {email.analysis?.category && (
                        <span className={styles.categoryPill}>{email.analysis.category}</span>
                      )}
                      {email.analysis?.priority && (
                        <span className={`${styles.priorityPill} ${styles[`pill_${priority}`]}`}>
                          {email.analysis.priority}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Extracted Tasks & Checklist */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2>Executive Checklist</h2>
              <span className={styles.sectionBadge}>Tasks</span>
            </div>
            <Link href="/tasks" className={styles.viewAllLink}>
              All Tasks <ArrowRight size={14} />
            </Link>
          </div>

          <form onSubmit={handleCreateTask} className={styles.quickTaskForm}>
            <input
              type="text"
              placeholder="Add quick follow-up task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className={styles.taskInput}
            />
            <button type="submit" className={styles.addTaskBtn} title="Add task">
              <Plus size={16} />
            </button>
          </form>

          <div className={styles.tasksList}>
            {tasks.length === 0 ? (
              <p className={styles.noTasks}>No active tasks. AI extracts action items from your incoming emails.</p>
            ) : (
              tasks.slice(0, 6).map((task) => {
                const isCompleted = task.status === 'COMPLETED';
                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className={`${styles.taskItem} ${isCompleted ? styles.taskCompleted : ''}`}
                  >
                    <div className={styles.taskCheckbox}>
                      {isCompleted ? (
                        <CheckCircle2 size={17} className={styles.checkedIcon} />
                      ) : (
                        <Circle size={17} className={styles.uncheckedIcon} />
                      )}
                    </div>
                    <div className={styles.taskTextGroup}>
                      <span className={styles.taskTitle}>{task.title}</span>
                      {task.deadline && (
                        <span className={styles.taskDeadline}>
                          Due: {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      className={styles.taskDeleteBtn}
                      title="Delete task"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
