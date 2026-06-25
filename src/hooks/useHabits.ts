"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type FrequencyType = "daily" | "weekdays" | "weekends" | "3x-week" | "2x-week" | "custom";

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: FrequencyType;
  frequencyDays: string[]; // e.g. ["Mon","Wed","Fri"]
  color: string;
  icon: string;
  createdAtMs: number;
  userId: string;
  streak: number;
  longestStreak: number;
  completedDates: string[];
  // New fields
  isNegative?: boolean;           // If true, this is a "break the habit" tracker
  skipReasons?: Record<string, string>; // date → skip reason
  recoveryMode?: boolean;         // Streak broken, recovery challenge active
  recoveryDays?: string[];        // Days completed during recovery
  previousStreak?: number;        // Streak before it broke (for recovery goal display)
}

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocal, setIsLocal] = useState(false);

  const getLSKey = useCallback(() => {
    return user ? `habitflow_habits_v2_${user.uid}` : "habitflow_habits_v2_guest";
  }, [user]);

  const loadFromLS = useCallback(() => {
    try {
      const key = getLSKey();
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const data: Habit[] = JSON.parse(raw);
      return data.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
    } catch {
      return [];
    }
  }, [getLSKey]);

  const saveToLS = useCallback((data: Habit[]) => {
    try {
      const key = getLSKey();
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save habits to local storage:", err);
    }
  }, [getLSKey]);

  // Returns the Firestore path: users/{uid}/habits
  const habitsCol = useCallback(() => {
    if (!user) return null;
    return collection(db, "users", user.uid, "habits");
  }, [user]);

  useEffect(() => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe = () => {};

    try {
      const col = habitsCol();
      if (!col) return;

      unsubscribe = onSnapshot(
        col,
        (snapshot) => {
          const habitsData = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Habit[];

          habitsData.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
          setHabits(habitsData);
          setIsLocal(false);
          setLoading(false);
          saveToLS(habitsData);
        },
        (error) => {
          console.warn("Firestore habits query failed, using localStorage fallback:", error.message);
          const cached = loadFromLS();
          setHabits(cached);
          setIsLocal(true);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn("Firestore query setup failed, using localStorage fallback:", err);
      const cached = loadFromLS();
      setHabits(cached);
      setIsLocal(true);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [user, loadFromLS, saveToLS, habitsCol]);

  const addHabit = useCallback(
    async (habitData: Omit<Habit, "id" | "userId" | "createdAtMs" | "streak" | "longestStreak" | "completedDates">) => {
      if (!user) return;
      const newHabit: Habit = {
        ...habitData,
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        userId: user.uid,
        createdAtMs: Date.now(),
        streak: 0,
        longestStreak: 0,
        completedDates: [],
        skipReasons: {},
        isNegative: habitData.isNegative || false,
        recoveryMode: false,
        recoveryDays: [],
      };

      if (isLocal) {
        setHabits((prev) => {
          const updated = [newHabit, ...prev];
          saveToLS(updated);
          return updated;
        });
      } else {
        try {
          const col = habitsCol();
          if (!col) return;
          const { id, ...firebaseData } = newHabit;
          await addDoc(col, firebaseData);
        } catch (err) {
          console.warn("Firestore add failed, writing locally:", err);
          setHabits((prev) => {
            const updated = [newHabit, ...prev];
            saveToLS(updated);
            return updated;
          });
          setIsLocal(true);
        }
      }
    },
    [user, isLocal, saveToLS, habitsCol]
  );

  const updateHabit = useCallback(async (id: string, data: Partial<Habit>) => {
    if (!user) return;

    if (isLocal) {
      setHabits((prev) => {
        const updated = prev.map((h) => (h.id === id ? { ...h, ...data } : h));
        saveToLS(updated);
        return updated;
      });
    } else {
      try {
        const habitDoc = doc(db, "users", user.uid, "habits", id);
        await updateDoc(habitDoc, data);
      } catch (err) {
        console.warn("Firestore update failed, updating locally:", err);
        setHabits((prev) => {
          const updated = prev.map((h) => (h.id === id ? { ...h, ...data } : h));
          saveToLS(updated);
          return updated;
        });
        setIsLocal(true);
      }
    }
  }, [user, isLocal, saveToLS]);

  const deleteHabit = useCallback(async (id: string) => {
    if (!user) return;

    if (isLocal) {
      setHabits((prev) => {
        const updated = prev.filter((h) => h.id !== id);
        saveToLS(updated);
        return updated;
      });
    } else {
      try {
        await deleteDoc(doc(db, "users", user.uid, "habits", id));
      } catch (err) {
        console.warn("Firestore delete failed, deleting locally:", err);
        setHabits((prev) => {
          const updated = prev.filter((h) => h.id !== id);
          saveToLS(updated);
          return updated;
        });
        setIsLocal(true);
      }
    }
  }, [user, isLocal, saveToLS]);

  // Reset ALL habits + XP data for fresh start
  const resetAllHabits = useCallback(async () => {
    if (!user) return;

    if (isLocal) {
      setHabits([]);
      saveToLS([]);
    } else {
      try {
        const col = habitsCol();
        if (!col) return;
        const snapshot = await getDocs(col);
        const batch = writeBatch(db);
        snapshot.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        // Also clear LS cache
        saveToLS([]);
      } catch (err) {
        console.warn("Firestore batch delete failed:", err);
        setHabits([]);
        saveToLS([]);
        setIsLocal(true);
      }
    }
  }, [user, isLocal, habitsCol, saveToLS]);

  // Log a skip reason for a specific habit + date
  const logSkipReason = useCallback(async (habitId: string, date: string, reason: string) => {
    if (!user) return;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const updatedReasons = { ...(habit.skipReasons || {}), [date]: reason };
    await updateHabit(habitId, { skipReasons: updatedReasons });
  }, [user, habits, updateHabit]);

  const toggleCompletion = useCallback(async (habit: Habit, addXP?: (amount?: number) => Promise<boolean | undefined>) => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const completedDates = [...(habit.completedDates || [])];
    const isCompleted = completedDates.includes(today);
    const newDates = isCompleted
      ? completedDates.filter((d) => d !== today)
      : [...completedDates, today];
    const newStreak = calculateStreak(newDates);

    // Recovery Mode logic: 3 consecutive days = restore old streak
    let recoveryMode = habit.recoveryMode || false;
    let recoveryDays = [...(habit.recoveryDays || [])];
    let previousStreak = habit.previousStreak || 0;

    if (!isCompleted && recoveryMode) {
      // Add today to recovery days
      if (!recoveryDays.includes(today)) recoveryDays.push(today);
      // Check if 3 consecutive recovery days achieved
      if (recoveryDays.length >= 3) {
        const sorted = [...recoveryDays].sort();
        const last3 = sorted.slice(-3);
        const isConsecutive = last3.every((d, i) => {
          if (i === 0) return true;
          const prev = new Date(last3[i - 1]);
          const curr = new Date(d);
          return (curr.getTime() - prev.getTime()) === 86400000;
        });
        if (isConsecutive) {
          recoveryMode = false;
          recoveryDays = [];
          previousStreak = 0;
        }
      }
    }

    // Detect streak break: streak was positive yesterday, now 0
    const wasStreakActive = (habit.streak || 0) > 3;
    const streakBroke = isCompleted === false && wasStreakActive && newStreak === 0;

    if (streakBroke && !recoveryMode) {
      recoveryMode = true;
      recoveryDays = [];
      previousStreak = habit.streak || 0;
    }

    const streakData = {
      completedDates: newDates,
      streak: newStreak,
      longestStreak: Math.max(habit.longestStreak || 0, newStreak),
      recoveryMode,
      recoveryDays,
      previousStreak,
    };

    if (isLocal) {
      setHabits((prev) => {
        const updated = prev.map((h) => (h.id === habit.id ? { ...h, ...streakData } : h));
        saveToLS(updated);
        return updated;
      });
    } else {
      try {
        await updateDoc(doc(db, "users", user.uid, "habits", habit.id), streakData);
      } catch (err) {
        console.warn("Firestore toggleCompletion failed, toggling locally:", err);
        setHabits((prev) => {
          const updated = prev.map((h) => (h.id === habit.id ? { ...h, ...streakData } : h));
          saveToLS(updated);
          return updated;
        });
        setIsLocal(true);
      }
    }

    // Award XP if completed
    if (!isCompleted && addXP) {
      await addXP();
    }
  }, [user, isLocal, saveToLS]);

  return { habits, loading, addHabit, updateHabit, deleteHabit, toggleCompletion, resetAllHabits, logSkipReason, isLocal };
}

function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...dates].sort((a, b) => b.localeCompare(a));
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  let streak = 0;
  let current = sorted[0] === today ? new Date() : subDays(new Date(), 1);
  for (const date of sorted) {
    if (date === format(current, "yyyy-MM-dd")) {
      streak++;
      current = subDays(current, 1);
    } else break;
  }
  return streak;
}
