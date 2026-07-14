"use client";

import { useState } from "react";
import { Habit, FrequencyType } from "@/hooks/useHabits";
import { X, Check } from "lucide-react";
import styles from "./HabitForm.module.css";
import { useBackHandler } from "@/hooks/useBackHandler";

const CATEGORIES = [
  { name: "Health",      emoji: "🏥", color: "#22d3a0" },
  { name: "Fitness",     emoji: "💪", color: "#f97316" },
  { name: "Mindfulness", emoji: "🧘", color: "#a78bfa" },
  { name: "Work",        emoji: "💼", color: "#60a5fa" },
  { name: "Learning",    emoji: "📚", color: "#fbbf24" },
  { name: "Social",      emoji: "🌿", color: "#f472b6" },
  { name: "Other",       emoji: "⭐", color: "#9090b0" },
];

const ICONS = ["💪","🏃","🧘","📚","💧","🥗","😴","🧠","✍️","🎯","🔥","🚴"];


const EMOJI_PLACEHOLDER: Record<string, string> = {
  "💪": "Do a full-body workout",
  "🏃": "Go for a 30-minute run",
  "🧘": "Meditate for 10 minutes",
  "📚": "Read for 30 minutes",
  "💧": "Drink 8 glasses of water",
  "🥗": "Eat a healthy meal",
  "😴": "Sleep 8 hours",
  "🧠": "Practice brain training",
  "✍️": "Journal my thoughts",
  "🎯": "Work toward my goal",
  "🎨": "Draw or paint something",
  "🎵": "Practice my instrument",
  "💼": "Finish my work tasks",
  "🌿": "Spend time in nature",
  "⭐": "Build a new habit",
  "🔥": "Stay consistent today",
  "☀️": "Complete morning routine",
  "🌙": "Wind down for bed",
  "🍎": "Eat a healthy snack",
  "🚴": "Cycle for 30 minutes",
};

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const FREQ_OPTIONS: { id: FrequencyType; label: string; sub: string; days: string[] }[] = [
  { id: "daily",    label: "Daily",       sub: "Every day",      days: DAYS },
  { id: "weekdays", label: "Weekdays",    sub: "Mon – Fri",      days: ["Mon","Tue","Wed","Thu","Fri"] },
  { id: "weekends", label: "Weekends",    sub: "Sat & Sun",      days: ["Sat","Sun"] },
  { id: "3x-week",  label: "3× / week",  sub: "Pick 3 days",    days: [] },
  { id: "2x-week",  label: "2× / week",  sub: "Pick 2 days",    days: [] },
  { id: "custom",   label: "Custom",      sub: "You pick days",  days: [] },
];

interface HabitFormProps {
  initial?: Partial<Habit>;
  onSave: (data: Omit<Habit, "id" | "userId" | "createdAtMs" | "streak" | "longestStreak" | "completedDates">) => Promise<void>;
  onCancel: () => void;
  title?: string;
}

