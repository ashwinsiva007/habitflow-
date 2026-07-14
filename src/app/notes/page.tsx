"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useNotes, Note } from "@/hooks/useNotes";
import { Plus, Pin, Trash2, X, StickyNote, Mic, MicOff, Square } from "lucide-react";
import { format } from "date-fns";
import styles from "./notes.module.css";
import { useBackHandler } from "@/hooks/useBackHandler";

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

  // Close the note form when back button pressed on mobile
  useBackHandler(() => { if (showForm) setShowForm(false); });

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

  // ── Voice Note / Speech-to-Text ─────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startVoice = useCallback(async () => {
    setVoiceError("");

    // Check browser support
    const SpeechRecognitionAPI =
      (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceError("Voice notes not supported in this browser. Try Chrome or Edge.");
      return;
    }

    // Request mic permission
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setVoiceError("Microphone permission denied. Please allow mic access.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interim = transcript;
        }
      }
      setContent((prev) => {
        // Build the displayed text: previous content + confirmed finals + live interim
        const base = prev.replace(/\[…[^\]]*\]$/, "").trim();
        const liveIndicator = interim ? ` […${interim}]` : "";
        return (base ? base + " " : "") + finalTranscript.trim() + liveIndicator;
      });
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Clean up interim indicator
      setContent((prev) => prev.replace(/\[…[^\]]*\]$/, "").trim());
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      setVoiceError(`Voice error: ${e.error}`);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, []);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  }, []);

  // Stop recording when form closes
  useEffect(() => {
    if (!showForm && isRecording) stopVoice();
  }, [showForm, isRecording, stopVoice]);

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
            <h1 className={styles.title}>Notes</h1>
            <p className={styles.sub}>Capture your thoughts and ideas</p>
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

            {/* Content area with voice button */}
            <div style={{ position: "relative" }}>
              <textarea
                className={styles.noteContent}
                placeholder={isRecording ? "🎙️ Listening… speak now" : "Write your note here or tap the mic to dictate…"}
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              {/* Mic button — bottom-right of textarea */}
              <button
                type="button"
                onClick={isRecording ? stopVoice : startVoice}
                title={isRecording ? "Stop recording" : "Start voice note"}
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: 10,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isRecording ? "#ef4444" : color,
                  color: "#fff",
                  boxShadow: isRecording ? "0 0 0 4px rgba(239,68,68,0.25)" : "0 2px 8px rgba(0,0,0,0.3)",
                  animation: isRecording ? "pulse 1.2s ease infinite" : "none",
                  transition: "background 0.2s",
                }}
              >
                {isRecording ? <Square size={14} /> : <Mic size={15} />}
              </button>
              {/* REC indicator */}
              {isRecording && (
                <span style={{
                  position: "absolute",
                  top: 10,
                  right: 54,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#ef4444",
                  letterSpacing: 1,
                  animation: "pulse 1s ease infinite",
                }}>● REC</span>
              )}
            </div>

            {/* Voice error message */}
            {voiceError && (
              <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                <MicOff size={13} /> {voiceError}
              </p>
            )}

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
      </div>
    </div>
  );
}
