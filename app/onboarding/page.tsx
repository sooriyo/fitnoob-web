"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { SEED_ENTRIES } from "@/lib/seedData";
import { Profile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { account, ID, databases, DB_ID, PROFILE_COL, Query } from "@/lib/appwrite";
import { clsx } from "clsx";
import Link from "next/link";
import { calcBMR, calcTDEE, suggestMacros, calculateAge, suggestPlanOptions, suggestMacrosByDeficit } from "@/lib/calculations";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user, profile, refreshProfile, refreshUser } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [metrics, setMetrics] = useState<{
    name: string; birth_date: string; sex: Profile["sex"]; height: number;
    start_weight: number; goal_weight: number; body_fat?: number;
    waist_cm?: number; activity_level: Profile["activity_level"]; goal: Profile["goal"];
  }>({
    name: "",
    birth_date: "1995-01-01",
    sex: "male" as Profile["sex"],
    height: 175,
    start_weight: 90,
    goal_weight: 75,
    body_fat: undefined,
    waist_cm: undefined,
    activity_level: "moderate" as Profile["activity_level"],
    goal: "fat-burn" as Profile["goal"],
  });

  const bmr = useMemo(
    () => calcBMR(metrics.start_weight, metrics.height, metrics.birth_date, metrics.sex),
    [metrics]
  );
  const tdee = useMemo(
    () => calcTDEE(bmr, metrics.activity_level),
    [bmr, metrics.activity_level]
  );

  const planOptions = useMemo(() => suggestPlanOptions(metrics.start_weight, tdee, metrics.goal), [metrics.start_weight, tdee, metrics.goal]);
  
  const [selectedOptionId, setSelectedOptionId] = useState('balanced');
  const [customDelta, setCustomDelta] = useState<number | null>(null);

  const activeMacros = useMemo(() => {
    if (customDelta !== null) return suggestMacrosByDeficit(metrics.start_weight, tdee, metrics.goal, customDelta);
    const opt = planOptions.find(o => o.id === selectedOptionId) || planOptions[0];
    return opt;
  }, [selectedOptionId, customDelta, planOptions, metrics.start_weight, tdee, metrics.goal]);

  const [customMacros, setCustomMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [useCustom, setUseCustom] = useState(false);

  useEffect(() => {
    if (profile?.onboarding_done) router.push("/log");
  }, [profile, router]);

  useEffect(() => {
    if (activeMacros) setCustomMacros(activeMacros);
  }, [activeMacros]);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!user) {
        await account.create(ID.unique(), email, password, metrics.name);
        await account.createEmailPasswordSession(email, password);
        await refreshUser();
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

  const handleStep2 = () => setStep(3);

  const handleCompletePlan = async () => {
    setLoading(true);
    try {
      let currentUser = user;
      if (!currentUser) {
        currentUser = await account.get();
      }
      if (!currentUser) throw new Error("No active session found.");

      const macros = useCustom ? customMacros : activeMacros;
      const payload = {
        ...metrics,
        start_date: new Date().toISOString().split("T")[0],
        target_calories: macros.calories,
        target_protein: macros.protein,
        target_carbs: macros.carbs,
        target_fat: macros.fat,
        onboarding_done: true,
      };

      // Direct client-side SDK call to avoid scope errors
      const existing = await databases.listDocuments(DB_ID, PROFILE_COL, [
        Query.equal("user_id", currentUser.$id)
      ]);

      if (existing.total > 0) {
        await databases.updateDocument(DB_ID, PROFILE_COL, existing.documents[0].$id, payload);
      } else {
        await databases.createDocument(DB_ID, PROFILE_COL, ID.unique(), {
          ...payload,
          user_id: currentUser.$id
        });
      }

      await refreshProfile();
      setStep(4);
    } catch (err: any) {
      console.error("Finalize Plan Error:", err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const [importedCount, setImportedCount] = useState<number | null>(null);
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

  const jsonTemplate = JSON.stringify(
    [{ date: "2024-03-20", weight: 85.5, calories: 2100, protein: 180, carbs: 200, fat: 65, workout_done: true, notes: "Good session" }],
    null, 2
  );

  return (
    <div className="min-h-screen py-10 md:py-16">
      <div className="max-w-2xl mx-auto space-y-8 px-4">

        {/* Progress */}
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="h-0.5 flex-1 rounded-full bg-border overflow-hidden">
              <div className={clsx("h-full bg-accent transition-all duration-500", s <= step ? "w-full" : "w-0")} />
            </div>
          ))}
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <p className="text-[11px] mono text-muted uppercase tracking-widest mb-1">Step 1 of 4</p>
              <h1 className="text-4xl font-black uppercase syne tracking-tight italic">Biological Baseline</h1>
              <p className="text-sm mono text-muted mt-1">Used to calculate your exact TDEE and macro targets.</p>
            </div>

            {!user && (
              <div className="grid grid-cols-2 gap-3 p-4 bg-surface2 rounded-xl border border-border">
                <div className="space-y-1">
                  <label className="section-label">Email</label>
                  <input type="email" placeholder="email@example.com" className="input-field"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="section-label">Password</label>
                  <input type="password" placeholder="••••••••" className="input-field"
                    value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="section-label">Full Name</label>
                <input type="text" placeholder="Tharuka" className="input-field"
                  value={metrics.name} onChange={(e) => setMetrics({ ...metrics, name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="section-label">Birth Date</label>
                <input type="date" className="input-field" value={metrics.birth_date}
                  onChange={(e) => setMetrics({ ...metrics, birth_date: e.target.value })} required />
              </div>

              <div className="space-y-1">
                <label className="section-label">Biological Sex</label>
                <select className="input-field appearance-none" value={metrics.sex}
                  onChange={(e) => setMetrics({ ...metrics, sex: e.target.value as any })} required>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="section-label">Height (cm)</label>
                <input type="number" className="input-field" value={metrics.height}
                  onChange={(e) => setMetrics({ ...metrics, height: parseInt(e.target.value) })} required />
              </div>

              <div className="space-y-1">
                <label className="section-label">Current Weight (kg)</label>
                <input type="number" step="0.1" className="input-field" value={metrics.start_weight}
                  onChange={(e) => setMetrics({ ...metrics, start_weight: parseFloat(e.target.value) })} required />
              </div>
              <div className="space-y-1">
                <label className="section-label">Goal Weight (kg)</label>
                <input type="number" step="0.1" className="input-field" value={metrics.goal_weight}
                  onChange={(e) => setMetrics({ ...metrics, goal_weight: parseFloat(e.target.value) })} required />
              </div>

              <div className="space-y-1">
                <label className="section-label">Body Fat % <span className="text-muted normal-case">(optional)</span></label>
                <input type="number" step="0.1" min="3" max="60" placeholder="e.g. 26.8" className="input-field"
                  value={metrics.body_fat ?? ""}
                  onChange={(e) => setMetrics({ ...metrics, body_fat: e.target.value ? parseFloat(e.target.value) : undefined })} />
              </div>
              <div className="space-y-1">
                <label className="section-label">Waist (cm) <span className="text-muted normal-case">(optional)</span></label>
                <input type="number" step="0.1" placeholder="e.g. 96" className="input-field"
                  value={metrics.waist_cm ?? ""}
                  onChange={(e) => setMetrics({ ...metrics, waist_cm: e.target.value ? parseFloat(e.target.value) : undefined })} />
              </div>

              <div className="col-span-2 flex items-center justify-between p-4 bg-surface2 border border-border rounded-xl">
                <div className="flex items-center gap-5">
                  <div>
                    <span className="text-[10px] mono text-muted uppercase block">To lose</span>
                    <span className="text-2xl font-black syne text-accent">
                      {Math.max(0, metrics.start_weight - metrics.goal_weight).toFixed(1)} kg
                    </span>
                  </div>
                  <div className="w-px h-7 bg-border" />
                  <div>
                    <span className="text-[10px] mono text-muted uppercase block">At 500g/wk</span>
                    <span className="text-2xl font-black syne text-muted">
                      ~{Math.ceil(Math.max(0, metrics.start_weight - metrics.goal_weight) / 0.5)} wks
                    </span>
                  </div>
                </div>
                <p className="text-[10px] mono text-muted leading-relaxed text-right italic hidden sm:block">
                  Calibration finalized in Step 3.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? "Registering..." : "Continue →"}
              </button>
              {!user && (
                <p className="text-center text-xs mono text-muted">
                  Have an account?{" "}
                  <Link href="/login" className="text-accent underline">Login</Link>
                </p>
              )}
            </div>
          </form>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <p className="text-[11px] mono text-muted uppercase tracking-widest mb-1">Step 2 of 4</p>
              <h1 className="text-4xl font-black uppercase syne tracking-tight italic">Lifestyle & Goal</h1>
              <p className="text-sm mono text-muted mt-1">How active are you, and what are you training for?</p>
            </div>

            <div className="space-y-2">
              <label className="section-label">Activity Level</label>
              <div className="space-y-2">
                {[
                  { id: "sedentary", label: "Sedentary", desc: "Desk job, no exercise", multiplier: "×1.2" },
                  { id: "light", label: "Lightly Active", desc: "1–3 days light training/wk", multiplier: "×1.375" },
                  { id: "moderate", label: "Moderately Active", desc: "3–5 days training/wk", multiplier: "×1.55" },
                  { id: "very", label: "Very Active", desc: "6–7 days heavy training/wk", multiplier: "×1.725" },
                  { id: "extra", label: "Extremely Active", desc: "Athlete / physical labour", multiplier: "×1.9" },
                ].map((act) => (
                  <button key={act.id}
                    onClick={() => setMetrics({ ...metrics, activity_level: act.id as any })}
                    className={clsx(
                      "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left",
                      metrics.activity_level === act.id
                        ? "bg-accent border-accent text-white"
                        : "border-border hover:border-muted bg-surface"
                    )}
                  >
                    <span>
                      <span className="font-bold syne text-sm block">{act.label}</span>
                      <span className="text-[11px] mono opacity-70">{act.desc}</span>
                    </span>
                    <span className={clsx("text-sm font-black mono",
                      metrics.activity_level === act.id ? "text-white/60" : "text-muted"
                    )}>{act.multiplier}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="section-label">Primary Goal</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "fat-burn", label: "Cut", desc: "Deficit · High protein" },
                  { id: "maintain", label: "Maintain", desc: "TDEE matched" },
                  { id: "gain", label: "Bulk", desc: "Surplus · Muscle" },
                ].map((g) => (
                  <button key={g.id}
                    onClick={() => setMetrics({ ...metrics, goal: g.id as any })}
                    className={clsx(
                      "text-left p-4 rounded-xl border-2 transition-all relative",
                      metrics.goal === g.id
                        ? "border-accent2 bg-accent2/5"
                        : "border-border hover:border-muted bg-surface"
                    )}
                  >
                    {metrics.goal === g.id && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent2" />
                    )}
                    <span className="text-lg font-black syne uppercase italic block">{g.label}</span>
                    <span className="text-[10px] mono text-muted leading-tight">{g.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn btn-outline px-8">← Back</button>
              <button onClick={handleStep2} className="btn btn-primary flex-1">Calculate →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center">
              <p className="text-[11px] mono text-muted uppercase tracking-widest mb-1">Step 3 of 4</p>
              <h1 className="text-4xl font-black uppercase syne tracking-tight italic">NUTRITIONAL STRATEGY</h1>
              <p className="text-sm mono text-muted mt-1">
                Select a protocol based on your primary objective.
              </p>
            </div>

            {/* Plan Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {planOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setSelectedOptionId(opt.id); setCustomDelta(null); }}
                  className={clsx(
                    "text-left p-4 rounded-xl border-2 transition-all relative overflow-hidden group",
                    selectedOptionId === opt.id && customDelta === null
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-muted bg-surface"
                  )}
                >
                  {selectedOptionId === opt.id && customDelta === null && (
                    <div className="absolute top-0 right-0 bg-accent text-white px-2 py-0.5 text-[8px] mono font-bold uppercase">Targeted</div>
                  )}
                  <span className="text-sm font-black syne uppercase italic block mb-1 group-hover:tracking-wider transition-all">{opt.label}</span>
                  <span className="text-[10px] mono text-muted leading-tight block mb-3 h-8">{opt.desc}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black mono">{opt.calories}</span>
                    <span className="text-[8px] mono text-muted uppercase">kcal/day</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Deficit Customizer */}
            <div className="card p-5 space-y-4 border-dashed">
              <div className="flex items-center justify-between">
                <label className="section-label uppercase tracking-[0.2em] text-[10px]">Manual Offset Control</label>
                <span className={clsx("text-xs font-black mono", (customDelta !== null ? customDelta : activeMacros.delta) < 0 ? "text-accent" : "text-green")}>
                  {customDelta !== null ? customDelta : activeMacros.delta} kcal {(customDelta !== null ? customDelta : activeMacros.delta) < 0 ? 'Deficit' : 'Surplus'}
                </span>
              </div>
              <input
                type="range"
                min={metrics.goal === 'fat-burn' ? -1000 : -500}
                max={metrics.goal === 'gain' ? 800 : 300}
                step="50"
                value={customDelta !== null ? customDelta : activeMacros.delta}
                onChange={(e) => setCustomDelta(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-[8px] mono text-muted uppercase">
                <span>Aggressive Loss</span>
                <span>Maintenance</span>
                <span>Aggressive Gain</span>
              </div>
            </div>

            {/* Detailed Analysis View */}
            <div className="card border-2 border-accent p-6 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-accent text-white px-4 py-1.5 text-[10px] font-black uppercase syne italic">Active Protocol Summary</div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-y border-border">
                {[
                  { label: "Energy", value: activeMacros.calories, unit: "kcal", color: "text-text" },
                  { label: "Protein", value: activeMacros.protein, unit: "g", color: "text-blue" },
                  { label: "Carbs", value: activeMacros.carbs, unit: "g", color: "text-accent2" },
                  { label: "Fat", value: activeMacros.fat, unit: "g", color: "text-green" },
                ].map((m) => (
                  <div key={m.label} className="text-center">
                    <span className="text-[9px] mono text-muted uppercase block mb-1">{m.label}</span>
                    <span className={clsx("text-2xl font-black mono", m.color)}>{m.value}</span>
                    <span className="text-[9px] mono text-muted block">{m.unit}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex gap-4 text-[10px] mono text-muted">
                  <span>BMR: {Math.round(bmr)}</span>
                  <span>TDEE: {Math.round(tdee)}</span>
                </div>
                {!useCustom ? (
                  <button onClick={() => setUseCustom(true)} className="text-[10px] mono text-accent hover:underline uppercase tracking-widest">Adjust Macro Proportions →</button>
                ) : (
                  <div className="flex gap-2">
                    <input type="number" className="input-field w-16 p-1 text-center text-xs"
                      value={customMacros.protein} onChange={e => setCustomMacros({ ...customMacros, protein: parseInt(e.target.value) })} />
                    <input type="number" className="input-field w-16 p-1 text-center text-xs"
                      value={customMacros.carbs} onChange={e => setCustomMacros({ ...customMacros, carbs: parseInt(e.target.value) })} />
                    <input type="number" className="input-field w-16 p-1 text-center text-xs"
                      value={customMacros.fat} onChange={e => setCustomMacros({ ...customMacros, fat: parseInt(e.target.value) })} />
                    <button onClick={() => setUseCustom(false)} className="text-[10px] mono text-muted p-1">×</button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn btn-outline px-8">← Previous</button>
              <button onClick={handleCompletePlan} className="btn btn-primary flex-1" disabled={loading}>
                {loading ? "Syncing..." : "Finalize Protocol →"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <p className="text-[11px] mono text-muted uppercase tracking-widest mb-1">Step 4 of 4</p>
              <h1 className="text-4xl font-black uppercase syne tracking-tight italic">Import Data</h1>
              <p className="text-sm mono text-muted mt-1">Load past history or start fresh from today.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleSeed} disabled={loading || importedCount !== null}
                className="card flex flex-col items-center gap-3 py-10 hover:border-accent transition-colors disabled:opacity-50 group">
                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <div className="text-center">
                  <span className="font-black syne uppercase italic text-sm block">Load History</span>
                  <span className="text-[10px] mono text-muted block mt-0.5">Nov 2025 – Feb 2026</span>
                </div>
                {importedCount !== null && <div className="badge badge-good text-[9px]">✓ {importedCount} loaded</div>}
              </button>

              <button onClick={() => router.push("/log")}
                className="card flex flex-col items-center gap-3 py-10 hover:border-muted transition-colors group">
                <div className="w-10 h-10 rounded-full bg-muted/10 border border-muted/20 flex items-center justify-center text-muted group-hover:scale-110 transition-transform">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
                <div className="text-center">
                  <span className="font-black syne uppercase italic text-sm block">Start Fresh</span>
                  <span className="text-[10px] mono text-muted block mt-0.5">Log from today</span>
                </div>
              </button>
            </div>

            <details className="group">
              <summary className="text-[10px] mono text-muted uppercase tracking-widest cursor-pointer hover:text-accent transition-colors list-none flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform inline-block text-[8px]">▶</span>
                JSON import schema
              </summary>
              <div className="mt-3 relative">
                <pre className="bg-surface2 p-4 rounded-xl border border-border text-[10px] mono overflow-x-auto">{jsonTemplate}</pre>
                <button className="absolute top-2 right-2 px-2 py-1 bg-surface border border-border rounded text-[9px] mono uppercase hover:border-accent transition-colors"
                  onClick={() => navigator.clipboard.writeText(jsonTemplate)}>Copy</button>
              </div>
              <p className="text-[10px] mono text-muted mt-2">POST to <span className="text-accent2">/api/upload</span></p>
            </details>
          </div>
        )}

      </div>
    </div>
  );
}

