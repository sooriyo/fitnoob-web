// ─────────────────────────────────────────
//  FAT BURN TRACKER — Calculations Engine
// ─────────────────────────────────────────

import type {
  Entry, Profile, PhaseSegment, StatStrip,
  MacroCompliance, Projection, Finding, DashboardData
} from './types'

// ── Helpers ──────────────────────────────

const daysBetween = (a: string, b: string): number => {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / msPerDay
}

const weeksBetween = (a: string, b: string): number =>
  daysBetween(a, b) / 7

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// ── Sort entries by date ascending ───────

export const sortEntries = (entries: Entry[]): Entry[] =>
  [...entries].sort((a, b) => a.date.localeCompare(b.date))

// ── Weighted entries (have weight logged) ─

export const weightedEntries = (entries: Entry[]): Entry[] =>
  sortEntries(entries).filter(e => e.weight != null)

// ── Stat Strip ────────────────────────────

export const calcStatStrip = (
  entries: Entry[],
  profile: Profile
): StatStrip => {
  const we = weightedEntries(entries)
  if (we.length === 0) return {
    totalLostKg: 0, currentWeight: profile.start_weight,
    recentRatePerWeek: 0, daysTracked: 0, daysToGoal: 0
  }

  const first = we[0]
  const last  = we[we.length - 1]
  const totalLostKg = parseFloat(((first.weight ?? 0) - (last.weight ?? 0)).toFixed(2))
  const currentWeight = last.weight ?? profile.start_weight

  // Rolling 14-day rate
  const cutoff = addDays(last.date, -14)
  const recent = we.filter(e => e.date >= cutoff)
  let recentRatePerWeek = 0
  if (recent.length >= 2) {
    const rFirst = recent[0]
    const rLast  = recent[recent.length - 1]
    const weeks  = weeksBetween(rFirst.date, rLast.date) || 1
    recentRatePerWeek = parseFloat(
      (((rFirst.weight ?? 0) - (rLast.weight ?? 0)) / weeks).toFixed(3)
    )
  }

  const kgToGoal = currentWeight - profile.goal_weight
  const daysToGoal = recentRatePerWeek > 0
    ? Math.round((kgToGoal / recentRatePerWeek) * 7)
    : 0

  const daysTracked = entries.length

  return { totalLostKg, currentWeight, recentRatePerWeek, daysTracked, daysToGoal }
}

// ── Phase Detection ───────────────────────

const phaseStatus = (ratePerWeek: number): PhaseSegment['status'] => {
  if (ratePerWeek >= 0.7)  return 'fast'
  if (ratePerWeek >= 0.35) return 'good'
  if (ratePerWeek >= 0.1)  return 'slow'
  if (ratePerWeek >= 0)    return 'stall'
  return 'gain'
}

const phaseCause = (status: PhaseSegment['status'], ratePerWeek: number): string => {
  if (status === 'fast')  return 'Water + glycogen flush'
  if (status === 'good')  return 'Consistent fat loss'
  if (status === 'slow')  return 'Possible metabolic adaptation'
  if (status === 'stall') return 'Metabolic adaptation / cortisol retention'
  return 'Refeed / cheat day water gain'
}

export const calcPhases = (entries: Entry[]): PhaseSegment[] => {
  const we = weightedEntries(entries)
  if (we.length < 2) return []

  // Group into ~2-week windows
  const phases: PhaseSegment[] = []
  const windowDays = 14
  let i = 0

  while (i < we.length - 1) {
    const start = we[i]
    let j = i + 1
    // Find next entry ~windowDays away, or end
    while (j < we.length - 1 && daysBetween(start.date, we[j].date) < windowDays) j++
    const end = we[j]

    const durationWeeks = weeksBetween(start.date, end.date) || 0.1
    const lostKg = parseFloat(((start.weight ?? 0) - (end.weight ?? 0)).toFixed(2))
    const ratePerWeek = parseFloat((lostKg / durationWeeks).toFixed(3))
    const status = phaseStatus(ratePerWeek)

    phases.push({
      label: formatDate(start.date) + ' → ' + formatDate(end.date),
      startDate: start.date,
      endDate: end.date,
      startWeight: start.weight ?? 0,
      endWeight: end.weight ?? 0,
      durationWeeks: parseFloat(durationWeeks.toFixed(1)),
      lostKg,
      ratePerWeek,
      status,
      cause: phaseCause(status, ratePerWeek)
    })

    i = j
  }

  return phases
}

// ── Macro Compliance ─────────────────────

export const calcMacroCompliance = (
  entries: Entry[],
  profile: Profile
): MacroCompliance => {
  const logged = entries.filter(e => e.calories != null)
  if (logged.length === 0) return {
    calorieHitRate: 0, proteinHitRate: 0,
    avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0,
    daysLogged: 0
  }

  const n = logged.length
  const calHits = logged.filter(e =>
    Math.abs((e.calories ?? 0) - profile.target_calories) <= 100
  ).length
  const proHits = logged.filter(e =>
    (e.protein ?? 0) >= profile.target_protein
  ).length

  const avg = (key: keyof Entry) =>
    parseFloat((logged.reduce((s, e) => s + ((e[key] as number) ?? 0), 0) / n).toFixed(1))

  return {
    calorieHitRate: parseFloat(((calHits / n) * 100).toFixed(1)),
    proteinHitRate: parseFloat(((proHits / n) * 100).toFixed(1)),
    avgCalories: avg('calories'),
    avgProtein:  avg('protein'),
    avgCarbs:    avg('carbs'),
    avgFat:      avg('fat'),
    daysLogged:  n
  }
}

