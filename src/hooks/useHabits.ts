"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
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
}

const LS_KEY = "habitflow_habits_v2";

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocal, setIsLocal] = useState(false);

  const loadFromLS = useCallback(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const data: Habit[] = JSON.parse(raw);
      return data.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
    } catch {
      return [];
    }
  }, []);

  const saveToLS = useCallback((data: Habit[]) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save habits to local storage:", err);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe = () => {};

    try {
      const q = query(
        collection(db, "habits"),
        where("userId", "==", user.uid)
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const habitsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Habit[];

          habitsData.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
          setHabits(habitsData);
          setIsLocal(false);
          setLoading(false);
          saveToLS(habitsData);
        },
        (error) => {
          console.warn("Firestore habits query failed (probably rules), using localStorage fallback:", error.message);
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
  }, [user, loadFromLS, saveToLS]);

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
      };

      if (isLocal) {
        setHabits((prev) => {
          const updated = [newHabit, ...prev];
          saveToLS(updated);
          return updated;
        });
      } else {
        try {
          const { id, ...firebaseData } = newHabit;
          await addDoc(collection(db, "habits"), firebaseData);
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
    [user, isLocal, saveToLS]
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
        const habitDoc = doc(db, "habits", id);
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
        await deleteDoc(doc(db, "habits", id));
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

  const toggleCompletion = useCallback(async (habit: Habit, addXP?: (amount?: number) => Promise<boolean | undefined>) => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const completedDates = [...(habit.completedDates || [])];
    const isCompleted = completedDates.includes(today);
    const newDates = isCompleted
      ? completedDates.filter((d) => d !== today)
      : [...completedDates, today];
    const streak = calculateStreak(newDates);
    const streakData = {
      completedDates: newDates,
      streak,
      longestStreak: Math.max(habit.longestStreak || 0, streak),
    };

    if (isLocal) {
      setHabits((prev) => {
        const updated = prev.map((h) => (h.id === habit.id ? { ...h, ...streakData } : h));
        saveToLS(updated);
        return updated;
      });
    } else {
      try {
        await updateDoc(doc(db, "habits", habit.id), streakData);
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

  return { habits, loading, addHabit, updateHabit, deleteHabit, toggleCompletion, isLocal };
}

function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...dates].sort((a, b) => b.localeCompare(a));
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  let streak = 0;
  let current = sorted[0] === today ? new Date() : new Date(Date.now() - 86400000);
  for (const date of sorted) {
    if (date === format(current, "yyyy-MM-dd")) {
      streak++;
      current = new Date(current.getTime() - 86400000);
    } else break;
  }
  return streak;
}
