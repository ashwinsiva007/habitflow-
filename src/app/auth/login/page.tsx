"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Flame, Mail, Lock, Eye, EyeOff, Globe } from "lucide-react";
import styles from "../auth.module.css";

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isCap = !!(window as any).Capacitor || (window.location.hostname === "localhost" && !window.location.port);
      setIsCapacitor(isCap);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      if (err?.message === "CAPACITOR_GOOGLE_SIGNIN_UNSUPPORTED") {
        setError("Google Sign-In is not supported in the mobile app. Please sign in with your email & password.");
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Flame size={28} className={styles.logoIcon} />
          <span>HabitFlow</span>
        </div>

        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.sub}>Sign in to continue your journey</p>

        {isCapacitor ? (
          <div className={styles.mobileAuthNotice}>
            <p>
              <strong>Mobile App:</strong> Google Sign-In is not supported in the mobile APK. Please sign in below using your **Email & Password**.
            </p>
          </div>
        ) : (
          <>
            <button onClick={handleGoogle} className={styles.googleBtn} disabled={googleLoading}>
              {googleLoading ? <span className="spinner" /> : <Globe size={18} />}
              Continue with Google
            </button>
            <div className={styles.divider}><span>or</span></div>
          </>
        )}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.field}>
            <label className="label">Email</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input className={`input ${styles.inputPadded}`} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className={styles.field}>
            <label className="label">Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input className={`input ${styles.inputPadded}`} type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
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
