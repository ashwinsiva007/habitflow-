"use client";

import { useAuth } from "@/hooks/useAuth";
import { useProfile, calculateProgress } from "@/hooks/useProfile";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter } from "next/navigation";
import { useHabits } from "@/hooks/useHabits";
import { Palette, LogOut, Trophy, ArrowLeft, Pencil, Check, X, RotateCcw, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";

// Curated emoji set for profile avatar
const AVATAR_EMOJIS = [
  "🦁", "🐯", "🦊", "🐺", "🐸", "🦋", "🦅", "🦉",
  "🌟", "⚡", "🔥", "💎", "🚀", "🎯", "🎨", "🌈",
  "🏔️", "🌊", "🌙", "☀️", "🍀", "🌺", "🎵", "👑",
];

export default function ProfilePage() {
  const { user, logOut } = useAuth();
  const { profile, updateProfileData, resetProfile } = useProfile();
  const progress = calculateProgress(profile.xp);
  const { theme, setTheme, themeOptions } = useTheme();
  const { habits, resetAllHabits } = useHabits();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editAboutMe, setEditAboutMe] = useState("");
  const [saving, setSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetInput, setResetInput] = useState("");
  const [resetting, setResetting] = useState(false);

  // Compute stats for bio card
  const currentStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0;
  const totalCompletions = habits.reduce((sum, h) => sum + (h.completedDates?.length || 0), 0);
  const memberSince = user?.metadata?.creationTime
    ? format(new Date(user.metadata.creationTime), "MMMM yyyy")
    : "Recently";

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
    setEditAboutMe(profile.aboutMe || "");
  }, [profile, user]);

  if (!user) return null;

  const handleLogout = async () => {
    await logOut();
    router.push("/auth");
  };

  const handleReset = async () => {
    if (resetInput.trim().toUpperCase() !== "RESET") return;
    setResetting(true);
    try {
      await resetAllHabits();
      await resetProfile(); // Also reset XP/level to 0
      setShowResetConfirm(false);
      setResetInput("");
    } finally {
      setResetting(false);
    }
  };

  const handleEditOpen = () => {
    setEditName(profile.displayName || user?.displayName || "");
    setEditEmoji(profile.avatarEmoji || "");
    setEditAboutMe(profile.aboutMe || "");
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      await updateProfileData({
        displayName: editName.trim() || undefined,
        avatarEmoji: editEmoji || undefined,
        aboutMe: editAboutMe.trim() || undefined,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditName(profile.displayName || user?.displayName || "");
    setEditEmoji(profile.avatarEmoji || "");
    setEditAboutMe(profile.aboutMe || "");
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

          {/* ── Bio Card (single unified section) ── */}
          <div className={`glass ${styles.bioCard}`}>
            {/* Edit button top right */}
            <button
              className={styles.editBtn}
              onClick={handleEditOpen}
              id="edit-profile-btn"
              style={{ position: 'absolute', top: 16, right: 16 }}
            >
              <Pencil size={14} />
              Edit
            </button>

            {/* Avatar + Name + Bio */}
            <div className={styles.bioTop}>
              <div className={styles.avatarLarge}>
                {user.photoURL && !avatarEmoji ? (
                  <img src={user.photoURL} alt="Avatar" className={styles.avatarImg} />
                ) : avatarEmoji ? (
                  <span className={styles.avatarEmoji}>{avatarEmoji}</span>
                ) : (
                  <span className={styles.avatarInitial}>{initial}</span>
                )}
              </div>
              <div className={styles.bioInfo}>
                <h2 className={styles.bioName}>{displayName}</h2>
                <p className={styles.bioEmail}>{user.email}</p>
                {profile.aboutMe ? (
                  <p className={styles.bioText}>{profile.aboutMe}</p>
                ) : (
                  <p className={styles.bioPlaceholder}>✍️ No bio yet — tap <strong>Edit</strong> to add one!</p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className={styles.bioDivider} />

            {/* Stats row */}
            <div className={styles.bioStats}>
              <div className={styles.bioStat}>
                <span className={styles.bioStatIcon}>🔥</span>
                <div>
                  <p className={styles.bioStatLabel}>Current Streak</p>
                  <p className={styles.bioStatValue}>{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}</p>
                </div>
              </div>
              <div className={styles.bioStatDivider} />
              <div className={styles.bioStat}>
                <span className={styles.bioStatIcon}>📅</span>
                <div>
                  <p className={styles.bioStatLabel}>Member Since</p>
                  <p className={styles.bioStatValue}>{memberSince}</p>
                </div>
              </div>
              <div className={styles.bioStatDivider} />
              <div className={styles.bioStat}>
                <span className={styles.bioStatIcon}>🏆</span>
                <div>
                  <p className={styles.bioStatLabel}>Habits Completed</p>
                  <p className={styles.bioStatValue}>{totalCompletions}</p>
                </div>
              </div>
            </div>

            {/* Level bar */}
            <div className={styles.xpBar} style={{ marginTop: 0 }}>
              <div className={styles.xpRow}>
                <span className={styles.xpLevel}>
                  <Trophy size={16} color="var(--accent)" />
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

          {/* ── Appearance ── */}
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

          {/* ── Reset Data ── */}
          <div className={`glass ${styles.section} ${styles.dangerZone}`}>
            <div className={styles.resetRow}>
              <div className={styles.logoutInfo}>
                <h4><RotateCcw size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Reset All Data</h4>
                <p>Delete all habits, streaks, and XP. This cannot be undone.</p>
              </div>
              {!showResetConfirm ? (
                <button className={`btn btn-danger`} onClick={() => setShowResetConfirm(true)} id="reset-data-btn">
                  <RotateCcw size={16} />
                  Reset
                </button>
              ) : (
                <button className={`btn btn-danger`} onClick={() => { setShowResetConfirm(false); setResetInput(""); }}>
                  <X size={16} /> Cancel
                </button>
              )}
            </div>
            {showResetConfirm && (
              <div className={styles.resetConfirm}>
                <div className={styles.resetWarning}>
                  <AlertTriangle size={16} color="#ef4444" />
                  <span>This will permanently delete all <strong>{habits.length} habits</strong> and reset your XP to 0. Type <strong>RESET</strong> to confirm.</span>
                </div>
                <div className={styles.resetInputRow}>
                  <input
                    className={`input ${styles.resetInput}`}
                    type="text"
                    placeholder="Type RESET to confirm"
                    value={resetInput}
                    onChange={(e) => setResetInput(e.target.value)}
                    id="reset-confirm-input"
                  />
                  <button
                    className={styles.resetConfirmBtn}
                    onClick={handleReset}
                    disabled={resetInput.trim().toUpperCase() !== "RESET" || resetting}
                    id="reset-confirm-btn"
                  >
                    {resetting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <RotateCcw size={14} />}
                    {resetting ? "Resetting…" : "Confirm Reset"}
                  </button>
                </div>
              </div>
            )}
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

      {/* ── Edit Profile Modal (bottom sheet) ── */}
      {isEditing && (
        <div className={styles.editOverlay} onClick={(e) => e.target === e.currentTarget && handleEditCancel()}>
          <div className={styles.editSheet}>
            <div className={styles.editSheetHeader}>
              <h3 className={styles.editSheetTitle}>Edit Profile</h3>
              <button className={styles.editSheetClose} onClick={handleEditCancel}>
                <X size={18} />
              </button>
            </div>

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
                autoFocus
              />
            </div>

            {/* Emoji picker */}
            <div className={styles.editField}>
              <label className={styles.editLabel}>Profile Avatar</label>
              <div className={styles.emojiGrid}>
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

            {/* About Me */}
            <div className={styles.editField}>
              <label className={styles.editLabel}>About Me</label>
              <textarea
                className={`input ${styles.editTextarea}`}
                value={editAboutMe}
                onChange={(e) => setEditAboutMe(e.target.value)}
                placeholder="Tell yourself a little about who you are and what you want to achieve..."
                id="edit-about-input"
                maxLength={300}
                rows={3}
              />
              <span className={styles.charCount}>{editAboutMe.length}/300</span>
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
        </div>
      )}
    </div>
  );
}
