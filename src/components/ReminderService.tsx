"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Note } from "@/hooks/useNotes";

const LS_KEY = "habitflow_notes_v1";

export default function ReminderService() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Request notification permission if needed
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    let unsubscribe = () => {};
    let isLocalFallback = false;

    const checkLocalReminders = () => {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return;
        const notes: Note[] = JSON.parse(raw);
        let updated = false;
        const now = new Date();

        const updatedNotes = notes.map((note) => {
          if (note.reminder && !note.notified) {
            const remDate = new Date(note.reminder);
            if (remDate <= now) {
              if (Notification.permission === "granted") {
                new Notification(note.title || "HabitFlow Reminder", {
                  body: note.content || "You have a reminder scheduled for now.",
                  icon: "/favicon.ico",
                });
              }
              note.notified = true;
              updated = true;
            }
          }
          return note;
        });

        if (updated) {
          localStorage.setItem(LS_KEY, JSON.stringify(updatedNotes));
          window.dispatchEvent(new Event("notes_updated"));
        }
      } catch (err) {
        console.error("Local reminder check error:", err);
      }
    };

    let localInterval: NodeJS.Timeout;

    try {
      const q = query(
        collection(db, "notes"),
        where("userId", "==", user.uid)
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const now = new Date();
          snapshot.docs.forEach(async (d) => {
            const note = d.data();
            if (note.reminder && !note.notified) {
              const remDate = new Date(note.reminder);
              if (remDate <= now) {
                if (Notification.permission === "granted") {
                  new Notification(note.title || "HabitFlow Reminder", {
                    body: note.content || "You have a reminder scheduled for now.",
                    icon: "/favicon.ico",
                  });
                }
                try {
                  await updateDoc(doc(db, "notes", d.id), { notified: true });
                } catch (err) {
                  console.error("Failed to update notified status in Firestore:", err);
                }
              }
            }
          });
        },
        (error) => {
          console.warn("Firestore reminders listener failed (checking rules), falling back to local storage polling:", error.message);
          isLocalFallback = true;
          localInterval = setInterval(checkLocalReminders, 10000);
          checkLocalReminders();
        }
      );
    } catch (err) {
      console.warn("Firestore reminders query failed, falling back to local storage polling:", err);
      isLocalFallback = true;
      localInterval = setInterval(checkLocalReminders, 10000);
      checkLocalReminders();
    }

    return () => {
      unsubscribe();
      if (localInterval) clearInterval(localInterval);
    };
  }, [user]);

  return null;
}
