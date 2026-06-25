"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import styles from "../auth.module.css";

const SAVED_EMAIL_KEY = "habitflow_saved_email";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill email if previously saved
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_EMAIL_KEY);
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem(SAVED_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }
      await signIn(email, password, rememberMe);
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={styles.logoIcon}>
            <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
            <path d="M16 4 A12 12 0 0 1 28 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M28 16 A12 12 0 1 1 16 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
            <path d="M25 12 L28 16 L31 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 16 L14 20 L22 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>HabitFlow</span>
        </div>

        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.sub}>Sign in to continue your journey</p>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.field}>
            <label className="label">Email</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                className={`input ${styles.inputPadded}`}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                id="login-email"
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className="label">Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                className={`input ${styles.inputPadded}`}
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                id="login-password"
                autoComplete="current-password"
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <label className={styles.rememberRow} htmlFor="remember-me">
            <div className={`${styles.checkBox} ${rememberMe ? styles.checkBoxActive : ""}`} onClick={() => setRememberMe(!rememberMe)}>
              {rememberMe && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ display: "none" }}
            />
            <span className={styles.rememberLabel}>Remember my email</span>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading} id="login-submit">
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : "Sign In"}
          </button>
        </form>

        <p className={styles.switchText}>
          Don&apos;t have an account? <Link href="/auth/signup" className={styles.switchLink}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
