"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { SEED_ENTRIES } from "@/lib/seedData";
import { Profile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { account, ID } from "@/lib/appwrite";
import { clsx } from "clsx";
import Link from "next/link";
import { calcBMR, calcTDEE, suggestMacros, ACTIVITY_MULTIPLIERS } from "@/lib/calculations";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  // Auth fields (for step 1 if not logged in)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 1: Scientific Metrics
  const [metrics, setMetrics] = useState({
    name: "Tharuka",
    age: 25,
    sex: "male" as Profile["sex"],
    height: 175,
    start_weight: 90,
    goal_weight: 75,
    activity_level: "moderate" as Profile["activity_level"],
    goal: "fat-burn" as Profile["goal"],
  });

  // Step 2: Calculated Results & Selection
  const bmr = useMemo(() => calcBMR(metrics.start_weight, metrics.height, metrics.age, metrics.sex), [metrics]);
  const tdee = useMemo(() => calcTDEE(bmr, metrics.activity_level), [bmr, metrics.activity_level]);
  const suggestions = useMemo(() => suggestMacros(metrics.start_weight, tdee, metrics.goal), [metrics.start_weight, tdee, metrics.goal]);

  const [customMacros, setCustomMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const [useCustom, setUseCustom] = useState(false);

  useEffect(() => {
    if (profile?.onboarding_done) {
      router.push("/log");
    }
  }, [profile, router]);

  useEffect(() => {
    setCustomMacros(suggestions);
  }, [suggestions]);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!user) {
        await account.create(ID.unique(), email, password, metrics.name);
        await account.createEmailPasswordSession(email, password);
        await refreshProfile();
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

  const handleComplete = async () => {
    setLoading(true);
    try {
      const macros = useCustom ? customMacros : suggestions;
      
      const payload = {
        ...metrics,
        start_date: new Date().toISOString().split("T")[0],
        target_calories: macros.calories,
        target_protein: macros.protein,
        target_carbs: macros.carbs,
        target_fat: macros.fat,
        onboarding_done: true,
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      await refreshProfile();
      setStep(3);
    } catch (err: any) {
      alert(err.message);
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

  const jsonTemplate = JSON.stringify([
    {
      "date": "2024-03-20",
      "weight": 85.5,
      "calories": 2100,
      "protein": 180,
      "carbs": 200,
      "fat": 65,
      "workout_done": true,
      "notes": "Good session"
    }
  ], null, 2);

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-12 px-4">
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
            <h1 className="text-4xl font-black uppercase syne tracking-tight italic">Biological Baseline</h1>
            <p className="text-muted text-sm mono">Enter your metrics for scientific calorie calibration.</p>
          </div>

          {!user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface2 p-4 rounded-xl border border-border">
              <div className="space-y-2">
                <label className="section-label">Email</label>
                <input type="email" placeholder="Email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="section-label">Password</label>
                <input type="password" placeholder="Password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
               <div className="space-y-2">
                  <label className="section-label">Full Name</label>
                  <input type="text" className="input-field" value={metrics.name} onChange={(e) => setMetrics({...metrics, name: e.target.value})} required />
               </div>
               
               <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="section-label">Age</label>
                    <input type="number" className="input-field" value={metrics.age} onChange={(e) => setMetrics({...metrics, age: parseInt(e.target.value)})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="section-label">Sex</label>
                    <select className="input-field appearance-none" value={metrics.sex} onChange={(e) => setMetrics({...metrics, sex: e.target.value as any})} required>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="section-label">Height (cm)</label>
                    <input type="number" className="input-field" value={metrics.height} onChange={(e) => setMetrics({...metrics, height: parseInt(e.target.value)})} required />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="section-label">Current Weight (kg)</label>
                    <input type="number" step="0.1" className="input-field" value={metrics.start_weight} onChange={(e) => setMetrics({...metrics, start_weight: parseFloat(e.target.value)})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="section-label">Goal Weight (kg)</label>
                    <input type="number" step="0.1" className="input-field" value={metrics.goal_weight} onChange={(e) => setMetrics({...metrics, goal_weight: parseFloat(e.target.value)})} required />
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="section-label">Activity Level</label>
                  <div className="grid gap-2">
                    {[
                      { id: 'sedentary', label: 'Sedentary', desc: 'No exercise' },
                      { id: 'light', label: 'Light', desc: '1-2 days/wk' },
                      { id: 'moderate', label: 'Moderate', desc: '3-5 days/wk' },
                      { id: 'very', label: 'Active', desc: '6-7 days/wk' },
                      { id: 'extra', label: 'Elite', desc: 'Pro Athlete' },
                    ].map(act => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setMetrics({...metrics, activity_level: act.id as any})}
                        className={clsx(
                          "text-left p-2 rounded border text-[10px] transition-all",
                          metrics.activity_level === act.id ? "bg-accent border-accent text-white" : "border-border hover:border-muted"
                        )}
                      >
                        <span className="font-bold block uppercase">{act.label}</span>
                        <span className="mono opacity-60 italic">{act.desc}</span>
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-2">
             <label className="section-label text-center block">Primary Goal</label>
             <div className="flex gap-4">
                {['fat-burn', 'maintain', 'gain'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setMetrics({...metrics, goal: g as any})}
                    className={clsx(
                      "flex-1 py-3 rounded-xl border-2 font-bold uppercase syne text-sm transition-all",
                      metrics.goal === g ? "border-accent bg-accent/5 scale-[1.05]" : "border-border text-muted"
                    )}
                  >
                    {g.replace('-', ' ')}
                  </button>
                ))}
             </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Registering..." : "Analyze Biological Profile →"}
          </button>

          {!user && (
            <div className="text-center text-xs mono text-muted pt-4">
              Already a member? <Link href="/login" className="text-accent underline">Login</Link>
            </div>
          )}
        </form>
      )}

      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
           <div className="space-y-2 text-center">
            <h1 className="text-4xl font-black uppercase syne tracking-tight italic">Calibration Results</h1>
            <p className="text-muted text-sm mono">Based on the MS-Jeor Equation and Activity Multipliers.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="card text-center py-6">
                <span className="text-[10px] mono uppercase text-muted block mb-1">Estimated BMR</span>
                <span className="text-3xl font-black syne text-accent">{Math.round(bmr)}</span>
                <span className="text-[10px] mono text-muted block">kcal/day basal</span>
             </div>
             <div className="card text-center py-6 border-accent2/30">
                <span className="text-[10px] mono uppercase text-muted block mb-1">Maintenance (TDEE)</span>
                <span className="text-3xl font-black syne text-accent2">{Math.round(tdee)}</span>
                <span className="text-[10px] mono text-muted block">kcal/day active</span>
             </div>
          </div>

          <div className="card border-2 border-accent p-8 space-y-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-accent text-white px-3 py-1 text-[10px] font-black uppercase syne italic">Recommended Strategy</div>
             <div className="space-y-1">
                <h3 className="text-2xl font-black syne uppercase italic">The {metrics.goal.replace('-', ' ')} Protocol</h3>
                <p className="text-xs text-muted mono italic">Optimized for {metrics.activity_level} activity and {metrics.goal} goal.</p>
             </div>

             <div className="grid grid-cols-4 gap-4 py-6 border-y border-border">
                <div className="space-y-1">
                  <span className="text-[8px] mono uppercase text-muted">Daily Energy</span>
                  <div className="text-2xl font-black mono">{useCustom ? customMacros.calories : suggestions.calories}</div>
                  <span className="text-[8px] mono text-muted">kcal</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] mono uppercase text-muted">Protein (2.2g/kg)</span>
                  <div className="text-2xl font-black mono text-blue">{useCustom ? customMacros.protein : suggestions.protein}g</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] mono uppercase text-muted">Carbs</span>
                  <div className="text-2xl font-black mono text-accent2">{useCustom ? customMacros.carbs : suggestions.carbs}g</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] mono uppercase text-muted">Fat</span>
                  <div className="text-2xl font-black mono text-green">{useCustom ? customMacros.fat : suggestions.fat}g</div>
                </div>
             </div>

             {!useCustom ? (
                <button onClick={() => setUseCustom(true)} className="text-[10px] mono uppercase text-accent hover:underline">Customize targets manually</button>
             ) : (
                <div className="grid grid-cols-4 gap-4 animate-in fade-in zoom-in-95">
                  <input type="number" className="input-field p-2 text-center" value={customMacros.calories} onChange={e => setCustomMacros({...customMacros, calories: parseInt(e.target.value)})} />
                  <input type="number" className="input-field p-2 text-center" value={customMacros.protein} onChange={e => setCustomMacros({...customMacros, protein: parseInt(e.target.value)})} />
                  <input type="number" className="input-field p-2 text-center" value={customMacros.carbs} onChange={e => setCustomMacros({...customMacros, carbs: parseInt(e.target.value)})} />
                  <input type="number" className="input-field p-2 text-center" value={customMacros.fat} onChange={e => setCustomMacros({...customMacros, fat: parseInt(e.target.value)})} />
                </div>
             )}
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStep(1)} className="btn btn-outline flex-1">Recalibrate Metrics</button>
            <button onClick={handleComplete} className="btn btn-primary flex-1" disabled={loading}>
              {loading ? "Saving Protocol..." : "Initialize Engine →"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
           <div className="space-y-2 text-center">
            <h1 className="text-4xl font-black uppercase syne tracking-tight italic">Data Integration</h1>
            <p className="text-muted text-sm mono">Seed legacy metadata or enter an empty state.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <button 
                  onClick={handleSeed}
                  disabled={loading || importedCount !== null}
                  className="card w-full flex flex-col items-center gap-4 py-12 hover:border-accent transition-colors disabled:opacity-50"
                >
                  <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </div>
                  <span className="text-lg font-black syne uppercase italic">Seed Sample Data</span>
                  {importedCount !== null && (
                    <div className="badge badge-good">✓ {importedCount} Entries Imported</div>
                  )}
                </button>
                
                <button onClick={() => router.push("/log")} className="btn btn-outline w-full py-6">Enter Dashboard Only</button>
             </div>

             <div className="space-y-3">
                <label className="section-label">JSON Data Schema</label>
                <div className="relative group">
                  <pre className="bg-surface2 p-4 rounded-xl border border-border text-[10px] mono overflow-x-auto max-h-[300px]">
                    {jsonTemplate}
                  </pre>
                  <button className="absolute top-2 right-2 p-2 bg-background border border-border rounded text-[8px] mono uppercase opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                    navigator.clipboard.writeText(jsonTemplate);
                    alert("Template copied to clipboard!");
                  }}>Copy</button>
                </div>
                <p className="text-[9px] text-muted mono">Use our CLI or the /api/upload endpoint to batch import historical weight logs using this structure.</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
