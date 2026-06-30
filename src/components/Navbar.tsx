"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Menu, X, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const pathname = usePathname();

  // Initialize theme state from DOM
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDarkClass = document.documentElement.classList.contains("dark");
      setIsDark(isDarkClass);
    }
  }, []);

  const toggleTheme = () => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      if (root.classList.contains("dark")) {
        root.classList.remove("dark");
        setIsDark(false);
        localStorage.setItem("theme", "light");
      } else {
        root.classList.add("dark");
        setIsDark(true);
        localStorage.setItem("theme", "dark");
      }
    }
  };

  const navLinks = [
    { name: "Tamper-Proof Prescriptions", href: "/#prescriptions" },
    { name: "Doctor Verification", href: "/#doctors" },
    { name: "Insurance Auto-Claims", href: "/#insurance" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Logo className="h-8 w-8 transition-all duration-300 group-hover:scale-105" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            Cure<span className="text-gradient-primary">Path</span>
            <span className="ml-1.5 text-[9px] font-bold tracking-wider uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
              Hospitals
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg text-muted-foreground hover:text-foreground h-9 w-9"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>

          <Link href="/login">
            <Button variant="ghost" className="text-sm font-medium h-9 px-4">
              Hospital Login
            </Button>
          </Link>

          <Link href="/signup">
            <Button className="text-sm font-medium bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-95 shadow-md shadow-primary/10 rounded-lg h-9 px-4">
              Register Node
            </Button>
          </Link>
        </div>

        {/* Mobile Menu & Theme Button */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg text-muted-foreground hover:text-foreground h-9 w-9"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="h-9 w-9 rounded-lg"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden glass-panel border-b border-border/40 absolute top-16 left-0 right-0 py-6 px-6 flex flex-col gap-5 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-muted-foreground hover:text-foreground py-2 border-b border-border/20"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
              <Button variant="outline" className="w-full h-10 border-border/60 rounded-lg">
                Hospital Login
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setIsOpen(false)} className="w-full">
              <Button className="w-full h-10 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-95 rounded-lg">
                Register Node
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
