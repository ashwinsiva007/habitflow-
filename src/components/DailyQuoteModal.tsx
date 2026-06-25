"use client";

import { useState, useEffect } from "react";
import styles from "./DailyQuoteModal.module.css";

const QUOTES = [
  "Small steps every day lead to giant leaps over time.",
  "You don't rise to the level of your goals, you fall to the level of your systems.",
  "The secret of getting ahead is getting started.",
  "Discipline is choosing between what you want now and what you want most.",
  "Every master was once a disaster — keep going.",
  "Habits are the compound interest of self-improvement.",
  "The only bad workout is the one that didn't happen.",
  "Progress, not perfection, is the goal.",
  "Your future self is watching you right now through your memories.",
  "Motivation gets you started. Habit keeps you going.",
  "One percent better every day — 37× better by year's end.",
  "You are what you repeatedly do. Excellence is a habit, not an act.",
  "Begin today. Not tomorrow, not next week — today.",
  "Success is the sum of small efforts repeated day after day.",
  "The difference between who you are and who you want to be is what you do.",
  "Showing up consistently beats showing up perfectly occasionally.",
  "Your habits today are building the person you'll be tomorrow.",
  "Chase progress, not perfection.",
  "A year from now, you'll wish you had started today.",
  "Focus on the process and the results will follow.",
  "You don't need to be great to start, but you need to start to be great.",
  "Each day is a new chance to grow stronger than yesterday.",
  "The hardest part is starting. Everything after that is just keeping momentum.",
  "Make today count — it won't come back.",
  "Your only competition is who you were yesterday.",
  "Consistency is more powerful than intensity.",
  "Do something today your future self will thank you for.",
  "Winners are not people who never fail — they're people who never quit.",
  "The body achieves what the mind believes.",
  "Great things are built one small habit at a time.",
];

const QUOTE_KEY = "habitflow_quote_date";

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getDailyQuote(): string {
  const d = new Date();
  const dayOfYear = Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return QUOTES[dayOfYear % QUOTES.length];
}

export default function DailyQuoteModal() {
  const [visible, setVisible] = useState(false);
  const [quote, setQuote] = useState("");

  useEffect(() => {
    const today = getTodayString();
    const lastShown = localStorage.getItem(QUOTE_KEY);
    if (lastShown !== today) {
      setQuote(getDailyQuote());
      // Small delay so the page loads first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(QUOTE_KEY, getTodayString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Glow ring */}
        <div className={styles.glowRing} />

        {/* Icon */}
        <div className={styles.iconWrap}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="19" stroke="var(--accent)" strokeWidth="2" opacity="0.3"/>
            <path d="M20 5 A15 15 0 0 1 35 20" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M35 20 A15 15 0 1 1 20 5" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" opacity="0.35"/>
            <path d="M31 14 L35 20 L39 14" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13 20 L17.5 25 L27 15" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <p className={styles.greeting}>Good morning! ☀️</p>
        <blockquote className={styles.quote}>
          &ldquo;{quote}&rdquo;
        </blockquote>

        <button className={styles.closeBtn} onClick={handleClose} id="daily-quote-close">
          Let&apos;s crush today 🚀
        </button>
      </div>
    </div>
  );
}
