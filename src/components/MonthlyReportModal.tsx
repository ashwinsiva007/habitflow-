"use client";

import { useEffect, useState, useMemo } from "react";
import { format, getDaysInMonth, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Habit } from "@/hooks/useHabits";
import { X, Trophy, Flame, TrendingUp, Star, CheckCircle2, AlertCircle } from "lucide-react";
import styles from "./MonthlyReportModal.module.css";
import { useBackHandler } from "@/hooks/useBackHandler";

interface MonthlyReportModalProps {
  habits: Habit[];
  userName: string;
}

const LS_KEY = "habitflow_last_monthly_report";

function getAchievementBadge(successRate: number, totalCompletions: number, bestStreak: number) {
  if (successRate >= 90) return { emoji: "🏆", title: "Iron Will", desc: "90%+ completion rate — you're unstoppable!" };
  if (successRate >= 75) return { emoji: "🌟", title: "Consistency King", desc: "Strong discipline all month long!" };
  if (successRate >= 60) return { emoji: "🔥", title: "Habit Builder", desc: "Good momentum — keep pushing!" };
  if (bestStreak >= 14)  return { emoji: "⚡", title: "Streak Legend", desc: `${bestStreak}-day streak this month!` };
  if (totalCompletions >= 30) return { emoji: "💎", title: "Diamond Effort", desc: "Over 30 habit completions — impressive!" };
  return { emoji: "🌱", title: "Fresh Start", desc: "Every journey starts with a single step. Keep going!" };
}

function getTopSkipReason(habits: Habit[], monthStr: string): string | null {
  const reasonCounts: Record<string, number> = {};
  habits.forEach((h) => {
    Object.entries(h.skipReasons || {}).forEach(([date, reason]) => {
      if (date.startsWith(monthStr)) {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      }
    });
  });
  const entries = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  return `${entries[0][0]} (${entries[0][1]} time${entries[0][1] > 1 ? "s" : ""})`;
}

export default function MonthlyReportModal({ habits, userName }: MonthlyReportModalProps) {
  const [visible, setVisible] = useState(false);

  const now = new Date();
  const dayOfMonth = now.getDate();
  const monthStr = format(now, "yyyy-MM"); // e.g. "2026-06"
  const reportMonthLabel = format(now, "MMMM yyyy");

  // Show if: it's day 28+ of month AND we haven't shown for this month yet
  useEffect(() => {
    if (dayOfMonth < 28) return;
    const last = localStorage.getItem(LS_KEY);
    if (last === monthStr) return;
    // Only show if user has habits
    if (habits.length === 0) return;
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [dayOfMonth, monthStr, habits.length]);

  const handleClose = () => {
    localStorage.setItem(LS_KEY, monthStr);
    setVisible(false);
  };

  // Intercept hardware back-button when modal is showing
  useBackHandler(() => {
    if (visible) handleClose();
  });

  // Compute stats for the current month
  const stats = useMemo(() => {
    const daysInMonth = getDaysInMonth(now);
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const daysRange = eachDayOfInterval({ start, end: new Date() }); // up to today

    let totalCompletions = 0;
    let bestStreak = 0;
    let bestHabitName = "";
    let bestHabitIcon = "⭐";
    let bestHabitCount = 0;

    habits.forEach((h) => {
      const monthCompletions = (h.completedDates || []).filter((d) => d.startsWith(monthStr));
      totalCompletions += monthCompletions.length;
      if (monthCompletions.length > bestHabitCount) {
        bestHabitCount = monthCompletions.length;
        bestHabitName = h.name;
        bestHabitIcon = h.icon;
      }
      bestStreak = Math.max(bestStreak, h.longestStreak || 0);
    });

    const possibleCompletions = habits.length * daysRange.length;
    const successRate = possibleCompletions > 0
      ? Math.round((totalCompletions / possibleCompletions) * 100)
      : 0;

    const topSkipReason = getTopSkipReason(habits, monthStr);
    const badge = getAchievementBadge(successRate, totalCompletions, bestStreak);

    return { totalCompletions, bestStreak, bestHabitName, bestHabitIcon, bestHabitCount, successRate, topSkipReason, badge, daysRange: daysRange.length };
  }, [habits, monthStr]);

  // Fix: declare bestHabitIcon outside useMemo
  // (Removed — now returned from useMemo above)

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Confetti header */}
        <div className={styles.topBanner}>
          <div className={styles.confettiRow}>
            {"🎉🌟✨🏆🎊".split("").map((e, i) => (
              <span key={i} className={styles.confetti} style={{ animationDelay: `${i * 0.1}s` }}>{e}</span>
            ))}
          </div>
          <button className={styles.closeBtn} onClick={handleClose}><X size={18} /></button>
        </div>

        <div className={styles.body}>
          {/* Title */}
          <div className={styles.titleSection}>
            <p className={styles.monthLabel}>{reportMonthLabel}</p>
            <h2 className={styles.title}>Monthly Report 📋</h2>
            <p className={styles.greeting}>
              Great work, <strong>{userName.split(" ")[0]}</strong>! Here's how you did this month.
            </p>
          </div>

          {/* Achievement Badge */}
          <div className={styles.badgeCard}>
            <span className={styles.badgeEmoji}>{stats.badge.emoji}</span>
            <div>
              <p className={styles.badgeTitle}>{stats.badge.title}</p>
              <p className={styles.badgeDesc}>{stats.badge.desc}</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <CheckCircle2 size={20} color="#22d3a0" />
              <p className={styles.statValue}>{stats.totalCompletions}</p>
              <p className={styles.statLabel}>Habits Completed</p>
            </div>
            <div className={styles.statItem}>
              <TrendingUp size={20} color="#7c6aff" />
              <p className={styles.statValue}>{stats.successRate}%</p>
              <p className={styles.statLabel}>Success Rate</p>
            </div>
            <div className={styles.statItem}>
              <Flame size={20} color="#f97316" />
              <p className={styles.statValue}>{stats.bestStreak}d</p>
              <p className={styles.statLabel}>Best Streak</p>
            </div>
            <div className={styles.statItem}>
              <Star size={20} color="#fbbf24" />
              <p className={styles.statValue}>{stats.bestHabitCount}</p>
              <p className={styles.statLabel}>Best Habit Days</p>
            </div>
          </div>

          {/* Best habit */}
          {stats.bestHabitName && (
            <div className={styles.bestHabit}>
              <span className={styles.bestHabitIcon}>{stats.bestHabitIcon}</span>
              <div>
                <p className={styles.bestHabitLabel}>🌟 Best Habit This Month</p>
                <p className={styles.bestHabitName}>{stats.bestHabitName}</p>
                <p className={styles.bestHabitSub}>{stats.bestHabitCount} completions this month</p>
              </div>
            </div>
          )}

          {/* Skip reason insight */}
          {stats.topSkipReason && (
            <div className={styles.insightCard}>
              <AlertCircle size={16} color="#f59e0b" />
              <div>
                <p className={styles.insightTitle}>💡 Skip Insight</p>
                <p className={styles.insightText}>
                  You skipped most often because: <strong>{stats.topSkipReason}</strong>.
                  Work on this to unlock your full potential! 💪
                </p>
              </div>
            </div>
          )}

          {/* Next month motivation */}
          <p className={styles.motivation}>
            A new month is a fresh start. Set your goals, stay consistent, and smash your records! 🚀
          </p>

          <button className={styles.closeMainBtn} onClick={handleClose}>
            <Trophy size={16} />
            Awesome, let's crush next month!
          </button>
        </div>
      </div>
    </div>
  );
}
