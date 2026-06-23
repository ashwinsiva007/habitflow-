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

const LS_KEY = "habitflow_notes_v1";

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
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

  const saveToLS = useCallback((data: Note[]) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {}
  }, []);

  const sortNotes = (data: Note[]) => {
    return [...data].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0);
    });
  };

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe = () => {};

    try {
      const q = query(
        collection(db, "notes"),
        where("userId", "==", user.uid)
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
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
  }, [user, loadFromLS, saveToLS]);

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
        const { id, ...firebaseData } = newNote;
        await addDoc(collection(db, "notes"), firebaseData);
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
  }, [user, isLocal, saveToLS]);

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
        await updateDoc(doc(db, "notes", id), data);
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
        await deleteDoc(doc(db, "notes", id));
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
        await updateDoc(doc(db, "notes", id), { pinned: !note.pinned });
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
