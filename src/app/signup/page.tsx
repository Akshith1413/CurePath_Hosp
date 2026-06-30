"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Mail, 
  LockKeyhole, 
  ArrowLeft, 
  Building2, 
  FileText, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { apiFetch } from "@/lib/api";

const INDIAN_STATES = [
  "Delhi",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Gujarat",
  "Kerala",
  "West Bengal",
  "Rajasthan"
];

export default function Signup() {
  const router = useRouter();
  const [hospitalName, setHospitalName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [state, setState] = useState("");
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [branchName, setBranchName] = useState("");
  const [stateSearchQuery, setStateSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const filteredStates = INDIAN_STATES.filter(st => 
    st.toLowerCase().includes(stateSearchQuery.toLowerCase())
  );

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!state) {
      setErrorMsg("Please select your facility state.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetch("/auth/register-hospital", {
        method: "POST",
        body: JSON.stringify({
          hospitalName,
          registrationNumber: regNumber,
          branchName,
          state,
          city,
          adminEmail,
          contactNumber,
          password
        })
      });

      setIsLoading(false);
      if (res.success) {
        setSuccessMsg(`Hospital Node registration request approved. Node ID issued for ${hospitalName}. Redirecting to Login...`);
        setTimeout(() => {
          router.push("/login");
        }, 2200);
      } else {
        setErrorMsg(res.error || "Onboarding failed. Please review your credentials.");
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg("Connection to node coordinator failed. Try again.");
    }
  };

  // Real-time checks
  const isRegNumberValid = regNumber.trim().length >= 5;
  const isContactValid = contactNumber.replace(/\D/g, "").length === 10;
  const doPasswordsMatch = password && confirmPassword && password === confirmPassword;

  return (
    <div className="flex-1 flex flex-col justify-center py-10 px-6 sm:px-8 relative min-h-screen">
      {/* Back to Home */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="mx-auto w-full max-w-lg space-y-6">
        {/* Title */}
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
            Hospital Node Onboarding
          </h2>
          <p className="text-sm text-muted-foreground">
            Register your healthcare facility on the blockchain trust grid.
          </p>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 border border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400 rounded-xl flex items-start gap-2.5 text-sm animate-in fade-in zoom-in-95">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Registration Submitted!</span>
              <p className="text-xs opacity-90">{successMsg}</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 border border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2.5 text-sm animate-in fade-in">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Main Glassmorphic Form Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl border border-border/80">
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* Hospital Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Hospital Name</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="All India Institute of Medical Sciences"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
                />
              </div>
            </div>

            {/* Registration Number & Branch Name Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Registration Number */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-foreground">Registration Number</label>
                  {isRegNumberValid && (
                    <span className="text-[9px] font-bold text-green-600 dark:text-green-400 flex items-center gap-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Ok
                    </span>
                  )}
                </div>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="REG-908312"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>
              </div>

              {/* Branch Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Branch Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Campus / South Wing"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Location Row (State & City) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* State Selector */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-semibold text-muted-foreground">State</label>
                <button
                  type="button"
                  onClick={() => setStateDropdownOpen(!stateDropdownOpen)}
                  className="w-full flex items-center justify-between h-11 px-4 bg-background/50 border border-border/60 hover:border-primary/50 rounded-xl text-sm focus:outline-none transition-all"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className={state ? "font-bold text-foreground" : "text-muted-foreground truncate max-w-[120px]"}>
                      {state || "Choose State"}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${stateDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {stateDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => { setStateDropdownOpen(false); setStateSearchQuery(""); }} />
                    <div className="absolute left-0 right-0 mt-2 z-20 bg-popover text-popover-foreground border border-border/80 shadow-2xl rounded-2xl p-2 flex flex-col gap-1 max-h-[260px] animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="relative px-1 pb-1.5 pt-0.5 border-b border-border/50">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search state..."
                          value={stateSearchQuery}
                          onChange={(e) => setStateSearchQuery(e.target.value)}
                          className="w-full h-9 pl-8 pr-3 text-xs bg-muted/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto overflow-x-hidden pt-1 max-h-[160px]">
                        {filteredStates.length > 0 ? (
                          filteredStates.map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                setState(st);
                                setStateDropdownOpen(false);
                                setStateSearchQuery("");
                              }}
                              className={`w-full text-left px-3.5 py-2 text-sm rounded-lg hover:bg-primary/10 transition-colors font-semibold ${state === st ? "bg-primary/5 text-primary" : "text-foreground"}`}
                            >
                              {st}
                            </button>
                          ))
                        ) : (
                          <div className="px-3.5 py-4 text-center text-xs text-muted-foreground">
                            No states found.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* City / Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">City / Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai, Andheri West"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Admin Email & Contact Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Admin Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    placeholder="admin@facility.org"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-foreground">Contact Number</label>
                  {isContactValid && (
                    <span className="text-[9px] font-bold text-green-600 dark:text-green-400 flex items-center gap-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Verified Format
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Password</label>
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

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-foreground">Confirm Password</label>
                  {doPasswordsMatch && (
                    <span className="text-[9px] font-bold text-green-600 dark:text-green-400 flex items-center gap-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Match
                    </span>
                  )}
                </div>
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
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-95 shadow-md shadow-primary/10 flex items-center justify-center gap-2 pt-1 mt-2"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                "Register Hospital Node"
              )}
            </Button>
          </form>
        </div>

        {/* Onboarding Info Link */}
        <p className="text-center text-xs text-muted-foreground">
          Already have an authenticated node?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
