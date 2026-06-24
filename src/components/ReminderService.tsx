"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useReminders } from "@/hooks/useReminders";
import { useNotes } from "@/hooks/useNotes";

export default function ReminderService() {
  const { user } = useAuth();
  const { reminders, updateReminder } = useReminders();
  const { notes, updateNote } = useNotes();

  useEffect(() => {
    if (!user) return;

    const checkReminders = () => {
      const now = new Date();
      const hasNotificationSupport = typeof window !== "undefined" && typeof Notification !== "undefined";

      // Check dedicated reminders
      reminders.forEach((rem) => {
        if (!rem.notified) {
          const remDate = new Date(rem.time);
          if (remDate <= now) {
            if (hasNotificationSupport && Notification.permission === "granted") {
              try {
                new Notification(rem.title || "HabitFlow Reminder", {
                  body: rem.description || "You have a reminder scheduled for now.",
                  icon: "/favicon.ico",
                });
              } catch (e) {
                console.warn("Failed to trigger web notification:", e);
              }
            }
            updateReminder(rem.id, { notified: true });
          }
        }
      });

      // Check legacy note reminders
      notes.forEach((note) => {
        if (note.reminder && !note.notified) {
          const remDate = new Date(note.reminder);
          if (remDate <= now) {
            if (hasNotificationSupport && Notification.permission === "granted") {
              try {
                new Notification(note.title || "HabitFlow Note Reminder", {
                  body: note.content || "You have a note reminder scheduled for now.",
                  icon: "/favicon.ico",
                });
              } catch (e) {
                console.warn("Failed to trigger web notification:", e);
              }
            }
            updateNote(note.id, { notified: true });
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 10000); // Check every 10 seconds
    checkReminders(); // Check immediately on mount

    return () => clearInterval(interval);
  }, [user, reminders, notes, updateReminder, updateNote]);

  return null;
}
