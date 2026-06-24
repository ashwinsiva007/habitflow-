import { useMemo } from "react";
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns";

interface HeatmapProps {
  completedDates: string[]; // List of all completed dates "yyyy-MM-dd"
  daysToShow?: number;
}

export default function Heatmap({ completedDates, daysToShow = 180 }: HeatmapProps) {
  const days = useMemo(() => {
    const end = new Date();
    const start = subDays(end, daysToShow - 1);
    const interval = eachDayOfInterval({ start, end });
    
    // Map dates to completion counts
    const dateCounts: Record<string, number> = {};
    completedDates.forEach(date => {
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    return interval.map(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      return {
        date,
        dateStr,
        count: dateCounts[dateStr] || 0
      };
    });
  }, [completedDates, daysToShow]);

  // Group by weeks (cols), starting on Sunday
  const weeks: { date: Date; dateStr: string; count: number }[][] = [];
  let currentWeek: any[] = [];
  
  days.forEach((day, index) => {
    if (index === 0) {
      // Pad the first week to align with Sunday
      const dayOfWeek = day.date.getDay();
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push(null);
      }
    }
    
    currentWeek.push(day);
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  if (currentWeek.length > 0) {
    // Pad the last week
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const getColor = (count: number) => {
    if (count === 0) return "var(--bg-secondary)";
    if (count === 1) return "var(--accent-soft)";
    if (count <= 3) return "var(--accent)";
    return "var(--success)"; // High completion
  };

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {weeks.map((week, wIndex) => (
          <div key={wIndex} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {week.map((day, dIndex) => {
              if (!day) return <div key={`empty-${wIndex}-${dIndex}`} style={{ width: 12, height: 12 }} />;
              return (
                <div 
                  key={day.dateStr}
                  title={`${day.dateStr}: ${day.count} habits`}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    backgroundColor: getColor(day.count),
                    transition: 'transform 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
        <span>Less</span>
        <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: "var(--bg-secondary)" }} />
        <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: "var(--accent-soft)" }} />
        <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: "var(--accent)" }} />
        <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: "var(--success)" }} />
        <span>More</span>
      </div>
    </div>
  );
}
