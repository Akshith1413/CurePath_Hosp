"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  UserRound, 
  Calendar, 
  Activity, 
  ShieldCheck, 
  Shield,
  Database, 
  Settings, 
  Bell, 
  Search, 
  Menu, 
  X, 
  ArrowUpRight, 
  Clock, 
  LogOut, 
  HeartPulse,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { PatientsModule } from "@/components/dashboard/PatientsModule";
import { DoctorsModule } from "@/components/dashboard/DoctorsModule";
import { AppointmentsModule } from "@/components/dashboard/AppointmentsModule";
import { EmergencyModule } from "@/components/dashboard/EmergencyModule";
import { VerificationModule } from "@/components/dashboard/VerificationModule";
import { BlockchainLogsModule } from "@/components/dashboard/BlockchainLogsModule";
import { SettingsModule } from "@/components/dashboard/SettingsModule";
import { InsuranceModule } from "@/components/dashboard/InsuranceModule";
import { getToken, removeToken, apiFetch } from "@/lib/api";

type Tab = "overview" | "patients" | "doctors" | "appointments" | "emergency" | "verification" | "logs" | "settings" | "insurance";

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentBlock, setCurrentBlock] = useState(983104);
  const [isDark, setIsDark] = useState(false);

  // Profile, Search and Autocomplete states
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [patientSearchFilter, setPatientSearchFilter] = useState("");
  const [doctorSearchFilter, setDoctorSearchFilter] = useState("");
  const [appointmentSearchFilter, setAppointmentSearchFilter] = useState("");
  const [emergencySearchFilter, setEmergencySearchFilter] = useState("");
  const [insuranceSearchFilter, setInsuranceSearchFilter] = useState("");
  const [logSearchFilter, setLogSearchFilter] = useState("");
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [allEmergencies, setAllEmergencies] = useState<any[]>([]);
  const [allInsurance, setAllInsurance] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const getDisplayName = () => {
    if (hospitalInfo && hospitalInfo.hospital_name) {
      return hospitalInfo.hospital_name;
    }
    return "Apollo Admin";
  };

  const getNodeCode = () => {
    if (hospitalInfo && hospitalInfo.registration_number) {
      return `Node: ${hospitalInfo.registration_number}`;
    }
    return "Node: H-APOLLO-01";
  };

  const getInitials = () => {
    const name = getDisplayName();
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Live Stats & Alerts
  const INITIAL_STATS = {
    totalPatients: 0,
    totalDoctors: 0,
    appointmentsToday: 0,
    emergencyCases: 0,
    verifiedDoctors: 0,
    icuPatients: 0
  };

  const [stats, setStats] = useState(INITIAL_STATS);
  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const sRes = await apiFetch("/dashboard/stats");
      if (sRes.success && sRes.stats) {
        setStats(sRes.stats);
      }
    } catch (err) {
      console.error("Fetch dashboard stats error:", err);
    }
    try {
      const aRes = await apiFetch("/dashboard/emergency-alerts");
      if (aRes.success && aRes.alerts) {
        setAlerts(aRes.alerts);
      }
    } catch (err) {
      console.error("Fetch dashboard alerts error:", err);
    }
  };

  const fetchProfileAndSearchData = async () => {
    try {
      const results = await Promise.allSettled([
        apiFetch("/auth/me"),
        apiFetch("/patients"),
        apiFetch("/doctors"),
        apiFetch("/appointments"),
        apiFetch("/emergency"),
        apiFetch("/insurance"),
        apiFetch("/blockchain/logs")
      ]);

      if (results[0].status === "fulfilled" && results[0].value.success) setHospitalInfo(results[0].value.hospital);
      if (results[1].status === "fulfilled" && results[1].value.success) setAllPatients(results[1].value.patients || []);
      if (results[2].status === "fulfilled" && results[2].value.success) setAllDoctors(results[2].value.doctors || []);
      if (results[3].status === "fulfilled" && results[3].value.success) setAllAppointments(results[3].value.appointments || []);
      if (results[4].status === "fulfilled" && results[4].value.success) setAllEmergencies(results[4].value.emergencies || []);
      if (results[5].status === "fulfilled" && results[5].value.success) setAllInsurance(results[5].value.policies || []);
      if (results[6].status === "fulfilled" && results[6].value.success) setAllLogs(results[6].value.logs || []);
    } catch (err) {
      console.error("Fetch profile and search data error:", err);
    }
  };

  const handleDataChange = () => {
    fetchDashboardData();
    fetchProfileAndSearchData();
  };

  // Initialize theme and check authorization state from DOM
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));
      const token = getToken();
      if (!token) {
        router.push("/login");
      } else {
        fetchDashboardData();
        fetchProfileAndSearchData();
      }
    }
  }, [router]);

  // Refetch when entering overview
  useEffect(() => {
    if (activeTab === "overview") {
      fetchDashboardData();
    }
  }, [activeTab]);

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

  // Tick block height in background
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBlock(b => b + 1);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  const navItems = [
    { value: "overview", label: "Overview", icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
    { value: "patients", label: "Patients", icon: <Users className="h-4.5 w-4.5" /> },
    { value: "doctors", label: "Doctors Directory", icon: <UserRound className="h-4.5 w-4.5" /> },
    { value: "appointments", label: "Appointments", icon: <Calendar className="h-4.5 w-4.5" /> },
    { value: "emergency", label: "Emergency Cases", icon: <HeartPulse className="h-4.5 w-4.5" /> },
    { value: "verification", label: "Doctor Verification", icon: <ShieldCheck className="h-4.5 w-4.5" /> },
    { value: "insurance", label: "Insurance Policies", icon: <Shield className="h-4.5 w-4.5" /> },
    { value: "logs", label: "Blockchain Logs", icon: <Database className="h-4.5 w-4.5" /> },
    { value: "settings", label: "Settings", icon: <Settings className="h-4.5 w-4.5" /> },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-border/40 bg-white/70 dark:bg-background/60 backdrop-blur-xl h-screen justify-between z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b border-border/40 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo className="h-8 w-8 transition-all duration-300 group-hover:scale-105" />
              <span className="text-xl font-bold tracking-tight text-foreground">
                Cure<span className="text-gradient-primary">Path</span>
                <span className="ml-1.5 text-[9px] font-bold tracking-wider uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                  Hospitals
                </span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Main Menu</div>
            {navItems.map((item) => (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value as Tab)}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === item.value 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1" 
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-border/40 bg-background/50 backdrop-blur-md shrink-0">
            <div className="flex items-center justify-between glass-card p-3 rounded-2xl border border-border/60">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-bold shadow-inner font-mono text-sm">
                  {getInitials()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold leading-tight truncate max-w-[140px]">{getDisplayName()}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">{getNodeCode()}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER & DRAWER */}
      <header className="lg:hidden absolute top-0 left-0 right-0 h-16 border-b border-border/40 bg-white/80 dark:bg-background/80 backdrop-blur-md flex items-center justify-between px-4 z-40">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo className="h-7 w-7 transition-all duration-300 group-hover:scale-105" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            Cure<span className="text-gradient-primary">Path</span>
            <span className="ml-1.5 text-[8px] font-bold tracking-wider uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
              Hospitals
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="h-10 w-10 rounded-xl">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-white/95 dark:bg-background/95 z-30 p-4 flex flex-col justify-between animate-in slide-in-from-top-4 duration-250">
          <nav className="space-y-1.5 overflow-y-auto pb-4">
            {navItems.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setActiveTab(item.value as Tab);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold ${
                  activeTab === item.value 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          
          <Button variant="outline" onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-6 border-red-200 text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-2xl font-bold">
            <LogOut className="h-5 w-5" />
            Disconnect Terminal
          </Button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* TOP NAVBAR (Desktop) */}
        <header className="hidden lg:flex h-20 items-center justify-between px-8 border-b border-border/30 bg-white/50 dark:bg-background/40 backdrop-blur-sm shrink-0 z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search patients, doctors, appointments, policies, blocks..." 
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="h-10 w-96 pl-9 pr-4 bg-background/50 border border-border/60 rounded-full text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-foreground"
            />

            {/* AUTOCOMPLETE FLOATING DROPDOWN */}
            {showSearchDropdown && globalSearch.trim().length > 0 && (
              <div className="absolute top-12 left-0 w-[450px] bg-white dark:bg-[#0a0f16] border border-border/60 rounded-2xl shadow-xl p-4 z-50 text-foreground animate-in fade-in duration-200">
                <div className="flex justify-between items-center px-2 pb-2 mb-2 border-b border-border/40 text-xs font-bold text-muted-foreground uppercase">
                  <span>Enterprise Search Suggestions</span>
                  <button onClick={() => setShowSearchDropdown(false)} className="hover:text-foreground text-[10px]">Close</button>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-4 font-sans pr-1 scrollbar-thin">
                  {/* Patients section */}
                  {allPatients.filter(p => 
                    (p.patient_name || p.name || "").toLowerCase().includes(globalSearch.toLowerCase()) || 
                    p.id.toLowerCase().includes(globalSearch.toLowerCase())
                  ).length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-primary dark:text-cyan-500 uppercase px-2 mb-1">Patients</div>
                      {allPatients.filter(p => 
                        (p.patient_name || p.name || "").toLowerCase().includes(globalSearch.toLowerCase()) || 
                        p.id.toLowerCase().includes(globalSearch.toLowerCase())
                      ).slice(0, 2).map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setPatientSearchFilter(p.patient_name || p.name || p.id);
                            setActiveTab("patients");
                            setGlobalSearch("");
                            setShowSearchDropdown(false);
                          }}
                          type="button"
                          className="w-full text-left px-2 py-1.5 hover:bg-muted dark:hover:bg-cyan-950/20 rounded-lg text-xs flex justify-between items-center transition-colors"
                        >
                          <span className="font-semibold text-foreground">{p.patient_name || p.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{p.id}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Doctors section */}
                  {allDoctors.filter(d => 
                    (d.doctor_name || d.name || "").toLowerCase().includes(globalSearch.toLowerCase()) || 
                    d.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
                    d.specialization.toLowerCase().includes(globalSearch.toLowerCase())
                  ).length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-secondary dark:text-emerald-500 uppercase px-2 mb-1">Doctors</div>
                      {allDoctors.filter(d => 
                        (d.doctor_name || d.name || "").toLowerCase().includes(globalSearch.toLowerCase()) || 
                        d.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
                        d.specialization.toLowerCase().includes(globalSearch.toLowerCase())
                      ).slice(0, 2).map(d => (
                        <button
                          key={d.id}
                          onClick={() => {
                            setDoctorSearchFilter(d.doctor_name || d.name || d.id);
                            setActiveTab("doctors");
                            setGlobalSearch("");
                            setShowSearchDropdown(false);
                          }}
                          type="button"
                          className="w-full text-left px-2 py-1.5 hover:bg-muted dark:hover:bg-cyan-950/20 rounded-lg text-xs flex justify-between items-center transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-foreground">{d.doctor_name || d.name}</span>
                            <span className="text-[10px] text-muted-foreground block">{d.specialization}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">{d.id}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Appointments section */}
                  {allAppointments.filter(a => 
                    (a.patients?.patient_name || a.patientName || "").toLowerCase().includes(globalSearch.toLowerCase()) || 
                    (a.doctors?.doctor_name || a.doctorName || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
                    a.id.toLowerCase().includes(globalSearch.toLowerCase())
                  ).length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-amber-500 uppercase px-2 mb-1">Appointments</div>
                      {allAppointments.filter(a => 
                        (a.patients?.patient_name || a.patientName || "").toLowerCase().includes(globalSearch.toLowerCase()) || 
                        (a.doctors?.doctor_name || a.doctorName || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
                        a.id.toLowerCase().includes(globalSearch.toLowerCase())
                      ).slice(0, 2).map(a => (
                        <button
                          key={a.id}
                          onClick={() => {
                            setAppointmentSearchFilter(a.patients?.patient_name || a.patientName || a.id);
                            setActiveTab("appointments");
                            setGlobalSearch("");
                            setShowSearchDropdown(false);
                          }}
                          type="button"
                          className="w-full text-left px-2 py-1.5 hover:bg-muted dark:hover:bg-cyan-950/20 rounded-lg text-xs flex justify-between items-center transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-foreground">{a.patients?.patient_name || a.patientName}</span>
                            <span className="text-[10px] text-muted-foreground block">with {a.doctors?.doctor_name || a.doctorName}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">{a.id}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Emergencies section */}
                  {allEmergencies.filter(e => 
                    (e.patients?.patient_name || e.patientName || "").toLowerCase().includes(globalSearch.toLowerCase()) || 
                    e.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
                    (e.symptoms || "").toLowerCase().includes(globalSearch.toLowerCase())
                  ).length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-red-500 uppercase px-2 mb-1">Emergencies</div>
                      {allEmergencies.filter(e => 
                        (e.patients?.patient_name || e.patientName || "").toLowerCase().includes(globalSearch.toLowerCase()) || 
                        e.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
                        (e.symptoms || "").toLowerCase().includes(globalSearch.toLowerCase())
                      ).slice(0, 2).map(e => (
                        <button
                          key={e.id}
                          onClick={() => {
                            setEmergencySearchFilter(e.patients?.patient_name || e.patientName || e.id);
                            setActiveTab("emergency");
                            setGlobalSearch("");
                            setShowSearchDropdown(false);
                          }}
                          type="button"
                          className="w-full text-left px-2 py-1.5 hover:bg-muted dark:hover:bg-cyan-950/20 rounded-lg text-xs flex justify-between items-center transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-foreground">{e.patients?.patient_name || e.patientName}</span>
                            <span className="text-[10px] text-red-500 block truncate max-w-[240px]">{e.symptoms}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">{e.id}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Insurance section */}
                  {allInsurance.filter(i => 
                    (i.patients?.patient_name || i.patientName || "").toLowerCase().includes(globalSearch.toLowerCase()) || 
                    (i.insurance_provider || i.provider || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
                    (i.policy_name || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
                    i.id.toLowerCase().includes(globalSearch.toLowerCase())
                  ).length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-teal-500 uppercase px-2 mb-1">Insurance Policies</div>
                      {allInsurance.filter(i => 
                        (i.patients?.patient_name || i.patientName || "").toLowerCase().includes(globalSearch.toLowerCase()) || 
                        (i.insurance_provider || i.provider || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
                        (i.policy_name || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
                        i.id.toLowerCase().includes(globalSearch.toLowerCase())
                      ).slice(0, 2).map(i => (
                        <button
                          key={i.id}
                          onClick={() => {
                            setInsuranceSearchFilter(i.patients?.patient_name || i.patientName || i.id);
                            setActiveTab("insurance");
                            setGlobalSearch("");
                            setShowSearchDropdown(false);
                          }}
                          type="button"
                          className="w-full text-left px-2 py-1.5 hover:bg-muted dark:hover:bg-cyan-950/20 rounded-lg text-xs flex justify-between items-center transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-foreground">{i.patients?.patient_name || i.patientName}</span>
                            <span className="text-[10px] text-muted-foreground block truncate max-w-[240px]">{i.insurance_provider || i.provider} — {i.policy_name}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">{i.id}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Ledger Logs section */}
                  {allLogs.filter(l => 
                    l.id.toLowerCase().includes(globalSearch.toLowerCase()) || 
                    (l.record_type || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
                    (l.current_hash || "").toLowerCase().includes(globalSearch.toLowerCase())
                  ).length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-violet-500 uppercase px-2 mb-1">Ledger Blocks</div>
                      {allLogs.filter(l => 
                        l.id.toLowerCase().includes(globalSearch.toLowerCase()) || 
                        (l.record_type || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
                        (l.current_hash || "").toLowerCase().includes(globalSearch.toLowerCase())
                      ).slice(0, 2).map(l => (
                        <button
                          key={l.id}
                          onClick={() => {
                            setLogSearchFilter(l.id);
                            setActiveTab("logs");
                            setGlobalSearch("");
                            setShowSearchDropdown(false);
                          }}
                          type="button"
                          className="w-full text-left px-2 py-1.5 hover:bg-muted dark:hover:bg-cyan-950/20 rounded-lg text-xs flex justify-between items-center transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-foreground">{l.record_type}</span>
                            <span className="text-[10px] text-muted-foreground block font-mono truncate max-w-[240px]">{l.current_hash || l.hash}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">{l.id.substring(0, 8)}...</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No results */}
                  {allPatients.filter(p => 
                    (p.patient_name || p.name || "").toLowerCase().includes(globalSearch.toLowerCase()) || 
                    p.id.toLowerCase().includes(globalSearch.toLowerCase())
                  ).length === 0 && allDoctors.filter(d => 
                    (d.doctor_name || d.name || "").toLowerCase().includes(globalSearch.toLowerCase()) || 
                    d.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
                    d.specialization.toLowerCase().includes(globalSearch.toLowerCase())
                  ).length === 0 && allAppointments.filter(a => 
                    (a.patients?.patient_name || a.patientName || "").toLowerCase().includes(globalSearch.toLowerCase()) || 
                    (a.doctors?.doctor_name || a.doctorName || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
                    a.id.toLowerCase().includes(globalSearch.toLowerCase())
                  ).length === 0 && allEmergencies.filter(e => 
                    (e.patients?.patient_name || e.patientName || "").toLowerCase().includes(globalSearch.toLowerCase()) || 
                    e.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
                    (e.symptoms || "").toLowerCase().includes(globalSearch.toLowerCase())
                  ).length === 0 && allInsurance.filter(i => 
                    (i.patients?.patient_name || i.patientName || "").toLowerCase().includes(globalSearch.toLowerCase()) || 
                    (i.insurance_provider || i.provider || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
                    (i.policy_name || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
                    i.id.toLowerCase().includes(globalSearch.toLowerCase())
                  ).length === 0 && allLogs.filter(l => 
                    l.id.toLowerCase().includes(globalSearch.toLowerCase()) || 
                    (l.record_type || "").toLowerCase().includes(globalSearch.toLowerCase()) ||
                    (l.current_hash || "").toLowerCase().includes(globalSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-4 text-xs text-muted-foreground font-semibold">No nodes matched query.</div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2.5 bg-background/50 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors" aria-label="Toggle Theme">
              {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 pt-24 lg:pt-8 scroll-smooth">
          
          {/* OVERVIEW DASHBOARD */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Hospital Overview</h1>
                  <p className="text-sm text-muted-foreground mt-1">Real-time metrics for Apollo Super Speciality Hospital.</p>
                </div>
                <Button className="hidden sm:flex bg-primary text-primary-foreground font-bold rounded-xl h-10 px-4 shadow-lg shadow-primary/20">
                  Generate Report
                </Button>
              </div>

              {/* STAT CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { label: "Total Patients", value: stats.totalPatients.toLocaleString(), change: "Live", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", dotColor: "bg-blue-500", pulse: true },
                  { label: "Active Doctors", value: stats.totalDoctors.toLocaleString(), change: "Live", icon: UserRound, color: "text-purple-500", bg: "bg-purple-500/10", dotColor: "bg-purple-500", pulse: true },
                  { label: "Appointments Today", value: stats.appointmentsToday.toLocaleString(), change: "Scheduled", icon: Calendar, color: "text-teal-500", bg: "bg-teal-500/10", dotColor: "bg-teal-500", pulse: true },
                  { label: "Emergency Cases", value: stats.emergencyCases.toLocaleString(), change: stats.emergencyCases > 0 ? "Critical" : "Stable", icon: HeartPulse, color: "text-red-500", bg: "bg-red-500/10", dotColor: stats.emergencyCases > 0 ? "bg-red-500" : "bg-green-500", pulse: true, alert: stats.emergencyCases > 0 },
                  { label: "Verified Doctors", value: stats.verifiedDoctors.toLocaleString(), change: "Verified", icon: ShieldCheck, color: "text-green-500", bg: "bg-green-500/10", dotColor: "bg-green-500", pulse: false },
                  { label: "ICU Patients", value: stats.icuPatients.toLocaleString(), change: "Monitoring", icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10", dotColor: "bg-amber-500", pulse: true },
                ].map((stat, i) => (
                  <div key={i} className={`glass-card p-5 rounded-3xl border border-border/80 flex flex-col justify-between relative overflow-hidden group ${stat.alert ? 'ring-1 ring-destructive/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : ''}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <stat.icon className={`h-12 w-12 ${stat.color}`} />
                    </div>
                    <div className="relative z-10">
                      <div className={`h-8 w-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                        <stat.icon className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${stat.alert ? 'text-red-500' : stat.color}`}>
                          <span className="flex h-2 w-2 relative">
                            {stat.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${stat.dotColor} opacity-75`}></span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${stat.dotColor}`}></span>
                          </span>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* PATIENT INFLOW CHART */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-border/80 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Patient Inflow Analytics</h3>
                      <p className="text-xs text-muted-foreground">Weekly volume across departments</p>
                    </div>
                    <select className="bg-background border border-border/60 text-xs rounded-lg px-3 py-1.5 focus:outline-none">
                      <option>This Week</option>
                      <option>Last Week</option>
                      <option>This Month</option>
                    </select>
                  </div>
                  
                  {/* CSS Chart with data */}
                  <div className="flex-1 flex items-end gap-2 sm:gap-4 mt-auto h-[200px] pt-4">
                    {[
                      { day: "Mon", value: 12, height: 40 },
                      { day: "Tue", value: 21, height: 70 },
                      { day: "Wed", value: 14, height: 45 },
                      { day: "Thu", value: 28, height: 90 },
                      { day: "Fri", value: 19, height: 65 },
                      { day: "Sat", value: 25, height: 85 },
                      { day: "Sun", value: 8, height: 30 },
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-8 bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {bar.value} patients
                        </div>
                        {/* Bar */}
                        <div 
                          className="w-full max-w-[40px] bg-gradient-to-t from-primary/80 to-secondary/80 rounded-t-md transition-all duration-500 group-hover:brightness-110"
                          style={{ height: `${bar.height}%` }}
                        />
                        <span className="text-[10px] text-muted-foreground mt-2 font-medium">
                          {bar.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EMERGENCY ALERTS */}
                <div className="glass-card p-6 rounded-3xl border border-border/80 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Critical Alerts
                    </h3>
                    <span className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-0.5 rounded-full">
                      {(alerts.length > 0 ? alerts.length : 2)} Active
                    </span>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    {alerts.length > 0 ? (
                      alerts.slice(0, 3).map((alert, i) => {
                        const color = alert.emergency_level === "CRITICAL" ? "red-500" : "orange-500";
                        const textClass = alert.emergency_level === "CRITICAL" ? "text-red-500" : "text-orange-500";
                        const borderStyle = alert.emergency_level === "CRITICAL" ? "border-red-500/20 bg-red-500/5" : "border-orange-500/20 bg-orange-500/5";
                        return (
                          <div key={alert.id} className={`p-4 rounded-2xl border ${borderStyle} relative overflow-hidden`}>
                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${color}`} />
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className={`text-sm font-bold ${textClass}`}>{alert.emergency_level} Alert</h4>
                                <p className="text-xs text-foreground font-medium mt-0.5">
                                  Patient: {alert.patients?.patient_name || "Unknown"} — {alert.symptoms}
                                </p>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono">{alert.emergency_status}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                        No active emergency alerts at this time.
                      </div>
                    )}
                  </div>
                  
                  <Button variant="outline" className="w-full mt-4 text-xs font-bold rounded-xl border-border/80">
                    View All Alerts
                  </Button>
                </div>
              </div>

              {/* RECENT APPOINTMENTS TABLE */}
              <div className="glass-panel rounded-3xl border border-border/80 overflow-hidden">
                <div className="p-6 border-b border-border/40 flex items-center justify-between">
                  <h3 className="font-bold text-lg text-foreground">Upcoming Appointments</h3>
                  <Button variant="ghost" size="sm" className="text-primary text-xs font-bold h-8">View Schedule</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Patient</th>
                        <th className="px-6 py-4 font-semibold">Doctor</th>
                        <th className="px-6 py-4 font-semibold">Time</th>
                        <th className="px-6 py-4 font-semibold">Department</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {allAppointments && allAppointments.length > 0 ? allAppointments.slice(0, 5).map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-foreground">{row.patients?.patient_name || row.patient_name || row.patientName || "Unknown"}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{row.patient_id || row.id}</div>
                          </td>
                          <td className="px-6 py-4 font-medium text-muted-foreground">{row.doctors?.doctor_name || row.doctorName || "Unassigned"}</td>
                          <td className="px-6 py-4 font-mono text-xs">{row.appointment_time || row.time || "N/A"}</td>
                          <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-md bg-muted/50 text-xs font-semibold">{row.department || row.type || "General"}</span></td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              row.status === 'Checked In' || row.status === 'In Progress' ? 'bg-green-500/10 text-green-500' :
                              row.status === 'Waiting' || row.status === 'Scheduled' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-blue-500/10 text-blue-500'
                            }`}>
                              {row.status || "Scheduled"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground text-sm">
                            No upcoming appointments for today.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* PATIENT MANAGEMENT MODULE */}
          {activeTab === "patients" && <PatientsModule initialSearchQuery={patientSearchFilter} />}

          {/* DOCTOR MANAGEMENT MODULE */}
          {activeTab === "doctors" && <DoctorsModule initialSearchQuery={doctorSearchFilter} onDataChange={handleDataChange} />}

          {/* APPOINTMENT MANAGEMENT MODULE */}
          {activeTab === "appointments" && <AppointmentsModule initialSearchQuery={appointmentSearchFilter} onDataChange={handleDataChange} />}

          {/* EMERGENCY MANAGEMENT MODULE */}
          {activeTab === "emergency" && <EmergencyModule initialSearchQuery={emergencySearchFilter} />}

          {/* VERIFICATION MODULE */}
          {activeTab === "verification" && <VerificationModule />}

          {/* INSURANCE POLICIES MODULE */}
          {activeTab === "insurance" && <InsuranceModule initialSearchQuery={insuranceSearchFilter} />}

          {/* BLOCKCHAIN LOGS MODULE */}
          {activeTab === "logs" && <BlockchainLogsModule initialSearchQuery={logSearchFilter} />}

          {/* SETTINGS MODULE */}
          {activeTab === "settings" && <SettingsModule />}

          {/* PLACEHOLDER FOR OTHER TABS */}
          {activeTab !== "overview" && activeTab !== "patients" && activeTab !== "doctors" && activeTab !== "appointments" && activeTab !== "emergency" && activeTab !== "verification" && activeTab !== "logs" && activeTab !== "settings" && activeTab !== "insurance" && (
            <div className="h-full flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300 opacity-60">
              <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center">
                <Database className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold font-heading">{(activeTab as string).charAt(0).toUpperCase() + (activeTab as string).slice(1)} Module</h2>
              <p className="text-sm text-muted-foreground max-w-sm text-center">
                This enterprise module is connected to the blockchain ledger and will be populated with secure node data.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
