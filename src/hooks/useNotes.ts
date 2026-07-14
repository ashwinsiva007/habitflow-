"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  reminder: string; // ISO date-time string or ""
  createdAtMs: number;
  userId: string;
  notified?: boolean;
}

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocal, setIsLocal] = useState(false);

  const getLSKey = useCallback(() => {
    return user ? `habitflow_notes_v1_${user.uid}` : "habitflow_notes_v1_guest";
  }, [user]);

  const loadFromLS = useCallback(() => {
    try {
      const key = getLSKey();
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [getLSKey]);

  const saveToLS = useCallback((data: Note[]) => {
    try {
      const key = getLSKey();
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }, [getLSKey]);

  const sortNotes = (data: Note[]) => {
    return [...data].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0);
    });
  };

  // Returns the Firestore path: users/{uid}/notes (subcollection — clean & per-user)
  const notesCol = useCallback(() => {
    if (!user) return null;
    return collection(db, "users", user.uid, "notes");
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe = () => {};

    try {
      const col = notesCol();
      if (!col) return;

      // No where() filter needed — the subcollection already belongs to this user
      unsubscribe = onSnapshot(
        col,
        (snapshot) => {
          const notesData = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Note[];

          const sorted = sortNotes(notesData);
          setNotes(sorted);
          setIsLocal(false);
          setLoading(false);
          saveToLS(sorted);
        },
        (error) => {
          console.warn("Firestore notes query failed, using localStorage fallback:", error.message);
          const cached = loadFromLS();
          setNotes(sortNotes(cached));
          setIsLocal(true);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn("Firestore query failed, using localStorage fallback:", err);
      const cached = loadFromLS();
      setNotes(sortNotes(cached));
      setIsLocal(true);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [user, loadFromLS, saveToLS, notesCol]);

  const addNote = useCallback(async (data: Omit<Note, "id" | "createdAtMs" | "userId">) => {
    if (!user) return;
    const newNote: Note = {
      ...data,
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      userId: user.uid,
      createdAtMs: Date.now(),
      pinned: data.pinned ?? false,
      notified: false,
    };

    if (isLocal) {
      setNotes((prev) => {
        const updated = sortNotes([newNote, ...prev]);
        saveToLS(updated);
        return updated;
      });
    } else {
      try {
        const col = notesCol();
        if (!col) return;
        const { id, ...firebaseData } = newNote;
        await addDoc(col, firebaseData);
      } catch (err) {
        console.warn("Firestore addNote failed, performing local write:", err);
        setNotes((prev) => {
          const updated = sortNotes([newNote, ...prev]);
          saveToLS(updated);
          return updated;
        });
        setIsLocal(true);
      }
    }
  }, [user, isLocal, saveToLS, notesCol]);

  const updateNote = useCallback(async (id: string, data: Partial<Note>) => {
    if (!user) return;

    if (isLocal) {
      setNotes((prev) => {
        const updated = prev.map((n) => (n.id === id ? { ...n, ...data } : n));
        const sorted = sortNotes(updated);
        saveToLS(sorted);
        return sorted;
      });
    } else {
      try {
        await updateDoc(doc(db, "users", user.uid, "notes", id), data);
      } catch (err) {
        console.warn("Firestore updateNote failed, performing local update:", err);
        setNotes((prev) => {
          const updated = prev.map((n) => (n.id === id ? { ...n, ...data } : n));
          const sorted = sortNotes(updated);
          saveToLS(sorted);
          return sorted;
        });
        setIsLocal(true);
      }
    }
  }, [user, isLocal, saveToLS]);

  const deleteNote = useCallback(async (id: string) => {
    if (!user) return;

    if (isLocal) {
      setNotes((prev) => {
        const updated = prev.filter((n) => n.id !== id);
        saveToLS(updated);
        return updated;
      });
    } else {
      try {
        await deleteDoc(doc(db, "users", user.uid, "notes", id));
      } catch (err) {
        console.warn("Firestore deleteNote failed, performing local delete:", err);
        setNotes((prev) => {
          const updated = prev.filter((n) => n.id !== id);
          saveToLS(updated);
          return updated;
        });
        setIsLocal(true);
      }
    }
  }, [user, isLocal, saveToLS]);

  const togglePin = useCallback(async (id: string) => {
    if (!user) return;
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    if (isLocal) {
      setNotes((prev) => {
        const updated = prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
        const sorted = sortNotes(updated);
        saveToLS(sorted);
        return sorted;
      });
    } else {
      try {
        await updateDoc(doc(db, "users", user.uid, "notes", id), { pinned: !note.pinned });
      } catch (err) {
        console.warn("Firestore togglePin failed, performing local toggle:", err);
        setNotes((prev) => {
          const updated = prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
          const sorted = sortNotes(updated);
          saveToLS(sorted);
          return sorted;
        });
        setIsLocal(true);
      }
    }
  }, [user, notes, isLocal, saveToLS]);

  return { notes, loading, addNote, updateNote, deleteNote, togglePin, isLocal };
}
