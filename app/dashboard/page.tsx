"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { buildDashboard } from "@/lib/calculations";
import { DashboardData, Entry, PhaseSegment, Finding } from "@/lib/types";
import { clsx } from "clsx";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/entries");
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const dashboardData = useMemo(() => {
    if (!profile || entries.length === 0) return null;
    return buildDashboard(entries, profile);
  }, [entries, profile]);

  if (loading) return <div className="p-12 text-center mono text-muted animate-pulse">Computing metrics...</div>;
  if (!dashboardData) return (
    <div className="p-12 text-center space-y-4">
      <div className="badge badge-bad">Calibration Required</div>
      <h1 className="text-2xl font-black syne uppercase">Insufficient Data</h1>
      <p className="text-muted mono text-xs leading-relaxed">Log at least 2 weight entries to initialize the performance engine.</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-32 animate-in fade-in zoom-in-95 duration-700">
      {/* 1. StatStrip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Lost" value={dashboardData.stats.totalLostKg} unit="KG" color="text-green" />
        <StatCard label="Current Weight" value={dashboardData.stats.currentWeight} unit="KG" color="text-accent2" />
        <StatCard label="Rate (14d)" value={dashboardData.stats.recentRatePerWeek} unit="KG/WK" color="text-blue" />
        <StatCard label="Days tracked" value={dashboardData.stats.daysTracked} unit="DAYS" color="text-accent" />
      </section>

      {/* 2. Weight Chart (SVG) */}
      <section className="space-y-4">
        <label className="section-label">Weight Velocity</label>
        <div className="card p-0 overflow-hidden relative">
          <WeightChart entries={dashboardData.entries} goalWeight={profile?.goal_weight} />
        </div>
      </section>

      {/* 3. Findings / AI Insights */}
      <section className="space-y-4">
        <label className="section-label">Engine Findings</label>
        <div className="grid gap-3">
          {dashboardData.findings.map((finding, i) => (
             <FindingCard key={i} finding={finding} />
          ))}
        </div>
      </section>

      {/* 4. Macro Compliance */}
      <section className="space-y-4">
        <label className="section-label">Macro Efficiency</label>
        <div className="card space-y-6">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-3xl font-black syne italic">{dashboardData.macroCompliance.calorieHitRate}%</span>
              <span className="text-[8px] mono uppercase text-muted tracking-widest">Calorie precision</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-3xl font-black syne italic">{dashboardData.macroCompliance.proteinHitRate}%</span>
              <span className="text-[8px] mono uppercase text-muted tracking-widest">Protein compliance</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <MacroBar label="Calories" current={dashboardData.macroCompliance.avgCalories} target={profile?.target_calories || 0} unit="kcal" color="bg-accent" />
            <MacroBar label="Protein" current={dashboardData.macroCompliance.avgProtein} target={profile?.target_protein || 0} unit="g" color="bg-blue" />
            <MacroBar label="Carbs" current={dashboardData.macroCompliance.avgCarbs} target={profile?.target_carbs || 0} unit="g" color="bg-accent2" />
            <MacroBar label="Fat" current={dashboardData.macroCompliance.avgFat} target={profile?.target_fat || 0} unit="g" color="bg-green" />
          </div>
        </div>
      </section>

      {/* 5. Loss Rate Table */}
      <section className="space-y-4">
        <label className="section-label">Phase Logs</label>
        <div className="card p-0 overflow-hidden border-border/50">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface2">
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-[8px] mono uppercase text-muted">Period</th>
                <th className="px-4 py-2 text-[8px] mono uppercase text-muted">Lost</th>
                <th className="px-4 py-2 text-[8px] mono uppercase text-muted">Rate</th>
                <th className="px-4 py-2 text-[8px] mono uppercase text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {dashboardData.phases.map((phase, i) => (
                <tr key={i} className="hover:bg-surface2/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-[10px] mono text-muted block mb-0.5 leading-none">{phase.label.split(' → ')[0]}</span>
                    <span className="text-[10px] mono text-text font-bold block">{phase.durationWeeks} weeks</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold mono text-green">{phase.lostKg} kg</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold mono">{phase.ratePerWeek} <span className="text-[8px] opacity-40">KG/WK</span></span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx("badge", 
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

      {/* 6. Projection Scenarios */}
      <section className="space-y-4">
        <label className="section-label">Goal Trajectory</label>
        <div className="grid gap-4">
           <ProjectionBox
              label="Current Rate"
              rate={`${dashboardData.projection.currentRateWeekly} kg/wk`}
              eta={new Date(dashboardData.projection.estimatedDateCurrent).toLocaleDateString()}
              weeks={`${dashboardData.projection.weeksAtCurrentRate} wks left`}
              active={true}
           />
           <ProjectionBox
              label="Optimal Fat Loss"
              rate="0.50 kg/wk"
              eta={new Date(dashboardData.projection.estimatedDateOptimal).toLocaleDateString()}
              weeks={`${dashboardData.projection.weeksAtOptimalRate} wks left`}
              active={false}
           />
        </div>
        <p className="text-[9px] mono text-muted text-center italic">Calculated using 14-day rolling performance metrics.</p>
      </section>
    </div>
  );
}

// ── Components ──────────────────────────

