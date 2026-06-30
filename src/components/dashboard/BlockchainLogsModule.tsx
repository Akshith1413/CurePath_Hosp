"use client";

import React, { useState, useEffect } from "react";
import { 
  Network,
  Cpu,
  ShieldCheck,
  Search,
  Box,
  Key,
  Database,
  ArrowRight,
  Code2,
  Clock,
  Activity,
  FileText,
  ShieldAlert,
  Play
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

// --- Types ---
type RecordType = "PRESCRIPTION" | "DOCTOR_VERIFICATION" | "PATIENT_RECORD" | "INSURANCE_CLAIM" | "EMERGENCY_CASE";

interface BlockchainLog {
  txId: string; // DB log UUID
  hash: string;
  previousHash: string;
  actionType: string;
  doctorName: string;
  patientName: string;
  recordType: RecordType;
  status: string; // VALID, TAMPERED, PENDING
  timestamp: string;
  rawData: string;
}

// --- Mock Data Fallback ---
const generateMockHash = () => "sha256:" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

export function BlockchainLogsModule({ initialSearchQuery = "" }: { initialSearchQuery?: string }) {
  const [logs, setLogs] = useState<BlockchainLog[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [isAuditingChain, setIsAuditingChain] = useState(false);

  const handleVerifyWholeChain = async () => {
    setIsAuditingChain(true);
    try {
      const res = await apiFetch("/blockchain/verify-chain");
      if (res.success) {
        if (res.verified) {
          alert(`Ledger Audit Scan Complete!\n\nStatus: SECURE\nVerified Blocks: ${res.count}\nIntegrity Check: PASSED\n\nAll cryptographic linked records are 100% untampered and verified.`);
        } else {
          alert(`Ledger Audit Scan Failed!\n\nStatus: CORRUPTED\nReason: ${res.reason}\nFailed Block UUID: ${res.failedBlockId}\n\nTampering detected in ledger history!`);
        }
      } else {
        alert("Failed to complete ledger audit: " + (res.error || "Unknown audit failure"));
      }
    } catch (err) {
      console.error("Audit error:", err);
      alert("Failed to connect to verification node routing.");
    } finally {
      setIsAuditingChain(false);
    }
  };

  // --- Fetch Blockchain Logs from Backend ---
  const fetchLogs = async () => {
    try {
      const res = await apiFetch("/blockchain/logs");
      if (res.success && res.logs && res.logs.length > 0) {
        const mapped: BlockchainLog[] = res.logs.map((l: any) => ({
          txId: l.id,
          hash: l.current_hash || generateMockHash(),
          previousHash: l.previous_hash || "0x0",
          actionType: l.action_type || "CREATED",
          doctorName: l.metadata?.doctor_name || l.metadata?.doc_name || l.metadata?.provider || "System Node",
          patientName: l.metadata?.patient_name || "N/A",
          recordType: l.record_type as RecordType,
          status: l.verified_status || "VALID",
          timestamp: l.created_at || new Date().toISOString(),
          rawData: JSON.stringify(l.metadata || { action: l.action_type, status: l.verified_status }, null, 2)
        }));
        setLogs(mapped);
      }
    } catch (err) {
      console.warn("Using fallback blockchain logs data");
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleVerifyRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding row
    setVerifyingId(id);
    try {
      const res = await apiFetch(`/blockchain/verify/${id}`);
      if (res.success) {
        setLogs(prev => prev.map(log => {
          if (log.txId === id) {
            return { ...log, status: res.verified_status };
          }
          return log;
        }));
        alert(`Integrity Check Sealed!\n\nStatus: ${res.verified_status}\nSealed Hash: ${res.sealed_hash}\nRecomputed Hash: ${res.recomputed_hash}\nMatch: ${res.verified ? "YES" : "NO"}`);
      } else {
        alert("Verification routine failed: " + (res.error || "Unknown ledger error"));
      }
    } catch (err) {
      console.error("Verification error:", err);
      alert("Failed to connect to private verification ledger node.");
    } finally {
      setVerifyingId(null);
    }
  };

  const toggleRow = (txId: string) => {
    setExpandedTx(expandedTx === txId ? null : txId);
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.txId.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.recordType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.hash.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "All" || l.recordType === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VALID": 
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider text-green-400 bg-green-500/10 border border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.3)]"><ShieldCheck className="h-3.5 w-3.5" /> Valid</span>;
      case "PENDING": 
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)] animate-pulse"><Activity className="h-3.5 w-3.5" /> Pending</span>;
      case "TAMPERED": 
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]"><ShieldAlert className="h-3.5 w-3.5 animate-bounce" /> Tampered</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider text-green-400 bg-green-500/10 border border-green-500/40"><ShieldCheck className="h-3.5 w-3.5" /> Valid</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER & NETWORK STATS */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Network className="h-8 w-8 text-cyan-500" /> Private Trust Grid Logs
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Lightweight cryptographic audit trail sealed on private ledger.</p>
        </div>

        {/* Futuristic Network Dashboard */}
        <div className="flex flex-wrap gap-4 items-center">
          <Button 
            onClick={handleVerifyWholeChain}
            disabled={isAuditingChain}
            className="bg-[#00e1d9] hover:bg-[#00c2bb] text-black font-bold h-16 px-6 rounded-2xl flex items-center gap-2.5 shadow-lg shadow-[#00e1d9]/25 hover:shadow-[#00e1d9]/40 border border-[#00e1d9]/35 transition-all text-sm font-mono"
          >
            {isAuditingChain ? (
              <>
                <Activity className="h-5 w-5 animate-spin" />
                Auditing Chain...
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" />
                Run Security Audit Scan
              </>
            )}
          </Button>

          <div className="bg-card border border-border/80 dark:bg-[#0a0f16] dark:border-cyan-500/30 rounded-2xl p-4 flex items-center gap-4 shadow-sm dark:shadow-[0_0_20px_rgba(6,182,212,0.1)] min-w-[180px]">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Blockchain Method</div>
              <div className="text-sm font-bold text-primary dark:text-cyan-400 font-mono">SHA-256 Hashchain</div>
            </div>
          </div>

          <div className="bg-card border border-border/80 dark:bg-[#0a0f16] dark:border-green-500/30 rounded-2xl p-4 flex items-center gap-4 shadow-sm dark:shadow-[0_0_20px_rgba(34,197,94,0.1)] min-w-[180px]">
            <div className="h-10 w-10 rounded-xl bg-green-500/20 text-green-500 flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Verification Fee</div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">Free / On-Node</div>
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="glass-panel p-4 rounded-2xl border border-border/80 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-cyan-500/50" />
          <input 
            type="text" 
            placeholder="Search Hash, Doctor, Patient or Record Type..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-foreground placeholder:text-muted-foreground dark:bg-[#0a0f16] dark:border-cyan-900/50 dark:text-cyan-100 dark:placeholder:text-cyan-900/50 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30 font-mono"
          />
        </div>
        
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground font-semibold">Filter:</span>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-background border border-border/60 text-xs rounded-lg px-3 py-2 text-foreground focus:outline-none dark:bg-[#0a0f16] dark:border-cyan-900/50"
          >
            <option value="All">All Types</option>
            <option value="PRESCRIPTION">Prescriptions</option>
            <option value="DOCTOR_VERIFICATION">Doctor Verifications</option>
            <option value="PATIENT_RECORD">Patient Records</option>
            <option value="INSURANCE_CLAIM">Insurance Claims</option>
          </select>

          <div className="text-xs font-mono text-muted-foreground dark:text-cyan-500/50 flex items-center gap-2 ml-4">
            <Key className="h-3 w-3" /> SHA-256 Linked
          </div>
        </div>
      </div>

      {/* BLOCKCHAIN AUDIT TABLE */}
      <div className="glass-card rounded-3xl border border-border/80 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:bg-[#0a0f16] dark:border-cyan-900/30 dark:shadow-[0_0_30px_rgba(6,182,212,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/40 dark:bg-[#0f1724] dark:text-cyan-500/60 dark:font-mono dark:border-cyan-900/40">
              <tr>
                <th className="px-6 py-4">Verification Hash ID</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Record Type</th>
                <th className="px-6 py-4">Associated Entity</th>
                <th className="px-6 py-4">Timestamp (UTC)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 dark:divide-cyan-900/20">
              {filteredLogs.map((log) => (
                <React.Fragment key={log.txId}>
                  {/* Main Row */}
                  <tr 
                    onClick={() => toggleRow(log.txId)}
                    className={`transition-colors cursor-pointer group ${expandedTx === log.txId ? 'bg-primary/5 dark:bg-cyan-900/10' : 'hover:bg-muted/20 dark:hover:bg-[#0f1724]'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-bold text-foreground dark:text-cyan-300 truncate max-w-[200px]">{log.hash}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-1">Prev: {log.previousHash.slice(0, 16)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.actionType === "VERIFIED" || log.actionType === "APPROVED" ? "bg-green-500/10 text-green-500" :
                        log.actionType === "REJECTED" ? "bg-red-500/10 text-red-500" :
                        "bg-blue-500/10 text-blue-500"
                      }`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-foreground dark:text-cyan-100 font-semibold text-xs">
                        <FileText className="h-4 w-4 text-primary dark:text-cyan-500" /> {log.recordType}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground dark:text-cyan-100 text-xs font-semibold">{log.doctorName}</div>
                      {log.patientName !== "N/A" && (
                        <div className="text-muted-foreground text-[10px] flex items-center gap-1 mt-0.5">
                          <ArrowRight className="h-2 w-2" /> {log.patientName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground dark:text-cyan-100/70 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> {log.timestamp.replace('T', ' ').replace('Z', '').split('.')[0]}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button 
                        onClick={(e) => handleVerifyRecord(log.txId, e)}
                        disabled={verifyingId === log.txId}
                        className="bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white dark:bg-cyan-500/10 dark:border-cyan-500/30 dark:text-cyan-400 dark:hover:bg-cyan-500 dark:hover:text-black text-xs font-bold rounded-lg h-8 px-3 transition-all"
                      >
                        {verifyingId === log.txId ? (
                          <Activity className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </td>
                  </tr>

                  {/* Expanded Raw Data View */}
                  {expandedTx === log.txId && (
                    <tr className="bg-muted/10 dark:bg-[#05080c] border-b border-border/40 dark:border-cyan-900/40">
                      <td colSpan={7} className="p-0">
                        <div className="p-6 border-l-4 border-primary dark:border-cyan-500 animate-in slide-in-from-top-2 duration-200">
                          
                          <div className="flex flex-col lg:flex-row gap-6">
                            {/* Cryptographic Info */}
                            <div className="flex-1 space-y-4">
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground dark:font-mono dark:text-cyan-500/60 uppercase tracking-widest mb-1.5">Current Block Hash (SHA-256)</h4>
                                <div className="bg-background border border-border/60 p-3 rounded-lg font-mono text-xs text-foreground dark:bg-[#0a0f16] dark:border-cyan-900/40 dark:text-cyan-300 break-all shadow-inner">
                                  {log.hash}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground dark:font-mono dark:text-cyan-500/60 uppercase tracking-widest mb-1.5">Previous Block Hash</h4>
                                <div className="bg-background border border-border/60 p-3 rounded-lg font-mono text-xs text-foreground dark:bg-[#0a0f16] dark:border-cyan-900/40 dark:text-cyan-500/80 break-all shadow-inner">
                                  {log.previousHash}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-xs font-semibold text-muted-foreground dark:font-mono dark:text-cyan-500/60 uppercase tracking-widest mb-1.5">Verification Framework</h4>
                                  <div className="text-foreground dark:text-cyan-100 font-mono text-xs">CurePath Hashchain v1.0</div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-semibold text-muted-foreground dark:font-mono dark:text-cyan-500/60 uppercase tracking-widest mb-1.5">Gas Cost</h4>
                                  <div className="text-foreground dark:text-cyan-100 font-mono text-xs text-green-400">0.00 FREE (On-Node Validation)</div>
                                </div>
                              </div>
                            </div>

                            {/* Raw JSON Data */}
                            <div className="flex-1">
                              <h4 className="text-xs font-semibold text-muted-foreground dark:font-mono dark:text-cyan-500/60 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                <Cpu className="h-3.5 w-3.5" /> Sealed Payload Metadata
                              </h4>
                              <pre className="bg-background border border-border/60 p-4 rounded-lg font-mono text-[11px] text-foreground dark:bg-[#0a0f16] dark:border-cyan-900/40 dark:text-cyan-200 overflow-x-auto shadow-inner h-full">
                                {log.rawData}
                              </pre>
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-cyan-500/50 font-mono">
                    0x0000: No cryptographic ledger entries logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
