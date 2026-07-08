import { useState, useEffect } from "react";

export const DealCountdown = () => {
  const [time, setTime] = useState({ days: 8, hours: 23, minutes: 29, seconds: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; days--; }
        if (days < 0) return prev;
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const blocks = [
    { label: "Days", value: time.days },
    { label: "Hrs", value: time.hours },
    { label: "Min", value: time.minutes },
    { label: "Sec", value: time.seconds },
  ];

  return (
    <div className="flex items-center gap-1.5 sm:gap-3">
      {blocks.map((b, i) => (
        <div key={b.label} className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex flex-col items-center bg-foreground rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 min-w-[44px] sm:min-w-[56px] shadow-lg border border-white/10">
            <span className="font-mono tabular-nums text-lg sm:text-xl font-black text-background leading-none tracking-tighter">
              {String(b.value).padStart(2, "0")}
            </span>
            <p className="text-[7px] sm:text-[9px] uppercase tracking-[0.2em] font-bold text-background/40 mt-1">{b.label}</p>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-primary font-mono text-xl sm:text-2xl font-bold animate-pulse">:</span>
          )}
        </div>
      ))}
    </div>
  );
};
