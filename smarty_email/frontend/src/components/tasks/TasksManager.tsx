'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Plus, 
  Calendar, 
  Mail, 
  CheckSquare 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { tasksAPI, Task } from '@/lib/api';
import styles from './TasksManager.module.css';

export const TasksManager = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, COMPLETED
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const data = await tasksAPI.getTasks();
      setTasks(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const handleToggle = async (task: Task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await tasksAPI.updateTask(task.id, { status: nextStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tasksAPI.deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch {
      // ignore
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const created = await tasksAPI.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      });
      setTasks([created, ...tasks]);
      setTitle('');
      setDescription('');
    } catch {
      // ignore
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'PENDING') return t.status !== 'COMPLETED';
    if (filter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Tasks & Action Items</h1>
          <p>Action items extracted from client emails, meeting requests, and project deadlines.</p>
        </div>

        <div className={styles.filterPills}>
          {['ALL', 'PENDING', 'COMPLETED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`${styles.filterBtn} ${filter === f ? styles.activeFilter : ''}`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {/* Add Task Form */}
      <form onSubmit={handleCreateTask} className={styles.createForm}>
        <div className={styles.formRow}>
          <input
            type="text"
            placeholder="Add a new action item or follow-up..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.titleInput}
            required
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className={styles.prioritySelect}
          >
            <option value="LOW">Low Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="HIGH">High Priority</option>
          </select>
          <button type="submit" className={styles.submitBtn}>
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        </div>
        <input
          type="text"
          placeholder="Optional notes or context..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.descInput}
        />
      </form>

      {/* Task List */}
      <div className={styles.taskListPane}>
        {loading ? (
          <div className={styles.emptyState}>Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckSquare size={36} />
            <p>No tasks found for &quot;{filter.toLowerCase()}&quot; filter.</p>
          </div>
        ) : (
          <div className={styles.tasksList}>
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'COMPLETED';
              return (
                <div
                  key={task.id}
                  onClick={() => handleToggle(task)}
                  className={`${styles.taskCard} ${isCompleted ? styles.completedCard : ''}`}
                >
                  <div className={styles.checkbox}>
                    {isCompleted ? (
                      <CheckCircle2 size={19} className={styles.iconGreen} />
                    ) : (
                      <Circle size={19} className={styles.iconGray} />
                    )}
                  </div>

                  <div className={styles.taskInfo}>
                    <div className={styles.taskTitleRow}>
                      <span className={styles.taskTitle}>{task.title}</span>
                      <span className={`${styles.priorityPill} ${styles[`pill_${task.priority}`]}`}>
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className={styles.taskDesc}>{task.description}</p>
                    )}

                    <div className={styles.taskMeta}>
                      <span className={styles.metaItem}>
                        <Calendar size={12} /> {new Date(task.created_at).toLocaleDateString()}
                      </span>
                      {task.source_email_id && (
                        <Link
                          href={`/inbox?id=${task.source_email_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={styles.emailSourceLink}
                        >
                          <Mail size={12} /> View Source Email
                        </Link>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                    className={styles.deleteBtn}
                    title="Delete task"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
