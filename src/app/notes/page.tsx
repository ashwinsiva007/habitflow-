"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useNotes, Note } from "@/hooks/useNotes";
import { Plus, Pin, Trash2, Bell, BellOff, X, StickyNote } from "lucide-react";
import { format } from "date-fns";
import styles from "./notes.module.css";

const COLORS = ["#7c6aff","#22d3a0","#f97316","#60a5fa","#fbbf24","#f472b6","#ef4444"];

export default function NotesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notes, loading, addNote, updateNote, deleteNote, togglePin } = useNotes();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [user, authLoading, router]);
  const [showForm, setShowForm] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);

  // Form state
  const [title,    setTitle]    = useState("");
  const [content,  setContent]  = useState("");
  const [color,    setColor]    = useState(COLORS[0]);
  const [reminder, setReminder] = useState("");

  const openNew = () => {
    setEditNote(null); setTitle(""); setContent(""); setColor(COLORS[0]); setReminder("");
    setShowForm(true);
  };

  const openEdit = (n: Note) => {
    setEditNote(n); setTitle(n.title); setContent(n.content);
    setColor(n.color); setReminder(n.reminder || "");
    setShowForm(true);
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    if (editNote) {
      updateNote(editNote.id, { title: title.trim(), content: content.trim(), color, reminder });
    } else {
      addNote({ title: title.trim(), content: content.trim(), color, reminder, pinned: false });
    }
    setShowForm(false);
  };

  const pinned = notes.filter((n) => n.pinned);
  const regular = notes.filter((n) => !n.pinned);

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
            <h1 className={styles.title}>Notes & Reminders</h1>
            <p className={styles.sub}>Capture thoughts and set daily reminders</p>
          </div>
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={16}/> New Note
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}><span className="spinner"/></div>
        ) : notes.length === 0 ? (
          <div className={styles.empty}>
            <StickyNote size={48} style={{color:"var(--text-muted)"}}/>
            <h3>No notes yet</h3>
            <p>Add notes, reminders, or anything you want to remember.</p>
            <button className="btn btn-primary" onClick={openNew}><Plus size={16}/> Create your first note</button>
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <div className={styles.group}>
                <p className={styles.groupLabel}>📌 Pinned</p>
                <div className={styles.grid}>
                  {pinned.map((n) => <NoteCard key={n.id} note={n} onEdit={openEdit} onDelete={deleteNote} onPin={togglePin}/>)}
                </div>
              </div>
            )}
            {regular.length > 0 && (
              <div className={styles.group}>
                {pinned.length > 0 && <p className={styles.groupLabel}>All Notes</p>}
                <div className={styles.grid}>
                  {regular.map((n) => <NoteCard key={n.id} note={n} onEdit={openEdit} onDelete={deleteNote} onPin={togglePin}/>)}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Note form */}
      {showForm && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className={styles.formSheet}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>{editNote ? "Edit Note" : "New Note"}</h2>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}><X size={18}/></button>
            </div>

            {/* Color picker */}
            <div className={styles.colorRow}>
              {COLORS.map((c) => (
                <button
                  key={c} type="button"
                  className={`${styles.colorDot} ${color === c ? styles.colorSelected : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>

            <input
              className={styles.noteTitle}
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className={styles.noteContent}
              placeholder="Write your note here..."
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {/* Reminder */}
            <div className={styles.reminderRow}>
              <Bell size={15} style={{color: "var(--text-muted)"}}/>
              <span className={styles.reminderLabel}>Reminder</span>
              <input
                type="datetime-local"
                className={styles.reminderInput}
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
              />
              {reminder && (
                <button className={styles.clearReminder} onClick={() => setReminder("")}><X size={13}/></button>
              )}
            </div>

            <div className={styles.formActions}>
              <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} style={{background: color}}>
                {editNote ? "Save Changes" : "Add Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete, onPin }: {
  note: Note;
  onEdit: (n: Note) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
}) {
  const hasReminder = !!note.reminder;
  const reminderPassed = hasReminder && new Date(note.reminder) < new Date();

  return (
    <div
      className={styles.card}
      style={{ borderColor: `${note.color}40`, background: `${note.color}0d` }}
      onClick={() => onEdit(note)}
    >
      <div className={styles.cardTop}>
        <div className={styles.colorAccent} style={{ background: note.color }}/>
        <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
          <button className={styles.cardBtn} onClick={() => onPin(note.id)} title={note.pinned?"Unpin":"Pin"}>
            <Pin size={14} style={{ color: note.pinned ? note.color : undefined }}/>
          </button>
          <button className={styles.cardBtn} onClick={() => onDelete(note.id)} title="Delete">
            <Trash2 size={14}/>
          </button>
        </div>
      </div>

      {note.title && <h3 className={styles.cardTitle}>{note.title}</h3>}
      {note.content && <p className={styles.cardContent}>{note.content}</p>}

      <div className={styles.cardMeta}>
        <span className={styles.cardDate}>{format(new Date(note.createdAtMs), "MMM d")}</span>
        {hasReminder && (
          <span className={`${styles.cardReminder} ${reminderPassed ? styles.reminderPast : ""}`}>
            {reminderPassed ? <BellOff size={11}/> : <Bell size={11}/>}
            {format(new Date(note.reminder), "MMM d, h:mm a")}
          </span>
        )}
      </div>
    </div>
  );
}
