"use client";

import React from "react";
import { Users, FileText, MessageSquare, Database } from "lucide-react";
import styles from "./admin.module.css";

export default function AdminDashboard() {
  // In a real app, fetch these stats from the backend
  const stats = [
    { name: "Total Users", value: "245", icon: Users },
    { name: "Indexed Documents", value: "1,204", icon: FileText },
    { name: "Chat Interactions", value: "8,432", icon: MessageSquare },
    { name: "Departments", value: "12", icon: Database },
  ];

  return (
    <div>
      <div className={styles.grid}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="glass-card">
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{stat.name}</h3>
                <div className={styles.cardIcon}>
                  <Icon size={24} />
                </div>
              </div>
              <p className={styles.cardValue}>{stat.value}</p>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 glass-card" style={{marginTop: '32px'}}>
        <h3 className={styles.cardTitle} style={{marginBottom: '16px'}}>Recent Activity</h3>
        <p style={{color: 'var(--text-secondary)'}}>Activity feed will go here...</p>
      </div>
    </div>
  );
}
