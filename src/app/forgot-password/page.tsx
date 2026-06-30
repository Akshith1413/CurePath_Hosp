"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, KeyRound, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { apiFetch } from "@/lib/api";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });

      setIsLoading(false);
      if (res.success) {
        setSuccessMsg(res.message || "Recovery code sent to your registered email.");
        // Redirect to reset password page after 2 seconds, passing email in query params
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        }, 2000);
      } else {
        setErrorMsg(res.error || "Failed to request password recovery. Verify the email address.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || "Failed to establish node connection. Try again later.");
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-8 relative min-h-screen">
      {/* Back button */}
      <div className="absolute top-6 left-6">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
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
            Forgot Password
          </h2>
          <p className="text-sm text-muted-foreground">
            Recover access to your administrative node terminal.
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

        {/* Forgot Form */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl border border-border/80">
          <div className="mb-5 p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-2.5 text-xs text-primary leading-normal">
            <KeyRound className="h-4 w-4 shrink-0" />
            <span>We will email a 6-digit OTP verification code to verify ownership.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Administrator Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="admin@aiims.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                "Send Verification Code"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
