
// V39 — Coach Template Supplement Schedule
// Supplements are placed by actual coach-defined timing, not by generic catalog category.

export const COACH_SUPPLEMENT_SCHEDULE = {
  wake: [
    "Electrolytes"
  ],
  meal1: [
    "Omega-3",
    "Vitamin D3",
    "Vitamin K2",
    "CoQ10"
  ],
  preWorkout: [
    "Citrulline Malate",
    "Beta-Alanine",
    "Taurine",
    "Betaine Anhydrous"
  ],
  intraWorkout: [
    "Electrolytes"
  ],
  postWorkout: [
    "Digestive Enzymes"
  ],
  meal5: [
    "Omega-3"
  ],
  evening: [
    "Magnesium Glycinate"
  ]
} as const;

// Items that are intentionally NOT placed at wake-up.
export const NEVER_PLACE_AT_WAKE = [
  "Beta-Alanine",
  "Citrulline Malate",
  "Taurine",
  "Betaine Anhydrous",
  "Creatine Monohydrate",
  "Omega-3",
  "Vitamin D3",
  "Vitamin K2",
  "CoQ10",
  "Magnesium Glycinate"
] as const;

export function supplementTimingKey(name:string) {
  const n = name.toLowerCase();
  if (n.includes("electrolyte")) return "wake";
  if (n.includes("citrulline") || n.includes("beta-alanine") ||
      n.includes("taurine") || n.includes("betaine")) return "preWorkout";
  if (n.includes("digestive")) return "postWorkout";
  if (n.includes("magnesium")) return "evening";
  if (n.includes("omega-3")) return "meal1";
  if (n.includes("vitamin d3") || n.includes("vitamin k2") || n.includes("coq10")) return "meal1";
  return "meal1";
}
