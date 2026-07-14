"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHabits, Habit } from "@/hooks/useHabits";
import { useProfile } from "@/hooks/useProfile";
import Navbar from "@/components/Navbar";
import HabitCard from "@/components/HabitCard";
import HabitForm from "@/components/HabitForm";
import SkipReasonModal from "@/components/SkipReasonModal";
import { Plus, Filter } from "lucide-react";
import { format } from "date-fns";
import styles from "./habits.module.css";


export default function HabitsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { habits, loading, addHabit, updateHabit, deleteHabit, toggleCompletion, logSkipReason } = useHabits();
  const { addXP } = useProfile();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [user, authLoading, router]);

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [filter, setFilter] = useState("All");
  const [skipHabit, setSkipHabit] = useState<Habit | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  // Dynamically build the category list from habits the user actually has
  const availableCategories = useMemo(() => {
    const cats = new Set(habits.map((h) => h.isNegative ? "Break habit" : h.category));
    return ["All", ...Array.from(cats).sort()];
  }, [habits]);

  // Auto-reset filter when it no longer exists in available categories
  useEffect(() => {
    if (filter !== "All" && !availableCategories.includes(filter)) {
      setFilter("All");
    }
  }, [availableCategories, filter]);

  const filtered = filter === "All"
    ? habits
    : filter === "Break habit"
      ? habits.filter((h) => h.isNegative)
      : habits.filter((h) => !h.isNegative && h.category === filter);

  const handleEditSave = async (data: Omit<Habit, "id" | "userId" | "createdAtMs" | "streak" | "longestStreak" | "completedDates">) => {
    if (editingHabit) await updateHabit(editingHabit.id, data);
    setEditingHabit(null);
  };

  const handleSkipSave = async (reason: string) => {
    if (skipHabit) {
      await logSkipReason(skipHabit.id, today, reason);
      setSkipHabit(null);
    }
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
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>My Habits</h1>
            <p className={styles.sub}>{habits.length} habit{habits.length !== 1 ? "s" : ""} being tracked</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> New Habit
          </button>
        </div>

        {/* Category filters */}
        <div className={styles.filters}>
          <Filter size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          {availableCategories.map((cat) => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${filter === cat ? styles.filterActive : ""}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Habits */}
        {loading ? (
          <div className={styles.loading}><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <span style={{ fontSize: 48 }}>🎯</span>
            <h3>{filter === "All" ? "No habits yet" : `No ${filter} habits`}</h3>
            <p>{filter === "All" ? "Add your first habit to get started!" : "Try a different category or add a new habit."}</p>
            {filter === "All" && (
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={16} /> Add your first habit
              </button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={(habit) => toggleCompletion(habit, addXP)}
                onEdit={setEditingHabit}
                onDelete={deleteHabit}
                onLogSkip={(h) => setSkipHabit(h)}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && <HabitForm title="New Habit" onSave={addHabit} onCancel={() => setShowForm(false)} />}
      {editingHabit && <HabitForm title="Edit Habit" initial={editingHabit} onSave={handleEditSave} onCancel={() => setEditingHabit(null)} />}
      {skipHabit && (
        <SkipReasonModal
          habitName={skipHabit.name}
          habitIcon={skipHabit.icon}
          date={today}
          onSave={handleSkipSave}
          onDismiss={() => setSkipHabit(null)}
        />
      )}
    </div>
  );
}
