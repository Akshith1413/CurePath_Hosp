"use client";

import React from "react";

export function GlowBackground() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
      {/* Dynamic Grid Overlay */}
      <div className="absolute inset-0 grid-background opacity-[0.4] dark:opacity-[0.25]" />

      {/* Decorative Glow Orb 1 - Cyan/Teal */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/10 blur-[120px] dark:from-cyan-900/10 dark:to-blue-900/5 animate-pulse-slow" />

      {/* Decorative Glow Orb 2 - Blue/Indigo */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-indigo-500/10 to-teal-400/20 blur-[140px] dark:from-indigo-950/5 dark:to-teal-900/10 animate-pulse-slow" style={{ animationDelay: "-3s" }} />

      {/* Subtle center ambient light */}
      <div className="absolute top-[30%] left-[25%] w-[50%] h-[40%] rounded-full bg-blue-300/10 blur-[150px] dark:bg-blue-900/5" />
    </div>
  );
}
