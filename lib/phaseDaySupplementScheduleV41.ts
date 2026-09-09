
export type DayType = "HIGH" | "MEDIUM" | "LOW" | "ZERO";

export const COACH_SUPPLEMENTS: Record<DayType, any> = {
  HIGH: {
    wake: ["Electrolytes"],
    meal1: ["Omega-3", "Vitamin D3", "Vitamin K2", "CoQ10"],
    preWorkout: ["Citrulline Malate", "Beta-Alanine", "Taurine", "Betaine Anhydrous"],
    intraWorkout: ["Electrolytes"],
    postWorkout: ["Digestive Enzymes"],
    evening: ["Magnesium Glycinate"]
  },
  MEDIUM: {
    wake: ["Electrolytes"],
    meal1: ["Omega-3", "Vitamin D3", "Vitamin K2", "CoQ10"],
    preWorkout: ["Citrulline Malate", "Beta-Alanine", "Taurine", "Betaine Anhydrous"],
    intraWorkout: ["Electrolytes"],
    postWorkout: ["Digestive Enzymes"],
    evening: ["Magnesium Glycinate"]
  },
  LOW: {
    wake: ["Electrolytes"],
    meal1: ["Omega-3", "Vitamin D3", "Vitamin K2", "CoQ10"],
    preWorkout: ["Citrulline Malate", "Beta-Alanine", "Taurine", "Betaine Anhydrous"],
    intraWorkout: ["Electrolytes"],
    postWorkout: ["Digestive Enzymes"],
    evening: ["Magnesium Glycinate"]
  },
  ZERO: {
    wake: ["Electrolytes"],
    meal1: ["Omega-3", "Vitamin D3", "Vitamin K2", "CoQ10"],
    preWorkout: ["Citrulline Malate", "Beta-Alanine", "Taurine", "Betaine Anhydrous"],
    intraWorkout: ["Electrolytes"],
    postWorkout: ["Digestive Enzymes"],
    evening: ["Magnesium Glycinate"]
  }
};

export const PRE_WORKOUT = [
  "Citrulline Malate",
  "Beta-Alanine",
  "Taurine",
  "Betaine Anhydrous"
];

export function getCoachSupplements(dayType: DayType) {
  return COACH_SUPPLEMENTS[dayType];
}
