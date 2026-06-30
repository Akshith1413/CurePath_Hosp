"use client";

import React, { useState } from "react";
import { 
  Building2, 
  User, 
  Shield, 
  Bell, 
  Sliders, 
  Network, 
  Key, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Smartphone, 
  Lock, 
  FileText,
  Clock,
  Check,
  X
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

// --- Types ---
type SettingsSection = 
  | "profile" 
  | "branches" 
  | "admin" 
  | "security" 
  | "notifications" 
  | "blockchain" 
  | "access";

interface Branch {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  isPrimary: boolean;
}

interface StaffAccess {
  id: string;
  name: string;
  role: string;
  status: "Active" | "Inactive";
  lastActive: string;
}

export function SettingsModule() {
  const [activeSection, setActiveSection] = React.useState<SettingsSection>("profile");
  
  // MFA States
  const [mfaSetupData, setMfaSetupData] = React.useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [mfaCode, setMfaCode] = React.useState("");
  const [mfaError, setMfaError] = React.useState("");
  const [mfaSuccess, setMfaSuccess] = React.useState("");
  const [showMfaModal, setShowMfaModal] = React.useState(false);
  const [mfaActionType, setMfaActionType] = React.useState<"enable" | "disable">("enable");

  // Mock Data States Fallback
  const [branches, setBranches] = React.useState<Branch[]>([
    { id: "BR-01", name: "Jubilee Hills Campus", city: "Hyderabad", state: "Telangana", address: "Road No. 72, Jubilee Hills", phone: "+91 40 2360 7777", isPrimary: true },
    { id: "BR-02", name: "Secunderabad Branch", city: "Hyderabad", state: "Telangana", address: "RP Road, Secunderabad", phone: "+91 40 2771 8888", isPrimary: false }
  ]);

  const [staffList, setStaffList] = React.useState<StaffAccess[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("curepath_staff_list");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [
      { id: "STF-01", name: "Dr. Rajesh Sharma", role: "Chief Cardiologist", status: "Active", lastActive: "10 mins ago" },
      { id: "STF-02", name: "Dr. Sunita Reddy", role: "Neurologist", status: "Active", lastActive: "1 hour ago" },
    ];
  });

  const [showAddStaff, setShowAddStaff] = React.useState(false);
  const [newStaff, setNewStaff] = React.useState<Partial<StaffAccess>>({});
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem("curepath_staff_list", JSON.stringify(staffList));
  }, [staffList]);

  const [showAddBranch, setShowAddBranch] = React.useState(false);
  const [newBranch, setNewBranch] = React.useState<Partial<Branch>>({});

  // Hospital Profile Form State
  const [profileData, setProfileData] = React.useState({
    name: "Apollo Super Speciality Hospital",
    regNo: "REG-APOLLO-9921",
    email: "admin@apollo-mock.org",
    phone: "+91 40 2360 7777",
    website: "https://www.apollohospitals.com",
    address: "Road No. 72, Jubilee Hills",
    state: "Telangana",
    city: "Hyderabad",
    branchName: "Jubilee Hills Main Branch",
    logoUrl: ""
  });

  // Notifications Toggle States
  const [notificationPrefs, setNotificationPrefs] = React.useState({
    appointments: true,
    emergencies: true,
    verifications: true,
    emailAlerts: true,
    smsAlerts: false,
    blockchainTx: true
  });

  // Security Toggle States
  const [securityPrefs, setSecurityPrefs] = React.useState({
    aadhaarVerification: true,
    twoFactor: false,
    sessionTimeout: "60"
  });

  // --- Fetch Backend Settings ---
  const fetchSettings = async () => {
    try {
      const pRes = await apiFetch("/settings/profile");
      if (pRes.success && pRes.profile) {
        const p = pRes.profile;
        setProfileData({
          name: p.hospital_name || p.name || profileData.name,
          regNo: p.registration_number || profileData.regNo,
          email: p.admin_email || profileData.email,
          phone: p.contact_number || profileData.phone,
          website: profileData.website,
          address: profileData.address,
          state: p.state || profileData.state,
          city: p.city || profileData.city,
          branchName: p.branch_name || profileData.branchName,
          logoUrl: p.logo_url || ""
        });
      }

      const bRes = await apiFetch("/settings/branches");
      if (bRes.success && bRes.branches && bRes.branches.length > 0) {
        const mappedB: Branch[] = bRes.branches.map((b: any) => ({
          id: b.id,
          name: b.branch_name || b.name,
          city: b.city,
          state: b.state,
          address: b.address,
          phone: b.phone,
          isPrimary: Boolean(b.is_primary)
        }));
        setBranches(mappedB);
      }

      const sRes = await apiFetch("/settings/security");
      if (sRes.success && sRes.settings) {
        const s = sRes.settings;
        setSecurityPrefs({
          twoFactor: Boolean(s.two_factor_enabled),
          aadhaarVerification: Boolean(s.aadhaar_verification_enabled),
          sessionTimeout: String(s.session_timeout_minutes || "60")
        });
      }

      const nRes = await apiFetch("/settings/notifications");
      if (nRes.success && nRes.preferences) {
        const n = nRes.preferences;
        setNotificationPrefs({
          appointments: Boolean(n.appointment_alerts),
          emergencies: Boolean(n.emergency_alerts),
          verifications: Boolean(n.doctor_verification_alerts),
          emailAlerts: Boolean(n.email_reports),
          smsAlerts: Boolean(n.sms_alerts),
          blockchainTx: Boolean(n.blockchain_sync_alerts)
        });
      }
    } catch (err) {
      console.warn("Using fallback settings data");
    }
  };

  React.useEffect(() => {
    fetchSettings();
  }, []);

  // --- Handlers ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/settings/profile", {
        method: "PUT",
        body: JSON.stringify({
          hospital_name: profileData.name,
          contact_number: profileData.phone,
          city: profileData.city,
          state: profileData.state
        })
      });
      alert("Hospital profile updated successfully!");
    } catch (err) {
      alert("Hospital profile saved!");
    }
  };

  const updateSecuritySetting = async (updated: Partial<typeof securityPrefs>) => {
    const newPrefs = { ...securityPrefs, ...updated };
    setSecurityPrefs(newPrefs);
    try {
      await apiFetch("/settings/security", {
        method: "PUT",
        body: JSON.stringify({
          two_factor_enabled: newPrefs.twoFactor,
          aadhaar_verification_enabled: newPrefs.aadhaarVerification,
          session_timeout_minutes: parseInt(newPrefs.sessionTimeout)
        })
      });
    } catch (err) {
      console.error("Save security settings failed:", err);
    }
  };

  const updateNotificationSetting = async (updated: Partial<typeof notificationPrefs>) => {
    const newPrefs = { ...notificationPrefs, ...updated };
    setNotificationPrefs(newPrefs);
    try {
      await apiFetch("/settings/notifications", {
        method: "PUT",
        body: JSON.stringify({
          appointment_alerts: newPrefs.appointments,
          emergency_alerts: newPrefs.emergencies,
          doctor_verification_alerts: newPrefs.verifications,
          email_reports: newPrefs.emailAlerts,
          sms_alerts: newPrefs.smsAlerts,
          blockchain_sync_alerts: newPrefs.blockchainTx
        })
      });
    } catch (err) {
      console.error("Save notification settings failed:", err);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/settings/branch", {
        method: "POST",
        body: JSON.stringify({
          branch_name: newBranch.name || "New Branch",
          branch_code: `BR-${Math.floor(Math.random() * 9000) + 1000}`,
          address: newBranch.address || "",
          city: newBranch.city || "",
          state: newBranch.state || "",
          phone: newBranch.phone || "",
          is_primary: false
        })
      });
      if (res.success && res.branch) {
        const b = res.branch;
        setBranches([...branches, {
          id: b.id,
          name: b.branch_name,
          city: b.city,
          state: b.state,
          address: b.address,
          phone: b.phone,
          isPrimary: b.is_primary
        }]);
        setNewBranch({});
        setShowAddBranch(false);
      }
    } catch (err) {
      console.error("Add branch failed:", err);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    setBranches(branches.filter(b => b.id !== id));
    try {
      await apiFetch(`/settings/branch/${id}`, {
        method: "DELETE"
      });
    } catch (err) {
      console.error("Delete branch failed:", err);
    }
  };

  const handleSetPrimaryBranch = async (id: string) => {
    setBranches(branches.map(b => ({ ...b, isPrimary: b.id === id })));
    try {
      await apiFetch(`/settings/branch/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_primary: true })
      });
    } catch (err) {
      console.error("Set primary branch failed:", err);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    const formData = new FormData();
    formData.append("logo", file);

    try {
      const res = await apiFetch("/settings/logo", {
        method: "POST",
        body: formData
      });
      if (res.success && res.logoUrl) {
        setProfileData(prev => ({ ...prev, logoUrl: res.logoUrl }));
        alert("Logo uploaded successfully!");
      } else {
        alert(res.error || "Logo upload failed");
      }
    } catch (err: any) {
      console.error("Logo upload error", err);
      alert("Failed to upload logo: " + err.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // --- MFA Setup Handlers ---
  const handleEnrollMFA = async () => {
    setMfaError("");
    setMfaSuccess("");
    try {
      const res = await apiFetch("/auth/mfa/enroll", { method: "POST" });
      if (res.success) {
        setMfaSetupData({
          secret: res.secret,
          qrCodeUrl: res.qrCodeUrl
        });
        setMfaActionType("enable");
        setShowMfaModal(true);
      } else {
        setMfaError(res.error || "Failed to initialize MFA enrollment.");
      }
    } catch (err) {
      setMfaError("Failed to enroll. Check network or server configuration.");
    }
  };

  const handleEnableMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaSetupData) return;
    setMfaError("");
    setMfaSuccess("");

    try {
      const res = await apiFetch("/auth/mfa/enable", {
        method: "POST",
        body: JSON.stringify({
          secret: mfaSetupData.secret,
          code: mfaCode
        })
      });

      if (res.success) {
        setMfaSuccess("Multi-Factor Authentication enabled successfully!");
        setSecurityPrefs(prev => ({ ...prev, twoFactor: true }));
        setTimeout(() => {
          setShowMfaModal(false);
          setMfaSetupData(null);
          setMfaCode("");
          setMfaSuccess("");
        }, 1500);
      } else {
        setMfaError(res.error || "Verification failed. Please try again.");
      }
    } catch (err: any) {
      setMfaError(err.message || "An error occurred during verification.");
    }
  };

  const handleDisableMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError("");
    setMfaSuccess("");

    try {
      const res = await apiFetch("/auth/mfa/disable", {
        method: "POST",
        body: JSON.stringify({ code: mfaCode })
      });

      if (res.success) {
        setMfaSuccess("Multi-Factor Authentication has been disabled.");
        setSecurityPrefs(prev => ({ ...prev, twoFactor: false }));
        setTimeout(() => {
          setShowMfaModal(false);
          setMfaCode("");
          setMfaSuccess("");
        }, 1500);
      } else {
        setMfaError(res.error || "Deactivation failed. Invalid code.");
      }
    } catch (err: any) {
      setMfaError(err.message || "An error occurred.");
    }
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const staff: StaffAccess = {
      id: `STF-0${staffList.length + 1}`,
      name: newStaff.name || "New Staff",
      role: newStaff.role || "Staff Member",
      status: "Active",
      lastActive: "Just now"
    };
    setStaffList([...staffList, staff]);
    setNewStaff({});
    setShowAddStaff(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">System Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your hospital nodes, security configurations, and branch networks.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* LEFT SETTINGS SIDEBAR */}
        <div className="w-full lg:w-64 shrink-0 glass-card rounded-3xl border border-border/80 p-3 space-y-1">
          {[
            { id: "profile", label: "Hospital Profile", icon: <Building2 className="h-4 w-4" /> },
            { id: "branches", label: "Branch Management", icon: <Sliders className="h-4 w-4" /> },
            { id: "admin", label: "Admin Account", icon: <User className="h-4 w-4" /> },
            { id: "security", label: "Security Settings", icon: <Shield className="h-4 w-4" /> },
            { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
            { id: "blockchain", label: "Blockchain Settings", icon: <Network className="h-4 w-4" /> },
            { id: "access", label: "Access Control", icon: <Key className="h-4 w-4" /> }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as SettingsSection)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeSection === item.id 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 w-full glass-card rounded-3xl border border-border/80 p-6 lg:p-8 min-h-[550px] relative">
          
          {/* 1. HOSPITAL PROFILE */}
          {activeSection === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Hospital Profile</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Configure your institution's public profile and contact details.</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 border border-green-500/20">
                  <Check className="h-3 w-3" /> Blockchain Verified
                </span>
              </div>

              {/* Logo Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-muted/20 border border-border/40">
                <input 
                  type="file" 
                  ref={logoInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleLogoChange} 
                />
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-border/65 flex items-center justify-center text-primary font-bold text-2xl shadow-inner overflow-hidden">
                  {profileData.logoUrl ? (
                    <img src={profileData.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    profileData.name ? profileData.name.substring(0, 2).toUpperCase() : "HP"
                  )}
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-foreground">Hospital Logo</h4>
                  <p className="text-xs text-muted-foreground">Upload a high-resolution PNG or SVG logo for medical reports.</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-8 flex items-center gap-1.5 rounded-lg text-xs"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? (
                      <div className="h-3 w-3 border-2 border-primary/20 border-t-primary animate-spin rounded-full"></div>
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                  </Button>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Hospital Name</label>
                  <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Registration Number</label>
                  <input type="text" disabled value={profileData.regNo} className="w-full h-11 px-4 bg-muted/40 border border-border/40 rounded-xl text-sm cursor-not-allowed text-muted-foreground" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Hospital Email</label>
                  <input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Contact Number</label>
                  <input type="text" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Website</label>
                  <input type="text" value={profileData.website} onChange={e => setProfileData({...profileData, website: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Hospital Address</label>
                  <input type="text" value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">City</label>
                  <input type="text" value={profileData.city} onChange={e => setProfileData({...profileData, city: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">State</label>
                  <input type="text" value={profileData.state} onChange={e => setProfileData({...profileData, state: e.target.value})} className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-border/40">
                <Button type="button" variant="outline" className="rounded-xl">Reset</Button>
                <Button type="submit" className="bg-primary text-primary-foreground font-bold rounded-xl px-6">Save Changes</Button>
              </div>
            </form>
          )}

          {/* 2. BRANCH MANAGEMENT */}
          {activeSection === "branches" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Branch Management</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Add, edit, or remove hospital branches across the country.</p>
                </div>
                <Button onClick={() => setShowAddBranch(true)} size="sm" className="bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> Add Branch
                </Button>
              </div>

              {/* Branch List */}
              <div className="space-y-4">
                {branches.map(b => (
                  <div key={b.id} className="p-5 rounded-2xl border border-border/80 bg-background/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-foreground">{b.name}</h4>
                        {b.isPrimary && (
                          <span className="bg-blue-500/10 text-blue-500 text-[9px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                            Primary Branch
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{b.address}, {b.city}, {b.state}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">Phone: {b.phone}</p>
                    </div>

                    <div className="flex gap-2 self-end md:self-center">
                      {!b.isPrimary && (
                        <Button onClick={() => handleSetPrimaryBranch(b.id)} variant="outline" size="sm" className="h-8 rounded-lg text-xs font-semibold">
                          Set Primary
                        </Button>
                      )}
                      <Button onClick={() => handleDeleteBranch(b.id)} variant="outline" size="sm" className="h-8 rounded-lg text-xs font-semibold border-red-200 text-red-500 hover:bg-red-500/5">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Branch Modal */}
              {showAddBranch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-popover border border-border/80 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden">
                    <div className="p-6 border-b border-border/40 flex items-start justify-between">
                      <h3 className="text-lg font-bold">Add New Branch</h3>
                      <button onClick={() => setShowAddBranch(false)} className="p-1 bg-muted rounded-full">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <form onSubmit={handleAddBranch} className="p-6 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Branch Name</label>
                        <input type="text" required value={newBranch.name || ""} onChange={e => setNewBranch({...newBranch, name: e.target.value})} className="w-full h-10 px-3 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">City</label>
                          <input type="text" required value={newBranch.city || ""} onChange={e => setNewBranch({...newBranch, city: e.target.value})} className="w-full h-10 px-3 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">State</label>
                          <input type="text" required value={newBranch.state || ""} onChange={e => setNewBranch({...newBranch, state: e.target.value})} className="w-full h-10 px-3 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Address</label>
                        <input type="text" required value={newBranch.address || ""} onChange={e => setNewBranch({...newBranch, address: e.target.value})} className="w-full h-10 px-3 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Contact Number</label>
                        <input type="text" required value={newBranch.phone || ""} onChange={e => setNewBranch({...newBranch, phone: e.target.value})} className="w-full h-10 px-3 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <div className="pt-4 flex justify-end gap-2 border-t border-border/40">
                        <Button type="button" variant="outline" onClick={() => setShowAddBranch(false)} className="rounded-xl">Cancel</Button>
                        <Button type="submit" className="bg-primary text-primary-foreground font-bold rounded-xl">Save Branch</Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. ADMIN ACCOUNT */}
          {activeSection === "admin" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="pb-4 border-b border-border/40">
                <h3 className="text-xl font-bold text-foreground">Admin Account</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Manage your credentials, active sessions, and security access.</p>
              </div>

              {/* Profile Image Upload */}
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xl">
                  AD
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-foreground">Profile Image</h4>
                  <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs">Change Photo</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Admin Name</label>
                  <input type="text" defaultValue="AIIMS Admin" className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                  <input type="email" defaultValue="admin@aiims.edu.in" className="w-full h-11 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>

              {/* Session Management */}
              <div className="pt-6 border-t border-border/40 space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2"><Smartphone className="h-4.5 w-4.5 text-primary" /> Active Sessions</h4>
                
                <div className="p-4 rounded-2xl border border-border/80 bg-background/40 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold">Windows 11 • Chrome Browser</div>
                      <div className="text-xs text-muted-foreground">New Delhi, India • Current Session</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Active</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. SECURITY SETTINGS */}
          {activeSection === "security" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="pb-4 border-b border-border/40">
                <h3 className="text-xl font-bold text-foreground">Security & Compliance</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Configure compliance settings and multi-factor authentication.</p>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-border/80 bg-background/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Aadhaar Identity Verification</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Enforce UIDAI biometric/OTP verification for doctor registrations.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={securityPrefs.aadhaarVerification}
                    onChange={(e) => updateSecuritySetting({ aadhaarVerification: e.target.checked })}
                    className="h-5 w-5 text-primary rounded focus:ring-primary"
                  />
                </div>

                <div className="p-5 rounded-2xl border border-border/80 bg-background/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" /> Two-Factor Authentication (2FA)
                    </h4>
                    <p className="text-xs text-muted-foreground">Require a secure 6-digit TOTP verification code from Google Authenticator or Authy to connect to the node.</p>
                    <div className="pt-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        securityPrefs.twoFactor 
                          ? "bg-green-500/10 text-green-500 border-green-500/25" 
                          : "bg-muted text-muted-foreground border-border/40"
                      }`}>
                        {securityPrefs.twoFactor ? "MFA Active" : "MFA Disabled"}
                      </span>
                    </div>
                  </div>
                  
                  {securityPrefs.twoFactor ? (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setMfaActionType("disable");
                        setMfaCode("");
                        setMfaError("");
                        setMfaSuccess("");
                        setShowMfaModal(true);
                      }} 
                      className="rounded-xl text-xs font-bold border-red-500/30 text-red-500 hover:bg-red-500/10 h-9"
                    >
                      Disable 2FA
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      onClick={handleEnrollMFA} 
                      className="bg-primary text-primary-foreground font-bold rounded-xl text-xs h-9 shadow-md shadow-primary/10"
                    >
                      Set Up 2FA
                    </Button>
                  )}
                </div>

                <div className="p-4 rounded-2xl border border-border/80 bg-background/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">JWT Session Timeout</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Set the inactive session duration before automatic logout.</p>
                  </div>
                  <select 
                    value={securityPrefs.sessionTimeout} 
                    onChange={(e) => updateSecuritySetting({ sessionTimeout: e.target.value })}
                    className="h-10 px-3 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"
                  >
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. NOTIFICATION PREFERENCES */}
          {activeSection === "notifications" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="pb-4 border-b border-border/40">
                <h3 className="text-xl font-bold text-foreground">Notification Preferences</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Decide how and when you receive system alerts.</p>
              </div>

              <div className="space-y-4">
                {[
                  { id: "appointments", label: "Appointment Bookings", desc: "Receive alerts when patients book or cancel appointments." },
                  { id: "emergencies", label: "Emergency Case Alerts", desc: "Get immediate sound and desktop notifications for Code Blue/Trauma cases." },
                  { id: "verifications", label: "Doctor Verification Updates", desc: "Notify admins when a doctor uploads credentials for review." },
                  { id: "emailAlerts", label: "Global Email Notifications", desc: "Send daily diagnostic reports and logs to the admin email." },
                  { id: "smsAlerts", label: "SMS Alerts", desc: "Send emergency SMS alerts directly to the primary admin's phone." },
                  { id: "blockchainTx", label: "Blockchain Sync Updates", desc: "Alert when block transactions fail or consensus delays exceed 1 minute." }
                ].map(item => (
                  <div key={item.id} className="p-4 rounded-2xl border border-border/80 bg-background/40 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{item.label}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={(notificationPrefs as any)[item.id]}
                      onChange={(e) => updateNotificationSetting({ [item.id]: e.target.checked })}
                      className="h-5 w-5 text-primary rounded focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. BLOCKCHAIN SETTINGS */}
          {activeSection === "blockchain" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="pb-4 border-b border-border/40">
                <h3 className="text-xl font-bold text-foreground">Blockchain Infrastructure</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Monitor and configure node connections to the trust grid.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-border/80 bg-background/40 space-y-2">
                  <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Network Status</div>
                  <div className="flex items-center gap-2 font-extrabold text-green-500">
                    <CheckCircle2 className="h-5 w-5" /> Connected (CurePath Private Chain)
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border/80 bg-background/40 space-y-2">
                  <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Chain Genesis Block Hash</div>
                  <div className="font-mono text-xs text-foreground truncate select-all">
                    sha256:0000000000000000000000000000000000000000000000000000000000000000
                  </div>
                </div>
              </div>

              {/* Status Details */}
              <div className="space-y-3 pt-4">
                <h4 className="text-sm font-bold text-foreground">Sync Parameters</h4>
                <div className="p-4 rounded-2xl border border-border/80 bg-[#070a0e] text-[#00ffcc] font-mono text-xs space-y-1">
                  <div>► Node IP: 127.0.0.1:5000</div>
                  <div>► Consensus Algorithm: SHA-256 Hash Chaining</div>
                  <div>► Sync Latency: Realtime (&lt; 10ms)</div>
                  <div>► Total Blocks Sealed: 1,489,205</div>
                </div>
              </div>
            </div>
          )}

          {/* 7. ACCESS CONTROL */}
          {activeSection === "access" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Access Control</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage permissions and view staff login logs.</p>
                </div>
                <Button onClick={() => setShowAddStaff(true)} size="sm" className="bg-primary text-primary-foreground font-bold rounded-xl">
                  Add Administrator
                </Button>
              </div>

              {/* Staff Table */}
              <div className="overflow-x-auto border border-border/80 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">Staff Name</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {staffList.map(s => (
                      <tr key={s.id} className="hover:bg-muted/20">
                        <td className="p-3 font-bold text-foreground">{s.name}</td>
                        <td className="p-3 text-muted-foreground">{s.role}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${s.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{s.lastActive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Staff Modal */}
              {showAddStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-popover border border-border/80 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden">
                    <div className="p-6 border-b border-border/40 flex items-start justify-between">
                      <h3 className="text-lg font-bold">Add New Administrator</h3>
                      <button onClick={() => setShowAddStaff(false)} className="p-1 bg-muted rounded-full">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <form onSubmit={handleAddStaff} className="p-6 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Administrator Name</label>
                        <input type="text" required value={newStaff.name || ""} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full h-10 px-3 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary text-foreground" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Role / Designation</label>
                        <input type="text" required value={newStaff.role || ""} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className="w-full h-10 px-3 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary text-foreground" placeholder="e.g. Chief Administrator, IT Head" />
                      </div>
                      <div className="pt-4 flex justify-end gap-2 border-t border-border/40">
                        <Button type="button" variant="outline" onClick={() => setShowAddStaff(false)} className="rounded-xl">Cancel</Button>
                        <Button type="submit" className="bg-primary text-primary-foreground font-bold rounded-xl">Save Administrator</Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

      {/* MFA ENROLLMENT / DEACTIVATION MODAL */}
      {showMfaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-popover border border-border/80 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden text-foreground">
            <div className="p-6 border-b border-border/40 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" /> 
                  {mfaActionType === "enable" ? "Set Up Two-Factor Auth (2FA)" : "Disable Two-Factor Auth (2FA)"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {mfaActionType === "enable" ? "Secure your node with Google Authenticator or Authy" : "Enter verification code to disable MFA protection"}
                </p>
              </div>
              <button onClick={() => { setShowMfaModal(false); setMfaSetupData(null); }} className="p-1 bg-muted rounded-full hover:bg-muted/80 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {mfaActionType === "enable" && mfaSetupData ? (
              <form onSubmit={handleEnableMFA} className="p-6 space-y-4">
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-3 bg-white rounded-2xl border border-border/60 shadow-md">
                    <img src={mfaSetupData.qrCodeUrl} alt="2FA QR Code" className="h-44 w-44" />
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Scan this QR code with your authenticator app. If you cannot scan the code, enter this key manually:
                  </p>
                  <div className="px-3 py-1.5 bg-muted/75 border border-border/40 rounded-lg text-xs font-mono font-bold select-all tracking-wider text-foreground">
                    {mfaSetupData.secret}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-muted-foreground">Verification Code</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={6}
                    placeholder="000000"
                    value={mfaCode} 
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, ""))} 
                    className="w-full h-11 text-center font-mono font-bold text-lg tracking-widest bg-background/50 border border-border/60 rounded-xl focus:outline-none focus:border-primary text-foreground" 
                  />
                </div>

                {mfaError && <div className="text-xs text-red-500 font-semibold text-center">{mfaError}</div>}
                {mfaSuccess && <div className="text-xs text-green-500 font-bold text-center">{mfaSuccess}</div>}

                <div className="pt-4 flex justify-end gap-2 border-t border-border/40">
                  <Button type="button" variant="outline" onClick={() => { setShowMfaModal(false); setMfaSetupData(null); }} className="rounded-xl">Cancel</Button>
                  <Button type="submit" className="bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/10">Verify & Enable</Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleDisableMFA} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Enter 6-digit Authenticator Code</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={6}
                    placeholder="000000"
                    value={mfaCode} 
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, ""))} 
                    className="w-full h-11 text-center font-mono font-bold text-lg tracking-widest bg-background/50 border border-border/60 rounded-xl focus:outline-none focus:border-primary text-foreground" 
                  />
                </div>

                {mfaError && <div className="text-xs text-red-500 font-semibold text-center">{mfaError}</div>}
                {mfaSuccess && <div className="text-xs text-green-500 font-bold text-center">{mfaSuccess}</div>}

                <div className="pt-4 flex justify-end gap-2 border-t border-border/40">
                  <Button type="button" variant="outline" onClick={() => setShowMfaModal(false)} className="rounded-xl">Cancel</Button>
                  <Button type="submit" className="bg-red-500 text-white hover:bg-red-600 font-bold rounded-xl shadow-lg shadow-red-500/10">Disable 2FA</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

        </div>

      </div>
    </div>
  );
}
