"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/hooks/useHabits";
import Navbar from "@/components/Navbar";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  format,
  subDays,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  getDay,
  isToday,
  isSameMonth,
  subMonths,
  addMonths,
  getDate,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import styles from "./progress.module.css";

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
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={10} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-primary)" fontSize={18} fontWeight={800}>{value}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="var(--text-muted)" fontSize={11}>{sub}</text>
      </svg>
      <p className={styles.ringLabel}>{label}</p>
    </div>
  );
}

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { habits, loading } = useHabits();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

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

  // Monthly heatmap calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
    setSelectedDay(null);
  };

  const getDayStats = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const activeHabits = habits.filter((h) => {
      if (!h.createdAtMs) return true;
      const endOfDayMs = new Date(date).setHours(23, 59, 59, 999);
      return h.createdAtMs <= endOfDayMs;
    });

    const completed = activeHabits.filter((h) => h.completedDates?.includes(dateStr));
    const rate = activeHabits.length > 0 ? Math.round((completed.length / activeHabits.length) * 100) : 0;

    return {
      activeCount: activeHabits.length,
      completedCount: completed.length,
      rate,
      completedList: completed,
    };
  };

  const activeDay = selectedDay || (isSameMonth(currentMonth, new Date()) ? new Date() : monthStart);
  const activeDayStats = getDayStats(activeDay);

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
            {/* Heatmap Card */}
            <div className={`${styles.heatmapCard} glass`}>
              <div className={styles.heatmapHeader}>
                <h2 className={styles.heatmapTitle}>
                  <CalendarIcon size={18} color="var(--accent)" />
                  Monthly Activity Heatmap
                </h2>
                <div className={styles.heatmapNav}>
                  <button className={styles.navBtn} onClick={handlePrevMonth} title="Previous Month">
                    <ChevronLeft size={16} />
                  </button>
                  <span className={styles.heatmapMonthName}>
                    {format(currentMonth, "MMMM yyyy")}
                  </span>
                  <button className={styles.navBtn} onClick={handleNextMonth} title="Next Month">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.weekdayLabels}>
                {WEEKDAYS.map((w) => (
                  <span key={w} className={styles.weekdayLabel}>
                    {w.slice(0, 2)}
                  </span>
                ))}
              </div>

              <div className={styles.heatmapGrid}>
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className={styles.dayCellEmpty} />
                ))}

                {monthDays.map((day) => {
                  const dayStats = getDayStats(day);
                  const isTodayDay = isToday(day);
                  const isSelected = activeDay && getDate(activeDay) === getDate(day) && isSameMonth(activeDay, day);

                  let opacity = 0;
                  if (dayStats.rate > 0) {
                    if (dayStats.rate <= 25) opacity = 0.2;
                    else if (dayStats.rate <= 50) opacity = 0.45;
                    else if (dayStats.rate <= 75) opacity = 0.7;
                    else opacity = 1.0;
                  }

                  const isHighContrast = opacity > 0.6;

                  return (
                    <div
                      key={day.toString()}
                      className={`${styles.dayCell} ${isTodayDay ? styles.dayToday : ""} ${isSelected ? styles.daySelected : ""}`}
                      onClick={() => setSelectedDay(day)}
                    >
                      {dayStats.rate > 0 && (
                        <div
                          className={styles.dayBg}
                          style={{ opacity }}
                        />
                      )}
                      <span className={`${styles.dayText} ${isHighContrast ? styles.dayTextHigh : ""}`}>
                        {getDate(day)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className={styles.heatmapDetails}>
                <div className={styles.detailsHeader}>
                  <span>{format(activeDay, "MMMM d, yyyy")}</span>
                  <span>{activeDayStats.rate}% consistency</span>
                </div>
                {activeDayStats.activeCount === 0 ? (
                  <div className={styles.detailsEmpty}>No active habits on this day</div>
                ) : (
                  <div>
                    <p style={{ margin: "4px 0 8px", fontSize: "12px", color: "var(--text-muted)" }}>
                      Completed {activeDayStats.completedCount} of {activeDayStats.activeCount} habits:
                    </p>
                    {activeDayStats.completedList.length === 0 ? (
                      <div className={styles.detailsEmpty} style={{ fontSize: "12px" }}>No habits checked off today</div>
                    ) : (
                      <div className={styles.detailsList}>
                        {activeDayStats.completedList.map((h) => (
                          <span key={h.id} className={styles.detailsTag}>
                            <span>{h.icon}</span>
                            <span>{h.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

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
                        contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-primary)", fontSize: 13 }}
                        formatter={(v: any, name: any) => [v, name]}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={10}
                        formatter={(value) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{value}</span>}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: "var(--text-muted)" as any, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "var(--text-muted)" as any, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-primary)", fontSize: 13 }}
                    formatter={(v: any, key: any) => [key === "rate" ? `${v}%` : v, key === "rate" ? "Completion Rate" : "Completed"]}
                  />
                  <Area type="monotone" dataKey="rate" stroke="var(--accent)" strokeWidth={2.5} fill="url(#rateGrad)" dot={false} activeDot={{ r: 5, fill: "var(--accent)" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
