"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { MACRO_PRESETS, SEED_ENTRIES } from "@/lib/seedData";
import { Profile, MacroPreset } from "@/lib/types";
import { useRouter } from "next/navigation";
import { account, ID } from "@/lib/appwrite";
import { clsx } from "clsx";
import Link from "next/link";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  // Auth fields (for step 1 if not logged in)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 1: Identity
  const [identityData, setIdentityData] = useState({
    name: "",
    start_weight: 90,
    goal_weight: 75,
    start_date: new Date().toISOString().split("T")[0],
  });

  // Step 2: Macros
  const [selectedMacro, setSelectedMacro] = useState<MacroPreset | null>(null);
  const [customMacros, setCustomMacros] = useState({
    calories: 1500,
    protein: 175,
    carbs: 100,
    fat: 40,
  });

  // Step 3: Seed/Import
  const [importedCount, setImportedCount] = useState<number | null>(null);

  useEffect(() => {
    if (profile?.onboarding_done) {
      router.push("/log");
    }
  }, [profile, router]);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!user) {
        // Create new account
        await account.create(ID.unique(), email, password, identityData.name);
        // Login immediately after creation
        await account.createEmailPasswordSession(email, password);
        await refreshProfile(); // Refresh to get the newly created user state
      }
      setStep(2);
    } catch (err: any) {
      if (err.code === 409) {
        alert("Account already exists. Please login instead.");
        router.push("/login");
      } else {
        alert(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = () => {
    if (!selectedMacro && !customMacros) return;
    setStep(3);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const macros = selectedMacro?.label === "Custom" ? customMacros : selectedMacro || MACRO_PRESETS.find(p => p.recommended)!;
      
      const payload = {
        ...identityData,
        target_calories: macros.calories,
        target_protein: macros.protein,
        target_carbs: macros.carbs,
        target_fat: macros.fat,
        onboarding_done: true,
      };

      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await refreshProfile();
      router.push("/log");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(SEED_ENTRIES),
      });
      const data = await res.json();
      setImportedCount(data.count);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 py-12">
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={clsx(
              "h-1 flex-1 rounded-full bg-border transition-all overflow-hidden",
              s <= step && "bg-accent"
            )}
          />
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase syne tracking-tight italic">Initiate protocol</h1>
            <p className="text-muted text-sm mono">Enter your baseline metrics and credentials.</p>
          </div>

          {!user && (
            <>
              <div className="space-y-3">
                <label className="section-label">Credentials</label>
                <input
                  type="email"
                  placeholder="Email address"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password (secure)"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-4">
            <label className="section-label">Identity & Metrics</label>
            <input
              type="text"
              placeholder="Name"
              className="input-field"
              value={identityData.name}
              onChange={(e) => setIdentityData({ ...identityData, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] mono uppercase text-muted">Start Weight (kg)</span>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={identityData.start_weight}
                  onChange={(e) => setIdentityData({ ...identityData, start_weight: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] mono uppercase text-muted">Goal Weight (kg)</span>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={identityData.goal_weight}
                  onChange={(e) => setIdentityData({ ...identityData, goal_weight: parseFloat(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] mono uppercase text-muted">Protocol Start Date</span>
              <input
                type="date"
                className="input-field"
                value={identityData.start_date}
                onChange={(e) => setIdentityData({ ...identityData, start_date: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating account..." : "Initiate protocol →"}
          </button>

          <div className="text-center text-xs mono text-muted">
            Already a member?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Login here
            </Link>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase syne tracking-tight italic">Target macros</h1>
            <p className="text-muted text-sm mono">Select your nutritional strategy for this phase.</p>
          </div>

          <div className="grid gap-4">
            {MACRO_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setSelectedMacro(preset)}
                className={clsx(
                  "card text-left relative overflow-hidden group border-2 transition-all",
                  selectedMacro?.label === preset.label ? "border-accent bg-surface2 scale-[1.02]" : "border-border hover:border-muted"
                )}
              >
                {preset.recommended && (
                  <div className="absolute top-0 right-0 bg-accent text-white px-2 py-0.5 text-[8px] mono font-black rounded-bl-lg uppercase">
                    Recommended
                  </div>
                )}
                <h3 className="text-lg font-black syne uppercase italic">{preset.label}</h3>
                <p className="text-xs text-muted mb-4 mono leading-relaxed">{preset.description}</p>
                {preset.label !== "Custom" && (
                  <div className="grid grid-cols-4 gap-2 border-t border-border pt-3">
                    <div className="flex flex-col">
                      <span className="text-[8px] mono uppercase text-muted">Kcal</span>
                      <span className="text-sm font-bold mono">{preset.calories}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] mono uppercase text-muted">P</span>
                      <span className="text-sm font-bold mono text-blue">{preset.protein}g</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] mono uppercase text-muted">C</span>
                      <span className="text-sm font-bold mono text-accent2">{preset.carbs}g</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] mono uppercase text-muted">F</span>
                      <span className="text-sm font-bold mono text-green">{preset.fat}g</span>
                    </div>
                  </div>
                )}
                {preset.label === "Custom" && selectedMacro?.label === "Custom" && (
                   <div className="grid grid-cols-4 gap-2 border-t border-border pt-3">
                    <input
                      type="number"
                      placeholder="kcal"
                      className="bg-transparent border-none p-0 text-xs mono font-bold focus:ring-0"
                      value={customMacros.calories}
                      onChange={(e) => setCustomMacros({...customMacros, calories: parseInt(e.target.value)})}
                    />
                    <input
                      type="number"
                      placeholder="P"
                      className="bg-transparent border-none p-0 text-xs mono font-bold text-blue focus:ring-0"
                      value={customMacros.protein}
                      onChange={(e) => setCustomMacros({...customMacros, protein: parseInt(e.target.value)})}
                    />
                    <input
                      type="number"
                      placeholder="C"
                      className="bg-transparent border-none p-0 text-xs mono font-bold text-accent2 focus:ring-0"
                      value={customMacros.carbs}
                      onChange={(e) => setCustomMacros({...customMacros, carbs: parseInt(e.target.value)})}
                    />
                    <input
                      type="number"
                      placeholder="F"
                      className="bg-transparent border-none p-0 text-xs mono font-bold text-green focus:ring-0"
                      value={customMacros.fat}
                      onChange={(e) => setCustomMacros({...customMacros, fat: parseInt(e.target.value)})}
                    />
                   </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStep(1)} className="btn btn-outline flex-1">Back</button>
            <button onClick={handleStep2} className="btn btn-primary flex-1">Confirm Protocol</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase syne tracking-tight italic">Legacy data</h1>
            <p className="text-muted text-sm mono">Import previous logs to initialize your performance charts.</p>
          </div>

          <div className="grid gap-4">
            <button
               onClick={handleSeed}
               disabled={loading || importedCount !== null}
               className="card flex flex-col items-center gap-4 py-12 hover:border-accent transition-colors disabled:opacity-50"
            >
              <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </div>
              <div className="text-center">
                <span className="text-lg font-black syne uppercase italic block">Seed Foundation Data</span>
                <span className="text-xs text-muted mono">Nov 2025 – Feb 2026 Archive</span>
              </div>
              {importedCount !== null && (
                <div className="badge badge-good select-none">✓ {importedCount} Entries Imported</div>
              )}
            </button>

            <label className="card flex flex-col items-center gap-4 py-8 border-dashed cursor-pointer">
              <input type="file" className="hidden" accept=".csv,.json" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) alert("File parsing logic would run here or use CLI import for speed.");
              }} />
              <div className="text-center">
                <span className="text-sm font-bold syne uppercase block">Upload CSV / JSON</span>
                <span className="text-[10px] text-muted mono">Manual file injection</span>
              </div>
            </label>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStep(2)} className="btn btn-outline flex-1">Back</button>
            <button onClick={handleComplete} className="btn btn-primary flex-1" disabled={loading}>
              {loading ? "Finalizing..." : "Initialize Profile"}
            </button>
          </div>
          
          <button onClick={handleComplete} className="text-[10px] mono uppercase text-muted hover:text-accent2 transition-colors mx-auto block">Skip → Enter Empty State</button>
        </div>
      )}
    </div>
  );
}