function StatCard({ label, value, unit, color }: { label: string, value: number, unit: string, color: string }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-1 py-6 group hover:border-accent/40 transition-colors">
      <span className="text-[8px] mono uppercase text-muted tracking-[0.2em] font-bold text-center leading-tight">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={clsx("text-2xl font-black syne uppercase italic leading-none", color)}>{value}</span>
        <span className="text-[8px] mono font-bold text-muted">{unit}</span>
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const styles = {
    critical: "bg-red/10 border-red/40 text-red",
    warning:  "bg-yellow/10 border-yellow/40 text-yellow",
    info:     "bg-blue/10 border-blue/40 text-blue",
    good:     "bg-green/10 border-green/40 text-green",
  };
  
  return (
    <div className={clsx("p-4 rounded-xl border relative overflow-hidden group", styles[finding.severity])}>
      <div className={clsx("absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform")}>
         {finding.severity === 'critical' && <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
         {finding.severity === 'good' && <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
      </div>
      <h4 className="text-sm font-black syne uppercase tracking-tight flex items-center gap-2 mb-1">
        {finding.title}
      </h4>
      <p className="text-[10px] mono leading-relaxed opacity-80">{finding.body}</p>
    </div>
  );
}

function MacroBar({ label, current, target, unit, color }: { label: string, current: number, target: number, unit: string, color: string }) {
  const percent = Math.min((current / target) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        <span className="text-[10px] mono uppercase font-bold">{label}</span>
        <span className="text-[10px] mono text-muted">
          <span className="text-text font-bold">{current}{unit}</span> / {target}{unit}
        </span>
      </div>
      <div className="h-1.5 bg-surface2 rounded-full overflow-hidden flex">
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
    <div className={clsx("card p-4 grid grid-cols-3 items-center group relative border-2", active ? "border-accent bg-surface2 shadow-[0_0_20px_rgba(255,95,31,0.05)]" : "border-border opacity-60")}>
      <div className="flex flex-col">
        <span className="text-[8px] mono uppercase text-muted mb-1">{label}</span>
        <span className={clsx("text-xs font-black mono", active ? "text-accent" : "")}>{rate}</span>
      </div>
      <div className="flex flex-col text-center">
        <span className="text-[8px] mono uppercase text-muted mb-1">Estimated Goal</span>
        <span className="text-xs font-black syne uppercase italic">{eta}</span>
      </div>
      <div className="flex flex-col text-right">
        <span className="text-[8px] mono uppercase text-muted mb-1">Timeline</span>
        <span className="text-xs font-black mono">{weeks}</span>
      </div>
    </div>
  );
}

// ── Pure SVG Weight Chart ────────────────────

function WeightChart({ entries, goalWeight }: { entries: Entry[], goalWeight: number | undefined }) {
  const data = useMemo(() => entries.filter(e => e.weight != null), [entries]);
  if (data.length < 2) return null;

  const width = 800;
  const height = 400;
  const paddingTop = 40;
  const paddingBottom = 40;
  const paddingLeft = 60;
  const paddingRight = 40;

  const weights = data.map(e => e.weight!);
  if (goalWeight) weights.push(goalWeight);
  
  const minWeight = Math.min(...weights) - 2;
  const maxWeight = Math.max(...weights) + 2;
  
  const getX = (i: number) => (i / (data.length - 1)) * (width - paddingLeft - paddingRight) + paddingLeft;
  const getY = (w: number) => ((maxWeight - w) / (maxWeight - minWeight)) * (height - paddingTop - paddingBottom) + paddingTop;

  const points = data.map((e, i) => `${getX(i)},${getY(e.weight!)}`).join(" ");

  return (
    <div className="w-full h-full bg-surface">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grids / Axes */}
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="var(--border)" strokeWidth="1" />
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="var(--border)" strokeWidth="1" />
        
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const w = minWeight + (maxWeight - minWeight) * p;
          const y = getY(w);
          return (
            <g key={i}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4,4" opacity="0.2" />
              <text x={paddingLeft - 10} y={y + 4} textAnchor="end" fill="var(--muted)" className="text-[10px] mono font-bold">
                {w.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Goal Weight Line */}
        {goalWeight && (
          <g>
            <line 
               x1={paddingLeft} 
               y1={getY(goalWeight)} 
               x2={width - paddingRight} 
               y2={getY(goalWeight)} 
               stroke="var(--accent2)" 
               strokeWidth="2" 
               strokeDasharray="8,4" 
               opacity="0.5" 
            />
            <text 
               x={width - paddingRight} 
               y={getY(goalWeight) - 10} 
               textAnchor="end" 
               fill="var(--accent2)" 
               className="text-[10px] mono font-black uppercase italic"
            >
              Goal: {goalWeight}kg
            </text>
          </g>
        )}

        {/* Line Path */}
        <path
          d={`M ${points}`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_0_10px_rgba(255,95,31,0.3)]"
        />

        {/* Area fill */}
        <path
          d={`M ${paddingLeft},${height - paddingBottom} L ${points} L ${getX(data.length - 1)},${height - paddingBottom} Z`}
          fill="url(#weightGradient)"
          opacity="0.1"
        />

        {/* Data points */}
        {data.map((e, i) => (
          <g key={i} className="group cursor-pointer">
            <circle
              cx={getX(i)}
              cy={getY(e.weight!)}
              r="4"
              fill="var(--surface)"
              stroke="var(--accent)"
              strokeWidth="2"
              className="hover:r-6 transition-all"
            />
          </g>
        ))}

        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
