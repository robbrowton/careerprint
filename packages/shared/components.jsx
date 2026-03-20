import React, { useState, useRef, useEffect } from "react";

export function CountUp({ value, suffix = "", duration = 1500 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef();
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        const num = typeof value === "number" ? value : parseInt(String(value).replace(/[^0-9]/g, "")) || 0;
        const startTime = performance.now();
        const step = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          setDisplay(Math.round(num * eased));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);
  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

export function SectionLabel({ children, color = "var(--muted)", icon }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: "0.2em", color, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
      {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
      {children}
    </div>
  );
}
