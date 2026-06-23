"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Flame, BarChart3, CheckCircle2, TrendingUp, StickyNote, LogOut } from "lucide-react";
import styles from "./Navbar.module.css";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/habits",    label: "Habits",    icon: CheckCircle2 },
  { href: "/progress",  label: "Progress",  icon: TrendingUp },
  { href: "/notes",     label: "Notes",     icon: StickyNote },
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
              <>
                <div className={styles.avatar} title={user.displayName || user.email || ""}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="avatar" className={styles.avatarImg} />
                  ) : (
                    <span className={styles.avatarInitial}>
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <button onClick={logOut} className={styles.logoutBtn} title="Sign Out">
                  <LogOut size={16} />
                </button>
              </>
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
      </nav>
    </>
  );
}
