"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHabits, Habit } from "@/hooks/useHabits";
import { useProfile, calculateProgress } from "@/hooks/useProfile";
import Navbar from "@/components/Navbar";
import HabitCard from "@/components/HabitCard";
import HabitForm from "@/components/HabitForm";
import { Flame, CheckCircle2, TrendingUp, Plus, Target, Trophy } from "lucide-react";
import { format } from "date-fns";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { habits, loading: habitsLoading, addHabit, updateHabit, deleteHabit, toggleCompletion } = useHabits();
  const { profile, addXP } = useProfile();

  const progress = calculateProgress(profile.xp);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [user, authLoading, router]);

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayDisplay = format(new Date(), "EEEE, MMMM d");

  const completedToday = habits.filter((h) => h.completedDates?.includes(today)).length;
  const totalHabits = habits.length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const totalStreaks = habits.reduce((sum, h) => sum + (h.streak || 0), 0);

  const handleEdit = (habit: Habit) => setEditingHabit(habit);
  const handleEditSave = async (data: Omit<Habit, "id" | "userId" | "createdAtMs" | "streak" | "longestStreak" | "completedDates">) => {
    if (editingHabit) await updateHabit(editingHabit.id, data);
    setEditingHabit(null);
  };

  if (authLoading || !user) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <p className={styles.dateLabel}>{todayDisplay}</p>
            <h1 className={styles.greeting}>
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
              <span className="gradient-text">{user?.displayName?.split(" ")[0] || "there"}</span> 👋
            </h1>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Add Habit
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {[
            { icon: <Target size={20} />, color: "#7c6aff", label: "Today's Progress", value: `${completedToday} / ${totalHabits}`, sub: `${completionRate}% complete` },
            { icon: <Flame size={20} />, color: "#f97316", label: "Total Streak Days", value: totalStreaks, sub: "across all habits" },
            { icon: <CheckCircle2 size={20} />, color: "#22d3a0", label: "Completed Today", value: completedToday, sub: `${totalHabits - completedToday} remaining` },
            { icon: <TrendingUp size={20} />, color: "#60a5fa", label: "Active Habits", value: totalHabits, sub: "being tracked" },
          ].map((s) => (
            <div key={s.label} className={`${styles.statCard} glass`}>
              <div className={styles.statIcon} style={{ color: s.color, background: `${s.color}18` }}>{s.icon}</div>
              <div>
                <p className={styles.statLabel}>{s.label}</p>
                <p className={styles.statValue}>{s.value}</p>
                <p className={styles.statSub}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Level and XP Progress */}
        <div className={styles.progressSection} style={{ marginTop: 24, padding: 24, background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div className={styles.progressHeader} style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={18} color="var(--accent)" />
              Level {progress.currentLevel}
            </span>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {Math.round(progress.xpIntoLevel)} / {Math.round(progress.xpRequiredForNext)} XP to next level
            </span>
          </div>
          <div className={styles.progressBar} style={{ height: 12, background: 'var(--bg-secondary)', borderRadius: 100, overflow: 'hidden' }}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progress.percentage}%`, background: 'linear-gradient(90deg, var(--accent), var(--success))', height: '100%', borderRadius: 100, transition: 'width 0.5s ease-out' }} 
            />
          </div>
        </div>

        {/* Progress bar */}
        {totalHabits > 0 && (
          <div className={styles.progressSection} style={{ marginTop: 24 }}>
            <div className={styles.progressHeader}>
              <span>Today&apos;s completion</span>
              <span>{completionRate}%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        )}

        {/* Habits list */}
        <div className={styles.habitsSection}>
          <h2 className={styles.sectionTitle}>Today&apos;s Habits</h2>
          {habitsLoading ? (
            <div className={styles.loadingHabits}><span className="spinner" /></div>
          ) : habits.length === 0 ? (
            <div className={styles.empty}>
              <span style={{ fontSize: 48 }}>🌱</span>
              <h3>No habits yet</h3>
              <p>Create your first habit to start building streaks!</p>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={16} /> Add your first habit
              </button>
            </div>
          ) : (
            <div className={styles.habitsList}>
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggle={(habit) => toggleCompletion(habit, addXP)}
                  onEdit={handleEdit}
                  onDelete={deleteHabit}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <HabitForm
          title="New Habit"
          onSave={addHabit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingHabit && (
        <HabitForm
          title="Edit Habit"
          initial={editingHabit}
          onSave={handleEditSave}
          onCancel={() => setEditingHabit(null)}
        />
      )}
    </div>
  );
}
