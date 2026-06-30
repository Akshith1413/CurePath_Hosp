"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LockKeyhole, KeyRound, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { apiFetch } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code, newPassword })
      });

      setIsLoading(false);
      if (res.success) {
        setSuccessMsg(res.message || "Password successfully updated. Routing to sign in...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setErrorMsg(res.error || "Failed to reset password. Verify the OTP code.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || "Connection timed out. Please try again.");
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-8 relative min-h-screen">
      {/* Back button */}
      <div className="absolute top-6 left-6">
        <Link href="/forgot-password" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" />
          Back
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
            Reset Password
          </h2>
          <p className="text-sm text-muted-foreground">
            Define your new cryptographic security key.
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
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
            <div className="font-semibold">{errorMsg}</div>
          </div>
        )}

        {/* Reset Form */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl border border-border/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (hidden or readonly if passed) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Registered Email</label>
              <input
                type="email"
                required
                readOnly={!!initialEmail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 bg-background/30 border border-border/40 rounded-xl text-sm focus:outline-none focus:border-primary transition-all text-foreground"
              />
            </div>

            {/* OTP Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">6-Digit Verification Code (OTP)</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-mono text-foreground"
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">New Security Password</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Confirm New Password</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-95 shadow-md shadow-primary/10 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                "Update Secure Password"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground font-mono">Loading Node Recovery Terminal...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
