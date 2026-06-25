"use client";

import { useAuth } from "@/hooks/useAuth";
import { useProfile, calculateProgress } from "@/hooks/useProfile";
import { useTheme, THEME_OPTIONS } from "@/components/ThemeProvider";
import { useRouter } from "next/navigation";
import { Palette, LogOut, Trophy, ArrowLeft, Pencil, Check, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";
import { useEffect, useState } from "react";

// Curated emoji set for profile avatar
const AVATAR_EMOJIS = [
  "🦁", "🐯", "🦊", "🐺", "🐸", "🦋", "🦅", "🦉",
  "🌟", "⚡", "🔥", "💎", "🚀", "🎯", "🎨", "🌈",
  "🏔️", "🌊", "🌙", "☀️", "🍀", "🌺", "🎵", "👑",
];

export default function ProfilePage() {
  const { user, logOut } = useAuth();
  const { profile, updateProfileData } = useProfile();
  const progress = calculateProgress(profile.xp);
  const { theme, setTheme, themeOptions } = useTheme();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [saving, setSaving] = useState(false);

  // Redirect to dashboard if not logged in
  useEffect(() => {
    if (user === null) {
      router.push("/auth");
    }
  }, [user, router]);

  // Sync edit fields when profile loads
  useEffect(() => {
    setEditName(profile.displayName || user?.displayName || "");
    setEditEmoji(profile.avatarEmoji || "");
  }, [profile, user]);

  if (!user) return null;

  const handleLogout = async () => {
    await logOut();
    router.push("/auth");
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      await updateProfileData({
        displayName: editName.trim() || undefined,
        avatarEmoji: editEmoji || undefined,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditName(profile.displayName || user?.displayName || "");
    setEditEmoji(profile.avatarEmoji || "");
    setIsEditing(false);
  };

  const displayName = profile.displayName || user.displayName || "Anonymous User";
  const avatarEmoji = profile.avatarEmoji || "";
  const initial = (displayName)[0]?.toUpperCase() || "U";

  return (
    <div className={`page-wrapper`}>
      <Navbar />
      <main className={`main-content slide-in`}>
        <div className={styles.container}>
          <button className={styles.backButton} onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>

          <div className={styles.header}>
            <h1 className={styles.title}>Profile Settings</h1>
            <p className={styles.subtitle}>Manage your account and preferences</p>
          </div>

          {/* ── Account Details ── */}
          <div className={`glass ${styles.section}`}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>Account Details</h2>
              {!isEditing && (
                <button className={styles.editBtn} onClick={() => setIsEditing(true)} id="edit-profile-btn">
                  <Pencil size={14} />
                  Edit Profile
                </button>
              )}
            </div>

            <div className={styles.profileInfo}>
              {/* Avatar */}
              <div className={styles.avatarLarge}>
                {user.photoURL && !avatarEmoji ? (
                  <img src={user.photoURL} alt="Avatar" className={styles.avatarImg} />
                ) : avatarEmoji ? (
                  <span className={styles.avatarEmoji}>{avatarEmoji}</span>
                ) : (
                  <span className={styles.avatarInitial}>{initial}</span>
                )}
              </div>

              <div className={styles.userDetails}>
                <h3 className={styles.userName}>{displayName}</h3>
                <p className={styles.userEmail}>{user.email}</p>
                <div className="badge" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
                  Active Plan: Free
                </div>
              </div>
            </div>

            {/* Edit panel */}
            {isEditing && (
              <div className={styles.editPanel}>
                {/* Name */}
                <div className={styles.editField}>
                  <label className={styles.editLabel}>Display Name</label>
                  <input
                    className={`input ${styles.editInput}`}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                    id="edit-name-input"
                    maxLength={40}
                  />
                </div>

                {/* Emoji picker */}
                <div className={styles.editField}>
                  <label className={styles.editLabel}>Profile Avatar Emoji</label>
                  <div className={styles.emojiGrid}>
                    {/* Option to clear emoji (use initials) */}
                    <button
                      type="button"
                      className={`${styles.emojiBtn} ${editEmoji === "" ? styles.emojiSelected : ""}`}
                      onClick={() => setEditEmoji("")}
                      title="Use initials"
                      id="avatar-initial"
                    >
                      <span className={styles.emojiInitialPreview}>{initial}</span>
                    </button>
                    {AVATAR_EMOJIS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        className={`${styles.emojiBtn} ${editEmoji === em ? styles.emojiSelected : ""}`}
                        onClick={() => setEditEmoji(em)}
                        id={`avatar-${em}`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.editActions}>
                  <button className={styles.cancelEditBtn} onClick={handleEditCancel} disabled={saving}>
                    <X size={14} /> Cancel
                  </button>
                  <button className={styles.saveEditBtn} onClick={handleEditSave} disabled={saving} id="save-profile-btn">
                    {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />}
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* Level and XP Progress */}
            <div className={styles.xpBar}>
              <div className={styles.xpRow}>
                <span className={styles.xpLevel}>
                  <Trophy size={18} color="var(--accent)" />
                  Level {progress.currentLevel}
                </span>
                <span className={styles.xpInfo}>
                  {Math.round(progress.xpIntoLevel)} / {Math.round(progress.xpRequiredForNext)} XP
                </span>
              </div>
              <div className={styles.xpTrack}>
                <div className={styles.xpFill} style={{ width: `${progress.percentage}%` }} />
              </div>
            </div>
          </div>

          {/* ── Appearance — 6 Themes ── */}
          <div className={`glass ${styles.section}`}>
            <h2 className={styles.sectionTitle}>
              <Palette size={20} className={styles.themeIcon} />
              Appearance
            </h2>
            <p className={styles.themeSubtitle}>Choose your vibe — dark or light, pick an accent color</p>

            {/* Dark themes row */}
            <div className={styles.themeGroup}>
              <span className={styles.themeGroupLabel}>🌑 Dark Themes</span>
              <div className={styles.themeRow}>
                {themeOptions.filter(t => t.mode === "dark").map((opt) => (
                  <div
                    key={opt.id}
                    className={`${styles.themeCard} ${theme === opt.id ? styles.active : ""}`}
                    onClick={() => setTheme(opt.id)}
                    id={`theme-${opt.id}`}
                    role="button"
                  >
                    <div className={styles.themePreview} style={{ background: opt.bgColor }}>
                      <div className={styles.themeAccentDot} style={{ background: opt.accentColor }} />
                    </div>
                    <span className={styles.themeEmoji}>{opt.emoji}</span>
                    <span className={styles.themeLabel}>{opt.label.replace('Dark ', '')}</span>
                    {theme === opt.id && <div className={styles.themeCheck}><Check size={10} /></div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Light themes row */}
            <div className={styles.themeGroup} style={{ marginTop: 16 }}>
              <span className={styles.themeGroupLabel}>☀️ Light Themes</span>
              <div className={styles.themeRow}>
                {themeOptions.filter(t => t.mode === "light").map((opt) => (
                  <div
                    key={opt.id}
                    className={`${styles.themeCard} ${theme === opt.id ? styles.active : ""}`}
                    onClick={() => setTheme(opt.id)}
                    id={`theme-${opt.id}`}
                    role="button"
                  >
                    <div className={styles.themePreview} style={{ background: opt.bgColor, border: '1px solid #e2e8f0' }}>
                      <div className={styles.themeAccentDot} style={{ background: opt.accentColor }} />
                    </div>
                    <span className={styles.themeEmoji}>{opt.emoji}</span>
                    <span className={styles.themeLabel}>{opt.label.replace('Light ', '')}</span>
                    {theme === opt.id && <div className={styles.themeCheck}><Check size={10} /></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sign Out ── */}
          <div className={`glass ${styles.section} ${styles.dangerZone}`}>
            <div className={styles.logoutRow}>
              <div className={styles.logoutInfo}>
                <h4>Sign Out</h4>
                <p>Log out of your account to switch to a different profile.</p>
              </div>
              <button className={`btn btn-danger`} onClick={handleLogout} id="logout-btn">
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
