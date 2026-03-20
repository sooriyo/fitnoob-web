// ─────────────────────────────────────────
//  FAT BURN TRACKER — Type Definitions
// ─────────────────────────────────────────

export interface Entry {
  $id?: string
  date: string           // "YYYY-MM-DD"
  weight?: number        // kg, 1 decimal
  body_fat?: number      // %, 1 decimal
  calories?: number      // kcal
  protein?: number       // grams
  carbs?: number         // grams
  fat?: number           // grams
  walk_km?: number       // km, 1 decimal
  workout_day?: string   // "Push A" | "Pull A" | etc.
  workout_done?: boolean
  notes?: string
  user_id: string
}

export interface Profile {
  $id?: string
  user_id: string
  name: string
  start_weight: number
  goal_weight: number
  start_date: string     // "YYYY-MM-DD"
  target_calories: number
  target_protein: number
  target_carbs: number
  target_fat: number
  onboarding_done: boolean
}

export interface MacroPreset {
  label: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  recommended?: boolean
}

export interface WorkoutDay {
  dayNum: number          // 1–7
  weekday: string         // "Monday"
  name: string            // "Push A"
  type: 'push' | 'pull' | 'legs' | 'cardio' | 'rest'
  focus: string
  exercises: Exercise[]
}

export interface Exercise {
  name: string
  sets?: string           // "4 × 6–8"
  note?: string
  section: string         // "Chest" | "Shoulders" | etc.
}

// ── Dashboard calculation types ──────────

export interface PhaseSegment {
  label: string
  startDate: string
  endDate: string
  startWeight: number
  endWeight: number
  durationWeeks: number
  lostKg: number
  ratePerWeek: number
  status: 'fast' | 'good' | 'slow' | 'stall' | 'gain'
  cause: string
}

export interface StatStrip {
  totalLostKg: number
  currentWeight: number
  recentRatePerWeek: number   // last 14 days
  daysTracked: number
  daysToGoal: number          // at current rate
}

export interface MacroCompliance {
  calorieHitRate: number      // % of days within ±100 kcal
  proteinHitRate: number      // % of days hitting target
  avgCalories: number
  avgProtein: number
  avgCarbs: number
  avgFat: number
  daysLogged: number
}

export interface Projection {
  currentRateWeekly: number
  weeksAtCurrentRate: number
  weeksAtOptimalRate: number  // 500g/week
  estimatedDateCurrent: string
  estimatedDateOptimal: string
  kgToGoal: number
}

export interface Finding {
  severity: 'critical' | 'warning' | 'info' | 'good'
  title: string
  body: string
}

export interface DashboardData {
  stats: StatStrip
  phases: PhaseSegment[]
  macroCompliance: MacroCompliance
  projection: Projection
  findings: Finding[]
  entries: Entry[]
}

// ── Import / Export ───────────────────────

export interface ImportRow {
  date: string
  weight?: string | number
  body_fat?: string | number
  calories?: string | number
  protein?: string | number
  carbs?: string | number
  fat?: string | number
  walk_km?: string | number
  workout_day?: string
  workout_done?: string | boolean
  notes?: string
}
