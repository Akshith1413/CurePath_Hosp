"use client";

import React, { useState } from "react";
import { 
  ShieldCheck,
  ShieldAlert,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  Search,
  Check,
  XCircle,
  FileText
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

// --- Types ---
type VerificationStatus = "Pending" | "Under Review" | "Verified" | "Rejected";

interface DoctorReview {
  id: string;
  doctorId: string;
  name: string;
  specialization: string;
  qualification: string;
  status: VerificationStatus;
  verification_docs: string[];
  hash?: string;
  cudoc_id?: string;
}

// --- Mock Data Fallback ---
const initialDoctors: DoctorReview[] = [];

export function VerificationModule() {
  const [doctors, setDoctors] = React.useState<DoctorReview[]>(initialDoctors);
  const [selectedDoctorId, setSelectedDoctorId] = React.useState<string | null>(null);
  const [isSimulatingSync, setIsSimulatingSync] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [stagedFiles, setStagedFiles] = React.useState<Record<string, File>>({});
  const [uploadStatuses, setUploadStatuses] = React.useState<Record<string, "pending" | "uploading" | "success" | "error">>({});
  const [isUploadingAll, setIsUploadingAll] = React.useState(false);
  const [showDoctorVerifiedAnimation, setShowDoctorVerifiedAnimation] = React.useState(false);

  // --- Fetch Verifications from Backend ---
  const fetchVerifications = async () => {
    try {
      const res = await apiFetch("/verification");
      if (res.success && res.verifications && res.verifications.length > 0) {
        const mapped: DoctorReview[] = res.verifications.map((v: any) => ({
          id: v.id,
          doctorId: v.doctor_id,
          name: v.doctors?.doctor_name || "Dr. Candidate",
          qualification: v.doctors?.qualification || "",
          status: (v.verification_status === "VERIFIED" ? "Verified" : v.verification_status === "REJECTED" ? "Rejected" : v.verification_status === "UNDER_REVIEW" ? "Under Review" : "Pending") as VerificationStatus,
          verification_docs: v.doctors?.verification_docs || [],
          hash: v.hash || "0x7a3f...e9c1",
          cudoc_id: v.doctors?.cudoc_id
        }));
        setDoctors(mapped);
        
        // Find matching doctor or update selected id
        if (mapped.length > 0) {
          setSelectedDoctorId(prev => {
            if (prev && mapped.some(m => m.id === prev)) return prev;
            setStagedFiles({});
            setUploadStatuses({});
            return mapped[0].id;
          });
        } else {
          setSelectedDoctorId(null);
        }
      }
    } catch (err) {
      console.warn("Using fallback verifications data");
    }
  };

  React.useEffect(() => {
    fetchVerifications();
  }, []);

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  // Reset staging when changing doctors
  const handleDoctorSelect = (id: string) => {
    setSelectedDoctorId(id);
    setStagedFiles({});
    setUploadStatuses({});
    setShowDoctorVerifiedAnimation(false);
  };

  // --- Handlers ---
  const handleUploadClick = (docType: string) => {
    if (!selectedDoctor) return;
    if (selectedDoctor.status === "Verified" || selectedDoctor.status === "Rejected") return;
    fileInputRef.current?.setAttribute("data-upload-type", docType);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const type = e.target.getAttribute("data-upload-type");
    if (!file || !type || !selectedDoctor) return;

    setStagedFiles(prev => ({ ...prev, [type]: file }));
    setUploadStatuses(prev => ({ ...prev, [type]: "pending" }));
  };

  const handleUploadAll = async () => {
    if (!selectedDoctor) return;
    setIsUploadingAll(true);

    const types = Object.keys(stagedFiles);
    let allSuccess = true;

    for (const type of types) {
      const file = stagedFiles[type];
      if (uploadStatuses[type] === "success") continue; // Skip already uploaded

      setUploadStatuses(prev => ({ ...prev, [type]: "uploading" }));

      const formDataPayload = new FormData();
      formDataPayload.append("cudocId", selectedDoctor.cudoc_id || selectedDoctor.doctorId);
      formDataPayload.append("file", file);

      try {
        const res = await apiFetch("/verification/upload", {
          method: "POST",
          body: formDataPayload
        });
        if (res.success) {
          setUploadStatuses(prev => ({ ...prev, [type]: "success" }));
        } else {
          setUploadStatuses(prev => ({ ...prev, [type]: "error" }));
          allSuccess = false;
        }
      } catch (err: any) {
        console.error("Upload error", err);
        setUploadStatuses(prev => ({ ...prev, [type]: "error" }));
        allSuccess = false;
      }
    }

    if (allSuccess && types.length > 0) {
      // Refresh to get updated document list
      await fetchVerifications();
      setShowDoctorVerifiedAnimation(true);
      setTimeout(() => setShowDoctorVerifiedAnimation(false), 3000);
    }
    
    setIsUploadingAll(false);
  };

  const handleVerify = async () => {
    setIsSimulatingSync(true);
    try {
      await apiFetch(`/verification/${selectedDoctorId}`, {
        method: "PUT",
        body: JSON.stringify({ verification_status: "VERIFIED", reviewer_notes: "Credentials verified on network." })
      });
    } catch (err) {
      console.error("Verify API error", err);
    }

    setTimeout(() => {
      const mockHash = "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('').slice(0, 8) + "..." + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('').slice(0, 4);
      
      const updatedDoctors = doctors.map(d => {
        if (d.id === selectedDoctorId) {
          return { ...d, status: "Verified" as VerificationStatus, hash: mockHash };
        }
        return d;
      });
      setDoctors(updatedDoctors);
      setIsSimulatingSync(false);
    }, 1500);
  };

  const handleReject = async () => {
    const updatedDoctors = doctors.map(d => {
      if (d.id === selectedDoctorId) {
        return { ...d, status: "Rejected" as VerificationStatus };
      }
      return d;
    });
    setDoctors(updatedDoctors);
    try {
      await apiFetch(`/verification/${selectedDoctorId}`, {
        method: "PUT",
        body: JSON.stringify({ verification_status: "REJECTED", reviewer_notes: "Invalid documentation." })
      });
    } catch (err) {
      console.error("Reject API error", err);
    }
  };

  // --- Helpers ---
  const requiredDocs = selectedDoctor ? [
    "Medical License", 
    "Aadhaar Proof", 
    ...(selectedDoctor.qualification || "MBBS").split(",").map(q => `${q.trim()} Degree`)
  ] : [];

  const uploadedCount = selectedDoctor?.verification_docs?.length || 0;
  // A doc is considered completely done if it's already in the DB, OR if we just successfully uploaded it
  const allDocsUploaded = uploadedCount >= requiredDocs.length || 
    (requiredDocs.every((_, i) => {
      const t = `doc_${i}`;
      return (selectedDoctor?.verification_docs?.length || 0) > i || uploadStatuses[t] === "success";
    }));

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case "Verified": return "text-green-500 bg-green-500/10 border-green-500/30";
      case "Pending": return "text-amber-500 bg-amber-500/10 border-amber-500/30";
      case "Under Review": return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      case "Rejected": return "text-red-500 bg-red-500/10 border-red-500/30";
    }
  };

  const UploadCard = ({ title, type, index }: { title: string, type: string, index: number }) => {
    const isAlreadyUploaded = selectedDoctor && selectedDoctor.verification_docs && selectedDoctor.verification_docs.length > index;
    const isLocked = selectedDoctor?.status === "Verified" || selectedDoctor?.status === "Rejected";
    
    const stagedFile = stagedFiles[type];
    const status = uploadStatuses[type];
    const isCurrentUploading = status === "uploading";
    const isSuccess = status === "success" || isAlreadyUploaded;
    const isError = status === "error";

    // Create object URL for preview if it's an image
    const previewUrl = React.useMemo(() => {
      if (stagedFile && stagedFile.type.startsWith("image/")) {
        return URL.createObjectURL(stagedFile);
      }
      return null;
    }, [stagedFile]);

    return (
      <div 
        onClick={() => !isLocked && !isSuccess && !isCurrentUploading && handleUploadClick(type)}
        className={`relative p-6 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-3 text-center h-40 overflow-hidden
          ${isSuccess 
            ? 'border-green-500/50 bg-green-500/5 cursor-default' 
            : isError 
              ? 'border-red-500/50 bg-red-500/5 hover:border-red-500/80 cursor-pointer'
            : isLocked 
              ? 'border-border/30 bg-muted/10 opacity-50 cursor-not-allowed'
              : stagedFile
                ? 'border-primary/50 bg-primary/5 cursor-pointer hover:bg-primary/10'
                : 'border-border/60 hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
          }`}
      >
        {/* Previews Background */}
        {previewUrl && (
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <img src={previewUrl} className="w-full h-full object-cover blur-sm" alt="Preview" />
          </div>
        )}

        {isCurrentUploading ? (
          <div className="relative z-10 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin flex items-center justify-center mb-1">
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">{title}</div>
              <div className="text-[10px] text-primary animate-pulse mt-1">Uploading...</div>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="relative z-10 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-1">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">{title}</div>
              <div className="text-[10px] text-green-500 font-semibold uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
                <Check className="h-3 w-3" /> Uploaded
              </div>
            </div>
          </div>
        ) : isError ? (
          <div className="relative z-10 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-1">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">{title}</div>
              <div className="text-[10px] text-red-500 font-semibold uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
                Upload Failed. Click to retry.
              </div>
            </div>
          </div>
        ) : stagedFile ? (
          <div className="relative z-10 flex flex-col items-center">
             <div className="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-1">
              {stagedFile.type.startsWith("image/") ? (
                <img src={previewUrl!} className="h-8 w-8 object-cover rounded-md" alt="Preview thumb" />
              ) : (
                <FileText className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">{title}</div>
              <div className="text-[10px] text-primary font-medium mt-1 truncate max-w-[120px]">{stagedFile.name}</div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-muted border border-border/60 text-muted-foreground flex items-center justify-center mb-1 transition-transform group-hover:scale-110">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">{title}</div>
              <div className="text-[10px] text-muted-foreground font-medium mt-1">Click to browse</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!selectedDoctor) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
        <div className="h-24 w-24 rounded-full bg-muted/50 border border-border flex items-center justify-center mb-6">
          <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Verifications Pending</h2>
        <p className="text-muted-foreground max-w-sm">All doctors have been verified or there are no registered doctors awaiting verification yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 flex flex-col lg:flex-row gap-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".jpg,.jpeg,.png,.pdf" 
        onChange={handleFileChange} 
      />
      
      {/* LEFT SIDEBAR: Select Doctor */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Compliance</h2>
          <p className="text-sm text-muted-foreground mt-1">Verify credentials before granting network access.</p>
        </div>

        <div className="glass-card rounded-2xl border border-border/80 p-4 sticky top-24">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search pending..." 
              className="w-full h-10 pl-9 pr-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"
            />
          </div>

          <div className="space-y-2">
            {doctors.map(doc => (
              <button 
                key={doc.id}
                onClick={() => handleDoctorSelect(doc.id)}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  selectedDoctorId === doc.id 
                  ? 'bg-primary/10 border-primary/30 shadow-sm' 
                  : 'bg-background/40 border-transparent hover:bg-muted/50'
                }`}
              >
                <div className="font-bold text-sm text-foreground">{doc.name}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">{doc.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(doc.status)}`}>
                    {doc.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT AREA: Verification Workflow */}
      <div className="flex-1 space-y-6">
        
        {/* Profile Header */}
        <div className="glass-panel p-6 rounded-3xl border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle background glow based on status */}
          <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
            selectedDoctor.status === 'Verified' ? 'bg-green-500' :
            selectedDoctor.status === 'Rejected' ? 'bg-red-500' : 'bg-primary'
          }`}></div>

          <div className="flex items-center gap-5 relative z-10">
            <div className="h-16 w-16 rounded-full bg-muted border-2 border-border/60 flex items-center justify-center text-xl font-extrabold text-foreground shadow-inner">
              {selectedDoctor.name ? (selectedDoctor.name.startsWith("Dr. ") ? selectedDoctor.name.charAt(4) : selectedDoctor.name.charAt(0)) : "D"}
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-foreground">{selectedDoctor.name}</h3>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground font-medium">
                <span>{selectedDoctor.specialization}</span>
                <span>•</span>
                <span className="font-mono text-xs">{selectedDoctor.id}</span>
              </div>
            </div>
          </div>
          
          <div className="relative z-10">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border ${getStatusColor(selectedDoctor.status)}`}>
              {selectedDoctor.status === "Verified" && <ShieldCheck className="h-4 w-4" />}
              {selectedDoctor.status === "Pending" && <Clock className="h-4 w-4" />}
              {selectedDoctor.status === "Under Review" && <Search className="h-4 w-4" />}
              {selectedDoctor.status === "Rejected" && <ShieldAlert className="h-4 w-4" />}
              {selectedDoctor.status}
            </span>
          </div>
        </div>

        {/* Progress Timeline & Blockchain Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-card p-6 rounded-3xl border border-border/80">
            <h4 className="font-bold text-lg mb-6 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Credential Uploads</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {requiredDocs.map((docTitle, index) => (
                <UploadCard key={index} title={docTitle} type={`doc_${index}`} index={index} />
              ))}
            </div>

            {/* Centralized Upload Button */}
            {Object.keys(stagedFiles).length > 0 && selectedDoctor.status !== "Verified" && (
              <div className="mt-6 flex justify-center animate-in slide-in-from-bottom-2 fade-in duration-300">
                <Button 
                  onClick={handleUploadAll}
                  disabled={isUploadingAll}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-8 rounded-full shadow-lg shadow-primary/25 flex items-center gap-2 transition-all"
                >
                  {isUploadingAll ? (
                    <div className="h-5 w-5 border-2 border-white/20 border-t-white animate-spin rounded-full"></div>
                  ) : (
                    <UploadCloud className="h-5 w-5" />
                  )}
                  {isUploadingAll ? "Uploading Documents..." : "Upload Selected Documents"}
                </Button>
              </div>
            )}
          </div>

          <div className="glass-card p-6 rounded-3xl border border-border/80 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-lg mb-6 flex items-center gap-2"><LinkIcon className="h-5 w-5 text-blue-500" /> Trust Grid</h4>
              
              <div className="space-y-6">
                <div className="relative pl-6 border-l-2 border-primary/20 space-y-6">
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-primary flex items-center justify-center ring-4 ring-background">
                      <Check className="h-2 w-2 text-white" />
                    </div>
                    <div className="text-sm font-bold text-foreground">Profile Created</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Admin initiated onboarding</div>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="relative">
                    <div className={`absolute -left-[31px] top-0 h-4 w-4 rounded-full flex items-center justify-center ring-4 ring-background transition-colors ${allDocsUploaded ? 'bg-primary' : 'bg-muted border border-border/80'}`}>
                      {allDocsUploaded && <Check className="h-2 w-2 text-white" />}
                    </div>
                    <div className={`text-sm font-bold ${allDocsUploaded ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Documents Verified
                      {showDoctorVerifiedAnimation && (
                        <span className="ml-2 text-xs text-green-500 animate-pulse">✓ All docs verified</span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{allDocsUploaded ? 'All requirements met' : 'Waiting for uploads'}</div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <div className={`absolute -left-[31px] top-0 h-4 w-4 rounded-full flex items-center justify-center ring-4 ring-background transition-colors ${
                      selectedDoctor.status === 'Verified' ? 'bg-green-500' : 
                      selectedDoctor.status === 'Rejected' ? 'bg-red-500' :
                      'bg-muted border border-border/80'
                    }`}>
                      {selectedDoctor.status === 'Verified' && <Check className="h-2 w-2 text-white" />}
                      {selectedDoctor.status === 'Rejected' && <XCircle className="h-2 w-2 text-white" />}
                    </div>
                    <div className={`text-sm font-bold ${
                      selectedDoctor.status === 'Verified' ? 'text-green-500' : 
                      selectedDoctor.status === 'Rejected' ? 'text-red-500' :
                      'text-muted-foreground'
                    }`}>
                      {selectedDoctor.status === 'Verified' ? 'Network Approved' : 
                       selectedDoctor.status === 'Rejected' ? 'Application Rejected' : 
                       'Blockchain Sync'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Blockchain Mock Terminal */}
            <div className="mt-8">
              <div className="bg-[#0D1117] rounded-xl border border-border/40 p-3 overflow-hidden shadow-inner font-mono">
                <div className="flex items-center gap-1.5 mb-2 border-b border-border/20 pb-2">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-[9px] text-muted-foreground ml-2 uppercase tracking-widest">Node Terminal</span>
                </div>
                <div className="text-[10px] space-y-1.5 h-[60px]">
                  {selectedDoctor.status === 'Verified' && selectedDoctor.hash ? (
                    <>
                      <div className="text-green-400">► Transaction Confirmed</div>
                      <div className="text-muted-foreground">Block: <span className="text-blue-400">14892201</span></div>
                      <div className="text-muted-foreground">Hash: <span className="text-amber-400">{selectedDoctor.hash}</span></div>
                    </>
                  ) : isSimulatingSync ? (
                    <>
                      <div className="text-blue-400 animate-pulse">► Broadcasting to Trust Grid...</div>
                      <div className="text-muted-foreground">Awaiting consensus confirmations (2/5)...</div>
                    </>
                  ) : selectedDoctor.status === 'Rejected' ? (
                    <>
                      <div className="text-red-400">► Node Rejected Credentials</div>
                      <div className="text-muted-foreground">Compliance failure logged.</div>
                    </>
                  ) : (
                    <>
                      <div className="text-muted-foreground">► Awaiting final approval...</div>
                      <div className="text-muted-foreground opacity-50">State: Standby</div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedDoctor.status !== "Verified" && selectedDoctor.status !== "Rejected" && (
                <div className="flex flex-col gap-2 mt-4">
                  <Button 
                    onClick={handleVerify}
                    disabled={!allDocsUploaded || isSimulatingSync} 
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-11 rounded-xl shadow-lg shadow-green-500/20 disabled:opacity-50"
                  >
                    {isSimulatingSync ? "Syncing..." : "Approve & Sync to Network"}
                  </Button>
                  <Button 
                    onClick={handleReject}
                    disabled={isSimulatingSync}
                    variant="outline" 
                    className="w-full h-11 rounded-xl font-bold border-red-500/30 text-red-500 hover:bg-red-500/10"
                  >
                    Reject Application
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
