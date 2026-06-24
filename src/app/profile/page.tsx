"use client";

import { useAuth } from "@/hooks/useAuth";
import { useProfile, calculateProgress } from "@/hooks/useProfile";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter } from "next/navigation";
import { User, Palette, Sun, Moon, Monitor, LogOut, Trophy, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, logOut } = useAuth();
  const { profile } = useProfile();
  const progress = calculateProgress(profile.xp);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // Redirect to dashboard if not logged in
  useEffect(() => {
    if (user === null) {
      router.push("/auth");
    }
  }, [user, router]);

  if (!user) return null;

  const handleLogout = async () => {
    await logOut();
    router.push("/auth");
  };

  const getInitial = () => {
    if (user.displayName) return user.displayName[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return "U";
  };

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

          <div className={`glass ${styles.section}`}>
            <h2 className={styles.sectionTitle}>
              <User size={20} className={styles.themeIcon} />
              Account Details
            </h2>
            <div className={styles.profileInfo}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className={styles.avatarLarge} />
              ) : (
                <div className={styles.avatarLarge}>{getInitial()}</div>
              )}
              
              <div className={styles.userDetails}>
                <h3 className={styles.userName}>{user.displayName || "Anonymous User"}</h3>
                <p className={styles.userEmail}>{user.email}</p>
                <div className="badge" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
                  Active Plan: Free
                </div>
              </div>
            </div>
            
            {/* Level and XP Progress */}
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Trophy size={18} color="var(--accent)" />
                  Level {progress.currentLevel}
                </span>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  {Math.round(progress.xpIntoLevel)} / {Math.round(progress.xpRequiredForNext)} XP
                </span>
              </div>
              <div style={{ height: 12, background: 'var(--bg-card)', borderRadius: 100, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div 
                  style={{ width: `${progress.percentage}%`, background: 'linear-gradient(90deg, var(--accent), var(--success))', height: '100%', borderRadius: 100, transition: 'width 0.5s ease-out' }} 
                />
              </div>
            </div>
          </div>

          <div className={`glass ${styles.section}`}>
            <h2 className={styles.sectionTitle}>
              <Palette size={20} className={styles.themeIcon} />
              Appearance
            </h2>
            
            <div className={styles.themeOptions}>
              <div 
                className={`${styles.themeCard} ${theme === 'light' ? styles.active : ''}`}
                onClick={() => setTheme('light')}
              >
                <Sun size={24} className={styles.themeIcon} />
                <span className={styles.themeLabel}>Light</span>
              </div>
              
              <div 
                className={`${styles.themeCard} ${theme === 'dark' ? styles.active : ''}`}
                onClick={() => setTheme('dark')}
              >
                <Moon size={24} className={styles.themeIcon} />
                <span className={styles.themeLabel}>Dark</span>
              </div>
              
              <div 
                className={`${styles.themeCard} ${theme === 'system' ? styles.active : ''}`}
                onClick={() => setTheme('system')}
              >
                <Monitor size={24} className={styles.themeIcon} />
                <span className={styles.themeLabel}>System</span>
              </div>
            </div>
          </div>

          <div className={`glass ${styles.section} ${styles.dangerZone}`}>
            <div className={styles.logoutRow}>
              <div className={styles.logoutInfo}>
                <h4>Sign Out</h4>
                <p>Log out of your account to switch to a different profile.</p>
              </div>
              <button className={`btn btn-danger`} onClick={handleLogout}>
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
