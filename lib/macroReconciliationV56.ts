
// V56 — Authoritative P/C/F reconciliation
export type MacroTarget = { protein:number; carbs:number; fat:number };

export function caloriesFromMacros(t: MacroTarget) {
  return Math.round(t.protein * 4 + t.carbs * 4 + t.fat * 9);
}

export function reconcileMacroTarget(t: MacroTarget) {
  return {
    protein: t.protein,
    carbs: t.carbs,
    fat: t.fat,
    calories: caloriesFromMacros(t)
  };
}

// Protein remains authoritative. Fat is solved before carbs.
export function solveRemainingMacros(
  target: MacroTarget,
  achieved: { protein:number; carbs:number; fat:number }
) {
  return {
    remainingProtein: Math.max(0, target.protein - achieved.protein),
    remainingFat: Math.max(0, target.fat - achieved.fat),
    remainingCarbs: Math.max(0, target.carbs - achieved.carbs),
  };
}
