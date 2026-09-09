import React from 'react';
import styles from './EmailDetail.module.css';

export const EmailDetail = () => {
  return (
    <div className={styles.container}>
      <div className={styles.emailContent}>
        <h1 className={styles.subject}>Website Redesign Proposal</h1>
        
        <div className={styles.meta}>
          <div>
            <div className={styles.sender}>Rahul Sharma (rahul@abctech.com)</div>
            <div>To: you@mailmind.com</div>
          </div>
          <div>Aug 10, 10:42 AM</div>
        </div>

        <div className={styles.body}>
          <p>Hi there,</p><br/>
          <p>Thanks for reaching out. We are looking to revamp our homepage to be more modern and mobile-responsive.</p><br/>
          <p>Can you prepare the website proposal and share it by Friday? Our budget is around $5,000.</p><br/>
          <p>Let me know if you need to schedule a call to discuss.</p><br/>
          <p>Best,<br/>Rahul</p>
        </div>
      </div>

      <div className={styles.aiPanel}>
        <h2 className={styles.panelTitle}>✨ AI Intelligence</h2>
        
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Classification</div>
          <div className={styles.badgeGroup}>
            <span className={styles.badge} style={{ backgroundColor: '#ff6b6b' }}>URGENT</span>
            <span className={styles.badge}>Client</span>
            <span className={styles.badge} style={{ backgroundColor: '#cc5de8' }}>Request</span>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Key Points</div>
          <ul style={{ paddingLeft: '20px', color: '#c1c2c5', lineHeight: '1.6' }}>
            <li>Wants modern, mobile-responsive homepage revamp</li>
            <li>Budget is $5,000</li>
            <li>Available for a call</li>
          </ul>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Action Items Detected</div>
          <div className={styles.actionItem}>
            <div className={styles.actionCheckbox}></div>
            <span>Send website proposal (Deadline: Friday)</span>
          </div>
          <button className={styles.btnSecondary} style={{ marginTop: '12px' }}>+ Create Task</button>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>AI Draft Reply (Professional)</div>
          <div className={styles.replyBox}>
            <p className={styles.replyText}>
              Hi Rahul,
              <br/><br/>
              Thanks for the details. I can absolutely help with the homepage revamp. 
              <br/><br/>
              I will prepare a detailed proposal that fits within the $5,000 budget and share it with you by this Friday. I&apos;ll let you know if I need a quick call before then.
              <br/><br/>
              Best regards,
            </p>
            <div className={styles.btnGroup}>
              <button className={`${styles.btn} ${styles.btnPrimary}`}>Send Reply</button>
              <button className={`${styles.btn} ${styles.btnSecondary}`}>Edit</button>
              <button className={`${styles.btn} ${styles.btnSecondary}`}>Regenerate</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
