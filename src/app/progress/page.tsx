"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/hooks/useHabits";
import Navbar from "@/components/Navbar";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Flame, Award, TrendingUp, Target } from "lucide-react";
import styles from "./progress.module.css";
import Heatmap from "@/components/Heatmap";

const CAT_COLORS: Record<string, string> = {
  Health: "#22d3a0", Fitness: "#f97316", Mindfulness: "#a78bfa",
  Work: "#60a5fa", Learning: "#fbbf24", Social: "#f472b6", Other: "#9090b0",
};
const FALLBACK_COLORS = ["#7c6aff","#22d3a0","#f97316","#60a5fa","#fbbf24","#f472b6","#9090b0"];

/* Custom Donut label */
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={13} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

/* Circular ring progress component */
function RingProgress({ value, max, color, label, sub }: { value: number; max: number; color: string; label: string; sub: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = 44, cx = 56, cy = 56;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  return (
    <div className={styles.ringWrap}>
      <svg width={112} height={112} viewBox="0 0 112 112">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize={18} fontWeight={800}>{value}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="#9090b0" fontSize={11}>{sub}</text>
      </svg>
      <p className={styles.ringLabel}>{label}</p>
    </div>
  );
}

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { habits, loading } = useHabits();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [user, authLoading, router]);

  const last14Days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
  const chartData = last14Days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const completed = habits.filter((h) => h.completedDates?.includes(dateStr)).length;
    return {
      date: format(day, "MMM d"),
      completed,
      total: habits.length,
      rate: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0,
    };
  });

  const topHabits = [...habits].sort((a, b) => (b.streak || 0) - (a.streak || 0)).slice(0, 5);

  const categoryMap: Record<string, number> = {};
  habits.forEach((h) => { categoryMap[h.category] = (categoryMap[h.category] || 0) + 1; });
  const categoryData = Object.entries(categoryMap).map(([name, count]) => ({
    name, count, fill: CAT_COLORS[name] || FALLBACK_COLORS[0],
  }));

  const longestStreak = habits.reduce((max, h) => Math.max(max, h.longestStreak || 0), 0);
  const totalCompletions = habits.reduce((sum, h) => sum + (h.completedDates?.length || 0), 0);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const completedToday = habits.filter((h) => h.completedDates?.includes(todayStr)).length;
  const avgRate = chartData.length > 0
    ? Math.round(chartData.reduce((s, d) => s + d.rate, 0) / chartData.length)
    : 0;

  const allCompletedDates = habits.reduce((acc: string[], habit) => {
    return [...acc, ...(habit.completedDates || [])];
  }, []);

  if (authLoading || !user) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        <div className={styles.header}>
          <h1 className={styles.title}>Progress</h1>
          <p className={styles.sub}>Your habit journey at a glance</p>
        </div>

        {/* Ring stats */}
        <div className={`${styles.ringsCard} glass`}>
          <RingProgress value={completedToday} max={habits.length || 1} color="#7c6aff" label="Today" sub="done" />
          <RingProgress value={longestStreak}   max={Math.max(longestStreak, 1)} color="#f97316" label="Best Streak" sub="days" />
          <RingProgress value={totalCompletions} max={Math.max(totalCompletions, 1)} color="#22d3a0" label="Total Done" sub="all time" />
          <RingProgress value={avgRate} max={100} color="#60a5fa" label="Avg Rate" sub="14 days" />
        </div>

        {loading ? (
          <div className={styles.loading}><span className="spinner" /></div>
        ) : habits.length === 0 ? (
          <div className={styles.empty}>
            <span style={{ fontSize: 48 }}>📊</span>
            <h3>No data yet</h3>
            <p>Add habits and check them off to see your progress charts!</p>
          </div>
        ) : (
          <>
            {/* Two columns: Donut + Top Streaks */}
            <div className={styles.midGrid}>
              {/* Donut chart — category breakdown */}
              <div className={`${styles.chartCard} glass`}>
                <h2 className={styles.chartTitle}>🗂 By Category</h2>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="40%"
                        outerRadius="70%"
                        paddingAngle={3}
                        labelLine={false}
                        label={renderCustomLabel}
                        animationBegin={0}
                        animationDuration={900}
                      >
                        {categoryData.map((entry, i) => (
                          <Cell key={entry.name} fill={entry.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#16161f", border: "1px solid #2a2a3a", borderRadius: 10, color: "#f0f0ff", fontSize: 13 }}
                        formatter={(v: any, name: any) => [v, name]}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={10}
                        formatter={(value) => <span style={{ color: "#c0c0d0", fontSize: 12 }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className={styles.noData}>No category data yet</p>
                )}
              </div>

              {/* Top streaks */}
              <div className={`${styles.chartCard} glass`}>
                <h2 className={styles.chartTitle}>🔥 Top Streaks</h2>
                <div className={styles.streakList}>
                  {topHabits.length === 0 && (
                    <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Check in daily to build streaks!</p>
                  )}
                  {topHabits.map((h, i) => (
                    <div key={h.id} className={styles.streakRow}>
                      <span className={styles.streakRank}>#{i + 1}</span>
                      <span className={styles.streakIconEmoji}>{h.icon}</span>
                      <div className={styles.streakInfo}>
                        <span className={styles.streakName}>{h.name}</span>
                        <div className={styles.streakBar}>
                          <div
                            className={styles.streakBarFill}
                            style={{
                              width: `${Math.min(((h.streak || 0) / Math.max(longestStreak, 1)) * 100, 100)}%`,
                              background: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                      <span className={styles.streakVal} style={{ color: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}>
                        🔥 {h.streak || 0}d
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Area chart — 14-day completion rate */}
            <div className={`${styles.chartCard} glass`}>
              <h2 className={styles.chartTitle}>📈 14-Day Completion Rate</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c6aff" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7c6aff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22d3a0" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22d3a0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#9090b0", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "#9090b0", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{ background: "#16161f", border: "1px solid #2a2a3a", borderRadius: 10, color: "#f0f0ff", fontSize: 13 }}
                    formatter={(v: any, key: any) => [key === "rate" ? `${v}%` : v, key === "rate" ? "Completion Rate" : "Completed"]}
                  />
                  <Area type="monotone" dataKey="rate" stroke="#7c6aff" strokeWidth={2.5} fill="url(#rateGrad)" dot={false} activeDot={{ r: 5, fill: "#7c6aff" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* GitHub-style Heatmap */}
            <div className={`${styles.chartCard} glass`}>
              <h2 className={styles.chartTitle}>🗓️ 6-Month Activity Heatmap</h2>
              <Heatmap completedDates={allCompletedDates} daysToShow={180} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
