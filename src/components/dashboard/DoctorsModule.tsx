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
  Stethoscope,
  Award,
  Users,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Upload
} from "lucide-react";
import { apiFetch, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";

// --- Types ---
type VerificationStatus = "Verified" | "Pending" | "Rejected";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  licenseNumber: string;
  aadhaarNumber: string;
  experienceYears: number;
  contactNumber: string;
  assignedPatients: string[]; 
  verificationStatus: VerificationStatus;
  email_id?: string;
  age?: number;
  current_hospital?: string;
  cudoc_id?: string;
}

// --- Mock Data Fallback ---
export function DoctorsModule({ initialSearchQuery = "", onDataChange }: { initialSearchQuery?: string, onDataChange?: () => void }) {
  const [doctors, setDoctors] = React.useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = React.useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = React.useState<string>("All");

  React.useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);
  
  // Modals
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isAssignOpen, setIsAssignOpen] = React.useState(false);
  
  const [editingDoctor, setEditingDoctor] = React.useState<Doctor | null>(null);
  const [assigningDoctor, setAssigningDoctor] = React.useState<Doctor | null>(null);

  // Form State
  const [formData, setFormData] = React.useState<Partial<Doctor>>({});
  const [newPatientUid, setNewPatientUid] = React.useState("");
  const [qualificationInput, setQualificationInput] = React.useState("");
  const [specializationInput, setSpecializationInput] = React.useState("");
  const QUALIFICATIONS = ["MBBS", "MD", "DO", "MS", "DNB", "FRCS", "MRCP"];
  const SPECIALIZATIONS = ["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Oncology", "General Medicine", "Dermatology"];
  // Global Search State
  const [globalSearchValue, setGlobalSearchValue] = React.useState("");
  const [globalSearchLoading, setGlobalSearchLoading] = React.useState(false);
  const [globalSearchResults, setGlobalSearchResults] = React.useState<any[]>([]);
  const [showDropdown, setShowDropdown] = React.useState(false);

  // --- Fetch Doctors from Backend ---
  const fetchDoctors = async () => {
    try {
      const res = await apiFetch("/doctors");
      if (res.success && res.doctors && res.doctors.length > 0) {
        const mapped: Doctor[] = res.doctors.map((d: any) => ({
          id: d.id,
          name: d.doctor_name || d.name || "Dr. Unknown",
          specialization: d.specialization || "General Medicine",
          qualification: d.qualification || "MBBS",
          licenseNumber: d.medical_license_number || d.licenseNumber || "MED-000",
          aadhaarNumber: d.aadhaar_number || d.aadhaarNumber || "0000-0000-0000",
          experienceYears: d.years_of_experience || d.experienceYears || 5,
          contactNumber: d.contact_number || d.contactNumber || "",
          assignedPatients: d.assigned_patients ? d.assigned_patients.map((p: any) => p.patient_name || p.id) : (Array.isArray(d.assignedPatients) ? d.assignedPatients : []),
          verificationStatus: (d.verification_status as VerificationStatus) || "Pending",
          email_id: d.email_id || "",
          age: d.age || 0,
          current_hospital: d.current_hospital && d.current_hospital.length > 0 ? d.current_hospital[0] : "",
          cudoc_id: d.cudoc_id || ""
        }));
        setDoctors(mapped);
      }
    } catch (err) {
      console.warn("Using fallback doctors data");
    }
  };

  React.useEffect(() => {
    fetchDoctors();
  }, []);

  // Global Search logic for doctors (reusing profiles API)
  React.useEffect(() => {
    const fetchGlobal = async () => {
      if (globalSearchValue.length < 2) {
        setGlobalSearchResults([]);
        return;
      }
      setGlobalSearchLoading(true);
      try {
        const res = await apiFetch(`/patients/global?search=${globalSearchValue}`);
        // We might get patients or doctors back, let's just filter it on the client loosely or let the user choose
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
      email_id: profile.email || prev.email_id,
      aadhaarNumber: profile.aadhar_number || prev.aadhaarNumber,
      cudoc_id: profile.cudoc_id || prev.cudoc_id,
      age: profile.age || prev.age
    }));
    setShowDropdown(false);
  };


  // --- Handlers ---
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleOpenAdd = () => {
    setEditingDoctor(null);
    setFormData({
      verificationStatus: "Pending",
      assignedPatients: [],
      qualification: "",
      specialization: ""
    });
    setIsFormOpen(true);
  };

  const handleOpenAssign = (doctor: Doctor) => {
    setAssigningDoctor(doctor);
    setNewPatientUid("");
    setIsAssignOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDoctors(doctors.filter(d => d.id !== id));
    try {
      await apiFetch(`/doctors/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Delete doctor error:", err);
    }
  };

  // removed upload function
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      doctor_name: formData.name,
      specialization: formData.specialization,
      qualification: formData.qualification,
      medical_license_number: formData.licenseNumber,
      aadhaar_number: formData.aadhaarNumber,
      years_of_experience: formData.experienceYears,
      contact_number: formData.contactNumber,
      verification_status: "Pending", // Always enforce pending initially
      email_id: formData.email_id,
      age: formData.age,
      current_hospital: formData.current_hospital,
      cudoc_id: formData.cudoc_id
    };

    if (editingDoctor) {
      setDoctors(doctors.map(d => d.id === editingDoctor.id ? { ...d, ...formData, verificationStatus: "Pending" } as Doctor : d));
      try {
        const res = await apiFetch(`/doctors/${editingDoctor.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        if (res.success && onDataChange) {
          onDataChange();
        }
      } catch (err) {
        console.error("Update doctor error", err);
      }
    } else {
      const tempId = `DOC-${Math.floor(Math.random() * 9000) + 1000}`;
      setDoctors([{ ...formData, id: tempId, assignedPatients: [], verificationStatus: "Pending" } as Doctor, ...doctors]);
      try {
        const res = await apiFetch("/doctors", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        if (res.success) {
          fetchDoctors();
          if (onDataChange) onDataChange();
        }
      } catch (err) {
        console.error("Add doctor error", err);
      }
    }
    setIsFormOpen(false);
  };

  const handleAssignPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (assigningDoctor && newPatientUid.trim() !== "") {
      const updatedDoctor = { 
        ...assigningDoctor, 
        assignedPatients: [...assigningDoctor.assignedPatients, newPatientUid.trim()] 
      };
      setDoctors(doctors.map(d => d.id === assigningDoctor.id ? updatedDoctor : d));
      setAssigningDoctor(updatedDoctor);
      setNewPatientUid("");
    }
  };

  const handleRemovePatient = (patientUid: string) => {
    if (assigningDoctor) {
      const updatedDoctor = { 
        ...assigningDoctor, 
        assignedPatients: assigningDoctor.assignedPatients.filter(uid => uid !== patientUid) 
      };
      setDoctors(doctors.map(d => d.id === assigningDoctor.id ? updatedDoctor : d));
      setAssigningDoctor(updatedDoctor);
    }
  };

  // --- Filtering ---
  const filteredDoctors = doctors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || d.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Doctor Directory</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage medical staff, verification status, and active cases.</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Doctor
        </Button>
      </div>

      {/* TOOLBAR */}
      <div className="glass-panel p-4 rounded-2xl border border-border/80 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by ID, Name, or Specialization..." 
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
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="glass-card rounded-3xl border border-border/80 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/40">
              <tr>
                <th className="px-6 py-4">Doctor Details</th>
                <th className="px-6 py-4">Specialization</th>
                <th className="px-6 py-4">Credentials</th>
                <th className="px-6 py-4">Active Cases</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredDoctors.length > 0 ? filteredDoctors.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground text-base">{doctor.name}</div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{doctor.cudoc_id || doctor.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-muted/50 px-3 py-1 rounded-md text-xs font-semibold">{doctor.specialization}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground text-xs flex items-center gap-1.5"><Award className="h-3 w-3 text-primary" /> {doctor.qualification}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{doctor.licenseNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                        {doctor.assignedPatients.length}
                      </div>
                      <span className="text-xs text-muted-foreground">Patients</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      doctor.verificationStatus === 'Verified' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      doctor.verificationStatus === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {doctor.verificationStatus === 'Verified' && <ShieldCheck className="h-3 w-3" />}
                      {doctor.verificationStatus === 'Pending' && <ShieldAlert className="h-3 w-3" />}
                      {doctor.verificationStatus === 'Rejected' && <ShieldX className="h-3 w-3" />}
                      {doctor.verificationStatus}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenAssign(doctor)} className="p-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors" title="Assign Patients">
                        <Users className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(doctor.id)} className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors" title="Remove Doctor">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No doctors found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD/EDIT DOCTOR MODAL --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-popover border border-border/80 shadow-2xl rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <div className="sticky top-0 bg-popover/90 backdrop-blur-md p-6 border-b border-border/40 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold">{editingDoctor ? "Edit Doctor Profile" : "Register New Doctor"}</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 bg-muted/50 hover:bg-muted rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">

              {!editingDoctor && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3 mb-4">
                  <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                    <Search className="h-4 w-4" /> Global Doctor Search
                  </h4>
                  <p className="text-xs text-muted-foreground">Search by name, email, Aadhar, or CUDOC ID to auto-fill.</p>
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
                              <div className="text-xs font-mono text-primary">{r.cudoc_id || r.cupat_id}</div>
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
                  <input type="text" required value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="Dr. Firstname Lastname" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Email</label>
                  <input type="email" value={formData.email_id || ""} onChange={e => setFormData({...formData, email_id: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="Email address" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">CUDOC ID</label>
                  <input type="text" value={formData.cudoc_id || ""} onChange={e => setFormData({...formData, cudoc_id: e.target.value})} className="w-full h-11 px-4 bg-muted border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary text-muted-foreground" placeholder="Auto-generated if empty" readOnly />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-xs font-semibold text-muted-foreground">Specialization</label>
                  <div className="min-h-11 px-3 py-2 bg-background/50 border border-border/60 rounded-xl text-sm focus-within:border-primary flex flex-wrap gap-2">
                    {(formData.specialization || "").split(",").filter(Boolean).map(spec => (
                      <span key={spec} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md flex items-center gap-1">
                        {spec} <X className="h-3 w-3 cursor-pointer" onClick={() => {
                          const current = (formData.specialization || "").split(",").filter(Boolean);
                          setFormData({...formData, specialization: current.filter(s => s !== spec).join(",")});
                        }} />
                      </span>
                    ))}
                    <input 
                      type="text" 
                      value={specializationInput} 
                      onChange={e => setSpecializationInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && specializationInput.trim() !== "") {
                          e.preventDefault();
                          const current = (formData.specialization || "").split(",").filter(Boolean);
                          if (!current.includes(specializationInput.trim())) {
                            setFormData({...formData, specialization: [...current, specializationInput.trim()].join(",")});
                          }
                          setSpecializationInput("");
                        }
                      }}
                      className="flex-1 min-w-[120px] bg-transparent outline-none" 
                      placeholder="Type or select..." 
                    />
                  </div>
                  {specializationInput.trim().length > 0 && (
                    <div className="absolute z-10 top-full mt-1 w-full bg-popover border border-border/80 shadow-xl rounded-lg max-h-40 overflow-auto p-1">
                      {SPECIALIZATIONS.filter(s => s.toLowerCase().includes(specializationInput.toLowerCase())).map(spec => (
                        <div key={spec} className="px-3 py-2 hover:bg-muted text-sm cursor-pointer rounded-md" onClick={() => {
                          const current = (formData.specialization || "").split(",").filter(Boolean);
                          if (!current.includes(spec)) {
                            setFormData({...formData, specialization: [...current, spec].join(",")});
                          }
                          setSpecializationInput("");
                        }}>{spec}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-xs font-semibold text-muted-foreground">Qualification</label>
                  <div className="min-h-11 px-3 py-2 bg-background/50 border border-border/60 rounded-xl text-sm focus-within:border-primary flex flex-wrap gap-2">
                    {(formData.qualification || "").split(",").filter(Boolean).map(qual => (
                      <span key={qual} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md flex items-center gap-1">
                        {qual} <X className="h-3 w-3 cursor-pointer" onClick={() => {
                          const current = (formData.qualification || "").split(",").filter(Boolean);
                          setFormData({...formData, qualification: current.filter(q => q !== qual).join(",")});
                        }} />
                      </span>
                    ))}
                    <input 
                      type="text" 
                      value={qualificationInput} 
                      onChange={e => setQualificationInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && qualificationInput.trim() !== "") {
                          e.preventDefault();
                          const current = (formData.qualification || "").split(",").filter(Boolean);
                          if (!current.includes(qualificationInput.trim())) {
                            setFormData({...formData, qualification: [...current, qualificationInput.trim()].join(",")});
                          }
                          setQualificationInput("");
                        }
                      }}
                      className="flex-1 min-w-[120px] bg-transparent outline-none" 
                      placeholder="Type or select..." 
                    />
                  </div>
                  {qualificationInput.trim().length > 0 && (
                    <div className="absolute z-10 top-full mt-1 w-full bg-popover border border-border/80 shadow-xl rounded-lg max-h-40 overflow-auto p-1">
                      {QUALIFICATIONS.filter(q => q.toLowerCase().includes(qualificationInput.toLowerCase())).map(qual => (
                        <div key={qual} className="px-3 py-2 hover:bg-muted text-sm cursor-pointer rounded-md" onClick={() => {
                          const current = (formData.qualification || "").split(",").filter(Boolean);
                          if (!current.includes(qual)) {
                            setFormData({...formData, qualification: [...current, qual].join(",")});
                          }
                          setQualificationInput("");
                        }}>{qual}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 relative group">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 cursor-help">
                    Medical License Number
                    <div className="h-3 w-3 rounded-full border border-muted-foreground text-[8px] flex items-center justify-center font-bold">i</div>
                    <div className="absolute left-0 -top-8 hidden group-hover:block bg-foreground text-background text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20">
                      Government verified Doctor ID
                    </div>
                  </label>
                  <input type="text" required value={formData.licenseNumber || ""} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="MED-XXXXX" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Aadhaar Number</label>
                  <input type="text" required value={formData.aadhaarNumber || ""} onChange={e => setFormData({...formData, aadhaarNumber: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="XXXX-XXXX-XXXX" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Years of Experience</label>
                  <input type="number" required value={formData.experienceYears || ""} onChange={e => setFormData({...formData, experienceYears: parseInt(e.target.value)})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" min="0" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Contact Number</label>
                  <input type="tel" required value={formData.contactNumber || ""} onChange={e => setFormData({...formData, contactNumber: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="10-digit number" />
                </div>

                {/* Upload section removed */}

              </div>

              <div className="pt-6 flex items-center justify-end gap-3 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" className="bg-primary text-primary-foreground font-bold rounded-xl px-6">
                  {editingDoctor ? "Save Changes" : "Register Doctor"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ASSIGN PATIENT MODAL --- */}
      {isAssignOpen && assigningDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-popover border border-border/80 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-border/40 flex items-start justify-between bg-gradient-to-br from-primary/10 to-transparent">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2"><Stethoscope className="h-5 w-5 text-primary" /> Active Cases</h3>
                <p className="text-sm text-muted-foreground mt-1">Managing patients for <span className="font-bold text-foreground">{assigningDoctor.name}</span></p>
              </div>
              <button onClick={() => setIsAssignOpen(false)} className="p-2 bg-background/50 hover:bg-muted rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Add New Case */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Assign New Patient</label>
                <form onSubmit={handleAssignPatient} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Patient UID (e.g. P-8021)"
                    value={newPatientUid}
                    onChange={(e) => setNewPatientUid(e.target.value)}
                    className="flex-1 h-10 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                  />
                  <Button type="submit" className="h-10 rounded-xl px-4 bg-primary text-primary-foreground">
                    Assign
                  </Button>
                </form>
              </div>

              {/* Current Cases List */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  Currently Assigned ({assigningDoctor.assignedPatients.length})
                </h4>
                <div className="bg-muted/20 border border-border/40 rounded-xl max-h-[250px] overflow-y-auto">
                  {assigningDoctor.assignedPatients.length > 0 ? (
                    <ul className="divide-y divide-border/40">
                      {assigningDoctor.assignedPatients.map(uid => (
                        <li key={uid} className="p-3 flex items-center justify-between hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                              {uid.charAt(2)}
                            </div>
                            <span className="font-mono text-sm font-bold">{uid}</span>
                          </div>
                          <button onClick={() => handleRemovePatient(uid)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-xs font-semibold">
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No active cases assigned to this doctor.
                    </div>
                  )}
                </div>
              </div>

            </div>
            
            <div className="p-4 bg-muted/30 border-t border-border/40 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsAssignOpen(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
