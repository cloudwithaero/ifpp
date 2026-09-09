export type TDEEActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "HEAVY" | "ATHLETE";

// Methodology aligned with TDEECalculator.net's public formulas:
// 1) If body-fat is supplied, use Katch-McArdle.
// 2) Otherwise use Mifflin-St Jeor.
// 3) Multiply BMR by the selected activity multiplier.
// The public site uses -151 for females in Mifflin-St Jeor.
export const TDEE_ACTIVITY_MULTIPLIERS: Record<TDEEActivityLevel, number> = {
  SEDENTARY: 1.20,
  LIGHT: 1.375,
  MODERATE: 1.55,
  HEAVY: 1.725,
  ATHLETE: 1.90,
};

export function calculateBMR(args: {
  weightKg: number;
  heightCm?: number;
  ageYears?: number;
  sex?: "male" | "female";
  bodyFatPercent?: number;
}) {
  const { weightKg, heightCm, ageYears, sex = "male", bodyFatPercent } = args;
  const hasValidBodyFat = Number.isFinite(bodyFatPercent) && (bodyFatPercent as number) > 2 && (bodyFatPercent as number) < 70;

  if (hasValidBodyFat) {
    const lbm = weightKg * (1 - (bodyFatPercent as number) / 100);
    return {
      bmr: 370 + 21.6 * lbm,
      method: "Katch-McArdle" as const,
      leanBodyMassKg: lbm,
    };
  }

  if (Number.isFinite(heightCm) && Number.isFinite(ageYears)) {
    const s = sex === "female" ? -151 : 5;
    return {
      bmr: 10 * weightKg + 6.25 * (heightCm as number) - 5 * (ageYears as number) + s,
      method: "Mifflin-St Jeor" as const,
      leanBodyMassKg: undefined,
    };
  }

  // No height/age: retain a conservative fallback rather than inventing inputs.
  return {
    bmr: 22 * weightKg,
    method: "Weight fallback" as const,
    leanBodyMassKg: undefined,
  };
}

export function calculateTDEE(args: {
  weightKg: number;
  heightCm?: number;
  ageYears?: number;
  sex?: "male" | "female";
  bodyFatPercent?: number;
  activity: TDEEActivityLevel;
}) {
  const activity = TDEE_ACTIVITY_MULTIPLIERS[args.activity] ? args.activity : "MODERATE" as TDEEActivityLevel;
  const base = calculateBMR(args);
  const tdee = base.bmr * TDEE_ACTIVITY_MULTIPLIERS[activity];
  return {
    ...base,
    activity,
    activityMultiplier: TDEE_ACTIVITY_MULTIPLIERS[activity],
    tdee,
  };
}
