"use client";

import { Habit } from "@/hooks/useHabits";
import { Flame, CheckCircle2, Circle, Trash2, Pencil, XCircle, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import styles from "./HabitCard.module.css";

interface HabitCardProps {
  habit: Habit;
  onToggle: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onLogSkip?: (habit: Habit) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Health: "#22d3a0", Fitness: "#f97316", Mindfulness: "#a78bfa",
  Work: "#60a5fa", Learning: "#fbbf24", Social: "#f472b6", Other: "#9090b0",
};

const FREQ_LABELS: Record<string, string> = {
  daily: "Daily", weekdays: "Weekdays", weekends: "Weekends",
  "3x-week": "3× / week", "2x-week": "2× / week", custom: "Custom",
};

function freqDisplay(habit: Habit): string {
  const base = FREQ_LABELS[habit.frequency] || habit.frequency;
  if (["3x-week","2x-week","custom"].includes(habit.frequency) && habit.frequencyDays?.length) {
    return `${base} · ${habit.frequencyDays.join(" ")}`;
  }
  return base;
}

export default function HabitCard({ habit, onToggle, onEdit, onDelete, onLogSkip }: HabitCardProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const isCompletedToday = habit.completedDates?.includes(today);
  const categoryColor = habit.isNegative ? "#ef4444" : (CATEGORY_COLORS[habit.category] || "#9090b0");
  const hasSkipToday = habit.skipReasons?.[today];

  // Recovery mode progress
  const recoveryProgress = habit.recoveryMode
    ? (habit.recoveryDays?.length || 0)
    : 0;

  return (
    <div className={`${styles.card} ${isCompletedToday ? styles.completed : ""} ${habit.isNegative ? styles.negative : ""} fade-in`}>
      <div className={styles.colorBar} style={{ background: categoryColor }} />

      {/* Recovery Mode Banner */}
      {habit.recoveryMode && !isCompletedToday && (
        <div className={styles.recoveryBanner}>
          <RotateCcw size={13} />
          <span>
            🔄 Recovery Mode — {recoveryProgress}/3 days to restore your {habit.previousStreak}-day streak!
          </span>
        </div>
      )}

      {/* Negative Habit Banner */}
      {habit.isNegative && (
        <div className={styles.negativeBanner}>
          <XCircle size={13} />
          <span>Break habit</span>
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.top}>
          <div className={styles.info}>
            <span className={styles.icon}>{habit.icon}</span>
            <div>
              <h3 className={styles.name}>{habit.name}</h3>
              {habit.description && (
                <p className={styles.desc}>{habit.description}</p>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button onClick={() => onEdit(habit)} className={styles.actionBtn} title="Edit">
              <Pencil size={14} />
            </button>
            <button onClick={() => onDelete(habit.id)} className={`${styles.actionBtn} ${styles.danger}`} title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className={styles.bottom}>
          <div className={styles.meta}>
            <span
              className={styles.badge}
              style={
                habit.isNegative
                  ? { color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }
                  : { color: categoryColor, background: `${categoryColor}18`, border: `1px solid ${categoryColor}30` }
              }
            >
              {habit.isNegative ? "⛔ Break habit" : habit.category}
            </span>
            <span className={styles.frequency}>{freqDisplay(habit)}</span>
          </div>

          <div className={styles.stats}>
            <div className={styles.streak}>
              <Flame size={15} className={habit.streak > 0 ? "streak-active" : styles.streakInactive} />
              <span className={habit.streak > 0 ? styles.streakCount : styles.streakZero}>
                {habit.streak} day{habit.streak !== 1 ? "s" : ""}
              </span>
            </div>

            <div className={styles.btnGroup}>
              {/* Skip reason button — only for positive habits, only if not completed */}
              {!habit.isNegative && !isCompletedToday && onLogSkip && (
                <button
                  onClick={() => onLogSkip(habit)}
                  className={`${styles.skipBtn} ${hasSkipToday ? styles.skipBtnActive : ""}`}
                  title={hasSkipToday ? `Skipped: ${hasSkipToday}` : "Log skip reason"}
                >
                  {hasSkipToday ? "📝 Skipped" : "Skip?"}
                </button>
              )}

              <button
                onClick={() => onToggle(habit)}
                className={`${styles.checkBtn} ${isCompletedToday ? styles.checkDone : ""} ${habit.isNegative ? styles.negativeCheck : ""}`}
                title={
                  habit.isNegative
                    ? (isCompletedToday ? "Mark as done (I did it)" : "I avoided it today ✓")
                    : (isCompletedToday ? "Mark incomplete" : "Mark complete")
                }
              >
                {isCompletedToday ? (
                  <><CheckCircle2 size={18} />{habit.isNegative ? "Avoided ✓" : "Done"}</>
                ) : (
                  <><Circle size={18} />{habit.isNegative ? "Avoided" : "Mark done"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
