"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Flame, BarChart3, CheckCircle2, TrendingUp, StickyNote, LogOut, Bell } from "lucide-react";
import styles from "./Navbar.module.css";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/habits",    label: "Habits",    icon: CheckCircle2 },
  { href: "/progress",  label: "Progress",  icon: TrendingUp },
  { href: "/notes",     label: "Notes",     icon: StickyNote },
  { href: "/reminders", label: "Reminders", icon: Bell },
];

export default function Navbar() {
  const { user, logOut } = useAuth();
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop top bar ─────────────────────────────────── */}
      <nav className={styles.topNav}>
        <div className={styles.inner}>
          <Link href="/dashboard" className={styles.logo}>
            <Flame size={22} className={styles.logoIcon} />
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
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="avatar" className={styles.avatarImg} />
                  ) : (
                    <span className={styles.avatarInitial}>
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </span>
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
            <div className={styles.avatar} style={{ width: 24, height: 24, borderWidth: pathname === "/profile" ? 2 : 1, borderColor: pathname === "/profile" ? 'var(--accent)' : 'var(--border)' }}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="avatar" className={styles.avatarImg} />
              ) : (
                <span className={styles.avatarInitial} style={{ fontSize: 10 }}>
                  {(user.displayName || user.email || "U")[0].toUpperCase()}
                </span>
              )}
            </div>
            <span className={styles.tabLabel}>Profile</span>
          </Link>
        )}
      </nav>
    </>
  );
}
