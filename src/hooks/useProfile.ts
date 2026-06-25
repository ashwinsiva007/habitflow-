"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserProfile {
  xp: number;
  level: number;
  displayName?: string;
  avatarEmoji?: string;
  aboutMe?: string;
}

const XP_PER_HABIT = 50;
const LEVEL_MULTIPLIER = 500; // Level 1 = 500 XP, Level 2 = 1000 XP, etc.

export function calculateLevel(xp: number) {
  return Math.floor(Math.sqrt(xp / LEVEL_MULTIPLIER)) + 1;
}

export function calculateProgress(xp: number) {
  const currentLevel = calculateLevel(xp);
  const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * LEVEL_MULTIPLIER;
  const xpForNextLevel = Math.pow(currentLevel, 2) * LEVEL_MULTIPLIER;
  
  const xpIntoLevel = xp - xpForCurrentLevel;
  const xpRequiredForNext = xpForNextLevel - xpForCurrentLevel;
  
  const percentage = Math.min(100, Math.max(0, (xpIntoLevel / xpRequiredForNext) * 100));
  
  return {
    currentLevel,
    xpIntoLevel,
    xpRequiredForNext,
    percentage,
  };
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({ xp: 0, level: 1 });
  const [loading, setLoading] = useState(true);
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile({ xp: 0, level: 1 });
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};

    const loadLocal = () => {
      const localProfile = localStorage.getItem(`habitflow_profile_${user.uid}`);
      if (localProfile) {
        setProfile(JSON.parse(localProfile));
      }
      setIsLocal(true);
      setLoading(false);
    };

    try {
      const docRef = doc(db, "users", user.uid);
      
      unsubscribe = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setProfile(data);
          localStorage.setItem(`habitflow_profile_${user.uid}`, JSON.stringify(data));
          setIsLocal(false);
        } else {
          // Initialize profile
          setDoc(docRef, { xp: 0, level: 1 }, { merge: true })
            .catch(() => loadLocal());
        }
        setLoading(false);
      }, () => loadLocal());
    } catch {
      loadLocal();
    }

    return () => unsubscribe();
  }, [user]);

  const addXP = useCallback(async (amount: number = XP_PER_HABIT) => {
    if (!user) return;
    
    const newXP = profile.xp + amount;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > profile.level;
    
    const updatedProfile = { ...profile, xp: newXP, level: newLevel };

    if (isLocal) {
      setProfile(updatedProfile);
      localStorage.setItem(`habitflow_profile_${user.uid}`, JSON.stringify(updatedProfile));
      if (leveledUp) window.dispatchEvent(new Event("level_up"));
    } else {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          xp: increment(amount),
          level: newLevel
        });
        if (leveledUp) window.dispatchEvent(new Event("level_up"));
      } catch {
        // Fallback to local
        setProfile(updatedProfile);
        localStorage.setItem(`habitflow_profile_${user.uid}`, JSON.stringify(updatedProfile));
        setIsLocal(true);
        if (leveledUp) window.dispatchEvent(new Event("level_up"));
      }
    }
    
    return leveledUp;
  }, [user, profile, isLocal]);

  const updateProfileData = useCallback(async (data: { displayName?: string; avatarEmoji?: string; aboutMe?: string }) => {
    if (!user) return;

    const updatedProfile = { ...profile, ...data };

    // Update Firebase Auth displayName if provided
    if (data.displayName !== undefined) {
      try {
        await updateProfile(auth.currentUser!, { displayName: data.displayName });
      } catch {
        // non-fatal
      }
    }

    if (isLocal) {
      setProfile(updatedProfile);
      localStorage.setItem(`habitflow_profile_${user.uid}`, JSON.stringify(updatedProfile));
    } else {
      try {
        await updateDoc(doc(db, "users", user.uid), data);
        setProfile(updatedProfile);
        localStorage.setItem(`habitflow_profile_${user.uid}`, JSON.stringify(updatedProfile));
      } catch {
        setProfile(updatedProfile);
        localStorage.setItem(`habitflow_profile_${user.uid}`, JSON.stringify(updatedProfile));
        setIsLocal(true);
      }
    }
  }, [user, profile, isLocal]);

  return { profile, loading, addXP, isLocal, updateProfileData };
}
