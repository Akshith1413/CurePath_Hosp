"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Mail, 
  LockKeyhole, 
  ArrowLeft, 
  Building2, 
  Fingerprint, 
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { apiFetch, setToken } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [nodeId, setNodeId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // MFA Challenge States
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [mfaCodeVal, setMfaCodeVal] = useState("");
  const [mfaError, setMfaError] = useState("");



  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeId || !password) return;

    setIsLoading(true);
    setErrorMsg("");
    setMfaError("");
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ loginId: nodeId, password })
      });

      setIsLoading(false);
      if (res.success) {
        if (res.mfaRequired) {
          setMfaRequired(true);
          setTempToken(res.tempToken);
          setSuccessMsg("Two-Factor Authentication Required.");
          setTimeout(() => {
            setSuccessMsg("");
          }, 2000);
        } else if (res.token) {
          setToken(res.token);
          setSuccessMsg("Node authentication approved! Routing to node dashboard...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 1200);
        }
      } else {
        setErrorMsg(res.error || "Authentication failed: Invalid credentials or node inactive.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || "Failed to establish terminal connection to validation node.");
    }
  };

  const handleMfaVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCodeVal || mfaCodeVal.length !== 6) return;

    setIsLoading(true);
    setMfaError("");
    try {
      const res = await apiFetch("/auth/mfa/verify-login", {
        method: "POST",
        body: JSON.stringify({ tempToken, code: mfaCodeVal })
      });

      setIsLoading(false);
      if (res.success && res.token) {
        setToken(res.token);
        setSuccessMsg("MFA verified! Routing to node dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      } else {
        setMfaError(res.error || "Invalid authenticator code. Please try again.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setMfaError(err.message || "Authentication failed. Try logging in again.");
    }
  };



  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-8 relative min-h-screen">
      {/* Back button */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="mx-auto w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Logo className="h-10 w-10 transition-all duration-300 group-hover:scale-105" />
              <span className="text-2xl font-bold tracking-tight text-foreground font-sans">
                Cure<span className="text-gradient-primary">Path</span>
                <span className="ml-1.5 text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                  Hospitals
                </span>
              </span>
            </Link>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight font-heading text-foreground">
            Hospital Sign In
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect administrative terminal to node gateway.
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 border border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400 rounded-xl flex items-center gap-2.5 text-sm animate-in fade-in zoom-in-95">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div className="font-semibold">{successMsg}</div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 border border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-400 rounded-xl flex items-center gap-2.5 text-sm animate-in fade-in zoom-in-95">
            <ShieldCheck className="h-5 w-5 shrink-0 text-red-500" />
            <div className="font-semibold">{errorMsg}</div>
          </div>
        )}

        {/* Login Form */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl border border-border/80">
          
          <div className="mb-5 p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-2.5 text-xs text-primary">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Cryptographic secure SHA-256 session encryption active.</span>
          </div>

          {mfaRequired ? (
            <form onSubmit={handleMfaVerifySubmit} className="space-y-5">
              <div className="space-y-2 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Fingerprint className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Authenticator Challenge</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter the 6-digit TOTP key displayed on your Google Authenticator or Authy app.
                </p>
              </div>

              <div className="space-y-1.5">
                <input 
                  type="text" 
                  required 
                  maxLength={6}
                  placeholder="000000"
                  value={mfaCodeVal} 
                  onChange={e => setMfaCodeVal(e.target.value.replace(/\D/g, ""))} 
                  className="w-full h-12 text-center font-mono font-bold text-xl tracking-widest bg-background/50 border border-border/80 rounded-xl focus:outline-none focus:border-primary text-foreground" 
                />
              </div>

              {mfaError && <div className="text-xs text-red-500 font-semibold text-center">{mfaError}</div>}

              <Button
                type="submit"
                disabled={isLoading || mfaCodeVal.length !== 6}
                className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Verify & Connect Node"
                )}
              </Button>

              <button 
                type="button" 
                onClick={() => { setMfaRequired(false); setMfaCodeVal(""); setMfaError(""); }} 
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors mt-2"
              >
                Back to credentials login
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Hospital ID/Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Hospital Email / Node ID</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="admin@aiims.org or H-AIIMS-01"
                    value={nodeId}
                    onChange={(e) => setNodeId(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">Password</label>
                  <Link href="/forgot-password" className="text-xs text-primary font-semibold hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>
              </div>

              {/* Action Row */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <label htmlFor="remember" className="text-xs text-muted-foreground font-medium select-none">
                  Remember this terminal key
                </label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-95 shadow-md shadow-primary/10 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Authorize Terminal Connection"
                )}
              </Button>
            </form>
          )}

        </div>

        {/* Footer info link */}
        <p className="text-center text-xs text-muted-foreground">
          Facility node not onboarding?{" "}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Register node here
          </Link>
        </p>
      </div>
    </div>
  );
}
