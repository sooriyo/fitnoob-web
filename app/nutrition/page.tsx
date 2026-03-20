"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { FoodLog, Entry } from "@/lib/types";
import { databases, DB_ID, FOOD_LOGS_COL, ENTRIES_COL, Query, ID } from "@/lib/appwrite";
import { searchFoods, FDCFood, findNutrient } from "@/lib/fdc";
import { clsx } from "clsx";

export default function NutritionPage() {
  const { user, profile } = useAuth();
  
  // States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [foodItems, setFoodItems] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search/Manual States
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FDCFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FDCFood | null>(null);
  
  const [manualForm, setManualForm] = useState({
    name: "",
    cals: 0,
    prot: 0,
    carb: 0,
    fat: 0,
    grams: 100
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await databases.listDocuments(DB_ID, FOOD_LOGS_COL, [
        Query.equal("user_id", user.$id),
        Query.equal("date", selectedDate),
        Query.limit(100)
      ]);
      setFoodItems(result.documents as unknown as FoodLog[]);
    } catch (err) {
      console.error(err);
      setFoodItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived Totals
  const totals = useMemo(() => {
    return foodItems.reduce((acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fat: acc.fat + (item.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [foodItems]);

  // Sync totals to main entry collection (for dashboard/stats)
  useEffect(() => {
    const syncToEntry = async () => {
       if (!user || loading) return;
       try {
         const existing = await databases.listDocuments(DB_ID, ENTRIES_COL, [
           Query.equal("user_id", user.$id),
           Query.equal("date", selectedDate)
         ]);

         const payload = {
           date: selectedDate,
           user_id: user.$id,
           calories: totals.calories,
           protein: Math.round(totals.protein),
           carbs: Math.round(totals.carbs),
           fat: Math.round(totals.fat)
         };

         if (existing.total > 0) {
           await databases.updateDocument(DB_ID, ENTRIES_COL, existing.documents[0].$id, payload);
         } else {
           await databases.createDocument(DB_ID, ENTRIES_COL, ID.unique(), payload);
         }
       } catch (e) {
         console.error("Sync Error:", e);
       }
    };
    syncToEntry();
  }, [totals, user, selectedDate]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query) return;
    setSearching(true);
    try {
       const foods = await searchFoods(query);
       setResults(foods);
    } finally {
       setSearching(false);
    }
  };

  const logFood = async (item: Partial<FoodLog>) => {
    if (!user) return;
    setSaving(true);
    try {
      await databases.createDocument(DB_ID, FOOD_LOGS_COL, ID.unique(), {
        ...item,
        user_id: user.$id,
        date: selectedDate
      });
      await fetchData();
    } catch (e: any) {
      alert("Error: " + e.message + ". Please ensure the 'food_logs' collection is created in Appwrite.");
    } finally {
      setSaving(false);
      setSelectedFood(null);
      setResults([]);
      setQuery("");
    }
  };

  const handleManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    logFood({
      food_name: manualForm.name,
      calories: manualForm.cals,
      protein: manualForm.prot,
      carbs: manualForm.carb,
      fat: manualForm.fat,
      grams: manualForm.grams
    });
    setManualForm({ name: "", cals: 0, prot: 0, carb: 0, fat: 0, grams: 100 });
  };

  const handleFDCLog = () => {
    if (!selectedFood) return;
    const factor = manualForm.grams / 100;
    logFood({
       food_name: selectedFood.description,
       calories: Math.round(findNutrient(selectedFood, 'calories') * factor),
       protein: findNutrient(selectedFood, 'protein') * factor,
       carbs: findNutrient(selectedFood, 'carbs') * factor,
       fat: findNutrient(selectedFood, 'fat') * factor,
       grams: manualForm.grams
    });
  };

  const deleteLog = async (id: string) => {
    if (!confirm("Remove this log?")) return;
    try {
      await databases.deleteDocument(DB_ID, FOOD_LOGS_COL, id);
      await fetchData();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-700">
      
      {/* ── DAILY TOTALS ──────────────── */}
      <section className="sticky top-0 z-20 pt-4 bg-bg/80 backdrop-blur-xl -mx-4 px-4 pb-6 border-b border-border/20">
        <div className="flex justify-between items-end mb-8">
           <div className="space-y-1">
             <span className="text-[10px] mono uppercase text-accent font-black tracking-[0.3em] italic">Select Date</span>
             <input 
               type="date" 
               value={selectedDate} 
               onChange={(e) => setSelectedDate(e.target.value)}
               className="bg-transparent border-none text-2xl font-black syne uppercase italic focus:ring-0 p-0 text-text cursor-pointer hover:text-accent transition-colors"
             />
           </div>
           <div className="text-right">
             <span className="text-[10px] mono uppercase text-muted font-black tracking-widest block opacity-50">Total Calories</span>
             <span className="text-3xl font-black mono text-accent italic">{totals.calories} <span className="text-xs">KCAL</span></span>
           </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
           <ProgressCard label="Protein" current={totals.protein} target={profile?.target_protein || 0} unit="g" color="text-blue" />
           <ProgressCard label="Carbs" current={totals.carbs} target={profile?.target_carbs || 0} unit="g" color="text-accent2" />
           <ProgressCard label="Fat" current={totals.fat} target={profile?.target_fat || 0} unit="g" color="text-good" />
        </div>
      </section>

      {/* ── SEARCH FOODS ──────────────── */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center gap-4">
          <span className="mono text-[10px] text-accent tracking-[0.2em] font-black italic">01</span>
          <h2 className="syne font-black uppercase text-sm tracking-widest italic">Search Common Foods</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent"></div>
        </div>

        <div className="card p-6 border-accent/20 bg-accent/5">
             <div className="flex gap-2">
               <input
                 type="text"
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 placeholder="Search food database..."
                 className="input-field flex-1 bg-surface font-black mono italic"
                 onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
               />
               <button onClick={() => handleSearch()} className="btn btn-primary w-auto px-6 text-[10px]" disabled={searching}>
                 {searching ? "..." : "SEARCH"}
               </button>
             </div>

             {results.length > 0 && !selectedFood && (
                <div className="grid grid-cols-1 divide-y divide-border/20 max-h-64 overflow-y-auto pr-2 mt-4 custom-scrollbar border rounded-xl bg-surface/80">
                   {results.map((food) => (
                     <button
                       key={food.fdcId}
                       onClick={() => setSelectedFood(food)}
                       className="py-3 px-4 text-left hover:bg-accent/5 transition-colors group flex justify-between items-center"
                     >
                       <div className="space-y-0.5">
                         <span className="text-[10px] font-black syne uppercase block group-hover:text-accent tracking-tighter">{food.description}</span>
                         <span className="text-[8px] mono text-muted uppercase font-black tracking-tighter opacity-60">{food.brandOwner || "General"}</span>
                       </div>
                       <svg className="w-4 h-4 text-muted group-hover:text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
                     </button>
                   ))}
                </div>
             )}

             {selectedFood && (
                <div className="p-4 bg-surface rounded-xl border-2 border-accent/30 mt-4 space-y-4 animate-in zoom-in-95">
                   <div className="flex justify-between items-center">
                     <h4 className="text-xs font-black syne uppercase text-text italic truncate pr-8">{selectedFood.description}</h4>
                     <button onClick={() => setSelectedFood(null)} className="text-muted hover:text-red">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                     </button>
                   </div>
                   <div className="flex gap-4 items-end">
                      <div className="space-y-1 flex-1">
                        <label className="text-[8px] mono uppercase text-muted font-black tracking-[0.2em] italic ml-1">Grams</label>
                        <input 
                          type="number" 
                          value={manualForm.grams} 
                          onChange={(e) => setManualForm({...manualForm, grams: parseInt(e.target.value)}) }
                          className="input-field py-3 font-black mono text-accent2 bg-surface2/50 text-base"
                        />
                      </div>
                      <button onClick={handleFDCLog} className="btn btn-primary py-2 px-6 text-[9px] uppercase font-black italic tracking-widest h-10">
                        Log Entry
                      </button>
                   </div>
                </div>
             )}
        </div>
      </section>

      {/* ── MANUAL LOG ──────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="mono text-[10px] text-accent tracking-[0.2em] font-black italic">02</span>
          <h2 className="syne font-black uppercase text-sm tracking-widest italic">Log Food Manually</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent"></div>
        </div>

        <form onSubmit={handleManualLog} className="card p-6 border-border/40 bg-surface/50 space-y-6">
           <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 flex-1">
                 <label className="text-[8px] mono uppercase text-muted font-black tracking-widest opacity-60 ml-1 italic">Type Food Name</label>
                 <input 
                   type="text" 
                   value={manualForm.name} 
                   onChange={e => setManualForm({...manualForm, name: e.target.value})}
                   placeholder="E.g. Banana..."
                   className="input-field bg-white/5 py-3"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[8px] mono uppercase text-muted font-black tracking-widest opacity-60 ml-1 italic">Quantity (Grams)</label>
                 <input 
                   type="number" 
                   value={manualForm.grams} 
                   onChange={e => setManualForm({...manualForm, grams: parseInt(e.target.value)})}
                   className="input-field bg-white/5 py-3 font-mono"
                 />
              </div>
           </div>

           <div className="grid grid-cols-4 gap-4">
              <LogInput label="Cals" val={manualForm.cals} set={v => setManualForm({...manualForm, cals: v})} color="text-accent" />
              <LogInput label="Prot" val={manualForm.prot} set={v => setManualForm({...manualForm, prot: v})} color="text-blue" />
              <LogInput label="Carb" val={manualForm.carb} set={v => setManualForm({...manualForm, carb: v})} color="text-accent2" />
              <LogInput label="Fat" val={manualForm.fat} set={v => setManualForm({...manualForm, fat: v})} color="text-good" />
           </div>

           <button type="submit" className="btn btn-outline py-4 w-full text-[10px] font-black uppercase tracking-[0.2em] italic border-accent/20 text-accent hover:bg-accent hover:text-white transition-all">
             Log This Food
           </button>
        </form>
      </section>

      {/* ── DAILY LOG ──────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="mono text-[10px] text-muted tracking-[0.2em] font-black italic">03</span>
          <h2 className="syne font-black uppercase text-sm tracking-widest italic text-muted">Daily Food Log</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-border/20 to-transparent"></div>
        </div>

        <div className="space-y-3">
          {foodItems.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border/20 rounded-2xl">
               <span className="text-[10px] text-muted mono uppercase italic font-black">Empty log for this date</span>
            </div>
          )}
          {foodItems.map((item) => (
            <div key={item.$id} className="card p-4 sm:p-5 flex items-center justify-between gap-4 border-border/20 hover:border-accent/40 group transition-all">
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] mono text-accent font-black italic">{item.grams}g</span>
                    <h4 className="text-xs font-black syne uppercase tracking-tight truncate border-l border-border/40 pl-2 text-text">{item.food_name}</h4>
                  </div>
                  <div className="flex gap-4 text-[9px] mono text-muted font-black uppercase opacity-60">
                     <span>{item.calories} Kcal</span>
                     <span>{item.protein.toFixed(1)}g P</span>
                     <span>{item.carbs.toFixed(1)}g C</span>
                     <span>{item.fat.toFixed(1)}g F</span>
                  </div>
               </div>
               <button onClick={() => deleteLog(item.$id!)} className="p-2 opacity-20 group-hover:opacity-100 hover:text-red transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
               </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Helpers ─────────────────────────────

function ProgressCard({ label, current, target, unit, color }: { label: string, current: number, target: number, unit: string, color: string }) {
  const percent = Math.min(100, (current / target) * 100) || 0;
  return (
    <div className="card p-3 sm:p-4 border-border/30 bg-surface/50 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-black mono uppercase text-muted tracking-tighter">{label}</span>
        <span className={clsx("text-xs font-black mono italic", color)}>{Math.round(current)}{unit}</span>
      </div>
      <div className="h-1 bg-surface2 rounded-full overflow-hidden">
        <div className={clsx("h-full transition-all duration-700", color.replace('text-', 'bg-'))} style={{ width: `${percent}%` }} />
      </div>
      <div className="text-[8px] mono text-muted opacity-40 text-right">Target: {target}{unit}</div>
    </div>
  );
}

function LogInput({ label, val, set, color }: { label: string, val: number, set: (v: number) => void, color: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[8px] mono uppercase text-muted font-black tracking-widest block text-center opacity-50">{label}</label>
      <input 
        type="number" 
        value={val === 0 ? "" : val} 
        onChange={e => set(parseFloat(e.target.value) || 0)}
        className={clsx("input-field p-2 text-center text-sm font-black mono italic bg-surface", color)}
      />
    </div>
  );
}
