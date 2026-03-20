// ─────────────────────────────────────────
//  FAT BURN TRACKER — Seed Data
//  Tharuka's Nov 2025 – Feb 2026 history
//  + Full PPL×2 workout schedule
// ─────────────────────────────────────────

import type { Entry, WorkoutDay, MacroPreset } from './types'

// ── Historical weight entries ─────────────
// Used to pre-populate DB on first login

export const SEED_ENTRIES: Omit<Entry, 'user_id'>[] = [
  {
    date: '2025-11-16',
    weight: 90.85,
    body_fat: 30.2,
    calories: 1250,
    protein: 180,
    carbs: 40,
    fat: 25,
    walk_km: 10,
    workout_day: 'Push A',
    workout_done: true,
    notes: 'Starting point. Strict protocol begins.'
  },
  {
    date: '2025-11-22',
    weight: 90.7,
    calories: 1240,
    protein: 182,
    carbs: 38,
    fat: 22,
    walk_km: 9,
    workout_day: 'Push B',
    workout_done: true,
    notes: 'First progress photo day.'
  },
  {
    date: '2025-11-26',
    weight: 89.5,
    calories: 1200,
    protein: 175,
    carbs: 35,
    fat: 20,
    walk_km: 0,
    workout_done: false,
    notes: 'Flood — missed gym and walks.'
  },
  {
    date: '2025-12-01',
    weight: 88.2,
    calories: 1250,
    protein: 183,
    carbs: 42,
    fat: 23,
    walk_km: 10,
    workout_day: 'Pull A',
    workout_done: true,
    notes: 'Restart after flood break. Good energy.'
  },
  {
    date: '2025-12-08',
    weight: 87.1,
    calories: 1240,
    protein: 180,
    carbs: 38,
    fat: 22,
    walk_km: 11,
    workout_day: 'Legs A',
    workout_done: true,
    notes: 'First big whoosh period starting.'
  },
  {
    date: '2025-12-15',
    weight: 86.3,
    calories: 1250,
    protein: 185,
    carbs: 40,
    fat: 24,
    walk_km: 12,
    workout_day: 'Push A',
    workout_done: true,
    notes: 'Waist noticeably smaller.'
  },
  {
    date: '2025-12-26',
    weight: 85.5,
    calories: 1240,
    protein: 181,
    carbs: 38,
    fat: 22,
    walk_km: 10,
    workout_day: 'Pull B',
    workout_done: true,
    notes: 'Mid-cut progress photo. Good definition.'
  },
  {
    date: '2026-01-03',
    weight: 84.5,
    calories: 1250,
    protein: 183,
    carbs: 40,
    fat: 23,
    walk_km: 10,
    workout_day: 'Legs B',
    workout_done: true,
    notes: 'Progress photo. Upper abs visible when flexed.'
  },
  {
    date: '2026-01-08',
    weight: 84.95,
    body_fat: 26.8,
    calories: 1240,
    protein: 180,
    carbs: 38,
    fat: 22,
    walk_km: 9,
    workout_day: 'Push A',
    workout_done: true,
    notes: 'Zepp scale reading. Visceral fat: 10.'
  },
  {
    date: '2026-01-09',
    weight: 84.50,
    body_fat: 26.7,
    calories: 1250,
    protein: 182,
    carbs: 96,
    fat: 22,
    walk_km: 10,
    workout_day: 'Pull A',
    workout_done: true,
    notes: 'Waist 96cm. Refeed day.'
  },
  {
    date: '2026-01-13',
    weight: 83.35,
    body_fat: 26.3,
    calories: 1240,
    protein: 185,
    carbs: 40,
    fat: 22,
    walk_km: 11,
    workout_day: 'Cardio + Core',
    workout_done: true,
    notes: 'Post-refeed whoosh. Love handles flatter.'
  },
  {
    date: '2026-01-17',
    weight: 84.10,
    calories: 3200,
    protein: 160,
    carbs: 280,
    fat: 90,
    walk_km: 3,
    workout_done: false,
    notes: 'Cheat day — KFC + kottu + milkshake + pudding.'
  },
  {
    date: '2026-01-20',
    weight: 83.80,
    body_fat: 26.4,
    calories: 1250,
    protein: 181,
    carbs: 38,
    fat: 22,
    walk_km: 10,
    workout_day: 'Push B',
    workout_done: true,
    notes: 'Back on track after cheat. Cortisol water drop.'
  },
  {
    date: '2026-01-23',
    weight: 82.30,
    body_fat: 26.8,
    calories: 2500,
    protein: 175,
    carbs: 260,
    fat: 45,
    walk_km: 8,
    workout_day: 'Pull B',
    workout_done: true,
    notes: 'Refeed day. Post-refeed water dump starting.'
  },
  {
    date: '2026-01-30',
    weight: 82.10,
    calories: 1240,
    protein: 183,
    carbs: 38,
    fat: 22,
    walk_km: 10,
    workout_day: 'Legs A',
    workout_done: true,
    notes: 'Shirts noticeably looser around waist.'
  },
  {
    date: '2026-02-07',
    weight: 81.95,
    calories: 1250,
    protein: 180,
    carbs: 40,
    fat: 23,
    walk_km: 9,
    workout_day: 'Push A',
    workout_done: true,
    notes: 'Skin looseness around abdomen noted.'
  },
  {
    date: '2026-02-14',
    weight: 81.80,
    calories: 1240,
    protein: 182,
    carbs: 38,
    fat: 22,
    walk_km: 10,
    workout_day: 'Pull A',
    workout_done: true,
    notes: 'Scale barely moving — stall confirmed.'
  },
  {
    date: '2026-02-21',
    weight: 81.75,
    calories: 1245,
    protein: 181,
    carbs: 39,
    fat: 22,
    walk_km: 10,
    workout_day: 'Legs B',
    workout_done: true,
    notes: 'Energy still 8/10. Piriformis 1/10 pain.'
  },
  {
    date: '2026-02-28',
    weight: 81.70,
    calories: 1240,
    protein: 183,
    carbs: 38,
    fat: 22,
    walk_km: 9,
    workout_day: 'Push B',
    workout_done: true,
    notes: 'Latest logged. Rate 118g/week — stall confirmed.'
  }
]

