"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  ShieldPlus, 
  Users, 
  ArrowRight,
  Activity,
  ChevronRight,
  Globe,
  Lock,
  Database,
  X,
  Sparkles,
  Info
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRole, setModalRole] = useState("");

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const openComingSoon = (role: string) => {
    setModalRole(role);
    setModalOpen(true);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30 relative flex flex-col justify-between">
      {/* Dynamic Cursor Light Effect */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30 dark:opacity-20 transition-opacity duration-1000 z-0"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(14, 165, 233, 0.15) 0%, transparent 40%)`
        }}
      />
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

      <div className="relative z-10 w-full flex-grow">
        {/* Header / Navbar */}
        <header className="w-full border-b border-border/40 bg-background/60 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-[1.02]">
              <Logo className="h-9 w-auto object-contain" />
              <span className="text-xl font-bold tracking-tight text-foreground hidden sm:inline-block">
                Cure<span className="text-primary">Path</span>
              </span>
            </Link>
            
            <nav className="flex gap-4 sm:gap-8 text-sm font-semibold text-muted-foreground">
              <a href="#about" className="hover:text-foreground transition-colors py-2">About</a>
              <a href="#portals" className="hover:text-foreground transition-colors py-2">Portals</a>
              <a href="#features" className="hover:text-foreground transition-colors py-2">Features</a>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-20 md:pb-28 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 text-center lg:text-left">
          {/* Hero Content */}
          <div className="flex-1 space-y-6 md:space-y-8 max-w-2xl lg:max-w-none">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mx-auto lg:mx-0">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Decentralized Health Network
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.15] text-foreground">
              Unifying Global <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-600">
                Medical Records
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
              CurePath bridges the gap between hospitals, insurance providers, and patients using immutable blockchain technology. Seamless, secure, and instant access to your health data—from birth to everywhere you go.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <a href="#portals" className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm sm:text-base">
                Access Portals <ArrowRight className="h-5 w-5" />
              </a>
              <a href="#about" className="px-8 py-4 bg-muted/60 text-foreground font-bold rounded-2xl border border-border/50 hover:bg-muted hover:border-border transition-all flex items-center justify-center text-sm sm:text-base">
                Learn More
              </a>
            </div>
          </div>
          
          {/* Hero Visual */}
          <div className="flex-1 w-full max-w-md lg:max-w-none relative aspect-square">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 to-purple-500/15 rounded-[3rem] rotate-3 blur-3xl"></div>
            <div className="absolute inset-0 bg-card border border-border/40 rounded-[2.5rem] shadow-2xl overflow-hidden glass-panel flex items-center justify-center p-6 sm:p-8">
              <div className="relative w-full h-full border border-dashed border-border/60 rounded-3xl flex items-center justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-primary to-blue-600 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <Activity className="h-28 w-28 text-primary relative z-10 drop-shadow-[0_0_15px_rgba(14,165,233,0.4)]" />
                
                {/* Floating Micro-elements */}
                <div className="absolute top-8 left-8 p-3.5 bg-background/80 backdrop-blur-md rounded-2xl border border-border/80 shadow-lg animate-[bounce_4s_infinite]">
                  <ShieldPlus className="h-5 w-5 text-green-500" />
                </div>
                <div className="absolute bottom-8 right-8 p-3.5 bg-background/80 backdrop-blur-md rounded-2xl border border-border/80 shadow-lg animate-[bounce_5s_infinite_reverse]">
                  <Database className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Portal Cards Section */}
        <section id="portals" className="py-20 md:py-24 bg-muted/20 border-y border-border/40 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Choose Your Portal</h2>
              <p className="text-muted-foreground text-sm sm:text-base">Select your platform to access the CurePath network. Secure authentication and Role-Based Access Control ensure your data is always protected.</p>
            </div>

            <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
              {/* Card 1: Hospital */}
              <div className="group relative bg-card border border-border/50 rounded-[2rem] p-8 shadow-md hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                  <Building2 className="h-44 w-44" />
                </div>
                <div>
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-105 transition-transform">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Hospital Node</h3>
                  <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                    For registered healthcare providers to manage patient admissions, doctor directories, and append medical records to the blockchain.
                  </p>
                </div>
                <div className="space-y-3 relative z-10">
                  <Link href="/login" className="w-full py-3 bg-primary text-primary-foreground text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/95 transition-colors shadow-md shadow-primary/10">
                    Sign In <ChevronRight className="h-4 w-4" />
                  </Link>
                  <Link href="/signup" className="w-full py-3 bg-muted/60 hover:bg-muted text-foreground text-sm font-bold rounded-xl flex items-center justify-center transition-colors border border-border/30">
                    Register Hospital
                  </Link>
                </div>
              </div>

              {/* Card 2: Insurance */}
              <div className="group relative bg-card border border-border/50 rounded-[2rem] p-8 shadow-md hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                  <ShieldPlus className="h-44 w-44" />
                </div>
                <div>
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6 border border-purple-500/20 group-hover:scale-105 transition-transform">
                    <ShieldPlus className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Insurance Provider</h3>
                  <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                    For insurance companies to process claims, verify treatments, and access verified medical histories through smart contracts.
                  </p>
                </div>
                <div className="space-y-3 relative z-10">
                  <button onClick={() => openComingSoon("Insurance")} className="w-full py-3 bg-purple-600/90 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors shadow-md shadow-purple-500/10">
                    Sign In <ChevronRight className="h-4 w-4" />
                  </button>
                  <button onClick={() => openComingSoon("Insurance")} className="w-full py-3 bg-muted/60 hover:bg-muted text-foreground text-sm font-bold rounded-xl flex items-center justify-center transition-colors border border-border/30">
                    Register Provider
                  </button>
                </div>
              </div>

              {/* Card 3: Other */}
              <div className="group relative bg-card border border-border/50 rounded-[2rem] p-8 shadow-md hover:shadow-2xl hover:shadow-green-500/5 transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                  <Users className="h-44 w-44" />
                </div>
                <div>
                  <div className="h-12 w-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-6 border border-green-500/20 group-hover:scale-105 transition-transform">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Other Organizations</h3>
                  <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                    For researchers, government bodies, and pharmaceutical companies to access anonymized global health trends.
                  </p>
                </div>
                <div className="space-y-3 relative z-10">
                  <button onClick={() => openComingSoon("Other Organizations")} className="w-full py-3 bg-green-600/90 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition-colors shadow-md shadow-green-500/10">
                    Sign In <ChevronRight className="h-4 w-4" />
                  </button>
                  <button onClick={() => openComingSoon("Other Organizations")} className="w-full py-3 bg-muted/60 hover:bg-muted text-foreground text-sm font-bold rounded-xl flex items-center justify-center transition-colors border border-border/30">
                    Register Org
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Features / About Section */}
        <section id="about" className="py-20 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            <div className="flex-1 space-y-6 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">How CurePath Works</h2>
              <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
                Traditionally, medical records are siloed within individual hospitals. CurePath breaks down these walls by introducing a decentralized, blockchain-backed architecture. 
              </p>
              
              <ul className="space-y-5 pt-4">
                <li className="flex gap-4 items-start">
                  <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Globe className="h-4.5 w-4.5" /></div>
                  <div>
                    <h4 className="font-bold text-foreground">Global Identity (CUPAT ID)</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">A single unique identifier follows a patient everywhere. Create it once, use it for a lifetime.</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center"><Lock className="h-4.5 w-4.5" /></div>
                  <div>
                    <h4 className="font-bold text-foreground">Immutable Blockchain Storage</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">Medical records are securely hashed and stored on-chain, preventing tampering or unauthorized alterations.</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center"><ShieldPlus className="h-4.5 w-4.5" /></div>
                  <div>
                    <h4 className="font-bold text-foreground">Doctor Verification</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">All doctors on the platform (CUDOC) must undergo strict verification before they can append to patient histories.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            {/* Stats Grid */}
            <div className="flex-1 w-full grid grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="h-40 sm:h-48 rounded-3xl bg-gradient-to-br from-primary/10 to-blue-600/10 border border-primary/10 p-5 sm:p-6 flex flex-col justify-end">
                  <div className="font-extrabold text-2xl sm:text-3xl text-foreground">1M+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">Patients Reached</div>
                </div>
                <div className="h-56 sm:h-64 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/10 p-5 sm:p-6 flex flex-col justify-end">
                  <div className="font-extrabold text-2xl sm:text-3xl text-foreground">100%</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">Data Immutability</div>
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6 pt-8 sm:pt-12">
                <div className="h-56 sm:h-64 rounded-3xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/10 p-5 sm:p-6 flex flex-col justify-end">
                  <div className="font-extrabold text-2xl sm:text-3xl text-foreground">5,000+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">Hospitals Connected</div>
                </div>
                <div className="h-40 sm:h-48 rounded-3xl bg-card border border-border/50 p-5 sm:p-6 flex flex-col justify-end shadow-lg">
                  <div className="font-extrabold text-2xl sm:text-3xl text-foreground">24/7</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">System Availability</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-border/40 py-10 bg-background/35 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Logo className="mx-auto h-8 w-auto opacity-40 object-contain" />
          <p className="text-xs sm:text-sm text-muted-foreground">© {new Date().getFullYear()} CurePath. All rights reserved.</p>
        </div>
      </footer>

      {/* Beautiful Modern Modal Dialog for Coming Soon */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-popover border border-border/80 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Info className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-foreground">Portal Coming Soon</h3>
              </div>
              <button 
                onClick={() => setModalOpen(false)} 
                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                The <span className="font-semibold text-foreground">{modalRole}</span> portal is currently in active development.
              </p>
              <div className="bg-muted/40 p-4 rounded-2xl border border-border/40 text-xs text-muted-foreground leading-normal">
                Access is restricted to Hospital Node administrators during this verification phase. Please contact the network administrators if you require credentials.
              </div>
            </div>
            
            <div className="p-4 bg-muted/20 border-t border-border/40 flex justify-end">
              <Button onClick={() => setModalOpen(false)} className="rounded-xl px-5 text-xs font-semibold bg-primary text-primary-foreground">
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
