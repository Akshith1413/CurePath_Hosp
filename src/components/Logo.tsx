import React from "react";

export function Logo({ className = "h-10 w-auto object-contain" }: { className?: string }) {
  return (
    <img 
      src="/logo.png" 
      alt="CurePath Logo" 
      className={className} 
    />
  );
}

