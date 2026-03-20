"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { WORKOUT_SCHEDULE } from "@/lib/seedData";
import { Entry, WorkoutDay } from "@/lib/types";
import { clsx } from "clsx";
import { databases, DB_ID, ENTRIES_COL, Query, ID } from "@/lib/appwrite";
import { searchFoods, FDCFood, findNutrient } from "@/lib/fdc";

export default function LogPage() {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Entry>>({
    date: new Date().toISOString().split("T")[0],
    weight: undefined,
    body_fat: undefined,
    calories: undefined,
    protein: undefined,
    carbs: undefined,
    fat: undefined,
    walk_km: undefined,
    notes: "",
  });

  // Workout Day Override
  const [selectedDayNum, setSelectedDayNum] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 7 : today;
  });

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    try {
      const result = await databases.listDocuments(DB_ID, ENTRIES_COL, [
        Query.equal("user_id", user.$id),
        Query.orderDesc("date"),
        Query.limit(100),
      ]);
      setEntries(result.documents as unknown as Entry[]);
    } catch (err) {
      console.error(err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const payload = { ...formData, user_id: user.$id };
      const existing = await databases.listDocuments(DB_ID, ENTRIES_COL, [
        Query.equal("user_id", user.$id),
        Query.equal("date", formData.date!)
      ]);

      if (existing.total > 0) {
        await databases.updateDocument(DB_ID, ENTRIES_COL, existing.documents[0].$id, payload);
      } else {
        await databases.createDocument(DB_ID, ENTRIES_COL, ID.unique(), payload);
      }

      setFormData({ date: new Date().toISOString().split("T")[0], weight: undefined, body_fat: undefined, calories: undefined, protein: undefined, carbs: undefined, fat: undefined, walk_km: undefined, notes: "" });
      await fetchEntries();
      alert("Progress saved successfully!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry: Entry) => {
    setFormData(entry);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm(`Delete this entry?`)) return;
    try {
      await databases.deleteDocument(DB_ID, ENTRIES_COL, entryId);
      await fetchEntries();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const selectedWorkout = WORKOUT_SCHEDULE.find((w) => w.dayNum === selectedDayNum);
  const entryForSelectedDate = Array.isArray(entries) ? entries.find((e) => e.date === formData.date) : null;

  const markWorkoutDone = async () => {
    if (!selectedWorkout || !user) return;
    setSaving(true);
    try {
      const date = formData.date!;
      const existing = await databases.listDocuments(DB_ID, ENTRIES_COL, [
        Query.equal("user_id", user.$id),
        Query.equal("date", date)
      ]);

      const payload = {
        date,
        workout_day: selectedWorkout.name,
        workout_done: true,
        user_id: user.$id,
      };

      if (existing.total > 0) {
        await databases.updateDocument(DB_ID, ENTRIES_COL, existing.documents[0].$id, payload);
      } else {
        await databases.createDocument(DB_ID, ENTRIES_COL, ID.unique(), payload);
      }
      
      await fetchEntries();
      alert("Workout Session Logged!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-700">
      
      {/* 01. WORKOUT SCHEDULE */}
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <SectionHeader num="01" title="Workout Schedule" />
            <div className="flex bg-surface2/50 p-1 rounded-xl border border-border/20 self-end sm:self-auto overflow-x-auto max-w-full">
               {[1,2,3,4,5,6,7].map(d => (
                 <button 
                   key={d}
                   onClick={() => setSelectedDayNum(d)}
                   className={clsx(
                     "px-3 py-1.5 text-[10px] mono font-black italic rounded-lg transition-all",
                     selectedDayNum === d ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-muted hover:text-text"
                   )}
                 >
                   D{d}
                 </button>
               ))}
            </div>
        </div>

        {selectedWorkout ? (
          <div className="card space-y-6 border-l-4 border-l-accent p-8 bg-surface/50">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              <div className="space-y-2">
                <span className={clsx("badge sm:px-3 sm:py-1 uppercase tracking-widest text-[9px] font-black", 
                  selectedWorkout.type === 'push' && "badge-accent",
                  selectedWorkout.type === 'pull' && "badge-info",
                  selectedWorkout.type === 'legs' && "badge-good",
                  selectedWorkout.type === 'cardio' && "badge-warn",
                  selectedWorkout.type === 'rest' && "badge-info"
                )}>
                  {selectedWorkout.type}
                </span>
                <h3 className="text-3xl font-black syne uppercase italic leading-none">{selectedWorkout.name}</h3>
                <p className="text-[10px] text-muted mono uppercase tracking-widest opacity-60 leading-tight">{selectedWorkout.focus}</p>
              </div>
              {entryForSelectedDate?.workout_done && entryForSelectedDate?.workout_day === selectedWorkout.name ? (
                <div className="badge badge-good sm:px-6 sm:py-3 normal-case text-xs font-black shadow-[0_0_20px_rgba(57,217,138,0.1)] flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Workout Completed
                </div>
              ) : (
                <button
                  onClick={markWorkoutDone}
                  className="btn btn-primary sm:px-8 sm:py-3 w-auto text-xs uppercase tracking-widest font-black"
                  disabled={saving}
                >
                  Log Workout Session for {formData.date}
                </button>
              )}
            </div>

            <details className="group border-t border-border/20 pt-6">
              <summary className="text-[10px] mono uppercase text-accent font-black cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2 list-none tracking-[0.2em] italic">
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
                Exercises
              </summary>
              <div className="mt-8 grid sm:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                {selectedWorkout.exercises.map((ex, i) => (
                  <div key={i} className="flex justify-between items-end gap-4 p-4 rounded-xl bg-surface2/30 border border-border/10 group hover:border-accent/40 transition-colors">
                    <div className="space-y-1">
                      <span className="text-[8px] mono uppercase text-muted font-black tracking-widest block leading-none opacity-50">{ex.section}</span>
                      <span className="text-sm font-black syne uppercase tracking-tight block group-hover:text-accent transition-colors">{ex.name}</span>
                      {ex.note && <span className="text-[10px] text-muted italic mono block mt-1 leading-tight opacity-70">{ex.note}</span>}
                    </div>
                    <div className="text-sm font-black mono text-accent2 whitespace-nowrap italic">{ex.sets}</div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        ) : (
          <div className="card text-center py-12 border-dashed border-border/40 bg-surface/20">
            <span className="text-[10px] text-muted mono uppercase tracking-[0.3em] font-black italic">Rest Day</span>
          </div>
        )}
      </section>

      {/* 02. BODY STATS */}
      <section>
        <SectionHeader num="02" title="Body Stats" />
        <form onSubmit={handleSubmit} className="card p-8 space-y-10 border-border/40 bg-surface/50">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <label className="text-[9px] mono uppercase text-muted font-black tracking-widest italic opacity-60 ml-1 block border-l-2 border-accent pl-2">Select Date</label>
              <input
                type="date"
                className="input-field py-4 bg-surface2/40"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 col-span-2 sm:col-span-1">
              <div className="space-y-2">
                <label className="text-[9px] mono uppercase text-muted font-black tracking-widest italic opacity-60 ml-1 block border-l-2 border-accent2 pl-2">Weight (KG)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="input-field py-4 font-black mono text-accent2 bg-surface2/40"
                  value={formData.weight || ""}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] mono uppercase text-muted font-black tracking-widest italic opacity-60 ml-1 block border-l-2 border-blue pl-2">Body Fat %</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  className="input-field py-4 font-black mono text-blue bg-surface2/40"
                  value={formData.body_fat || ""}
                  onChange={(e) => setFormData({ ...formData, body_fat: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 pt-10 border-t border-border/30">
            <div className="space-y-2">
              <label className="text-[9px] mono uppercase text-muted font-black tracking-widest italic opacity-60 ml-1 block border-l-2 border-green pl-2">Walking (KM)</label>
              <input
                type="number"
                step="0.1"
                placeholder="0.0"
                className="input-field py-4 font-black mono text-green bg-surface2/40"
                value={formData.walk_km || ""}
                onChange={(e) => setFormData({ ...formData, walk_km: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] mono uppercase text-muted font-black tracking-widest italic opacity-60 ml-1 block border-l-2 border-muted pl-2">Notes</label>
              <textarea
                className="input-field min-h-[58px] py-4 bg-surface2/40 font-mono text-[11px] leading-relaxed"
                placeholder="How are you feeling today?"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
               type="button"
               onClick={() => setFormData({ date: new Date().toISOString().split("T")[0] })}
               className="btn btn-outline py-4 px-8 text-[11px] mono uppercase font-black italic tracking-widest border-border hover:bg-surface2"
            >
              Reset
            </button>
            <button type="submit" className="btn btn-primary py-4 flex-1 text-[11px] mono uppercase font-black italic tracking-[0.2em] shadow-lg shadow-accent/10" disabled={saving}>
              {saving ? "Saving..." : "Save Daily Progress"}
            </button>
          </div>
        </form>
      </section>

      {/* 03. LOG HISTORY (COLLAPSIBLE) */}
      <section>
        <details className="group">
          <summary className="list-none flex items-center gap-4 cursor-pointer">
            <div className="flex items-center gap-4 flex-1">
              <span className="mono text-[10px] text-muted tracking-[0.3em] font-black italic">03</span>
              <h2 className="syne font-black uppercase text-sm tracking-widest italic text-muted group-hover:text-text transition-colors">Log History</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-border/40 to-transparent"></div>
              <svg className="w-5 h-5 text-muted transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </summary>
          
          <div className="mt-8 space-y-3 animate-in slide-in-from-top-4 duration-500">
            {entries.length === 0 && !loading && (
              <div className="text-center py-20 card border-dashed bg-surface/10">
                <span className="text-[10px] text-muted mono uppercase tracking-widest italic font-black">No history found</span>
              </div>
            )}
            {entries.slice(0, 30).map((entry) => (
              <div key={entry.$id || entry.date} className="card p-6 flex flex-col sm:flex-row items-center justify-between group hover:border-accent/40 bg-surface/40 hover:bg-surface2/20 transition-all border-border/20 gap-6">
                <div className="flex items-center gap-8 w-full sm:w-auto">
                  <div className="flex flex-col border-r border-border/20 pr-8">
                    <span className="text-[9px] mono text-muted uppercase tracking-widest font-black opacity-50 mb-1">
                      {new Date(entry.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="text-base font-black mono italic tracking-tighter">{entry.weight ? `${entry.weight} KG` : '--'}</span>
                  </div>
                  
                  {entry.calories && (
                    <div className="hidden xs:flex flex-col border-r border-border/20 pr-8">
                      <span className="text-[9px] mono text-muted uppercase tracking-widest font-black opacity-50 mb-1 leading-none italic">Total Energy</span>
                      <span className="text-sm font-black mono text-accent italic">{entry.calories} <span className="text-[8px] opacity-50">KCAL</span></span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {entry.workout_done && (
                      <div className="badge badge-accent sm:px-3 sm:py-1 italic uppercase text-[9px] font-black tracking-widest">Workout Done</div>
                    )}
                    {entry.body_fat && (
                      <div className="badge badge-blue sm:px-3 sm:py-1 italic uppercase text-[9px] font-black tracking-widest">{entry.body_fat}% BF</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end opacity-40 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(entry)}
                    className="p-3 hover:bg-surface2 border border-transparent hover:border-border rounded-xl text-muted hover:text-accent transition-all"
                    title="Edit Entry"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button 
                    onClick={() => handleDelete(entry.$id!)}
                    className="p-3 hover:bg-red/10 border border-transparent hover:border-red/20 rounded-xl text-muted hover:text-red transition-all"
                    title="Delete Entry"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>
      </section>
    </div>
  );
}

// ── Shared Sub-Components ──────────────────────────

function SectionHeader({ num, title }: { num: string, title: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="mono text-[10px] text-accent tracking-[0.3em] font-black italic">{num}</span>
      <h2 className="syne font-black uppercase text-sm tracking-widest italic">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent"></div>
    </div>
  );
}
