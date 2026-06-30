"use client";

import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit, 
  Eye, 
  Trash2, 
  X,
  FileText,
  Activity,
  HeartPulse
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

// --- Types ---
type PatientStatus = "Admitted" | "Discharged" | "Under Treatment" | "Critical";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone: string;
  address: string;
  diagnosis: string;
  assignedDoctor: string;
  assignedDoctorId?: string;
  medication: string;
  admissionDate: string;
  status: PatientStatus;
  flutterProfileId?: string;
  email?: string;
  aadharNumber?: string;
  cupatId?: string;
}

export function PatientsModule({ initialSearchQuery = "" }: { initialSearchQuery?: string }) {
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [doctors, setDoctors] = React.useState<{id: string, name: string}[]>([]);
  const [searchQuery, setSearchQuery] = React.useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = React.useState<string>("All");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);
  
  // Modals
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [editingPatient, setEditingPatient] = React.useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = React.useState<Patient | null>(null);

  // Global Search State
  const [globalSearchValue, setGlobalSearchValue] = React.useState("");
  const [globalSearchLoading, setGlobalSearchLoading] = React.useState(false);
  const [globalSearchResults, setGlobalSearchResults] = React.useState<any[]>([]);
  const [showDropdown, setShowDropdown] = React.useState(false);

  React.useEffect(() => {
    const fetchGlobal = async () => {
      if (globalSearchValue.length < 2) {
        setGlobalSearchResults([]);
        return;
      }
      setGlobalSearchLoading(true);
      try {
        const res = await apiFetch(`/patients/global?search=${globalSearchValue}`);
        if (res.success) setGlobalSearchResults(res.profiles || []);
      } catch (err) {} finally { setGlobalSearchLoading(false); }
    };
    const timer = setTimeout(fetchGlobal, 300);
    return () => clearTimeout(timer);
  }, [globalSearchValue]);

  const selectGlobalProfile = (profile: any) => {
    setFormData(prev => ({
      ...prev,
      name: profile.full_name || prev.name,
      age: profile.age || prev.age,
      email: profile.email || prev.email,
      aadharNumber: profile.aadhar_number || prev.aadharNumber,
      cupatId: profile.cupat_id || prev.cupatId,
      flutterProfileId: profile.id
    }));
    setShowDropdown(false);
  };

  // AI Summary State
  const [aiSummaryLoading, setAiSummaryLoading] = React.useState(false);
  const [aiSummary, setAiSummary] = React.useState<string | null>(null);
  const [globalRecords, setGlobalRecords] = React.useState<any[]>([]);

  // Form State
  const [formData, setFormData] = React.useState<Partial<Patient>>({});

  // --- Fetch Patients from Backend ---
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/patients");
      if (res.success && res.patients && res.patients.length > 0) {
        const mapped: Patient[] = res.patients.map((p: any) => ({
          id: p.id,
          name: p.patient_name || p.name || "Unknown Patient",
          age: p.age || 30,
          gender: p.gender || "Other",
          bloodGroup: p.blood_group || p.bloodGroup || "O+",
          phone: p.phone || p.phone_number || "",
          address: p.address || "",
          diagnosis: p.diagnosis || "General Observation",
          assignedDoctor: p.doctors?.doctor_name || p.assignedDoctor || "Dr. Unassigned",
          assignedDoctorId: p.assigned_doctor_id || p.assignedDoctorId || "",
          flutterProfileId: p.flutter_profile_id || "",
          email: p.email || "",
          aadharNumber: p.aadhar_number || "",
          cupatId: p.cupat_id || "",
          medication: p.medication || "None",
          admissionDate: p.admission_date || p.admissionDate || new Date().toISOString().split("T")[0],
          status: (p.status as PatientStatus) || "Admitted"
        }));
        setPatients(mapped);
      }
    } catch (err) {
      console.warn("Using fallback patients data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await apiFetch("/doctors");
      if (res.success && res.doctors) {
        setDoctors(res.doctors.map((d: any) => ({ id: d.id, name: d.doctor_name })));
      }
    } catch (err) {
      console.warn("Could not fetch doctors for dropdown");
    }
  };

  React.useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  // --- Handlers ---
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleOpenAdd = () => {
    setEditingPatient(null);
    setFormData({
      status: "Admitted",
      admissionDate: new Date().toISOString().split('T')[0],
      assignedDoctorId: ""
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({ ...patient });
    setIsFormOpen(true);
  };

  const handleOpenHistory = (patient: Patient) => {
    setViewingPatient(patient);
    setAiSummary(null);
    setGlobalRecords([]);
    setIsHistoryOpen(true);
  };

  const handleFetchAiSummary = async (patient: Patient) => {
    if (!patient.flutterProfileId) return;
    setAiSummaryLoading(true);
    try {
      const res = await apiFetch("/patients/summary", {
        method: "POST",
        body: JSON.stringify({ profile_id: patient.flutterProfileId })
      });
      if (res.success) {
        setAiSummary(res.summary);
        setGlobalRecords(res.records || []);
      } else {
        setAiSummary("Failed to generate AI summary.");
      }
    } catch (err) {
      setAiSummary("Error generating AI summary.");
    } finally {
      setAiSummaryLoading(false);
    }
  };

  // Legacy manual search handler removed since we use dynamic dropdown


  const handleDelete = async (id: string) => {
    setPatients(patients.filter(p => p.id !== id));
    try {
      await apiFetch(`/patients/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Delete patient error:", err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      patient_name: formData.name,
      age: formData.age,
      gender: formData.gender,
      blood_group: formData.bloodGroup,
      phone: formData.phone,
      address: formData.address,
      diagnosis: formData.diagnosis,
      assigned_doctor_id: formData.assignedDoctorId || null,
      flutter_profile_id: formData.flutterProfileId || null,
      medication: formData.medication,
      status: formData.status,
      email: formData.email,
      aadhar_number: formData.aadharNumber,
      cupat_id: formData.cupatId
    };

    if (editingPatient) {
      setPatients(patients.map(p => p.id === editingPatient.id ? { ...p, ...formData } as Patient : p));
      try {
        const res = await apiFetch(`/patients/${editingPatient.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        if (res.success) fetchPatients();
      } catch (err) {
        console.error("Update error", err);
      }
    } else {
      const tempId = `P-${Math.floor(Math.random() * 9000) + 1000}`;
      setPatients([{ ...formData, id: tempId } as Patient, ...patients]);
      try {
        const res = await apiFetch("/patients", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        if (res.success) fetchPatients();
      } catch (err) {
        console.error("Add error", err);
      }
    }
    setIsFormOpen(false);
  };

  // --- Filtering ---
  const filteredPatients = patients.filter(p => {
    const pName = p.name || "";
    const pId = p.id || "";
    const pDiag = p.diagnosis || "";
    const matchesSearch = pName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          pId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pDiag.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Patient Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage hospital admissions, records, and medical history.</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Patient
        </Button>
      </div>

      {/* TOOLBAR */}
      <div className="glass-panel p-4 rounded-2xl border border-border/80 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by ID, Name, or Diagnosis..." 
            value={searchQuery}
            onChange={handleSearch}
            className="w-full h-10 pl-9 pr-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-foreground"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 bg-background/50 border border-border/60 rounded-xl text-sm px-3 focus:outline-none focus:border-primary text-foreground"
          >
            <option value="All">All Statuses</option>
            <option value="Admitted">Admitted</option>
            <option value="Under Treatment">Under Treatment</option>
            <option value="Critical">Critical</option>
            <option value="Discharged">Discharged</option>
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="glass-card rounded-3xl border border-border/80 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/40">
              <tr>
                <th className="px-6 py-4">Patient Details</th>
                <th className="px-6 py-4">Vitals / Bio</th>
                <th className="px-6 py-4">Diagnosis</th>
                <th className="px-6 py-4">Assigned Doctor</th>
                <th className="px-6 py-4">Admission</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground text-base">{patient.name}</div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{patient.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-muted px-2 py-1 rounded-md">{patient.age} yrs</span>
                      <span className="text-xs bg-muted px-2 py-1 rounded-md">{patient.gender.charAt(0)}</span>
                      <span className="text-xs font-bold bg-red-500/10 text-red-500 px-2 py-1 rounded-md border border-red-500/20">{patient.bloodGroup}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">{patient.diagnosis}</td>
                  <td className="px-6 py-4 text-muted-foreground">{patient.assignedDoctor}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{patient.admissionDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      patient.status === 'Discharged' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      patient.status === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' :
                      patient.status === 'Under Treatment' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenHistory(patient)} className="p-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors" title="View History">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleOpenEdit(patient)} className="p-1.5 bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(patient.id)} className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No patients found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing 1 to {filteredPatients.length} of {filteredPatients.length} entries</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs" disabled>Prev</Button>
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs bg-primary/10 text-primary border-primary/20">1</Button>
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs" disabled>Next</Button>
          </div>
        </div>
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-popover border border-border/80 shadow-2xl rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className="sticky top-0 bg-popover/90 backdrop-blur-md p-6 border-b border-border/40 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold">{editingPatient ? "Edit Patient Record" : "Add New Patient"}</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 bg-muted/50 hover:bg-muted rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              {!editingPatient && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3 mb-4">
                  <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                    <Search className="h-4 w-4" /> Global Patient Search
                  </h4>
                  <p className="text-xs text-muted-foreground">Search by name, email, Aadhar, or CUPAT ID to auto-fill.</p>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={globalSearchValue}
                      onChange={(e) => {
                        setGlobalSearchValue(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Type to search global records..."
                      className="w-full h-10 px-3 bg-background border border-border/60 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                    {globalSearchLoading && <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">Searching...</span>}
                    {showDropdown && globalSearchResults.length > 0 && (
                      <div className="absolute z-20 top-full mt-1 w-full bg-popover border border-border/80 rounded-lg shadow-xl max-h-60 overflow-auto">
                        {globalSearchResults.map((r, i) => (
                          <div 
                            key={i} 
                            className="p-3 border-b border-border/40 hover:bg-muted/50 cursor-pointer flex justify-between items-center"
                            onClick={() => selectGlobalProfile(r)}
                          >
                            <div>
                              <div className="font-bold text-sm text-foreground">{r.full_name}</div>
                              <div className="text-xs text-muted-foreground">{r.email || "No Email"}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-mono text-primary">{r.cupat_id}</div>
                              <div className="text-[10px] text-muted-foreground">{r.aadhar_number || "No Aadhar"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                  <input type="text" required value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="Enter patient name" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Email</label>
                  <input type="email" value={formData.email || ""} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="Email address" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Aadhar Number</label>
                  <input type="text" value={formData.aadharNumber || ""} onChange={e => setFormData({...formData, aadharNumber: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="12-digit Aadhar" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">CUPAT ID</label>
                  <input type="text" value={formData.cupatId || ""} onChange={e => setFormData({...formData, cupatId: e.target.value})} className="w-full h-11 px-4 bg-muted border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary text-muted-foreground" placeholder="Auto-generated if empty" readOnly />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Age</label>
                  <input type="number" required value={formData.age || ""} onChange={e => setFormData({...formData, age: parseInt(e.target.value)})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Gender</label>
                  <select required value={formData.gender || ""} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Blood Group</label>
                  <select required value={formData.bloodGroup || ""} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary">
                    <option value="">Select Group</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                  <input type="tel" required value={formData.phone || ""} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="10-digit number" />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Address</label>
                  <input type="text" required value={formData.address || ""} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>

                <div className="space-y-1.5 md:col-span-2 pt-4 border-t border-border/40">
                  <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Medical Details</h4>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Diagnosis</label>
                  <input type="text" required value={formData.diagnosis || ""} onChange={e => setFormData({...formData, diagnosis: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Assigned Doctor</label>
                  <select 
                    required 
                    value={formData.assignedDoctorId || ""} 
                    onChange={e => setFormData({...formData, assignedDoctorId: e.target.value})} 
                    className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Current Status</label>
                  <select required value={formData.status || "Admitted"} onChange={e => setFormData({...formData, status: e.target.value as PatientStatus})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary">
                    <option value="Admitted">Admitted</option>
                    <option value="Under Treatment">Under Treatment</option>
                    <option value="Critical">Critical</option>
                    <option value="Discharged">Discharged</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Prescribed Medication</label>
                  <input type="text" value={formData.medication || ""} onChange={e => setFormData({...formData, medication: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div className="pt-6 flex items-center justify-end gap-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" className="bg-primary text-primary-foreground font-bold rounded-xl px-6">
                  {editingPatient ? "Save Changes" : "Register Patient"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- HISTORY MODAL --- */}
      {isHistoryOpen && viewingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-popover border border-border/80 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-border/40 flex items-start justify-between bg-gradient-to-br from-primary/10 to-transparent">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xl">
                  {viewingPatient.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{viewingPatient.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-1">
                    <FileText className="h-3 w-3" /> {viewingPatient.id}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 bg-background/50 hover:bg-muted rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Blood Group</div>
                  <div className="font-bold text-red-500">{viewingPatient.bloodGroup}</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Age / Gender</div>
                  <div className="font-bold">{viewingPatient.age} yrs, {viewingPatient.gender}</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold border-b border-border/40 pb-2 mb-3 flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-primary" /> Diagnosis & Treatment
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Primary Diagnosis</span>
                    <span className="font-bold">{viewingPatient.diagnosis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Attending Doctor</span>
                    <span className="font-medium">{viewingPatient.assignedDoctor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Medication</span>
                    <span className="font-medium">{viewingPatient.medication}</span>
                  </div>
                </div>
              </div>

              {viewingPatient.flutterProfileId && (
                <div className="mt-6 border-t border-border/40 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-purple-500" /> Global AI Summary (Blockchain)
                    </h4>
                    {!aiSummary && (
                      <Button 
                        size="sm" 
                        onClick={() => handleFetchAiSummary(viewingPatient)}
                        disabled={aiSummaryLoading}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs"
                      >
                        {aiSummaryLoading ? "Generating..." : "Generate Insights"}
                      </Button>
                    )}
                  </div>
                  
                  {aiSummary && (
                    <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl text-sm leading-relaxed text-foreground">
                      {aiSummary}
                    </div>
                  )}

                  {globalRecords.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Immutable Blockchain Records</h5>
                      {globalRecords.map((record, i) => (
                        <div key={i} className="bg-muted/40 border border-border/50 p-3 rounded-lg text-xs">
                          <div className="flex justify-between font-bold mb-1">
                            <span>{new Date(record.created_at).toLocaleDateString()}</span>
                            <span className="text-primary">{record.hospital_name}</span>
                          </div>
                          <div className="text-muted-foreground mb-1"><span className="font-semibold text-foreground">Diagnosis:</span> {record.diagnosis}</div>
                          <div className="text-muted-foreground"><span className="font-semibold text-foreground">Treatment:</span> {record.course_of_treatment}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold border-b border-border/40 pb-2 mb-3 mt-4">Admission Timeline</h4>
                <div className="relative pl-4 border-l-2 border-primary/30 space-y-4">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background"></div>
                    <div className="text-xs font-bold">{viewingPatient.status}</div>
                    <div className="text-[10px] text-muted-foreground">Current Status</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-muted-foreground ring-4 ring-background"></div>
                    <div className="text-xs font-bold">Admitted to Hospital</div>
                    <div className="text-[10px] text-muted-foreground">{viewingPatient.admissionDate}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-muted/30 border-t border-border/40 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(false)}>Close Record</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