export default function HabitForm({ initial, onSave, onCancel, title = "New Habit" }: HabitFormProps) {
  const [icon,        setIcon]      = useState(initial?.icon        || "⭐");
  const [name,        setName]      = useState(initial?.name        || "");
  const [desc,        setDesc]      = useState(initial?.description || "");
  const [category,    setCategory]  = useState(initial?.category    || "Health");
  const [frequency,   setFrequency] = useState<FrequencyType>(initial?.frequency || "daily");
  const [freqDays,    setFreqDays]  = useState<string[]>(initial?.frequencyDays ?? DAYS);
  const [isNegative,  setIsNegative]= useState(initial?.isNegative  || false);
  const [saving,      setSaving]    = useState(false);
  const [error,       setError]     = useState("");

  // Intercept hardware back-button — close form instead of exiting app
  useBackHandler(onCancel);

  const handleFreqSelect = (opt: typeof FREQ_OPTIONS[0]) => {
    setFrequency(opt.id);
    if (opt.days.length) setFreqDays(opt.days);
    else setFreqDays([]);
  };

  const toggleDay = (day: string) => {
    setFreqDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const showDayPicker = frequency === "3x-week" || frequency === "2x-week" || frequency === "custom";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Habit name is required"); return; }
    if (showDayPicker && freqDays.length === 0) { setError("Please select at least one day"); return; }
    const maxDays = frequency === "3x-week" ? 3 : frequency === "2x-week" ? 2 : 7;
    if ((frequency === "3x-week" || frequency === "2x-week") && freqDays.length > maxDays) {
      setError(`Please select exactly ${maxDays} days`); return;
    }
    setSaving(true);
    try {
      const finalDays = showDayPicker ? freqDays : (FREQ_OPTIONS.find(f=>f.id===frequency)?.days ?? DAYS);
      await onSave({ name: name.trim(), description: desc.trim(), category, frequency, frequencyDays: finalDays, color: "", icon, isNegative });
      onCancel();
    } catch {
      setError("Failed to save habit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.sheet}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button onClick={onCancel} className={styles.closeBtn}><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Habit Type Toggle */}
          <div className={styles.section}>
            <p className={styles.label}>Habit Type</p>
            <div className={styles.typeToggle}>
              <button
                type="button"
                className={`${styles.typeBtn} ${!isNegative ? styles.typeBtnActive : ""}`}
                onClick={() => setIsNegative(false)}
              >
                <span>✅</span>
                <span>Build a habit</span>
                <span className={styles.typeHint}>Something you want TO DO</span>
              </button>
              <button
                type="button"
                className={`${styles.typeBtn} ${isNegative ? styles.typeBtnNegActive : ""}`}
                onClick={() => setIsNegative(true)}
              >
                <span>⛔</span>
                <span>Break a habit</span>
                <span className={styles.typeHint}>Something you want to STOP</span>
              </button>
            </div>
            {isNegative && (
              <p className={styles.negativeHint}>
                💡 Tick ✓ each day you successfully avoided this habit.
              </p>
            )}
          </div>

          {/* Icon picker */}
          <div className={styles.section}>
            <p className={styles.label}>Choose an icon</p>
            <div className={styles.iconGrid}>
              {ICONS.map((ic) => (
                <button
                  key={ic} type="button"
                  className={`${styles.iconBtn} ${icon === ic ? styles.iconSelected : ""}`}
                  onClick={() => setIcon(ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className={styles.section}>
            <label className={styles.label}>Habit Name *</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputEmoji}>{icon}</span>
              <input
                className={styles.textInput}
                placeholder={EMOJI_PLACEHOLDER[icon] || "e.g. Morning run"}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Category */}
          <div className={styles.section}>
            <label className={styles.label}>Category</label>
            <div className={styles.catGrid}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.name} type="button"
                  className={`${styles.catBtn} ${category === c.name ? styles.catSelected : ""}`}
                  style={category === c.name ? { borderColor: c.color, background: `${c.color}18`, color: c.color } : {}}
                  onClick={() => setCategory(c.name)}
                >
                  <span>{c.emoji}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className={styles.section}>
            <label className={styles.label}>Frequency</label>
            <div className={styles.freqGrid}>
              {FREQ_OPTIONS.map((opt) => (
                <button
                  key={opt.id} type="button"
                  className={`${styles.freqBtn} ${frequency === opt.id ? styles.freqSelected : ""}`}
                  onClick={() => handleFreqSelect(opt)}
                >
                  <span className={styles.freqLabel}>{opt.label}</span>
                  <span className={styles.freqSub}>{opt.sub}</span>
                </button>
              ))}
            </div>

            {/* Day picker */}
            {showDayPicker && (
              <div className={styles.dayPicker}>
                <p className={styles.dayPickerLabel}>
                  {frequency === "3x-week" ? "Select 3 days:" : frequency === "2x-week" ? "Select 2 days:" : "Select days:"}
                </p>
                <div className={styles.dayBtns}>
                  {DAYS.map((day) => (
                    <button
                      key={day} type="button"
                      className={`${styles.dayBtn} ${freqDays.includes(day) ? styles.daySelected : ""}`}
                      onClick={() => toggleDay(day)}
                    >
                      {freqDays.includes(day) && <Check size={10} className={styles.dayCheck}/>}
                      {day.slice(0,1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          {/* Actions */}
          <div className={styles.actions}>
            <button type="button" onClick={onCancel} className={styles.cancelBtn}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? <><span className={styles.spinnerInline}/> Saving…</> : `Save Habit`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