// ── Workout Schedule (PPL×2 + Cardio + Rest) ─

export const WORKOUT_SCHEDULE: WorkoutDay[] = [
  {
    dayNum: 1,
    weekday: 'Monday',
    name: 'Push A',
    type: 'push',
    focus: 'Heavy compounds — strength focus',
    exercises: [
      { section: 'Warm-up', name: 'Cross trainer / bike', sets: '10 min' },
      { section: 'Warm-up', name: 'Band pull-aparts + shoulder circles', sets: '2 × 15' },
      { section: 'Chest', name: 'Barbell Bench Press', sets: '4 × 6–8', note: 'Primary strength builder. Rest 2–3 min.' },
      { section: 'Chest', name: 'Incline Dumbbell Press', sets: '3 × 8–10' },
      { section: 'Chest', name: 'Cable Fly (High to Low)', sets: '3 × 12–15' },
      { section: 'Shoulders', name: 'Barbell Overhead Press', sets: '4 × 8–10' },
      { section: 'Shoulders', name: 'Dumbbell Lateral Raise', sets: '3 × 12–15' },
      { section: 'Shoulders', name: 'Face Pull (Cable)', sets: '3 × 15', note: 'Rear delt + rotator cuff. Never skip.' },
      { section: 'Triceps', name: 'Overhead Triceps Extension', sets: '3 × 10–12' },
      { section: 'Triceps', name: 'Rope Pushdown', sets: '3 × 12–15' }
    ]
  },
  {
    dayNum: 2,
    weekday: 'Tuesday',
    name: 'Pull A',
    type: 'pull',
    focus: 'Back width + thickness — compound priority',
    exercises: [
      { section: 'Warm-up', name: 'Light lat pulldown + band dislocates', sets: '2 × 12' },
      { section: 'Back — Width', name: 'Wide Grip Lat Pulldown', sets: '4 × 8–10' },
      { section: 'Back — Width', name: 'Close Grip Lat Pulldown', sets: '3 × 10–12' },
      { section: 'Back — Thickness', name: 'Chest-Supported T-Bar Row', sets: '4 × 8–10', note: 'Chest support removes lower back load.' },
      { section: 'Back — Thickness', name: 'Seated Cable Row', sets: '3 × 10–12' },
      { section: 'Rear Delts', name: 'Face Pull (Cable)', sets: '3 × 15' },
      { section: 'Rear Delts', name: 'Reverse Pec Deck', sets: '3 × 12–15' },
      { section: 'Biceps', name: 'Barbell Curl', sets: '3 × 8–10' },
      { section: 'Biceps', name: 'Hammer Curl', sets: '3 × 10–12' }
    ]
  },
  {
    dayNum: 3,
    weekday: 'Wednesday',
    name: 'Legs A',
    type: 'legs',
    focus: 'Quad dominant — squat pattern priority',
    exercises: [
      { section: 'Warm-up', name: 'Stationary bike', sets: '10 min' },
      { section: 'Warm-up', name: 'Bodyweight squat + hip flexor stretch', sets: '2 × 10' },
      { section: 'Quads + Glutes', name: 'Barbell Back Squat', sets: '4 × 6–8', note: 'Rest 2–3 min between sets.' },
      { section: 'Quads + Glutes', name: 'Leg Press', sets: '4 × 10–12' },
      { section: 'Quads + Glutes', name: 'Leg Extension (Machine)', sets: '3 × 12–15' },
      { section: 'Hamstrings + Glutes', name: 'Romanian Deadlift', sets: '4 × 8–10', note: 'Feel the stretch at the bottom.' },
      { section: 'Hamstrings + Glutes', name: 'Leg Curl (Machine)', sets: '3 × 12' },
      { section: 'Calves + Core', name: 'Standing Calf Raise', sets: '4 × 15–20' },
      { section: 'Calves + Core', name: 'Hanging Leg Raise', sets: '3 × 15' }
    ]
  },
  {
    dayNum: 4,
    weekday: 'Thursday',
    name: 'Cardio + Core',
    type: 'cardio',
    focus: 'Active recovery — elevate metabolism',
    exercises: [
      { section: 'Cardio (choose one)', name: 'HIIT — Bike/cross-trainer', sets: '20 min', note: '20s all-out / 40s easy · 8–10 rounds' },
      { section: 'Cardio (choose one)', name: 'LISS — Brisk walk/elliptical', sets: '30–40 min', note: 'Zone 2 HR if legs sore from Day 3' },
      { section: 'Core Circuit × 3', name: 'Plank hold', sets: '45–60 sec' },
      { section: 'Core Circuit × 3', name: 'Cable Crunch or Decline Crunch', sets: '3 × 15' },
      { section: 'Core Circuit × 3', name: 'Russian Twist', sets: '3 × 20' },
      { section: 'Core Circuit × 3', name: 'Ab Wheel Rollout', sets: '3 × 10' },
      { section: 'Mobility', name: 'Hip flexor + thoracic spine stretch', sets: '10 min' }
    ]
  },
  {
    dayNum: 5,
    weekday: 'Friday',
    name: 'Push B',
    type: 'push',
    focus: 'Upper chest + shoulder volume focus',
    exercises: [
      { section: 'Warm-up', name: 'Resistance band shoulder warm-up', sets: '2 × 15' },
      { section: 'Chest — Upper', name: 'Incline Barbell Press', sets: '4 × 8', note: 'Keep elbows 45° from body.' },
      { section: 'Chest — Upper', name: 'Dumbbell Bench Press', sets: '3 × 10' },
      { section: 'Chest — Upper', name: 'Cable Fly (Low to High)', sets: '3 × 12–15', note: 'Upper chest stretch + peak contraction.' },
      { section: 'Shoulders', name: 'Dumbbell Shoulder Press', sets: '3 × 10–12' },
      { section: 'Shoulders', name: 'Lateral Raise (Cable or DB)', sets: '4 × 15', note: 'Cables maintain tension throughout ROM.' },
      { section: 'Shoulders', name: 'Dumbbell Front Raise', sets: '2 × 12' },
      { section: 'Triceps', name: 'Skull Crushers (EZ Bar)', sets: '3 × 10' },
      { section: 'Triceps', name: 'Triceps Pushdown (Bar or V-bar)', sets: '3 × 12' }
    ]
  },
  {
    dayNum: 6,
    weekday: 'Saturday',
    name: 'Pull B',
    type: 'pull',
    focus: 'Back thickness + arm volume emphasis',
    exercises: [
      { section: 'Warm-up', name: 'Light cable rows + scapular retractions', sets: '2 × 12' },
      { section: 'Back — Compound', name: 'Pull-Ups (or Assisted)', sets: '4 × max', note: 'Track reps each week.' },
      { section: 'Back — Compound', name: 'Machine Row', sets: '4 × 8–10' },
      { section: 'Back — Compound', name: 'Single-Arm Dumbbell Row', sets: '3 × 10' },
      { section: 'Back — Isolation', name: 'Straight-Arm Pulldown (Cable)', sets: '3 × 12–15' },
      { section: 'Back — Isolation', name: 'Reverse Pec Deck', sets: '3 × 12–15' },
      { section: 'Biceps', name: 'Incline Dumbbell Curl', sets: '3 × 10', note: 'Long head stretch at full extension.' },
      { section: 'Biceps', name: 'Single-Arm Preacher Curl', sets: '3 × 10' },
      { section: 'Biceps', name: 'Cable Curl', sets: '2 × 12–15' }
    ]
  },
  {
    dayNum: 7,
    weekday: 'Sunday',
    name: 'Legs B + Rest',
    type: 'legs',
    focus: 'Hip dominant — deadlift pattern priority',
    exercises: [
      { section: 'Warm-up', name: 'Bike + glute activation band work', sets: '10 min' },
      { section: 'Hamstrings + Glutes', name: 'Sumo or Romanian Deadlift', sets: '4 × 6–8', note: 'Sumo = more glute. RDL = more hamstring.' },
      { section: 'Hamstrings + Glutes', name: 'Leg Curl (Machine)', sets: '4 × 10–12' },
      { section: 'Hamstrings + Glutes', name: 'Hip Thrust (Barbell or Machine)', sets: '4 × 10–12', note: 'Best glute builder. Squeeze hard at top.' },
      { section: 'Quads — Accessory', name: 'Hack Squat or Leg Press', sets: '3 × 10–12' },
      { section: 'Quads — Accessory', name: 'Leg Extension', sets: '3 × 15' },
      { section: 'Calves + Core', name: 'Seated Calf Raise', sets: '4 × 15–20', note: 'Targets soleus — pair with standing.' },
      { section: 'Calves + Core', name: 'Hanging Leg Raise', sets: '3 × 15' }
    ]
  }
]

// ── Macro Presets ─────────────────────────

export const MACRO_PRESETS: MacroPreset[] = [
  {
    label: 'Aggressive Cut',
    description: 'Maximum fat loss. Best for short bursts only — not sustainable long-term.',
    calories: 1250,
    protein: 180,
    carbs: 40,
    fat: 25
  },
  {
    label: 'Recommended Cut',
    description: 'Optimal deficit for your current weight + activity level. Breaks the adaptation plateau.',
    calories: 1500,
    protein: 175,
    carbs: 100,
    fat: 40,
    recommended: true
  },
  {
    label: 'Maintenance Reset',
    description: '2-week diet break to fully restore leptin and metabolic rate before cutting again.',
    calories: 2000,
    protein: 160,
    carbs: 150,
    fat: 60
  },
  {
    label: 'Custom',
    description: 'Set your own targets.',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  }
]

// ── Profile defaults ──────────────────────

export const DEFAULT_PROFILE = {
  name: 'Tharuka',
  start_weight: 90.85,
  goal_weight: 75,
  start_date: '2025-11-16',
  target_calories: 1500,
  target_protein: 175,
  target_carbs: 100,
  target_fat: 40,
  onboarding_done: false
}
