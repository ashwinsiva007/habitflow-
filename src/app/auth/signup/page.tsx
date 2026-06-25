"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import styles from "../auth.module.css";

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await signUp(email, password, name);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) setError("An account with this email already exists.");
      else setError("Failed to create account. Please try again.");
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

        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.sub}>Start building better habits today</p>

        <form onSubmit={handleSignup} className={styles.form}>
          <div className={styles.field}>
            <label className="label">Full Name</label>
            <div className={styles.inputWrap}>
              <User size={16} className={styles.inputIcon} />
              <input
                className={`input ${styles.inputPadded}`}
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                id="signup-name"
                autoComplete="name"
              />
            </div>
          </div>

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
                id="signup-email"
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
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                id="signup-password"
                autoComplete="new-password"
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading} id="signup-submit">
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</> : "Create Account"}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account? <Link href="/auth/login" className={styles.switchLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
