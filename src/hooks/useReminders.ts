"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
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

export interface Reminder {
  id: string;
  title: string;
  description: string;
  time: string; // ISO string representing the exact date and time
  createdAtMs: number;
  userId: string;
  notified: boolean;
  color: string;
  icon: string;
}

const LS_KEY = "habitflow_reminders_v1";

export function useReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocal, setIsLocal] = useState(false);

  const loadFromLS = useCallback(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const saveToLS = useCallback((data: Reminder[]) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {}
  }, []);

  const sortReminders = (data: Reminder[]) => {
    return [...data].sort((a, b) => {
      // Sort upcoming first, then by time
      const timeA = new Date(a.time).getTime();
      const timeB = new Date(b.time).getTime();
      return timeA - timeB;
    });
  };

  useEffect(() => {
    if (!user) {
      setReminders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe = () => {};

    try {
      const q = query(
        collection(db, "reminders"),
        where("userId", "==", user.uid)
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Reminder[];

          const sorted = sortReminders(data);
          setReminders(sorted);
          setIsLocal(false);
          setLoading(false);
          saveToLS(sorted);
        },
        (error) => {
          console.warn("Firestore reminders query failed, using localStorage:", error.message);
          const cached = loadFromLS();
          setReminders(sortReminders(cached));
          setIsLocal(true);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn("Firestore query setup failed, using localStorage:", err);
      const cached = loadFromLS();
      setReminders(sortReminders(cached));
      setIsLocal(true);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [user, loadFromLS, saveToLS]);

  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
  };

  const addReminder = useCallback(async (data: Omit<Reminder, "id" | "createdAtMs" | "userId" | "notified">) => {
    if (!user) return;
    await requestPermission();

    const newReminder: Reminder = {
      ...data,
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      userId: user.uid,
      createdAtMs: Date.now(),
      notified: false,
    };

    if (isLocal) {
      setReminders((prev) => {
        const updated = sortReminders([...prev, newReminder]);
        saveToLS(updated);
        return updated;
      });
    } else {
      try {
        const { id, ...firebaseData } = newReminder;
        await addDoc(collection(db, "reminders"), firebaseData);
      } catch (err) {
        console.warn("Firestore add failed, writing locally:", err);
        setReminders((prev) => {
          const updated = sortReminders([...prev, newReminder]);
          saveToLS(updated);
          return updated;
        });
        setIsLocal(true);
      }
    }
  }, [user, isLocal, saveToLS]);

  const updateReminder = useCallback(async (id: string, data: Partial<Reminder>) => {
    if (!user) return;

    if (isLocal) {
      setReminders((prev) => {
        const updated = prev.map((r) => (r.id === id ? { ...r, ...data } : r));
        const sorted = sortReminders(updated);
        saveToLS(sorted);
        return sorted;
      });
    } else {
      try {
        await updateDoc(doc(db, "reminders", id), data);
      } catch (err) {
        console.warn("Firestore update failed, updating locally:", err);
        setReminders((prev) => {
          const updated = prev.map((r) => (r.id === id ? { ...r, ...data } : r));
          const sorted = sortReminders(updated);
          saveToLS(sorted);
          return sorted;
        });
        setIsLocal(true);
      }
    }
  }, [user, isLocal, saveToLS]);

  const deleteReminder = useCallback(async (id: string) => {
    if (!user) return;

    if (isLocal) {
      setReminders((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        saveToLS(updated);
        return updated;
      });
    } else {
      try {
        await deleteDoc(doc(db, "reminders", id));
      } catch (err) {
        console.warn("Firestore delete failed, deleting locally:", err);
        setReminders((prev) => {
          const updated = prev.filter((r) => r.id !== id);
          saveToLS(updated);
          return updated;
        });
        setIsLocal(true);
      }
    }
  }, [user, isLocal, saveToLS]);

  return { reminders, loading, addReminder, updateReminder, deleteReminder, isLocal, requestPermission };
}
