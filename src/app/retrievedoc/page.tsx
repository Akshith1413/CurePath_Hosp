"use client";

import React, { useState } from "react";
import { ShieldAlert, Search, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RetrieveDocPage() {
  const [email, setEmail] = useState("");
  const [cudocId, setCudocId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [docs, setDocs] = useState<string[]>([]);

  const handleRetrieve = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDocs([]);

    try {
      const res = await fetch("/api/verification/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, cudocId })
      });
      const data = await res.json();
      
      if (data.success) {
        setDocs(data.docs);
      } else {
        setError(data.error || "Failed to retrieve documents");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary/30">
      
      <div className="w-full max-w-md bg-card border border-border/50 rounded-[2rem] shadow-2xl overflow-hidden glass-panel relative z-10">
        
        {/* Header */}
        <div className="p-8 border-b border-border/40 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-500 flex items-center justify-center rounded-2xl border border-red-500/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Manual Retrieval</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Emergency secure access to doctor verification documents. Enter credentials to proceed.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-500 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleRetrieve} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="doctor@example.com"
                className="w-full h-12 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CUDOC ID</label>
              <input 
                type="text" 
                required
                value={cudocId}
                onChange={e => setCudocId(e.target.value)}
                placeholder="CUDOC-XXXXXXXX"
                className="w-full h-12 px-4 bg-background/50 border border-border/60 rounded-xl text-sm focus:outline-none focus:border-primary font-mono uppercase"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || !email || !cudocId}
              className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl mt-4"
            >
              {loading ? "Searching..." : (
                <span className="flex items-center gap-2"><Search className="h-4 w-4" /> Retrieve Documents</span>
              )}
            </Button>
          </form>

          {docs.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border/40 space-y-4">
              <h3 className="text-sm font-bold text-foreground">Retrieved Documents ({docs.length})</h3>
              <div className="space-y-3">
                {docs.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 border border-border/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-xs font-medium text-foreground truncate max-w-[150px]">
                        Document {idx + 1}
                      </span>
                    </div>
                    <a 
                      href={doc} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-background hover:bg-muted border border-border/60 rounded-lg text-primary transition-colors flex items-center justify-center"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
