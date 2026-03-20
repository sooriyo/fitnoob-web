"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { buildDashboard } from "@/lib/calculations";
import { DashboardData, Entry, PhaseSegment, Finding } from "@/lib/types";
import { clsx } from "clsx";
import { databases, DB_ID, ENTRIES_COL, Query } from "@/lib/appwrite";
import { WeightChart } from "@/components/dashboard/WeightChart";


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
      // Sort entries by date ascending for calculations
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

  if (loading) return <div className="p-12 text-center mono text-muted animate-pulse">Computing metrics...</div>;
  
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

      {/* 2. Weight Chart */}
      <section>
        <SectionHeader num="01" title="Weight Velocity" />
        <div className="card p-0 overflow-hidden relative border-border/40">
           <div className="p-4 border-b border-border/20 bg-surface2/30 flex justify-between items-center">
             <span className="text-[9px] mono text-muted uppercase tracking-widest">// Weekly metrics — All logs</span>
             <span className="badge badge-accent py-0.5 text-[8px] uppercase tracking-tighter">Live Engine Feedback</span>
           </div>
           <div className="p-2 sm:p-4">
            <WeightChart entries={dashboardData.entries} goalWeight={profile?.goal_weight} />
           </div>
        </div>
      </section>

      {/* 3. Findings */}
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
              <span className="text-[9px] mono uppercase text-muted tracking-widest mt-2">Calorie precision</span>
            </div>
            <div className="flex flex-col items-center sm:items-start pl-8">
              <span className="text-4xl sm:text-5xl font-black syne italic leading-none">{dashboardData.macroCompliance.proteinHitRate}%</span>
              <span className="text-[9px] mono uppercase text-muted tracking-widest mt-2">Protein compliance</span>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6">
            <MacroBar label="Calories" current={dashboardData.macroCompliance.avgCalories} target={profile?.target_calories || 0} unit="kcal" color="bg-accent" />
            <MacroBar label="Protein" current={dashboardData.macroCompliance.avgProtein} target={profile?.target_protein || 0} unit="g" color="bg-blue" />
            <MacroBar label="Carbs" current={dashboardData.macroCompliance.avgCarbs} target={profile?.target_carbs || 0} unit="g" color="bg-accent2" />
            <MacroBar label="Fat" current={dashboardData.macroCompliance.avgFat} target={profile?.target_fat || 0} unit="g" color="bg-green" />
          </div>
        </div>
      </section>

      {/* 5. Phase Logs */}
      <section>
        <SectionHeader num="04" title="Phase Logs" />
        <div className="card p-0 overflow-hidden border-border/50">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface2/50">
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-[9px] mono uppercase text-muted tracking-widest font-black">Period</th>
                <th className="px-6 py-3 text-[9px] mono uppercase text-muted tracking-widest font-black">Lost</th>
                <th className="px-6 py-3 text-[9px] mono uppercase text-muted tracking-widest font-black">Weekly Rate</th>
                <th className="px-6 py-3 text-[9px] mono uppercase text-muted tracking-widest font-black">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10 font-mono">
              {dashboardData.phases.map((phase, i) => (
                <tr key={i} className="hover:bg-surface2/30 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="text-[10px] text-muted block mb-1 leading-none uppercase tracking-tighter opacity-50">{phase.label.split(' → ')[0]}</span>
                    <span className="text-[11px] text-text font-bold block">{phase.durationWeeks} Weeks Phase</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-green italic">-{phase.lostKg} KG</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-text/80">{phase.ratePerWeek} <span className="text-[9px] opacity-40">KG/WK</span></span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={clsx("badge sm:px-3 sm:py-1 text-[9px] uppercase tracking-widest", 
                      phase.status === 'fast' && "badge-accent",
                      phase.status === 'good' && "badge-good",
                      phase.status === 'slow' && "badge-warn",
                      phase.status === 'stall' && "badge-bad",
                      phase.status === 'gain' && "badge-bad"
                    )}>
                      {phase.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Goal Trajectory */}
      <section>
        <SectionHeader num="05" title="Goal Trajectory" />
        <div className="grid sm:grid-cols-2 gap-4">
           <ProjectionBox
              label="Current Performance"
              rate={`${dashboardData.projection.currentRateWeekly} kg/wk`}
              eta={new Date(dashboardData.projection.estimatedDateCurrent).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              weeks={`${dashboardData.projection.weeksAtCurrentRate} WEEKS`}
              active={true}
           />
           <ProjectionBox
              label="Optimal Fat Loss"
              rate="0.50 kg/wk"
              eta={new Date(dashboardData.projection.estimatedDateOptimal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              weeks={`${dashboardData.projection.weeksAtOptimalRate} WEEKS`}
              active={false}
           />
        </div>
        <p className="text-[9px] mono text-muted text-center italic mt-6 uppercase tracking-wider opacity-50">Calculated via 14-day rolling performance telemetry.</p>
      </section>
    </div>
  );
}

// ── Components ──────────────────────────

function SectionHeader({ num, title }: { num: string, title: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <span className="mono text-[10px] text-accent tracking-[0.3em] font-black">{num}</span>
      <h2 className="syne font-black uppercase text-sm tracking-wider italic">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-border/80 to-transparent"></div>
    </div>
  );
}

function StatCard({ label, value, unit, border, color }: { label: string, value: number, unit: string, border: string, color: string }) {
  return (
    <div className={clsx("card flex flex-col items-center justify-center gap-1 py-8 relative overflow-hidden group hover:border-accent/40 transition-all border-t-4", border)}>
      <span className="text-[8px] mono uppercase text-muted tracking-[0.2em] font-bold text-center leading-tight opacity-70 mb-1">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={clsx("text-3xl font-black syne uppercase italic leading-none drop-shadow-sm", color)}>{value}</span>
        <span className="text-[9px] mono font-bold text-muted opacity-50">{unit}</span>
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const styles = {
    critical: "border-l-4 border-l-red bg-red/5 border-red/20",
    warning:  "border-l-4 border-l-yellow bg-yellow/5 border-yellow/20",
    info:     "border-l-4 border-l-blue bg-blue/5 border-blue/20",
    good:     "border-l-4 border-l-green bg-green/5 border-green/20",
  };
  
  return (
    <div className={clsx("p-6 rounded-2xl border relative overflow-hidden group transition-all hover:bg-surface2/20", styles[finding.severity])}>
      <div className="flex flex-col gap-2">
        <span className={clsx("mono text-[9px] uppercase tracking-[0.2em] font-black italic", 
          finding.severity === 'critical' ? 'text-red' : 
          finding.severity === 'warning' ? 'text-yellow' : 
          finding.severity === 'good' ? 'text-green' : 'text-blue'
        )}>
          // {finding.severity}
        </span>
        <h4 className="text-[15px] font-black syne uppercase tracking-tight leading-tight group-hover:text-accent transition-colors">{finding.title}</h4>
        <p className="text-[11px] mono leading-relaxed text-muted mt-1 group-hover:text-text/90 transition-colors">{finding.body}</p>
      </div>
    </div>
  );
}

function MacroBar({ label, current, target, unit, color }: { label: string, current: number, target: number, unit: string, color: string }) {
  const percent = Math.min((current / target) * 100, 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] mono uppercase font-black tracking-widest italic">{label}</span>
        <span className="text-[10px] mono text-muted">
          <span className="text-text font-black">{current}{unit}</span> <span className="opacity-30">/</span> {target}{unit}
        </span>
      </div>
      <div className="h-2 bg-surface2/50 rounded-full overflow-hidden flex border border-border/10">
        <div 
          className={clsx("h-full transition-all duration-1000 ease-out", color)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function ProjectionBox({ label, rate, eta, weeks, active }: { label: string, rate: string, eta: string, weeks: string, active: boolean }) {
  return (
    <div className={clsx("card p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center group relative border-2 transition-all", 
      active ? "border-accent bg-surface2 shadow-[0_0_40px_rgba(255,95,31,0.08)]" : "border-border/30 opacity-60 hover:opacity-100 hover:border-border"
    )}>
      <div className="flex flex-col">
        <span className="text-[9px] mono uppercase text-muted mb-1 tracking-widest font-black italic">{label}</span>
        <span className={clsx("text-sm font-black mono uppercase", active ? "text-accent" : "")}>{rate}</span>
      </div>
      <div className="flex flex-col text-center sm:text-left">
        <span className="text-[9px] mono uppercase text-muted mb-1 tracking-widest font-black italic">Estimated Goal</span>
        <span className="text-lg font-black syne uppercase italic tracking-tighter">{eta}</span>
      </div>
      <div className="flex flex-col text-right">
        <span className="text-[9px] mono uppercase text-muted mb-1 tracking-widest font-black italic">Timeline</span>
        <span className="text-lg font-black mono italic">{weeks}</span>
      </div>
    </div>
  );
}

// ── Pure SVG Weight Chart ────────────────────



