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
  notificationId?: number; // Store native notification ID for cancellation
}

const LS_KEY = "habitflow_reminders_v1";

const getLocalNotifications = async () => {
  if (typeof window !== "undefined" && (window as any).Capacitor) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      return LocalNotifications;
    } catch (e) {
      console.warn("Failed to load LocalNotifications plugin:", e);
    }
  }
  return null;
};

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

  // Synchronize reminders natively in the background on mobile
  useEffect(() => {
    const syncNativeNotifications = async () => {
      const isCap = typeof window !== "undefined" && (window as any).Capacitor;
      if (!isCap || reminders.length === 0) return;

      const LocalNotifications = await getLocalNotifications();
      if (!LocalNotifications) return;

      try {
        const pending = await LocalNotifications.getPending();
        const pendingIds = new Set(pending.notifications.map((n) => n.id));

        const nowMs = Date.now();
        const toSchedule = [];

        for (const rem of reminders) {
          if (!rem.notified && rem.notificationId !== undefined) {
            const remTime = new Date(rem.time).getTime();
            if (remTime > nowMs && !pendingIds.has(rem.notificationId)) {
              toSchedule.push({
                id: rem.notificationId,
                title: rem.title,
                body: rem.description || "You have a reminder scheduled for now.",
                schedule: { at: new Date(rem.time) },
                iconColor: "#7c6aff",
              });
            }
          }
        }

        if (toSchedule.length > 0) {
          await LocalNotifications.schedule({ notifications: toSchedule });
          console.log(`Synced ${toSchedule.length} reminders natively`);
        }
      } catch (e) {
        console.warn("Native notification sync failed:", e);
      }
    };

    syncNativeNotifications();
  }, [reminders]);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined") return;

    if ((window as any).Capacitor) {
      const LocalNotifications = await getLocalNotifications();
      if (LocalNotifications) {
        try {
          const check = await LocalNotifications.checkPermissions();
          if (check.display !== "granted") {
            await LocalNotifications.requestPermissions();
          }
        } catch (e) {
          console.warn("Capacitor requestPermissions failed:", e);
        }
      }
    } else if ("Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
  }, []);

  const addReminder = useCallback(async (data: Omit<Reminder, "id" | "createdAtMs" | "userId" | "notified">) => {
    if (!user) return;
    await requestPermission();

    let notificationId: number | undefined = undefined;
    const isCap = typeof window !== "undefined" && (window as any).Capacitor;

    if (isCap) {
      notificationId = Math.floor(Math.random() * 2147483647);
      const LocalNotifications = await getLocalNotifications();
      if (LocalNotifications) {
        try {
          const remDate = new Date(data.time);
          if (remDate > new Date()) {
            await LocalNotifications.schedule({
              notifications: [
                {
                  id: notificationId,
                  title: data.title,
                  body: data.description || "You have a reminder scheduled for now.",
                  schedule: { at: remDate },
                  iconColor: "#7c6aff",
                }
              ]
            });
          }
        } catch (e) {
          console.warn("Capacitor local notification schedule failed:", e);
        }
      }
    }

    const newReminder: Reminder = {
      ...data,
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      userId: user.uid,
      createdAtMs: Date.now(),
      notified: false,
      ...(notificationId !== undefined ? { notificationId } : {}),
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
  }, [user, isLocal, saveToLS, requestPermission]);

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

    const targetRem = reminders.find((r) => r.id === id);
    const isCap = typeof window !== "undefined" && (window as any).Capacitor;

    if (isCap && targetRem && targetRem.notificationId !== undefined) {
      const LocalNotifications = await getLocalNotifications();
      if (LocalNotifications) {
        try {
          await LocalNotifications.cancel({
            notifications: [{ id: targetRem.notificationId }],
          });
        } catch (e) {
          console.warn("Capacitor local notification cancellation failed:", e);
        }
      }
    }

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
  }, [user, isLocal, saveToLS, reminders]);

  return { reminders, loading, addReminder, updateReminder, deleteReminder, isLocal, requestPermission };
}
