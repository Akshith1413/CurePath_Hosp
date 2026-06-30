"use client";

import React, { useState, useEffect } from "react";
import { 
  AlertTriangle,
  HeartPulse,
  Ambulance,
  Plus,
  Clock,
  Activity,
  User,
  Stethoscope,
  X,
  CheckCircle2,
  Trash2,
  AlertOctagon
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

// --- Types ---
type EmergencyLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type AmbulanceStatus = "Dispatched" | "En Route" | "Arrived" | "Not Required";
type EmergencyStatus = "Awaiting Triage" | "In Treatment" | "Stabilized" | "Discharged" | "Admitted to ICU";

interface EmergencyCase {
  id: string;
  patientName: string;
  patientId?: string;
  level: EmergencyLevel;
  symptoms: string;
  assignedDoctor: string;
  assignedDoctorId?: string;
  icuRequired: boolean;
  ambulanceStatus: AmbulanceStatus;
  admissionTime: string;
  status: EmergencyStatus;
}

// --- Mock Data Fallback ---
export function EmergencyModule({ initialSearchQuery = "" }: { initialSearchQuery?: string }) {
  const [cases, setCases] = React.useState<EmergencyCase[]>([]);
  const [searchQuery, setSearchQuery] = React.useState(initialSearchQuery);
  const [patientsList, setPatientsList] = React.useState<{id: string, name: string}[]>([]);
  const [doctorsList, setDoctorsList] = React.useState<{id: string, name: string}[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState("");

  React.useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);
  
  // Form State
  const [formData, setFormData] = React.useState<Partial<EmergencyCase>>({});

  // --- Fetch Emergency Cases from Backend ---
  const fetchEmergencies = async () => {
    try {
      const res = await apiFetch("/emergency");
      if (res.success && res.emergencies && res.emergencies.length > 0) {
        const mapped: EmergencyCase[] = res.emergencies.map((e: any) => ({
          id: e.id,
          patientName: e.patients?.patient_name || e.patientName || "Emergency Patient",
          patientId: e.patient_id || e.patientId || "",
          level: (e.emergency_level as EmergencyLevel) || "HIGH",
          symptoms: e.symptoms || "Acute Distress",
          assignedDoctor: e.doctors?.doctor_name || e.assignedDoctor || "Unassigned ER Doctor",
          assignedDoctorId: e.assigned_doctor_id || e.assignedDoctorId || "",
          icuRequired: Boolean(e.icu_required),
          ambulanceStatus: (e.ambulance_status as AmbulanceStatus) || "Not Required",
          admissionTime: e.admission_time || e.admissionTime || "08:00 AM",
          status: (e.emergency_status as EmergencyStatus) || "Awaiting Triage"
        }));
        setCases(mapped);
      }
    } catch (err) {
      console.warn("Using fallback emergency data");
    }
  };

  const fetchDropdowns = async () => {
    try {
      const pRes = await apiFetch("/patients");
      if (pRes.success && pRes.patients) {
        setPatientsList(pRes.patients.map((p: any) => ({ id: p.id, name: p.patient_name })));
      }
      const dRes = await apiFetch("/doctors");
      if (dRes.success && dRes.doctors) {
        setDoctorsList(dRes.doctors.map((d: any) => ({ id: d.id, name: d.doctor_name })));
      }
    } catch (err) {
      console.warn("Failed to fetch patients/doctors for ER dropdowns");
    }
  };

  React.useEffect(() => {
    fetchEmergencies();
    fetchDropdowns();
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    
    // Poll for real-time emergencies (SOS from Flutter App)
    const interval = setInterval(() => {
      updateTime();
      fetchEmergencies();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // --- Handlers ---
  const handleOpenAdd = () => {
    setFormData({
      level: "HIGH",
      status: "Awaiting Triage",
      ambulanceStatus: "Not Required",
      icuRequired: false,
      admissionTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      patientId: "",
      assignedDoctorId: ""
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCases(cases.filter(c => c.id !== id));
    try {
      await apiFetch(`/emergency/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Delete emergency error:", err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: EmergencyStatus) => {
    setCases(cases.map(c => c.id === id ? { ...c, status: newStatus } : c));
    try {
      await apiFetch(`/emergency/${id}`, {
        method: "PUT",
        body: JSON.stringify({ emergency_status: newStatus })
      });
    } catch (err) {
      console.error("Update status error", err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempId = `EMG-${Math.floor(Math.random() * 900) + 100}`;
    setCases([{ ...formData, id: tempId } as EmergencyCase, ...cases]);
    try {
      const res = await apiFetch("/emergency", {
        method: "POST",
        body: JSON.stringify({
          patient_id: formData.patientId,
          emergency_level: formData.level,
          symptoms: formData.symptoms,
          assigned_doctor_id: formData.assignedDoctorId || null,
          icu_required: formData.icuRequired,
          ambulance_status: formData.ambulanceStatus,
          admission_time: formData.admissionTime
        })
      });
      if (res.success) fetchEmergencies();
    } catch (err) {
      console.error("Create ER case error:", err);
    }
    setIsFormOpen(false);
  };

  // --- Sorting & Layout ---
  // Prioritize Critical -> High -> Medium -> Low
  const levelWeight = { "CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1 };
  
  const sortedCases = [...cases].sort((a, b) => {
    // Primary sort: Level
    if (levelWeight[a.level] !== levelWeight[b.level]) {
      return levelWeight[b.level] - levelWeight[a.level];
    }
    // Secondary sort: Status (Awaiting Triage first)
    if (a.status === "Awaiting Triage" && b.status !== "Awaiting Triage") return -1;
    if (b.status === "Awaiting Triage" && a.status !== "Awaiting Triage") return 1;
    return 0;
  });

  const filteredCases = sortedCases.filter(c => 
    c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.assignedDoctor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCriticalCount = cases.filter(c => c.level === "CRITICAL" && c.status !== "Stabilized" && c.status !== "Discharged" && c.status !== "Admitted to ICU").length;
  const enRouteCount = cases.filter(c => c.ambulanceStatus === "En Route" || c.ambulanceStatus === "Dispatched").length;

  const getLevelStyle = (level: EmergencyLevel) => {
    switch (level) {
      case "CRITICAL": return "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse";
      case "HIGH": return "bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]";
      case "MEDIUM": return "bg-amber-400 text-amber-950";
      case "LOW": return "bg-blue-400 text-blue-950";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCardBorder = (level: EmergencyLevel, status: EmergencyStatus) => {
    if (status === "Discharged" || status === "Admitted to ICU" || status === "Stabilized") {
      return "border-border/60 opacity-70";
    }
    if (level === "CRITICAL") return "border-red-500/50 ring-1 ring-red-500/30";
    if (level === "HIGH") return "border-orange-500/40";
    return "border-border/80";
  };

  return (
    <div className="relative animate-in fade-in duration-500 pb-20 min-h-[calc(100vh-120px)]">
      {/* HEADER & LIVE STATS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <HeartPulse className="h-8 w-8 text-red-500" /> ER Triage & Queue
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time emergency admission and critical care monitoring.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass-panel p-3 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center gap-4 min-w-[160px]">
            <div className="h-10 w-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-foreground leading-none">{activeCriticalCount}</div>
              <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">Active Critical</div>
            </div>
          </div>
          
          <div className="glass-panel p-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex items-center gap-4 min-w-[160px]">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <Ambulance className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-foreground leading-none">{enRouteCount}</div>
              <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">En Route</div>
            </div>
          </div>
        </div>
      </div>

      {/* EMERGENCY QUEUE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCases.length > 0 ? filteredCases.map((c) => (
          <div key={c.id} className={`glass-card p-5 rounded-3xl border flex flex-col transition-all duration-300 hover:shadow-lg ${getCardBorder(c.level, c.status)}`}>
            
            {/* Card Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-1.5">
                <span className={`inline-flex items-center w-max px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getLevelStyle(c.level)}`}>
                  {c.level === "CRITICAL" && <AlertTriangle className="h-3 w-3 mr-1.5" />}
                  {c.level} PRIORITY
                </span>
                <h3 className="font-extrabold text-lg text-foreground leading-tight mt-1">{c.patientName}</h3>
                <span className="text-[11px] font-mono text-muted-foreground">{c.id} • Arrived: {c.admissionTime}</span>
              </div>
              <button onClick={(e) => handleDelete(c.id, e)} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Critical Info */}
            <div className="space-y-3 mb-6 flex-1">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1 flex items-center gap-1.5"><Activity className="h-3 w-3" /> Presenting Symptoms</div>
                <div className={`font-bold text-sm ${c.level === 'CRITICAL' ? 'text-red-500' : 'text-foreground'}`}>{c.symptoms}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground truncate">{c.assignedDoctor || "Unassigned"}</span>
                </div>
                
                {c.ambulanceStatus !== "Not Required" && (
                  <div className="flex items-center gap-2">
                    <Ambulance className={`h-4 w-4 ${c.ambulanceStatus === 'En Route' ? 'text-blue-500 animate-pulse' : 'text-green-500'}`} />
                    <span className="text-xs font-semibold text-foreground">{c.ambulanceStatus}</span>
                  </div>
                )}
                
                {c.icuRequired && (
                  <div className="col-span-2 flex items-center gap-2 mt-1">
                    <span className="bg-red-500/20 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/30">ICU BED REQUIRED</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions / Status Footer */}
            <div className="pt-4 border-t border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${
                  c.status === 'Awaiting Triage' ? 'bg-amber-500 animate-pulse' :
                  c.status === 'In Treatment' ? 'bg-blue-500' :
                  'bg-green-500'
                }`}></div>
                <span className="text-xs font-bold text-muted-foreground">{c.status}</span>
              </div>
              
              {c.status === "Awaiting Triage" && (
                <Button size="sm" onClick={() => handleUpdateStatus(c.id, "In Treatment")} className="h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md shadow-blue-500/20">
                  Begin Treatment
                </Button>
              )}
              {c.status === "In Treatment" && (
                <Button size="sm" onClick={() => handleUpdateStatus(c.id, c.icuRequired ? "Admitted to ICU" : "Stabilized")} className="h-8 text-xs bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-md shadow-green-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Stabilized
                </Button>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-border/60 rounded-3xl">
            <HeartPulse className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-foreground">ER is Clear</h3>
            <p className="text-muted-foreground mt-2">No active emergency cases in the queue.</p>
          </div>
        )}
      </div>

      {/* --- FLOATING ACTION BUTTON --- */}
      <button 
        onClick={handleOpenAdd}
        className="fixed bottom-8 right-8 h-16 w-16 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-[0_8px_30px_rgba(239,68,68,0.4)] flex items-center justify-center transition-transform hover:scale-110 z-40 group"
      >
        <Plus className="h-8 w-8" />
        <span className="absolute right-20 bg-background border border-border/80 text-foreground text-xs font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
          + Emergency Admission
        </span>
      </button>

      {/* --- FAST-ENTRY EMERGENCY MODAL --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-popover border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] rounded-3xl w-full max-w-2xl overflow-hidden">
            <div className="bg-red-500 text-white p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2"><AlertTriangle className="h-6 w-6" /> Rapid Emergency Admission</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-foreground">Patient Name (or Identifying Marks if John Doe)</label>
                  <select 
                    required 
                    value={formData.patientId || ""} 
                    onChange={e => setFormData({...formData, patientId: e.target.value})} 
                    className="w-full h-12 px-4 bg-background/50 border border-border/80 rounded-xl text-base font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 text-foreground"
                  >
                    <option value="">Select Patient</option>
                    {patientsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-foreground">Presenting Symptoms / Trauma</label>
                  <input type="text" required value={formData.symptoms || ""} onChange={e => setFormData({...formData, symptoms: e.target.value})} className="w-full h-12 px-4 bg-background/50 border border-border/80 rounded-xl text-base font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30" placeholder="e.g. Unresponsive, Severe bleeding" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Emergency Priority Level</label>
                  <select required value={formData.level || "HIGH"} onChange={e => setFormData({...formData, level: e.target.value as EmergencyLevel})} className="w-full h-12 px-4 bg-red-500/5 border border-red-500/30 rounded-xl text-sm font-bold focus:outline-none focus:border-red-500 text-foreground">
                    <option value="CRITICAL">CRITICAL (Immediate Life Threat)</option>
                    <option value="HIGH">HIGH (Severe / Urgent)</option>
                    <option value="MEDIUM">MEDIUM (Stable but Serious)</option>
                    <option value="LOW">LOW (Minor ER)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Ambulance Status</label>
                  <select required value={formData.ambulanceStatus || "Not Required"} onChange={e => setFormData({...formData, ambulanceStatus: e.target.value as AmbulanceStatus})} className="w-full h-12 px-4 bg-background/50 border border-border/80 rounded-xl text-sm focus:outline-none focus:border-red-500 text-foreground">
                    <option value="En Route">En Route (Inbound)</option>
                    <option value="Arrived">Arrived at Bay</option>
                    <option value="Not Required">Walk-in / Not Required</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Assigned ER Doctor (Optional)</label>
                  <select 
                    value={formData.assignedDoctorId || ""} 
                    onChange={e => setFormData({...formData, assignedDoctorId: e.target.value})} 
                    className="w-full h-12 px-4 bg-background/50 border border-border/80 rounded-xl text-sm focus:outline-none focus:border-red-500 text-foreground"
                  >
                    <option value="">Select Doctor</option>
                    {doctorsList.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer p-3 border border-border/80 rounded-xl bg-background/50 w-full h-12 hover:border-red-500/50 transition-colors">
                    <input type="checkbox" checked={formData.icuRequired || false} onChange={e => setFormData({...formData, icuRequired: e.target.checked})} className="h-5 w-5 text-red-500 rounded focus:ring-red-500 focus:ring-2" />
                    <span className="text-sm font-bold text-foreground">Requires ICU Bed Reservation</span>
                  </label>
                </div>

              </div>

              <div className="pt-6 flex items-center justify-end gap-3 border-t border-border/40">
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                <Button type="submit" className="bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-xl px-8 h-12 text-base shadow-lg shadow-red-500/30">
                  Log Admission
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
