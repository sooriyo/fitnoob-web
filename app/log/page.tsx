"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { WORKOUT_SCHEDULE } from "@/lib/seedData";
import { Entry, WorkoutDay } from "@/lib/types";
import { clsx } from "clsx";

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

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/entries");
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, user_id: user?.$id }),
      });
      if (res.ok) {
        setFormData({ ...formData, weight: undefined, body_fat: undefined, calories: undefined, protein: undefined, carbs: undefined, fat: undefined, walk_km: undefined, notes: "" });
        await fetchEntries();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry: Entry) => {
    setFormData(entry);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (date: string) => {
    if (!confirm(`Delete entry for ${date}?`)) return;
    try {
      const res = await fetch(`/api/entries/${date}`, { method: "DELETE" });
      if (res.ok) await fetchEntries();
    } catch (err) {
      console.error(err);
    }
  };

  const getWorkoutForDay = () => {
    const today = new Date().getDay(); // 0 (Sun) - 6 (Sat)
    // WORKOUT_SCHEDULE has dayNum 1 (Mon) - 7 (Sun)
    const dayNum = today === 0 ? 7 : today;
    return WORKOUT_SCHEDULE.find((w) => w.dayNum === dayNum);
  };

  const todayWorkout = getWorkoutForDay();
  const todayEntry = entries.find((e) => e.date === new Date().toISOString().split("T")[0]);

  const markWorkoutDone = async () => {
    if (!todayWorkout) return;
    setSaving(true);
    try {
      await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          workout_day: todayWorkout.name,
          workout_done: true,
          user_id: user?.$id,
        }),
      });
      await fetchEntries();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      {/* Today's Workout Card */}
      <section className="space-y-4">
        <label className="section-label">Performance Protocol</label>
        {todayWorkout ? (
          <div className="card space-y-4 border-l-4 border-l-accent">
            <div className="flex justify-between items-start">
              <div>
                <span className={clsx("badge mb-2", 
                  todayWorkout.type === 'push' && "badge-accent",
                  todayWorkout.type === 'pull' && "badge-info",
                  todayWorkout.type === 'legs' && "badge-good",
                  todayWorkout.type === 'cardio' && "badge-warn",
                  todayWorkout.type === 'rest' && "badge-info"
                )}>
                  {todayWorkout.type}
                </span>
                <h3 className="text-xl font-black syne uppercase italic">{todayWorkout.name}</h3>
                <p className="text-xs text-muted mono">{todayWorkout.focus}</p>
              </div>
              {todayEntry?.workout_done ? (
                <div className="badge badge-good py-2 px-4 normal-case text-xs">Completed ✓</div>
              ) : (
                <button
                  onClick={markWorkoutDone}
                  className="btn btn-primary py-2 px-4 w-auto text-xs"
                  disabled={saving}
                >
                  Mark Done
                </button>
              )}
            </div>

            <details className="group">
              <summary className="text-[10px] mono uppercase text-accent font-bold cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 list-none">
                <svg className="w-3 h-3 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
                Exercise Logistics
              </summary>
              <div className="mt-4 space-y-4 pt-4 border-t border-border">
                {todayWorkout.exercises.map((ex, i) => (
                  <div key={i} className="flex justify-between items-start gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[8px] mono uppercase text-muted block leading-none">{ex.section}</span>
                      <span className="text-sm font-bold block">{ex.name}</span>
                      {ex.note && <span className="text-[10px] text-muted italic mono block">{ex.note}</span>}
                    </div>
                    <div className="text-xs font-black mono text-accent2 whitespace-nowrap">{ex.sets}</div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        ) : (
          <div className="card text-center py-8 border-dashed">
            <span className="text-xs text-muted mono">No specific training protocol assigned for today.</span>
          </div>
        )}
      </section>

      {/* Entry Form */}
      <section className="space-y-4">
        <label className="section-label">Metric Injection</label>
        <form onSubmit={handleSubmit} className="card space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <span className="text-[8px] mono uppercase text-muted">Log Date</span>
              <input
                type="date"
                className="input-field"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[8px] mono uppercase text-muted">Weight (kg)</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="input-field"
                value={formData.weight || ""}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[8px] mono uppercase text-muted">Body Fat %</span>
              <input
                type="number"
                step="0.1"
                placeholder="0.0"
                className="input-field"
                value={formData.body_fat || ""}
                onChange={(e) => setFormData({ ...formData, body_fat: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <span className="text-[8px] mono uppercase text-muted block mb-1">Nutrition Strategy</span>
            <div className="space-y-1">
              <span className="text-[8px] mono uppercase text-muted opacity-50">Calories</span>
              <input
                type="number"
                placeholder="kcal"
                className="input-field"
                value={formData.calories || ""}
                onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <span className="text-[8px] mono uppercase text-muted opacity-50">Pro (g)</span>
                <input
                  type="number"
                  className="input-field"
                  value={formData.protein || ""}
                  onChange={(e) => setFormData({ ...formData, protein: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[8px] mono uppercase text-muted opacity-50">Carb (g)</span>
                <input
                  type="number"
                  className="input-field"
                  value={formData.carbs || ""}
                  onChange={(e) => setFormData({ ...formData, carbs: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[8px] mono uppercase text-muted opacity-50">Fat (g)</span>
                <input
                  type="number"
                  className="input-field"
                  value={formData.fat || ""}
                  onChange={(e) => setFormData({ ...formData, fat: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1 pt-4 border-t border-border">
            <span className="text-[8px] mono uppercase text-muted">Walk Volume (km)</span>
            <input
              type="number"
              step="0.1"
              placeholder="0.0"
              className="input-field"
              value={formData.walk_km || ""}
              onChange={(e) => setFormData({ ...formData, walk_km: parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-1">
            <span className="text-[8px] mono uppercase text-muted">Field Notes</span>
            <textarea
              className="input-field min-h-[80px]"
              placeholder="Hunger, energy, hydration..."
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-4">
            <button
               type="button"
               onClick={() => setFormData({ date: new Date().toISOString().split("T")[0] })}
               className="btn btn-outline flex-1 py-2 text-[10px]"
            >
              Clear
            </button>
            <button type="submit" className="btn btn-primary flex-[2] py-2 text-[10px]" disabled={saving}>
              {saving ? "Storing..." : "Commit Metrics"}
            </button>
          </div>
        </form>
      </section>

      {/* Past Entries List */}
      <section className="space-y-4">
        <label className="section-label">Archive Snapshot</label>
        <div className="space-y-2">
          {entries.length === 0 && !loading && (
            <div className="text-center py-8 text-muted mono text-xs">No data recorded yet.</div>
          )}
          {entries.slice(0, 30).map((entry) => (
            <div key={entry.$id || entry.date} className="card p-3 flex items-center justify-between group hover:border-muted transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] mono text-muted">
                    {new Date(entry.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                  </span>
                  <span className="text-xs font-bold mono">{entry.weight ? `${entry.weight} kg` : '--'}</span>
                </div>
                {entry.calories && (
                  <div className="hidden xs:block">
                     <span className="text-[10px] mono text-muted uppercase block leading-none">Energy</span>
                     <span className="text-xs font-bold mono text-accent2">{entry.calories} kcal</span>
                  </div>
                )}
                {entry.workout_done && (
                  <div className={clsx("badge badge-accent normal-case text-[8px] px-1.5")}>Done</div>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(entry)}
                  className="p-1.5 hover:bg-surface2 rounded-lg text-muted hover:text-text"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button 
                  onClick={() => handleDelete(entry.date)}
                  className="p-1.5 hover:bg-red/10 rounded-lg text-muted hover:text-red"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
