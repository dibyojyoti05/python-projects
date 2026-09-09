'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Inbox, 
  CheckSquare, 
  Sparkles, 
  Sliders, 
  LogOut, 
  RefreshCw, 
  User as UserIcon,
  Zap,
  Flame
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { emailsAPI, EmailStats } from '@/lib/api';
import styles from './Sidebar.module.css';

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, loginAsGuest, logout } = useAuth();
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await emailsAPI.getStats();
      setStats(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSeedOrSync = async () => {
    setSyncing(true);
    try {
      if (!user) {
        await loginAsGuest();
      } else {
        await emailsAPI.seedDemo();
      }
      await fetchStats();
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { 
      href: '/inbox', 
      label: 'Smart Inbox', 
      icon: Inbox,
      badge: stats?.unread ? stats.unread : undefined,
      urgentBadge: stats?.urgent ? stats.urgent : undefined
    },
    { href: '/tasks', label: 'Tasks & Actions', icon: CheckSquare },
    { href: '/assistant', label: 'AI Assistant', icon: Sparkles, accent: true },
    { href: '/automation', label: 'Automation Rules', icon: Sliders },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandHeader}>
        <div className={styles.logoBadge}>
          <Zap size={18} className={styles.zapIcon} />
        </div>
        <div>
          <span className={styles.logoText}>MAILMIND</span>
          <span className={styles.tagline}>AI Executive Agent</span>
        </div>
      </div>

      <div className={styles.syncContainer}>
        <button 
          onClick={handleSeedOrSync} 
          disabled={syncing}
          className={styles.syncBtn}
          title="Seed demo emails or sync mailbox"
        >
          <RefreshCw size={13} className={syncing ? styles.spinning : ''} />
          <span>{syncing ? 'Syncing...' : (user ? 'Quick Sync & Seed' : 'Explore Demo Mailbox')}</span>
        </button>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''} ${item.accent ? styles.accentItem : ''}`}
            >
              <div className={styles.navItemInner}>
                <Icon size={18} className={isActive ? styles.iconActive : styles.iconMuted} />
                <span>{item.label}</span>
              </div>
              <div className={styles.badgeGroup}>
                {item.urgentBadge && item.urgentBadge > 0 ? (
                  <span className={styles.urgentBadge} title={`${item.urgentBadge} urgent`}>
                    <Flame size={10} /> {item.urgentBadge}
                  </span>
                ) : null}
                {item.badge && item.badge > 0 ? (
                  <span className={styles.countBadge}>{item.badge}</span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className={styles.userFooter}>
        {user ? (
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              <UserIcon size={16} />
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.full_name || user.email.split('@')[0]}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
            <button onClick={logout} className={styles.logoutBtn} title="Sign Out">
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button onClick={loginAsGuest} className={styles.loginBtn}>
            <UserIcon size={14} />
            <span>Connect as Guest</span>
          </button>
        )}
      </div>
    </aside>
  );
};
