'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Plus, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { automationsAPI, AutomationRule } from '@/lib/api';
import styles from './AutomationBuilder.module.css';

export const AutomationBuilder = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Client');
  const [priority, setPriority] = useState('URGENT');
  const [actionType, setActionType] = useState('CREATE_TASK');
  const [taskTitle, setTaskTitle] = useState('Review high-priority email');
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchRules = async () => {
    try {
      const data = await automationsAPI.getAutomations();
      setRules(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [user]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const created = await automationsAPI.createAutomation({
        name: name.trim(),
        is_active: true,
        conditions: { category, priority },
        actions: { action_type: actionType, task_title: taskTitle }
      });
      setRules([created, ...rules]);
      setName('');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await automationsAPI.toggleAutomation(id);
      setRules(rules.map(r => r.id === id ? updated : r));
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await automationsAPI.deleteAutomation(id);
      setRules(rules.filter(r => r.id !== id));
    } catch {
      // ignore
    }
  };

  const applyTemplate = (templateName: string, cat: string, prio: string, act: string, task: string) => {
    setName(templateName);
    setCategory(cat);
    setPriority(prio);
    setActionType(act);
    setTaskTitle(task);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitles}>
          <h1>Workflow Automation Engine</h1>
          <p>Configure event-driven trigger rules to automatically process, flag, or convert incoming messages into tasks.</p>
        </div>
      </header>

      {/* Quick Starter Templates */}
      <div className={styles.templatesSection}>
        <span className={styles.sectionLabel}>Quick Automation Recipes:</span>
        <div className={styles.templatesGrid}>
          <button
            onClick={() => applyTemplate('Auto-task for Urgent Client Emails', 'Client', 'URGENT', 'CREATE_TASK', 'Respond to urgent client inquiry')}
            className={styles.templateCard}
          >
            <div className={styles.templateIcon}><Zap size={14} /></div>
            <div>
              <span className={styles.templateTitle}>Urgent Client Task</span>
              <span className={styles.templateDesc}>Category: Client + Urgent Priority → Create High Priority Task</span>
            </div>
          </button>

          <button
            onClick={() => applyTemplate('Track Technical Interviews', 'Interview', 'HIGH', 'CREATE_TASK', 'Prepare interview checklist')}
            className={styles.templateCard}
          >
            <div className={styles.templateIcon}><Zap size={14} /></div>
            <div>
              <span className={styles.templateTitle}>Interview Prep Reminder</span>
              <span className={styles.templateDesc}>Category: Interview → Generate prep checklist task</span>
            </div>
          </button>
        </div>
      </div>

      <div className={styles.mainLayout}>
        {/* Left: Rule Creator Form */}
        <form onSubmit={handleCreateRule} className={styles.builderCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Create New Automation Rule</span>
            {savedSuccess && (
              <span className={styles.successBadge}><Check size={12} /> Rule Saved!</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>Rule Identifier Name</label>
            <input
              type="text"
              placeholder="e.g. Convert Urgent Inquiries to Executive Tasks"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.textInput}
              required
            />
          </div>

          {/* WHEN Trigger */}
          <div className={styles.triggerBlock}>
            <div className={styles.blockBadge}>WHEN</div>
            <div className={styles.blockRow}>
              <span className={styles.rowLabel}>Email Category equals</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.select}>
                <option value="Client">Client</option>
                <option value="Interview">Interview</option>
                <option value="Project">Project</option>
                <option value="Notification">Notification</option>
                <option value="Personal">Personal</option>
              </select>
            </div>

            <div className={styles.connectorBadge}>AND</div>

            <div className={styles.blockRow}>
              <span className={styles.rowLabel}>Priority level is</span>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={styles.select}>
                <option value="URGENT">URGENT</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          {/* THEN Action */}
          <div className={styles.actionBlock}>
            <div className={styles.blockBadgeThen}>THEN</div>
            <div className={styles.blockRow}>
              <span className={styles.rowLabel}>Trigger Action</span>
              <select value={actionType} onChange={(e) => setActionType(e.target.value)} className={styles.select}>
                <option value="CREATE_TASK">Create Follow-up Task</option>
                <option value="MARK_STARRED">Mark as Starred</option>
                <option value="NOTIFY">Executive Notification</option>
              </select>
            </div>

            {actionType === 'CREATE_TASK' && (
              <div className={styles.blockRow}>
                <span className={styles.rowLabel}>Task Title</span>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className={styles.textInput}
                  placeholder="Task title to generate"
                />
              </div>
            )}
          </div>

          <button type="submit" className={styles.saveBtn}>
            <Plus size={16} />
            <span>Save Automation Rule</span>
          </button>
        </form>

        {/* Right: Active Rules List */}
        <div className={styles.rulesListPane}>
          <div className={styles.paneHeader}>
            <h3>Active Rules ({rules.length})</h3>
          </div>

          {loading ? (
            <div className={styles.emptyNotice}>Loading rules...</div>
          ) : rules.length === 0 ? (
            <div className={styles.emptyNotice}>
              <AlertCircle size={28} />
              <p>No active rules configured. Build a rule on the left or use a quick recipe above.</p>
            </div>
          ) : (
            <div className={styles.rulesList}>
              {rules.map((rule) => (
                <div key={rule.id} className={styles.ruleItem}>
                  <div className={styles.ruleInfo}>
                    <div className={styles.ruleNameRow}>
                      <span className={styles.ruleName}>{rule.name}</span>
                      <span className={`${styles.statusPill} ${rule.is_active ? styles.activePill : styles.inactivePill}`}>
                        {rule.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    <div className={styles.ruleLogicText}>
                      IF Category = <strong>{rule.conditions?.category || 'Any'}</strong> AND Priority = <strong>{rule.conditions?.priority || 'Any'}</strong> → Action: <strong>{rule.actions?.action_type || 'CREATE_TASK'}</strong>
                    </div>
                  </div>

                  <div className={styles.ruleActions}>
                    <button
                      onClick={() => handleToggle(rule.id)}
                      className={styles.toggleBtn}
                      title={rule.is_active ? 'Pause rule' : 'Activate rule'}
                    >
                      {rule.is_active ? (
                        <ToggleRight size={22} className={styles.toggleOn} />
                      ) : (
                        <ToggleLeft size={22} className={styles.toggleOff} />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(rule.id)}
                      className={styles.deleteBtn}
                      title="Delete rule"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
