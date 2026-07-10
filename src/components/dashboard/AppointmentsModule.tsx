"use client";

import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  X,
  CalendarDays,
  List,
  Clock,
  AlertTriangle,
  Stethoscope,
  Activity,
  HeartPulse,
  User
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

// --- Types ---
type AppointmentType = "Regular" | "Emergency" | "ICU" | "Follow-up";
type AppointmentStatus = "Scheduled" | "In Progress" | "Completed" | "Cancelled";

interface Appointment {
  id: string;
  patientName: string;
  patientId?: string;
  doctorName: string;
  doctorId?: string;
  type: AppointmentType;
  diagnosis: string;
  medication: string;
  treatmentDuration: string;
  date: string;
  time: string;
  status: AppointmentStatus;
}

// --- Mock Data Fallback ---
export function AppointmentsModule({ initialSearchQuery = "", onDataChange }: { initialSearchQuery?: string, onDataChange?: () => void }) {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [patientsList, setPatientsList] = React.useState<{id: string, name: string}[]>([]);
  const [doctorsList, setDoctorsList] = React.useState<{id: string, name: string}[]>([]);
  const [viewMode, setViewMode] = React.useState<"list" | "calendar">("list");
  
  // Filtering
  const [searchQuery, setSearchQuery] = React.useState(initialSearchQuery);
  const [typeFilter, setTypeFilter] = React.useState<string>("All");

  React.useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);
  
  // Modals
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null);
  const [viewingAppointment, setViewingAppointment] = React.useState<Appointment | null>(null);

  // Form State
  const [formData, setFormData] = React.useState<Partial<Appointment> & { icuCondition?: string; nurseAssigned?: string }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Settings
  const [hospitalOpenTime] = React.useState("09:00 AM");
  const [hospitalCloseTime] = React.useState("06:00 PM");

  // Helper for parsing time
  const parseTime = (timeStr: string) => {
    if (!timeStr) return 0;
    let [time, period] = timeStr.split(" ");
    if (!time || !period) return 0;
    let [h, m] = time.split(":").map(Number);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h * 60 + (m || 0);
  };

  const formatTime = (minutes: number) => {
    let h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const period = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const generateTimeSlots = (date: string, doctorId: string) => {
    const startMin = parseTime(hospitalOpenTime);
    const endMin = parseTime(hospitalCloseTime);
    const slots = [];
    
    // Get current time to block past slots if date is today
    const now = new Date();
    const isToday = date === now.toISOString().split("T")[0];
    const currentMin = now.getHours() * 60 + now.getMinutes();

    for (let m = startMin; m < endMin; m += 15) {
      if (isToday && m <= currentMin) continue;
      
      const timeStr = formatTime(m);
      // Check for conflicts
      const conflict = appointments.find(a => 
        a.date === date && 
        a.doctorId === doctorId && 
        a.time === timeStr && 
        a.status !== "Cancelled" &&
        (!editingAppointment || a.id !== editingAppointment.id)
      );

      slots.push({
        time: timeStr,
        available: !conflict,
        conflictPatient: conflict ? conflict.patientName : null
      });
    }
    return slots;
  };

  // --- Fetch Appointments from Backend ---
  const fetchAppointments = async () => {
    try {
      const res = await apiFetch("/appointments");
      if (res.success && res.appointments && res.appointments.length > 0) {
        const mapped: Appointment[] = res.appointments.map((a: any) => ({
          id: a.id,
          patientName: a.patients?.patient_name || a.patientName || "Unknown Patient",
          patientId: a.patient_id || a.patientId || "",
          doctorName: a.doctors?.doctor_name || a.doctorName || "Dr. Unassigned",
          doctorId: a.doctor_id || a.doctorId || "",
          type: (a.appointment_type === "FOLLOW_UP" ? "Follow-up" : a.appointment_type === "REGULAR" ? "Regular" : a.appointment_type === "EMERGENCY" ? "Emergency" : a.appointment_type) || "Regular",
          diagnosis: a.diagnosis || "Consultation",
          medication: a.medication || "None",
          treatmentDuration: a.treatment_duration || a.treatmentDuration || "30 mins",
          date: a.appointment_date || a.date || new Date().toISOString().split("T")[0],
          time: a.appointment_time || a.time || "10:00 AM",
          status: (a.status as AppointmentStatus) || "Scheduled"
        }));
        setAppointments(mapped);
      }
    } catch (err) {
      console.warn("Using fallback appointments data");
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
      console.warn("Failed to fetch patients/doctors list for appointment dropdowns");
    }
  };

  React.useEffect(() => {
    fetchAppointments();
    fetchDropdowns();
  }, []);

  // --- Handlers ---
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleOpenAdd = () => {
    setEditingAppointment(null);
    setFormError(null);
    setFormData({
      status: "Scheduled",
      date: new Date().toISOString().split('T')[0],
      type: "Regular",
      time: "10:00 AM",
      treatmentDuration: "30 mins"
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (appointment: Appointment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingAppointment(appointment);
    setFormError(null);
    let icuCondition = "";
    let nurseAssigned = "";
    let diagnosis = appointment.diagnosis;
    if (appointment.type === "ICU" && diagnosis.includes("[ICU]")) {
      const parts = diagnosis.split(" | Nurse: ");
      icuCondition = parts[0].replace("[ICU] ", "");
      if (parts.length > 1) {
        nurseAssigned = parts[1];
        diagnosis = "Critical Care";
      }
    }
    setFormData({ ...appointment, icuCondition, nurseAssigned, diagnosis: appointment.type === "ICU" ? diagnosis : appointment.diagnosis });
    setIsFormOpen(true);
  };

  const handleOpenDetail = (appointment: Appointment) => {
    setViewingAppointment(appointment);
    setIsDetailOpen(true);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAppointments(appointments.filter(a => a.id !== id));
    try {
      await apiFetch(`/appointments/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Delete appointment error:", err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.patientId) return setFormError("Patient is required.");
    if (!formData.doctorId) return setFormError("Doctor is required.");
    if (!formData.date) return setFormError("Appointment date is required.");
    if (!formData.time) return setFormError("Appointment time is required.");
    
    // Check if date is in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selectedDate < today) {
      return setFormError("Appointment date cannot be in the past.");
    }

    setIsSubmitting(true);

    const payload = {
      patient_id: formData.patientId,
      doctor_id: formData.doctorId,
      appointment_type: formData.type === "Follow-up" ? "FOLLOW_UP" : formData.type?.toUpperCase() || "REGULAR",
      diagnosis: formData.type === "ICU" ? `[ICU] ${formData.icuCondition || 'Critical'} | Nurse: ${formData.nurseAssigned || 'Unassigned'}` : formData.diagnosis,
      medication: formData.medication,
      treatment_duration: formData.treatmentDuration,
      appointment_date: formData.date,
      appointment_time: formData.time,
      status: formData.status
    };

    if (editingAppointment) {
      // Optimistic UI update
      setAppointments(appointments.map(a => a.id === editingAppointment.id ? { ...a, ...formData, type: formData.type || a.type } as Appointment : a));
      try {
        const res = await apiFetch(`/appointments/${editingAppointment.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        if (res.success) {
          fetchAppointments();
          setIsFormOpen(false);
        } else {
          setFormError(res.error || "Failed to update appointment");
        }
      } catch (err: any) {
        setFormError(err.message || "Failed to update appointment");
      }
      try {
        const res = await apiFetch("/appointments", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        if (res.success) {
          fetchAppointments();
          setIsFormOpen(false);
          if (onDataChange) onDataChange();
        } else {
          setFormError(res.error || "Failed to schedule appointment");
        }
      } catch (err: any) {
        setFormError(err.message || "Failed to schedule appointment");
      }
    }
    
    setIsSubmitting(false);
  };

  // --- Filtering ---
  const filteredAppointments = appointments.filter(a => {
    const pName = a.patientName || "";
    const dName = a.doctorName || "";
    const aId = a.id || "";
    const matchesSearch = pName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          aId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "All" || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // We will build a simple timeline view of today's appointments sorted by time
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = filteredAppointments
    .filter(a => a.date === todayStr)
    .sort((a, b) => parseTime(a.time) - parseTime(b.time));

  // Generate a full day timeline grid
  const timelineGrid = [];
  const startMin = parseTime(hospitalOpenTime);
  const endMin = parseTime(hospitalCloseTime);
  for (let m = startMin; m < endMin; m += 15) {
    const tStr = formatTime(m);
    const aptsAtTime = todayAppointments.filter(a => a.time === tStr && a.status !== "Cancelled");
    timelineGrid.push({
      time: tStr,
      minutes: m,
      appointments: aptsAtTime
    });
  }

  const getTypeStyle = (type: AppointmentType) => {
    switch (type) {
      case "Emergency": return "bg-red-500/10 text-red-500 border-red-500/30 ring-1 ring-red-500/50";
      case "ICU": return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      case "Follow-up": return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      default: return "bg-primary/10 text-primary border-primary/30";
    }
  };

  const getStatusStyle = (status: AppointmentStatus) => {
    switch (status) {
      case "In Progress": return "bg-blue-500/10 text-blue-500";
      case "Completed": return "bg-green-500/10 text-green-500";
      case "Cancelled": return "bg-red-500/10 text-red-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Appointments & Queue</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage schedules, emergency cases, and patient inflows.</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Schedule Appointment
        </Button>
      </div>

      {/* TOOLBAR */}
      <div className="glass-panel p-4 rounded-2xl border border-border/80 flex flex-col lg:flex-row gap-4 items-center justify-between">
        
        <div className="flex bg-muted/40 p-1 rounded-xl border border-border/50">
          <button 
            onClick={() => setViewMode("list")} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="h-4 w-4" /> List View
          </button>
          <button 
            onClick={() => setViewMode("calendar")} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "calendar" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <CalendarDays className="h-4 w-4" /> Timeline
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search patient, doctor..." 
              value={searchQuery}
              onChange={handleSearch}
              className="w-full h-10 pl-9 pr-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-foreground"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 bg-background/50 border border-border/60 rounded-xl text-sm px-3 focus:outline-none focus:border-primary text-foreground"
            >
              <option value="All">All Types</option>
              <option value="Regular">Regular</option>
              <option value="Emergency">Emergency</option>
              <option value="ICU">ICU</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEWS */}
      <div className="glass-card rounded-3xl border border-border/80 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        
        {/* --- LIST VIEW --- */}
        {viewMode === "list" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[1100px]">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/40">
                <tr>
                  <th className="px-6 py-4">Schedule</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredAppointments.length > 0 ? filteredAppointments.map((apt) => (
                  <tr key={apt.id} onClick={() => handleOpenDetail(apt)} className="hover:bg-muted/20 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-foreground font-bold">
                        <Clock className="h-4 w-4 text-primary" />
                        {apt.time}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{apt.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{apt.patientName}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{apt.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium flex items-center gap-1.5 text-foreground">
                        <Stethoscope className="h-3 w-3 text-muted-foreground" />
                        {apt.doctorName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getTypeStyle(apt.type)}`}>
                        {apt.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => handleOpenEdit(apt, e)} className="p-1.5 bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={(e) => handleDelete(apt.id, e)} className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors" title="Cancel Appointment">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No appointments found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TIMELINE / CALENDAR VIEW --- */}
        {viewMode === "calendar" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" /> Today's Timeline ({new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })})
              </h3>
              <div className="text-xs font-bold bg-muted/50 px-3 py-1.5 rounded-lg border border-border/60">
                Operating Hours: {hospitalOpenTime} - {hospitalCloseTime}
              </div>
            </div>
            
            <div className="relative border-l-2 border-border/60 ml-4 pl-6 space-y-4">
              {timelineGrid.map((slot, i) => (
                <div key={i} className="relative group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[31px] top-4 h-3.5 w-3.5 rounded-full ring-4 ring-background ${slot.appointments.length > 0 ? (slot.appointments.some(a => a.type === 'Emergency' || a.type === 'ICU') ? 'bg-red-500 animate-pulse' : 'bg-primary') : 'bg-muted-foreground/30'}`}></div>
                  
                  {slot.appointments.length > 0 ? (
                    slot.appointments.map(apt => (
                      <div key={apt.id} className={`p-4 rounded-2xl border bg-background/40 hover:bg-muted/30 transition-all cursor-pointer mb-3 ${getTypeStyle(apt.type).replace('bg-', 'hover:bg-').replace('text-', '')}`} onClick={() => handleOpenDetail(apt)}>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex gap-4">
                            <div className="hidden sm:flex flex-col items-center justify-center p-3 rounded-xl bg-muted/50 border border-border/40 h-16 w-20 shrink-0">
                              <span className="font-bold text-sm text-foreground">{apt.time.split(" ")[0]}</span>
                              <span className="text-[10px] font-bold text-muted-foreground">{apt.time.split(" ")[1]}</span>
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-extrabold text-base text-foreground">{apt.patientName}</h4>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getTypeStyle(apt.type)}`}>
                                  {apt.type}
                                </span>
                                {(apt.type === "Emergency" || apt.type === "ICU") && <AlertTriangle className="h-3.5 w-3.5 text-red-500 animate-pulse" />}
                              </div>
                              
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                                <span className="flex items-center gap-1 font-medium text-foreground"><Stethoscope className="h-3 w-3" /> {apt.doctorName}</span>
                                <span>•</span>
                                <span>{apt.diagnosis}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(apt.status)}`}>
                              {apt.status}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1"><Clock className="h-3 w-3" /> {apt.treatmentDuration}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div 
                      className="p-3 rounded-xl border border-dashed border-border/60 bg-muted/10 hover:bg-muted/30 transition-all cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        handleOpenAdd();
                        setFormData(prev => ({ ...prev, date: todayStr, time: slot.time }));
                      }}
                    >
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="w-16 font-mono text-xs font-bold text-right">{slot.time}</div>
                        <div className="text-xs font-medium italic">Available Slot</div>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-popover border border-border/80 shadow-2xl rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className="sticky top-0 bg-popover/90 backdrop-blur-md p-6 border-b border-border/40 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold">{editingAppointment ? "Edit Appointment" : "Schedule New Appointment"}</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 bg-muted/50 hover:bg-muted rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> {formError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Patient Name</label>
                  <select 
                    required 
                    value={formData.patientId || ""} 
                    onChange={e => setFormData({...formData, patientId: e.target.value})} 
                    className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"
                  >
                    <option value="">Select Patient</option>
                    {patientsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Doctor Name</label>
                  <select 
                    required 
                    value={formData.doctorId || ""} 
                    onChange={e => setFormData({...formData, doctorId: e.target.value})} 
                    className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"
                  >
                    <option value="">Select Doctor</option>
                    {doctorsList.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Appointment Type</label>
                  <select required value={formData.type || "Regular"} onChange={e => setFormData({...formData, type: e.target.value as AppointmentType})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary">
                    <option value="Regular">Regular</option>
                    <option value="Emergency">Emergency</option>
                    <option value="ICU">ICU</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Status</label>
                  <select required value={formData.status || "Scheduled"} onChange={e => setFormData({...formData, status: e.target.value as AppointmentStatus})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary">
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Date</label>
                  <input type="date" required value={formData.date || ""} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Time</label>
                  <select 
                    required 
                    disabled={!formData.date || !formData.doctorId}
                    value={formData.time || ""} 
                    onChange={e => setFormData({...formData, time: e.target.value})} 
                    className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary text-foreground disabled:opacity-50"
                  >
                    <option value="">{(!formData.date || !formData.doctorId) ? "Select Date & Doctor first" : "Select Time Slot"}</option>
                    {formData.date && formData.doctorId && generateTimeSlots(formData.date, formData.doctorId).map(slot => (
                      <option key={slot.time} value={slot.time} disabled={!slot.available}>
                        {slot.time} {!slot.available ? `(Booked by ${slot.conflictPatient})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-border/40">
                  <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Medical Details (Optional)</h4>
                </div>

                {formData.type === "ICU" && (
                  <>
                    <div className="space-y-1.5 md:col-span-2 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                      <h5 className="text-xs font-bold text-red-500 mb-3 flex items-center gap-1"><Activity className="h-3 w-3" /> ICU Patient Tracking</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Condition / Stability Index</label>
                          <input type="text" placeholder="e.g. Critical, SpO2 89%, BP 90/60" value={formData.icuCondition || ""} onChange={e => setFormData({...formData, icuCondition: e.target.value})} className="w-full h-10 px-3 bg-background border border-red-500/30 rounded-lg text-sm focus:outline-none focus:border-red-500" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Assigned Critical Care Nurse</label>
                          <input type="text" placeholder="Nurse Name / ID" value={formData.nurseAssigned || ""} onChange={e => setFormData({...formData, nurseAssigned: e.target.value})} className="w-full h-10 px-3 bg-background border border-red-500/30 rounded-lg text-sm focus:outline-none focus:border-red-500" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Diagnosis / Reason</label>
                  <input type="text" value={formData.diagnosis || ""} onChange={e => setFormData({...formData, diagnosis: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Medication Prescribed</label>
                  <input type="text" value={formData.medication || ""} onChange={e => setFormData({...formData, medication: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Est. Treatment Duration</label>
                  <input type="text" placeholder="e.g. 30 mins" value={formData.treatmentDuration || ""} onChange={e => setFormData({...formData, treatmentDuration: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div className="pt-6 flex items-center justify-end gap-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="rounded-xl" disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-6 min-w-[140px]">
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-white/20 border-t-white animate-spin rounded-full"></div>
                  ) : editingAppointment ? "Save Changes" : "Create Appointment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DETAIL / FOLLOW-UP MODAL --- */}
      {isDetailOpen && viewingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-popover border border-border/80 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-border/40 flex items-start justify-between bg-gradient-to-br from-primary/10 to-transparent">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <User className="h-5 w-5 text-primary" /> {viewingAppointment.patientName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-1">
                  {viewingAppointment.id} • {viewingAppointment.date} @ {viewingAppointment.time}
                </div>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="p-2 bg-background/50 hover:bg-muted rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getTypeStyle(viewingAppointment.type)}`}>
                  {viewingAppointment.type}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(viewingAppointment.status)}`}>
                  {viewingAppointment.status}
                </span>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                  <div className="text-xs text-muted-foreground mb-1 font-semibold flex items-center gap-1.5"><Stethoscope className="h-3 w-3" /> Attending Doctor</div>
                  <div className="font-bold text-foreground">{viewingAppointment.doctorName}</div>
                </div>

                <div>
                  <h4 className="text-sm font-bold border-b border-border/40 pb-2 mb-3 flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-primary" /> Appointment Notes
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Reason / Diagnosis</span>
                      <span className="font-bold text-foreground">{viewingAppointment.diagnosis || "Not specified"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Medication</span>
                      <span className="font-medium text-foreground">{viewingAppointment.medication || "None prescribed"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Duration</span>
                      <span className="font-medium text-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {viewingAppointment.treatmentDuration || "TBD"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-muted/30 border-t border-border/40 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>Close</Button>
              <Button 
                size="sm" 
                className="bg-primary text-primary-foreground font-bold"
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenEdit(viewingAppointment);
                }}
              >
                Edit & Schedule Follow-up
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
