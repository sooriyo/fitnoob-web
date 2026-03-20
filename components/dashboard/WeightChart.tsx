"use client";
import { useMemo } from "react";
import { Entry } from "@/lib/types";

export function WeightChart({
                              entries,
                              goalWeight,
                            }: {
  entries: Entry[];
  goalWeight: number | undefined;
}) {
  const data = useMemo(() => entries.filter((e) => e.weight != null), [entries]);
  if (data.length < 2) return null;

  const W  = 880;
  const H  = 300;
  const PT = 40;
  const PB = 44;
  const PL = 52;
  const PR = 32;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const weights    = data.map((e) => e.weight!);
  const allWeights = goalWeight ? [...weights, goalWeight] : weights;
  const minW = Math.floor(Math.min(...allWeights)) - 2;
  const maxW = Math.ceil(Math.max(...allWeights))  + 2;

  const getX = (i: number) =>
      data.length === 1 ? PL + chartW / 2 : PL + (i / (data.length - 1)) * chartW;
  const getY = (w: number) =>
      PT + ((maxW - w) / (maxW - minW)) * chartH;

  const linePoints = data.map((e, i) => `${getX(i)},${getY(e.weight!)}`).join(" L ");
  const areaPath   = `M ${getX(0)},${PT + chartH} L ${linePoints} L ${getX(data.length - 1)},${PT + chartH} Z`;

  const gridVals = Array.from({ length: 5 }, (_, i) =>
      minW + ((maxW - minW) * i) / 4
  );

  const showLabel = (i: number) =>
      i === 0 || i === data.length - 1 ||
      (data.length > 6 && i % Math.ceil(data.length / 6) === 0);

  const fmtDate = (d: string) =>
      new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // Interpolate dot color along gradient: green(0%) → orange(55%) → red(100%)
  const interpolateColor = (t: number): string => {
    const lerp = (a: number, b: number, f: number) => Math.round(a + (b - a) * f);
    const hex = (n: number) => n.toString(16).padStart(2, "0");
    let r: number, g: number, b: number;
    if (t <= 0.55) {
      const f = t / 0.55;
      r = lerp(0x39, 0xff, f); g = lerp(0xd9, 0x9f, f); b = lerp(0x8a, 0x1c, f);
    } else {
      const f = (t - 0.55) / 0.45;
      r = lerp(0xff, 0xff, f); g = lerp(0x9f, 0x4d, f); b = lerp(0x1c, 0x6d, f);
    }
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  };

  const dotColor = (i: number) => {
    if (i === 0)               return "#39d98a";
    if (i === data.length - 1) return "#ff4d6d";
    return interpolateColor(i / (data.length - 1));
  };

  // Per-segment gradients using interpolated colours
  const segments = data.slice(0, -1).map((_, i) => {
    const x1 = getX(i),   y1 = getY(data[i].weight!);
    const x2 = getX(i+1), y2 = getY(data[i + 1].weight!);
    return { x1, y1, x2, y2, c1: dotColor(i), c2: dotColor(i + 1), id: `sg${i}` };
  });

  return (
      <div className="w-full space-y-0">

        {/* ── Legend ── */}
        <div className="flex gap-4 flex-wrap px-1 pb-3">
          {[
            { color: "#39d98a", label: "Start / Fast loss"  },
            { color: "#ff9f1c", label: "Progress"           },
            { color: "#ff4d6d", label: "Current / Stall"    },
            { color: "#ff5f1f", label: "Goal target",  dashed: true },
          ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                {l.dashed ? (
                    <svg width="18" height="8" viewBox="0 0 18 8">
                      <line x1="0" y1="4" x2="18" y2="4"
                            stroke={l.color} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
                    </svg>
                ) : (
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color }} />
                )}
                <span className="text-[9px] mono text-muted uppercase tracking-wide">{l.label}</span>
              </div>
          ))}
        </div>

        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto select-none"
            xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Per-segment line gradients — spatially correct */}
            {segments.map((s) => (
                <linearGradient
                    key={s.id} id={s.id}
                    x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                    gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%"   stopColor={s.c1} />
                  <stop offset="100%" stopColor={s.c2} />
                </linearGradient>
            ))}

            {/*
            Area fill strategy:
            - areaColorH: horizontal green→orange→red (matches line)
            - areaFadeV:  vertical white → transparent (top bright, bottom gone)
            Both applied as separate layers, clipped to chart bounds.
          */}
            <linearGradient id="areaColorH" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#39d98a" />
              <stop offset="55%"  stopColor="#ff9f1c" />
              <stop offset="100%" stopColor="#ff4d6d" />
            </linearGradient>

            <linearGradient id="areaFadeV" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.14" />
              <stop offset="60%"  stopColor="#ffffff" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0"    />
            </linearGradient>

            <clipPath id="chartClip">
              <rect x={PL} y={PT} width={chartW} height={chartH} />
            </clipPath>

            <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── Area fill: colour layer + fade layer ── */}
          <g clipPath="url(#chartClip)">
            {/* Colour — thin horizontal gradient wash */}
            <path d={areaPath} fill="url(#areaColorH)" opacity="0.12" />
            {/* Fade — bright near line, transparent at bottom */}
            <path d={areaPath} fill="url(#areaFadeV)" />
          </g>

          {/* ── Grid lines ── */}
          {gridVals.map((w, i) => (
              <g key={`g${i}`}>
                <line
                    x1={PL} y1={getY(w)} x2={W - PR} y2={getY(w)}
                    stroke="#1e1e2e" strokeWidth="1"
                    strokeDasharray={i === 0 || i === 4 ? "0" : "4,6"}
                    opacity="0.8"
                />
                <text x={PL - 8} y={getY(w) + 4}
                      textAnchor="end" fill="#4a4a60"
                      fontSize="9" fontFamily="monospace">
                  {w.toFixed(0)}
                </text>
              </g>
          ))}

          {/* ── Goal weight dashed line ── */}
          {goalWeight && getY(goalWeight) >= PT && getY(goalWeight) <= PT + chartH && (
              <g>
                <line
                    x1={PL} y1={getY(goalWeight)} x2={W - PR} y2={getY(goalWeight)}
                    stroke="#ff5f1f" strokeWidth="1.5"
                    strokeDasharray="8,5" opacity="0.5"
                />
                <text x={W - PR - 4} y={getY(goalWeight) - 7}
                      textAnchor="end" fill="#ff5f1f"
                      fontSize="9" fontFamily="monospace" opacity="0.75">
                  GOAL {goalWeight}KG
                </text>
              </g>
          )}

          {/* ── Per-segment gradient lines ── */}
          {segments.map((s) => (
              <line
                  key={`l${s.id}`}
                  x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                  stroke={`url(#${s.id})`}
                  strokeWidth="2.5"
                  strokeLinecap="round"
              />
          ))}

          {/* ── Dots ── */}
          {data.map((e, i) => {
            const cx = getX(i);
            const cy = getY(e.weight!);
            const c  = dotColor(i);
            const r  = i === 0 || i === data.length - 1 ? 5 : 3.5;
            return (
                <g key={`d${i}`}>
                  <circle cx={cx} cy={cy} r={r + 5} fill={c} opacity="0.14" filter="url(#dotGlow)" />
                  <circle cx={cx} cy={cy} r={r} fill={c} />
                </g>
            );
          })}

          {/* ── X-axis date labels ── */}
          {data.map((e, i) =>
              showLabel(i) ? (
                  <text key={`dl${i}`} x={getX(i)} y={H - PB + 16}
                        textAnchor="middle" fill="#4a4a60"
                        fontSize="8" fontFamily="monospace">
                    {fmtDate(e.date)}
                  </text>
              ) : null
          )}

          {/* ── Weight annotation: first + last ── */}
          {[0, data.length - 1].map((i) => (
              <text key={`wl${i}`}
                    x={getX(i)} y={getY(data[i].weight!) - 11}
                    textAnchor={i === 0 ? "start" : "end"}
                    fill={dotColor(i)}
                    fontSize="11" fontFamily="monospace" fontWeight="bold">
                {data[i].weight}kg
              </text>
          ))}
        </svg>
      </div>
  );
}