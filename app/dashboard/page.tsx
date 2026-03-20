"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { buildDashboard } from "@/lib/calculations";
import { DashboardData, Entry, PhaseSegment, Finding } from "@/lib/types";
import { clsx } from "clsx";
import { databases, DB_ID, ENTRIES_COL, Query } from "@/lib/appwrite";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    try {
      const result = await databases.listDocuments(DB_ID, ENTRIES_COL, [
        Query.equal("user_id", user.$id),
        Query.orderDesc("date"),
        Query.limit(200),
      ]);
      const sorted = result.documents.sort((a, b) => a.date.localeCompare(b.date));
      setEntries(sorted as unknown as Entry[]);
    } catch (err) {
      console.error(err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const dashboardData = useMemo(() => {
    if (!profile || entries.length === 0) return null;
    return buildDashboard(entries, profile);
  }, [entries, profile]);

  if (loading) return <div className="p-12 text-center mono text-muted animate-pulse italic uppercase font-black tracking-widest text-[10px]">Computing metrics...</div>;
  
  if (!dashboardData) return (
    <div className="p-12 text-center space-y-6 max-w-sm mx-auto">
      <div className="inline-block px-3 py-1 bg-red/10 border border-red/30 text-red mono text-[10px] tracking-widest uppercase rounded">Calibration Required</div>
      <h1 className="text-4xl font-black syne uppercase leading-none italic">Insufficient<br/>Data</h1>
      <p className="text-muted mono text-[10px] leading-relaxed">The performance engine requires at least 2 logged weight entries to initialize metabolic tracking and projections.</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-32 animate-in fade-in zoom-in-95 duration-700">
      {/* 1. StatStrip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Lost" value={dashboardData.stats.totalLostKg} unit="KG" border="border-t-green" color="text-green" />
        <StatCard label="Current Weight" value={dashboardData.stats.currentWeight} unit="KG" border="border-t-accent2" color="text-accent2" />
        <StatCard label="Rate (14d)" value={dashboardData.stats.recentRatePerWeek} unit="KG/WK" border="border-t-blue" color="text-blue" />
        <StatCard label="Days tracked" value={dashboardData.stats.daysTracked} unit="DAYS" border="border-t-accent" color="text-accent" />
      </section>

      {/* 2. Weight Velocity */}
      <section>
        <SectionHeader num="01" title="Weight Velocity" />
        <div className="card p-0 overflow-hidden relative border-border/40">
           <div className="p-4 border-b border-border/20 bg-surface2/30 flex justify-between items-center">
             <span className="text-[9px] mono text-muted uppercase tracking-widest">// Weekly metrics — All logs</span>
             <span className="badge badge-accent py-0.5 text-[8px] uppercase tracking-tighter">Live Engine Feedback</span>
           </div>
           <div className="p-2 sm:p-4">
            <WeightChart entries={dashboardData.entries} goalWeight={profile?.goal_weight} rate={dashboardData.stats.recentRatePerWeek} />
           </div>
        </div>
      </section>

      {/* 3. Engine Findings */}
      <section>
        <SectionHeader num="02" title="Engine Findings" />
        <div className="grid sm:grid-cols-2 gap-4">
          {dashboardData.findings.map((finding, i) => (
             <FindingCard key={i} finding={finding} />
          ))}
        </div>
      </section>

      {/* 4. Macro Efficiency */}
      <section>
        <SectionHeader num="03" title="Macro Efficiency" />
        <div className="card space-y-8 border-border/40">
          <div className="grid grid-cols-2 gap-8 divide-x divide-border/20">
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-4xl sm:text-5xl font-black syne italic leading-none">{dashboardData.macroCompliance.calorieHitRate}%</span>
              <span className="text-[9px] mono uppercase text-muted tracking-widest mt-2 font-black italic">Calorie precision</span>
            </div>
            <div className="flex flex-col items-center sm:items-start pl-8">
              <span className="text-4xl sm:text-5xl font-black syne italic leading-none">{dashboardData.macroCompliance.proteinHitRate}%</span>
              <span className="text-[9px] mono uppercase text-muted tracking-widest mt-2 font-black italic">Protein compliance</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/20">
             <div className="flex justify-between items-end">
                <span className="text-[10px] mono uppercase text-muted tracking-[0.2em] font-black italic">Next Milestone</span>
                <span className="text-xl font-black mono text-blue italic">-{dashboardData.projection.kgToGoal} <span className="text-xs">KG</span></span>
             </div>
             <div className="h-2 bg-surface2 rounded-full overflow-hidden border border-border/20">
                <div 
                  className="h-full bg-gradient-to-r from-blue/40 to-blue transition-all duration-1000" 
                  style={{ width: `${Math.min(100, Math.max(0, 100 - (dashboardData.projection.kgToGoal / (profile?.start_weight - profile?.goal_weight)) * 100))}%` }} 
                />
             </div>
             <div className="flex justify-between text-[8px] mono uppercase text-muted font-black tracking-widest opacity-40 italic">
                <span>Start</span>
                <span>In progress</span>
                <span>Goal</span>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ───────────────────────────

function StatCard({ label, value, unit, border, color }: any) {
  return (
    <div className={clsx("card border-t-4 p-5 flex flex-col justify-center items-center sm:items-start", border)}>
      <span className="text-[9px] mono uppercase text-muted font-black tracking-[0.2em] italic mb-1">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={clsx("text-4xl font-black syne italic", color)}>{value}</span>
        <span className="text-[10px] mono text-muted font-black uppercase tracking-tighter italic">{unit}</span>
      </div>
    </div>
  );
}

function SectionHeader({ num, title }: { num: string, title: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <span className="mono text-[10px] text-accent tracking-[0.3em] font-black italic">{num}</span>
      <h2 className="syne font-black uppercase text-sm tracking-[0.2em] italic">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent"></div>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const isGood = finding.severity === 'good';
  const isCritical = finding.severity === 'critical';
  const isWarning = finding.severity === 'warning';
  
  return (
    <div className={clsx(
      "p-5 rounded-2xl border flex items-start gap-4 transition-all hover:bg-surface2/30",
      isGood ? "bg-good/5 border-good/20" : 
      isCritical ? "bg-red/5 border-red/20" : "bg-muted/5 border-muted/20"
    )}>
      <div className={clsx(
        "p-2 rounded-xl border",
        isGood ? "bg-good/10 border-good/30 text-good" : 
        isCritical ? "bg-red/10 border-red/30 text-red" : "bg-muted/10 border-muted/30 text-muted"
      )}>
        {isGood ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        )}
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-black uppercase syne tracking-wide italic">{finding.title}</h4>
        <p className="text-[10px] text-muted mono italic leading-relaxed">{finding.body}</p>
      </div>
    </div>
  );
}

function WeightChart({ entries, goalWeight, rate = 0 }: { entries: Entry[], goalWeight?: number, rate: number }) {
  const data = entries.map(e => ({
    date: new Date(e.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
    weight: e.weight
  })).filter(d => d.weight !== undefined);

  // Dynamic colors based on loss rate
  // Fast loss (>0.5kg/wk) = Green
  // Slow loss (<0.2kg/wk) = Red
  // Middle = Accent/Orange
  const chartColor = rate >= 0.5 ? "#39d98a" : (rate < 0.2 ? "#ff4d6d" : "#ff5f1f");

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="weightColorDynamic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6b6b80', fontSize: 10, fontFamily: 'var(--font-space-mono)' }}
            minTickGap={20}
          />
          <YAxis 
            hide 
            domain={['dataMin - 2', 'dataMax + 2']} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
            itemStyle={{ color: chartColor }}
            cursor={{ stroke: chartColor, strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          {goalWeight && (
            <ReferenceLine y={goalWeight} stroke="#39d98a" strokeDasharray="3 3" label={{ position: 'right', value: 'GOAL', fill: '#39d98a', fontSize: 8 }} />
          )}
          <Area 
            type="monotone" 
            dataKey="weight" 
            stroke={chartColor} 
            strokeWidth={4} 
            fillOpacity={1} 
            fill="url(#weightColorDynamic)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