// ── Projection ────────────────────────────

export const calcProjection = (
  stats: StatStrip,
  profile: Profile
): Projection => {
  const kgToGoal = stats.currentWeight - profile.goal_weight
  const currentRate = Math.max(stats.recentRatePerWeek, 0.01)
  const optimalRate = 0.5 // kg/week

  const weeksAtCurrentRate = parseFloat((kgToGoal / currentRate).toFixed(1))
  const weeksAtOptimalRate = parseFloat((kgToGoal / optimalRate).toFixed(1))

  const today = new Date().toISOString().split('T')[0]
  const estimatedDateCurrent = addDays(today, Math.round(weeksAtCurrentRate * 7))
  const estimatedDateOptimal = addDays(today, Math.round(weeksAtOptimalRate * 7))

  return {
    currentRateWeekly: currentRate,
    weeksAtCurrentRate,
    weeksAtOptimalRate,
    estimatedDateCurrent,
    estimatedDateOptimal,
    kgToGoal: parseFloat(kgToGoal.toFixed(2))
  }
}

// ── Dynamic Findings ─────────────────────

export const calcFindings = (
  entries: Entry[],
  profile: Profile,
  stats: StatStrip,
  phases: PhaseSegment[]
): Finding[] => {
  const findings: Finding[] = []
  const sorted = sortEntries(entries)
  const we = weightedEntries(entries)
  const today = new Date().toISOString().split('T')[0]

  // 1. Metabolic adaptation check
  if (stats.recentRatePerWeek < 0.15 && we.length > 10) {
    findings.push({
      severity: 'critical',
      title: 'Metabolic Adaptation Detected',
      body: `Your loss rate has dropped to ${(stats.recentRatePerWeek * 1000).toFixed(0)}g/week over the last 14 days. This strongly suggests metabolic downregulation. Consider bumping calories to 1,500–1,600 kcal for 2 weeks to reset your metabolism.`
    })
  }

  // 2. No refeed check (last refeed = day with calories > 1800)
  const refeeds = sorted.filter(e => (e.calories ?? 0) > 1800)
  if (refeeds.length > 0) {
    const lastRefeed = refeeds[refeeds.length - 1]
    const daysSince = daysBetween(lastRefeed.date, today)
    if (daysSince > 7) {
      findings.push({
        severity: daysSince > 10 ? 'critical' : 'warning',
        title: `No Refeed in ${Math.round(daysSince)} Days`,
        body: `Your last refeed was ${formatDate(lastRefeed.date)}. Refeeds every 5–7 days are critical at this stage to restore leptin and prevent further metabolic slowdown.`
      })
    }
  }

  // 3. Calorie too low
  const recentCal = sorted.slice(-7).filter(e => e.calories)
  if (recentCal.length >= 3) {
    const avgCal = recentCal.reduce((s, e) => s + (e.calories ?? 0), 0) / recentCal.length
    if (avgCal < 1300) {
      findings.push({
        severity: 'warning',
        title: 'Calories Too Low for Current Weight',
        body: `You're averaging ${avgCal.toFixed(0)} kcal over the last 7 days. At ${stats.currentWeight}kg with your activity level, this level of deficit triggers cortisol responses that protect fat stores.`
      })
    }
  }

  // 4. Good momentum
  if (stats.recentRatePerWeek >= 0.4) {
    findings.push({
      severity: 'good',
      title: 'Strong Momentum',
      body: `You're losing ${(stats.recentRatePerWeek * 1000).toFixed(0)}g/week — right in the optimal zone. Keep the current protocol and refeed on schedule.`
    })
  }

  // 5. Protein check
  const recentPro = sorted.slice(-7).filter(e => e.protein)
  if (recentPro.length >= 3) {
    const avgPro = recentPro.reduce((s, e) => s + (e.protein ?? 0), 0) / recentPro.length
    if (avgPro < profile.target_protein * 0.85) {
      findings.push({
        severity: 'warning',
        title: 'Protein Below Target',
        body: `Averaging ${avgPro.toFixed(0)}g protein vs your ${profile.target_protein}g target. Low protein during a cut accelerates muscle loss.`
      })
    }
  }

  // 6. Workout consistency
  const last7 = sorted.filter(e => e.date >= addDays(today, -7))
  const workoutDays = last7.filter(e => e.workout_done).length
  if (workoutDays < 3) {
    findings.push({
      severity: 'warning',
      title: 'Low Workout Frequency This Week',
      body: `Only ${workoutDays} workouts logged in the last 7 days. Aim for 5 sessions/week to maintain muscle while in a deficit.`
    })
  }

  return findings
}

// ── Master dashboard builder ──────────────

export const buildDashboard = (
  entries: Entry[],
  profile: Profile
): DashboardData => {
  const stats     = calcStatStrip(entries, profile)
  const phases    = calcPhases(entries)
  const macroCompliance = calcMacroCompliance(entries, profile)
  const projection = calcProjection(stats, profile)
  const findings  = calcFindings(entries, profile, stats, phases)

  return {
    stats,
    phases,
    macroCompliance,
    projection,
    findings,
    entries: sortEntries(entries)
  }
}
