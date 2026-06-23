"use client";

import { Habit } from "@/hooks/useHabits";
import { Flame, CheckCircle2, Circle, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import styles from "./HabitCard.module.css";

interface HabitCardProps {
  habit: Habit;
  onToggle: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
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

export default function HabitCard({ habit, onToggle, onEdit, onDelete }: HabitCardProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const isCompletedToday = habit.completedDates?.includes(today);
  const categoryColor = CATEGORY_COLORS[habit.category] || "#9090b0";

  return (
    <div className={`${styles.card} ${isCompletedToday ? styles.completed : ""} fade-in`}>
      <div className={styles.colorBar} style={{ background: categoryColor }} />

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
            <span className={styles.badge} style={{ color: categoryColor, background: `${categoryColor}18`, border: `1px solid ${categoryColor}30` }}>
              {habit.category}
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

            <button
              onClick={() => onToggle(habit)}
              className={`${styles.checkBtn} ${isCompletedToday ? styles.checkDone : ""}`}
              title={isCompletedToday ? "Mark incomplete" : "Mark complete"}
            >
              {isCompletedToday ? (
                <><CheckCircle2 size={18} /> Done</>
              ) : (
                <><Circle size={18} /> Mark done</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
