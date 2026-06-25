"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { BarChart3, CheckCircle2, TrendingUp, StickyNote } from "lucide-react";
import styles from "./Navbar.module.css";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/habits",    label: "Habits",    icon: CheckCircle2 },
  { href: "/progress",  label: "Progress",  icon: TrendingUp },
  { href: "/notes",     label: "Notes",     icon: StickyNote },
];

// HabitFlow logo — habit loop (circular arrow + checkmark)
function HabitLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.8" opacity="0.18"/>
      <path d="M16 4 A12 12 0 0 1 28 16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M28 16 A12 12 0 1 1 16 4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.38"/>
      <path d="M24.5 11.5 L28 16 L31.5 11.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 16 L14 20.5 L22 12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const pathname = usePathname();

  const avatarEmoji = profile?.avatarEmoji || "";
  const displayLetter = (user?.displayName || user?.email || "U")[0].toUpperCase();

  return (
    <>
      {/* ── Desktop top bar ─────────────────────────────────── */}
      <nav className={styles.topNav}>
        <div className={styles.inner}>
          <Link href="/dashboard" className={styles.logo}>
            <HabitLogo size={26} />
            <span>HabitFlow</span>
          </Link>

          <div className={styles.links}>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`${styles.link} ${pathname === href ? styles.linkActive : ""}`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          <div className={styles.right}>
            {user && (
              <Link href="/profile" className={styles.profileLink}>
                <div className={styles.avatar} title={user.displayName || user.email || ""}>
                  {user.photoURL && !avatarEmoji ? (
                    <img src={user.photoURL} alt="avatar" className={styles.avatarImg} />
                  ) : avatarEmoji ? (
                    <span className={styles.avatarEmoji}>{avatarEmoji}</span>
                  ) : (
                    <span className={styles.avatarInitial}>{displayLetter}</span>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom tab bar ────────────────────────────── */}
      <nav className={styles.bottomNav}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.tabItem} ${pathname === href ? styles.tabActive : ""}`}
          >
            <Icon size={22} />
            <span className={styles.tabLabel}>{label}</span>
          </Link>
        ))}
        {user && (
          <Link
            href="/profile"
            className={`${styles.tabItem} ${pathname === "/profile" ? styles.tabActive : ""}`}
          >
            <div
              className={styles.avatar}
              style={{
                width: 24,
                height: 24,
                borderWidth: pathname === "/profile" ? 2 : 1,
                borderColor: pathname === "/profile" ? 'var(--accent)' : 'var(--border)',
                fontSize: 14
              }}
            >
              {user.photoURL && !avatarEmoji ? (
                <img src={user.photoURL} alt="avatar" className={styles.avatarImg} />
              ) : avatarEmoji ? (
                <span style={{ fontSize: 13, lineHeight: 1 }}>{avatarEmoji}</span>
              ) : (
                <span className={styles.avatarInitial} style={{ fontSize: 10 }}>{displayLetter}</span>
              )}
            </div>
            <span className={styles.tabLabel}>Profile</span>
          </Link>
        )}
      </nav>
    </>
  );
}
