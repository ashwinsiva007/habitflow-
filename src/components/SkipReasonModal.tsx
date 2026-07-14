"use client";

import { useState } from "react";
import { X } from "lucide-react";
import styles from "./SkipReasonModal.module.css";
import { useBackHandler } from "@/hooks/useBackHandler";

const SKIP_REASONS = [
  { id: "busy",       label: "Too Busy",         emoji: "😓" },
  { id: "sick",       label: "Not Feeling Well",  emoji: "🤒" },
  { id: "forgot",     label: "Forgot",            emoji: "😅" },
  { id: "motivation", label: "Low Motivation",    emoji: "😶" },
  { id: "other",      label: "Other",             emoji: "✏️" },
];

interface SkipReasonModalProps {
  habitName: string;
  habitIcon: string;
  date: string; // yyyy-MM-dd
  onSave: (reason: string) => void;
  onDismiss: () => void;
}

export default function SkipReasonModal({
  habitName,
  habitIcon,
  date,
  onSave,
  onDismiss,
}: SkipReasonModalProps) {
  const [selected, setSelected] = useState<string>("");
  const [otherText, setOtherText] = useState("");

  // Intercept hardware back-button — close modal instead of exiting app
  useBackHandler(onDismiss);

  const handleSave = () => {
    const reason = selected === "other"
      ? (otherText.trim() || "Other")
      : SKIP_REASONS.find((r) => r.id === selected)?.label || "";
    if (!reason) return;
    onSave(reason);
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onDismiss()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.habitIcon}>{habitIcon}</span>
            <div>
              <p className={styles.label}>Why did you skip?</p>
              <h3 className={styles.habitName}>{habitName}</h3>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onDismiss}>
            <X size={18} />
          </button>
        </div>

        <p className={styles.sub}>This is optional — helps you understand your patterns 📊</p>

        {/* Reason chips */}
        <div className={styles.reasons}>
          {SKIP_REASONS.map((r) => (
            <button
              key={r.id}
              className={`${styles.reasonBtn} ${selected === r.id ? styles.reasonSelected : ""}`}
              onClick={() => setSelected(r.id)}
            >
              <span className={styles.reasonEmoji}>{r.emoji}</span>
              <span className={styles.reasonLabel}>{r.label}</span>
            </button>
          ))}
        </div>

        {/* Other text input */}
        {selected === "other" && (
          <div className={styles.otherWrap}>
            <textarea
              className={styles.otherInput}
              placeholder="What held you back today?"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              maxLength={120}
              rows={2}
              autoFocus
            />
            <span className={styles.charCount}>{otherText.length}/120</span>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.skipBtn} onClick={onDismiss}>
            Skip (no reason)
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={!selected || (selected === "other" && !otherText.trim())}
          >
            Save Reason
          </button>
        </div>
      </div>
    </div>
  );
}
