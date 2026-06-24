"use client";

import { useState } from "react";
import { useReminders } from "@/hooks/useReminders";
import { format } from "date-fns";
import { Bell, Clock, Plus, Trash2, Check } from "lucide-react";
import styles from "./page.module.css";

export default function RemindersPage() {
  const { reminders, addReminder, deleteReminder } = useReminders();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) return;

    // Combine date and time into an ISO string
    const dateTimeString = new Date(`${date}T${time}`).toISOString();

    await addReminder({
      title,
      description,
      time: dateTimeString,
      color: "var(--accent)",
      icon: "Bell",
    });

    // Reset form
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
  };

  const now = new Date();

  return (
    <div className="page-wrapper">
      <main className="main-content slide-in">
        <div className={styles.container}>
          
          <div className={styles.header}>
            <h1 className={styles.title}>
              <Bell size={28} className="gradient-text" />
              Reminders
            </h1>
            <p className={styles.subtitle}>
              Schedule alerts and get notified right in your browser.
            </p>
          </div>

          <form onSubmit={handleAdd} className={`glass ${styles.formCard}`}>
            <h2 className={styles.formTitle}>
              <Plus size={20} className="text-accent" /> Create New Reminder
            </h2>
            
            <div className={styles.inputGroup}>
              <label className="label">Title</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Drink water, Read a book..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className="label">Description (Optional)</label>
              <input
                type="text"
                className="input"
                placeholder="Additional details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  min={format(now, "yyyy-MM-dd")}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label className="label">Time</label>
                <input
                  type="time"
                  className="input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
              Set Reminder
            </button>
          </form>

          <div>
            <h2 className={styles.listHeader}>Your Reminders</h2>
            
            {reminders.length === 0 ? (
              <div className="glass" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bell size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <p>No reminders set yet. Create one above!</p>
              </div>
            ) : (
              <div className={styles.remindersGrid}>
                {reminders.map((rem) => {
                  const remDate = new Date(rem.time);
                  const isPast = remDate <= now;

                  return (
                    <div 
                      key={rem.id} 
                      className={`glass ${styles.reminderCard} ${isPast ? styles.pastTime : ''}`}
                    >
                      {rem.notified && (
                        <div className={styles.notifiedBadge} title="Notified">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                      
                      <div className={styles.cardHeader}>
                        <div>
                          <h3 className={styles.cardTitle}>{rem.title}</h3>
                          {rem.description && <p className={styles.cardDesc}>{rem.description}</p>}
                        </div>
                        <button 
                          className={styles.deleteBtn}
                          onClick={() => deleteReminder(rem.id)}
                          title="Delete Reminder"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className={styles.timePill}>
                        <Clock size={14} />
                        {format(remDate, "MMM d, yyyy • h:mm a")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
