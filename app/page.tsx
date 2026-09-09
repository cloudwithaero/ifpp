
/*
 V67 GENERATION CONTRACT
 The original generation routine must produce one normalized plan object:
 {
   dayType, target:{protein,carbs,fat,calories},
   meals:[{foods,supplements}],
   totals
 }
 Preview and Print must render this exact object.
 Food solving order: protein source -> fat source -> carb source -> vegetables.
 Eggs/egg whites are count-based for display.
 Do not render stale meal text from a previous generation.
*/

"use client";

// V67 — DIRECT GENERATOR CONTRACT
// This block is intentionally inside app/page.tsx so the actual page can use it.
// Preview and Print must consume the same generated plan object.
type V67Target = { protein:number; carbs:number; fat:number };

const v60Calories = (t:V67Target) => Math.round(t.protein*4 + t.carbs*4 + t.fat*9);

const peakLeafyVegetableAllowedGlobal = (f: { name_ar?: string; name_en?: string }) =>
  /جرجير|arugula|rocket|خس|lettuce|سبانخ|spinach|بقدونس|parsley|كزبرة|coriander|شبت|dill|نعناع|mint/i.test(`${f.name_ar || ""} ${f.name_en || ""}`);


const v60NormalizeTarget = (t:V67Target) => ({
  protein: t.protein,
  carbs: t.carbs,
  fat: t.fat,
  calories: v60Calories(t)
});

const v60FormatMeal = (n:number, foods:string[], supplements:string[] = []) =>
  [
    "━━━━━━━━━━━━━━━━━━",
    `🍽️ الوجبة ${n}`,
    "━━━━━━━━━━━━━━━━━━",
    "",
    ...foods.map(x => `• ${x}`),
    ...(supplements.length ? ["", "💊 المكملات", ...supplements.map(x => `• ${x}`)] : []),
    ""
  ].join("\n");

// Hard validation: never render a plan whose displayed macros disagree with target.
const v60ValidateTotals = (
  totals:{protein:number; carbs:number; fat:number},
  target:V67Target
) =>
  Math.abs(totals.protein-target.protein) <= 2 &&
  Math.abs(totals.carbs-target.carbs) <= 5 &&
  Math.abs(totals.fat-target.fat) <= 3;


// V67_FORMATTER — one formatter for Preview + Print
const formatMealBlockV67 = (
  mealNumber:number,
  foods:string[],
  supplements:string[] = []
) => [
  `━━━━━━━━━━━━━━━━━━`,
  `🍽️ الوجبة ${mealNumber}`,
  `━━━━━━━━━━━━━━━━━━`,
  ``,
  ...foods.map(x => `• ${x}`),
  ...(supplements.length ? [``, `💊 المكملات`, ...supplements.map(x => `• ${x}`)] : []),
  ``
].join("\n");

const formatSectionV67 = (title:string, body:string[]) => [
  `━━━━━━━━━━━━━━━━━━`,
  title,
  `━━━━━━━━━━━━━━━━━━`,
  ``,
  ...body,
  ``
].join("\n");

// Calories must be derived from displayed P/C/F.
const caloriesFromPCFV67 = (p:number,c:number,f:number) =>
  Math.round(p * 4 + c * 4 + f * 9);


// V67_AUTHORITATIVE_GENERATE
// Single-source generation contract used by Preview and Print.
// P/F/C targets are authoritative; calories are derived.
const v58Calories = (p:number,c:number,f:number) => Math.round(p*4+c*4+f*9);

function v58NormalizeTarget(target:{protein:number;carbs:number;fat:number}) {
  return {
    protein: target.protein,
    carbs: target.carbs,
    fat: target.fat,
    calories: v58Calories(target.protein,target.carbs,target.fat)
  };
}

function v58ValidatePlan(plan:any, target:{protein:number;carbs:number;fat:number}) {
  const t = plan?.totals || {};
  const eps = { protein:2, carbs:5, fat:3 };
  return Math.abs((t.protein??0)-target.protein)<=eps.protein &&
         Math.abs((t.carbs??0)-target.carbs)<=eps.carbs &&
         Math.abs((t.fat??0)-target.fat)<=eps.fat;
}


// V67_GENERATE_PIPELINE
// Authoritative generation contract:
// 1) P/F/C targets are read from the selected day.
// 2) Protein source quantity is solved first.
// 3) Fat source quantity is solved second.
// 4) Carbohydrate quantity is solved third.
// 5) Calories are derived from P/C/F; no stale calorie target is displayed.
// 6) Preview and print must use the same generated plan object.
const V67_caloriesFromMacros = (p:number,c:number,f:number) =>
  Math.round(p * 4 + c * 4 + f * 9);

const V67_reconcileTarget = (p:number,c:number,f:number) => ({
  protein:p, carbs:c, fat:f,
  calories:V67_caloriesFromMacros(p,c,f)
});


// V48 — REAL GENERATE PIPELINE
// This is the function the Generate action should call. It does not rely on the
// standalone V47 helper; it performs the allocation in the generation path.
type V48Food = {
  name:string;
  category:"protein"|"carb"|"fat"|"vegetable";
  protein:number;
  carbs:number;
  fat:number;
  unit?: "g"|"whole_egg"|"egg_white";
};

type V48Target = { protein:number; carbs:number; fat:number };

const V48_ROUND = (x:number) => Math.round(x * 10) / 10;

function v48PerUnit(food:V48Food, macro:"protein"|"carbs"|"fat") {
  return Number(food[macro]) || 0;
}

function v48ProteinQty(food:V48Food, targetProtein:number) {
  // Eggs are represented as counts. Everything else is grams.
  if (food.unit === "whole_egg" || food.unit === "egg_white") {
    const perUnit = v48PerUnit(food,"protein");
    return perUnit > 0 ? Math.max(1, Math.round(targetProtein / perUnit)) : 1;
  }
  const per100 = v48PerUnit(food,"protein");
  return per100 > 0 ? Math.max(1, Math.round(targetProtein * 100 / per100)) : 0;
}

function v48QtyForMacro(food:V48Food, macro:"carbs"|"fat", target:number) {
  const per100 = v48PerUnit(food, macro);
  return per100 > 0 ? Math.max(0, Math.round(target * 100 / per100)) : 0;
}

function v48MakeMeal(target:V48Target, proteinFood:V48Food, carbFood:V48Food|null, fatFood:V48Food|null, vegFood:V48Food|null) {
  const proteinQty = v48ProteinQty(proteinFood, target.protein);
  const proteinFactor = proteinFood.unit ? proteinQty : proteinQty / 100;

  const p = proteinFactor * proteinFood.protein;
  const c0 = proteinFactor * proteinFood.carbs;
  const f0 = proteinFactor * proteinFood.fat;

  const remainingC = Math.max(0, target.carbs - c0);
  const remainingF = Math.max(0, target.fat - f0);

  const carbQty = carbFood ? v48QtyForMacro(carbFood, "carbs", remainingC) : 0;
  const fatQty = fatFood ? v48QtyForMacro(fatFood, "fat", remainingF) : 0;

  return {
    proteinFood, proteinQty,
    carbFood, carbQty,
    fatFood, fatQty,
    vegFood,
    vegQty: vegFood ? 200 : 0,
    achieved: {
      protein: p,
      carbs: c0 + (carbQty/100)*(carbFood?.carbs || 0),
      fat: f0 + (fatQty/100)*(fatFood?.fat || 0)
    }
  };
}

function generateAutoDietV48(target:V48Target, foods:V48Food[], meals=5) {
  const proteins = foods.filter(x=>x.category==="protein");
  const carbs = foods.filter(x=>x.category==="carb");
  const fats = foods.filter(x=>x.category==="fat");
  const vegetables = foods.filter(x=>x.category==="vegetable");

  if (proteins.length < meals) throw new Error("Not enough protein sources in catalog.");

  const perMeal = {
    protein: target.protein / meals,
    carbs: target.carbs / meals,
    fat: target.fat / meals
  };

  const result = Array.from({length:meals},(_,i)=>{
    const proteinFood = proteins[i % proteins.length];
    const carbFood = carbs.length ? carbs[i % carbs.length] : null;
    const fatFood = fats.length ? fats[i % fats.length] : null;
    const vegFood = vegetables.length ? vegetables[i % vegetables.length] : null;
    return v48MakeMeal(perMeal, proteinFood, carbFood, fatFood, vegFood);
  });

  const totals = result.reduce((a,m)=>({
    protein:a.protein+m.achieved.protein,
    carbs:a.carbs+m.achieved.carbs,
    fat:a.fat+m.achieved.fat
  }),{protein:0,carbs:0,fat:0});

  // Generation is invalid if it misses the requested macros materially.
  const valid =
    Math.abs(totals.protein-target.protein) <= 2 &&
    Math.abs(totals.carbs-target.carbs) <= 5 &&
    Math.abs(totals.fat-target.fat) <= 3;

  if (!valid) throw new Error(
    `AUTO DIET validation failed: P ${V48_ROUND(totals.protein)}/${target.protein}, `+
    `C ${V48_ROUND(totals.carbs)}/${target.carbs}, F ${V48_ROUND(totals.fat)}/${target.fat}`
  );

  return { meals:result, totals, target, valid:true };
}


// V42 — ACTUAL PREVIEW TIMING
const V42_SUPPLEMENT_TIMING: Record<string,string> = {
  "Electrolytes":"wake_intra",
  "Omega-3":"meal1",
  "Vitamin D3":"meal1",
  "Vitamin K2":"meal1",
  "CoQ10":"meal1",
  "Citrulline Malate":"pre",
  "Beta-Alanine":"pre",
  "Taurine":"pre",
  "Betaine Anhydrous":"pre",
  "Digestive Enzymes":"post",
  "Magnesium Glycinate":"evening"
};

function v42SupplementTiming(name:string){
  const key = Object.keys(V42_SUPPLEMENT_TIMING).find(k =>
    name.toLowerCase().includes(k.toLowerCase())
  );
  return key ? V42_SUPPLEMENT_TIMING[key] : "manual";
}

function v42RenderSupplementBlock(name:string, amount:string){
  const timing = v42SupplementTiming(name);
  return {name, amount, timing};
}

// V36_FINAL_DIET_SCHEDULE_READY: use lib/finalDietScheduleV36.ts for preview rendering.
 

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { calculateTDEE, TDEE_ACTIVITY_MULTIPLIERS, type TDEEActivityLevel } from "../lib/tdeeCalculator";

const DEFAULT_PLAYER_ID = "54fddda1-410f-4e6d-b7a0-754178ffbb53";

type Measurement = {
  id?: string;
  player_id?: string;
  weight?: number | null;
  body_fat?: number | null;
  height?: number | null;
  waist?: number | null;
  thigh?: number | null;
  arm?: number | null;
  notes?: string | null;
  measured_at?: string | null;
  recorded_at?: string | null;
};

type PlayerPlan = {
  id?: string;
  player_id?: string;
  diet_system?: string | null;
  training_program?: string | null;
  cardio_plan?: string | null;
  supplements?: string | null;
  notes?: string | null;
  updated_at?: string | null;
  phase?: string | null;
  diet_system_type?: string | null;
  macro_mode?: string | null;
  calorie_adjustment?: number | null;
  auto_calories?: number | null;
  target_calories?: number | null;
  peak_week_type?: string | null;
  peak_start_date?: string | null;
  peak_show_date?: string | null;
  day_macro_overrides?: Record<string, Partial<MacroTargets>> | null;
};

type PlayerPlanHistory = PlayerPlan & {
  created_at?: string | null;
};

type PlayerOption = {
  id: string;
  name: string;
};

type DayType = "HIGH" | "MEDIUM" | "LOW" | "ZERO";
type DietSystem = "CUTTING" | "BULK" | "PEAK WEEK";
type DietStrategy = "STANDARD CUT" | "AGGRESSIVE CARB CYCLE" | "CONTEST PREP" | "CONTEST CONTINUATION" | "LEAN GROWTH" | "FULLNESS FOCUSED" | "MAXIMUM MASS" | "LOWER BODY MASS";
type CarbStructure = "FIXED" | "CARB CYCLE";
type MacroMode = "AUTO" | "MANUAL";
type PeakWeekType = "FRONT LOAD" | "BACK LOAD" | "LINEAR LOAD" | "MID LOAD" | "CONSERVATIVE / NO LOAD";
type PeakDayMode = "DEPLETE" | "LOW" | "MODERATE" | "LOAD" | "TIGHTEN" | "SHOW DAY";
type PeakResponseMode = "BALANCED" | "FLAT" | "SOFT";
type TrainingStatus = "TRAINING" | "REST";
type CardioMode = "NONE" | "FASTED" | "POST_WORKOUT" | "FASTED_POST_WORKOUT";
type CardioConfig = { mode: CardioMode; fastedType: string; postType: string; fastedMinutes: string; postMinutes: string; intensity: string };
type DayKey = "السبت" | "الأحد" | "الإثنين" | "الثلاثاء" | "الأربعاء" | "الخميس" | "الجمعة";

type MacroTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type CatalogFood = {
  id: number;
  name_ar: string;
  name_en: string | null;
  category: "protein" | "carb" | "fat" | "vegetable";
  serving_qty: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  active?: boolean;
};

// V140 — deterministic emergency nutrition catalog. Generation must not be
// blocked just because Supabase Catalog V74 is temporarily empty/unavailable.
// These values mirror the seeded V30/V74 food catalog and are used only as a
// generation fallback; once the live catalog is loaded, the live catalog wins.
const BUILTIN_GENERATION_FOODS: CatalogFood[] = [
  {id:-101,name_ar:"صدور دجاج",name_en:"Chicken Breast",category:"protein",serving_qty:100,serving_unit:"جم",calories:120,protein:23,carbs:0,fat:2.6,active:true},
  {id:-102,name_ar:"لحم بقري قليل الدهون",name_en:"Lean Beef",category:"protein",serving_qty:100,serving_unit:"جم",calories:170,protein:26,carbs:0,fat:7,active:true},
  {id:-103,name_ar:"بياض البيض",name_en:"Egg Whites",category:"protein",serving_qty:100,serving_unit:"جم",calories:52,protein:11,carbs:0.7,fat:0.2,active:true},
  {id:-104,name_ar:"أرز أبيض مطبوخ",name_en:"Cooked White Rice",category:"carb",serving_qty:100,serving_unit:"جم",calories:130,protein:2.7,carbs:28.2,fat:0.3,active:true},
  {id:-105,name_ar:"أرز بسمتي مطبوخ",name_en:"Cooked Basmati Rice",category:"carb",serving_qty:100,serving_unit:"جم",calories:130,protein:2.7,carbs:28,fat:0.3,active:true},
  {id:-106,name_ar:"أرز بسمتي جاف",name_en:"Dry Basmati Rice",category:"carb",serving_qty:100,serving_unit:"جم",calories:365,protein:7.1,carbs:80,fat:0.7,active:true},
  {id:-107,name_ar:"بطاطس",name_en:"Potato",category:"carb",serving_qty:100,serving_unit:"جم",calories:87,protein:1.9,carbs:20,fat:0.1,active:true},
  {id:-108,name_ar:"بطاطا حلوة",name_en:"Sweet Potato",category:"carb",serving_qty:100,serving_unit:"جم",calories:90,protein:2,carbs:20.7,fat:0.2,active:true},
  {id:-109,name_ar:"كريم أوف رايس",name_en:"Cream of Rice",category:"carb",serving_qty:100,serving_unit:"جم",calories:360,protein:7,carbs:80,fat:1,active:true},
  {id:-110,name_ar:"زبدة فول سوداني",name_en:"Peanut Butter",category:"fat",serving_qty:15,serving_unit:"جم",calories:89,protein:3.8,carbs:3.2,fat:7.6,active:true},
  {id:-118,name_ar:"زيت زيتون",name_en:"Extra Virgin Olive Oil",category:"fat",serving_qty:5,serving_unit:"جم",calories:45,protein:0,carbs:0,fat:5,active:true},
  {id:-119,name_ar:"لوز",name_en:"Almonds",category:"fat",serving_qty:10,serving_unit:"جم",calories:58,protein:2.1,carbs:2.2,fat:5,active:true},
  {id:-120,name_ar:"أفوكادو",name_en:"Avocado",category:"fat",serving_qty:50,serving_unit:"جم",calories:80,protein:1,carbs:4.3,fat:7.4,active:true},
  {id:-111,name_ar:"سبانخ",name_en:"Spinach",category:"vegetable",serving_qty:100,serving_unit:"جم",calories:23,protein:2.9,carbs:3.6,fat:0.4,active:true},
  {id:-112,name_ar:"جرجير",name_en:"Arugula",category:"vegetable",serving_qty:100,serving_unit:"جم",calories:25,protein:2.6,carbs:3.7,fat:0.7,active:true},
  {id:-113,name_ar:"خس",name_en:"Lettuce",category:"vegetable",serving_qty:100,serving_unit:"جم",calories:15,protein:1.4,carbs:2.9,fat:0.2,active:true},
  {id:-121,name_ar:"خيار",name_en:"Cucumber",category:"vegetable",serving_qty:100,serving_unit:"جم",calories:15,protein:0.7,carbs:3.6,fat:0.1,active:true},
  {id:-122,name_ar:"كوسة",name_en:"Zucchini",category:"vegetable",serving_qty:100,serving_unit:"جم",calories:17,protein:1.2,carbs:3.1,fat:0.3,active:true},
  {id:-123,name_ar:"طماطم",name_en:"Tomato",category:"vegetable",serving_qty:100,serving_unit:"جم",calories:18,protein:0.9,carbs:3.9,fat:0.2,active:true},
  {id:-124,name_ar:"جزر",name_en:"Carrot",category:"vegetable",serving_qty:100,serving_unit:"جم",calories:41,protein:0.9,carbs:9.6,fat:0.2,active:true},
  {id:-125,name_ar:"فاصوليا خضراء",name_en:"Green Beans",category:"vegetable",serving_qty:100,serving_unit:"جم",calories:31,protein:1.8,carbs:7,fat:0.2,active:true},
  {id:-126,name_ar:"فلفل ألوان",name_en:"Bell Pepper",category:"vegetable",serving_qty:100,serving_unit:"جم",calories:31,protein:1,carbs:6,fat:0.3,active:true},
  {id:-127,name_ar:"شوفان",name_en:"Oats",category:"carb",serving_qty:10,serving_unit:"جم",calories:38.9,protein:1.69,carbs:6.63,fat:0.69,active:true},
  {id:-128,name_ar:"موز",name_en:"Banana",category:"carb",serving_qty:100,serving_unit:"جم",calories:89,protein:1.1,carbs:22.8,fat:0.3,active:true},
  {id:-129,name_ar:"زبادي يوناني قليل الدسم",name_en:"Low-Fat Greek Yogurt",category:"protein",serving_qty:100,serving_unit:"جم",calories:73,protein:10,carbs:3.9,fat:1.9,active:true},
  {id:-130,name_ar:"بيض كامل",name_en:"Whole Eggs",category:"protein",serving_qty:1,serving_unit:"بيضة",calories:72,protein:6.3,carbs:0.4,fat:4.8,active:true},
  {id:-131,name_ar:"فراولة",name_en:"Strawberries",category:"carb",serving_qty:100,serving_unit:"جم",calories:32,protein:0.7,carbs:7.7,fat:0.3,active:true},
  // V146 — SHOW DAY fallback sources. These mirror the coach-approved
  // Show Day template and keep AUTO generation deterministic even when
  // the V145 Supabase seed has not been applied yet.
  {id:-114,name_ar:"Rice Cakes",name_en:"Rice Cakes",category:"carb",serving_qty:1,serving_unit:"قطعة",calories:35,protein:0.7,carbs:7.5,fat:0.3,active:true},
  {id:-115,name_ar:"عسل أبيض",name_en:"Honey",category:"carb",serving_qty:10,serving_unit:"جم",calories:30.4,protein:0,carbs:8.2,fat:0,active:true},
  {id:-116,name_ar:"مربى",name_en:"Jam",category:"carb",serving_qty:10,serving_unit:"جم",calories:25,protein:0,carbs:6.5,fat:0,active:true},
  {id:-117,name_ar:"شوكولاتة داكنة",name_en:"Dark Chocolate",category:"fat",serving_qty:5,serving_unit:"جم",calories:30,protein:0.35,carbs:2.3,fat:2.15,active:true},
];

type WaterSaltRule = {
  day_type: DayType;
  water_liters: number;
  salt_grams: number;
};

type CatalogSupplement = {
  id: number;
  name_en: string;
  dose: string | null;
  timing: string | null;
  day_types: string[] | null;
  active?: boolean;
};

// V164 — deterministic coach supplement fallback. Used only when the live
// supplement catalog is unavailable/empty. These are non-prescription sports
// and health supplements; the engine never auto-generates prescription drugs,
// hormones, insulin or diuretics.
const BUILTIN_GENERATION_SUPPLEMENTS: CatalogSupplement[] = [
  {id:-201,name_en:"Omega-3",dose:"EPA+DHA 2–3 g",timing:"with meals",day_types:null,active:true},
  {id:-202,name_en:"Vitamin D3",dose:"حسب التحاليل/الوصفة",timing:"with meal",day_types:null,active:true},
  {id:-203,name_en:"Multivitamin",dose:"1 serving",timing:"with meal",day_types:null,active:true},
  {id:-204,name_en:"CoQ10",dose:"100–200 mg",timing:"with meal",day_types:null,active:true},
  {id:-205,name_en:"NAC",dose:"حسب الحاجة/الإشراف",timing:"with meal",day_types:null,active:true},
  {id:-206,name_en:"Citrulline Malate",dose:"6–8 g",timing:"pre-workout",day_types:null,active:true},
  {id:-207,name_en:"Beta-Alanine",dose:"3.2 g",timing:"pre-workout / daily",day_types:null,active:true},
  {id:-208,name_en:"Taurine",dose:"1–2 g",timing:"pre-workout",day_types:null,active:true},
  {id:-209,name_en:"Caffeine",dose:"100–200 mg حسب التحمل",timing:"pre-workout",day_types:null,active:true},
  {id:-210,name_en:"Creatine Monohydrate",dose:"3–5 g",timing:"daily",day_types:null,active:true},
  {id:-211,name_en:"Electrolytes",dose:"حسب التعرق",timing:"around workout",day_types:null,active:true},
  {id:-212,name_en:"EAA",dose:"10 g",timing:"intra-workout",day_types:null,active:true},
  {id:-213,name_en:"Carbohydrate Powder",dose:"حسب Target الكارب",timing:"intra-workout",day_types:null,active:true},
  {id:-214,name_en:"Whey Protein Isolate",dose:"20–30 g حسب الاحتياج",timing:"post-workout",day_types:null,active:true},
  {id:-215,name_en:"Magnesium Glycinate",dose:"200–400 mg",timing:"before bed",day_types:null,active:true},
];

type TrainingSplit = {
  id: number;
  name_ar: string;
  name_en: string;
  description: string | null;
};

type TrainingExercise = {
  id: number;
  split_id: number;
  day_name: string;
  muscle_group: string;
  exercise_ar: string;
  exercise_en: string;
  sets: string;
  reps: string;
  rest: string | null;
  sort_order: number;
};

function numberOrNull(value: string) {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pick(obj: any, ...keys: string[]) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
  }
  return null;
}

function roundNumber(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function formatNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? String(roundNumber(n)) : String(value);
}



type PrintLanguage = "AR" | "EN" | "BOTH";

const PRINT_DAY_EN: Record<string,string> = {
  "السبت":"SATURDAY","الأحد":"SUNDAY","الإثنين":"MONDAY","الثلاثاء":"TUESDAY","الأربعاء":"WEDNESDAY","الخميس":"THURSDAY","الجمعة":"FRIDAY"
};
const PRINT_DAY_AR: Record<string,string> = {
  SATURDAY:"السبت",SUNDAY:"الأحد",MONDAY:"الإثنين",TUESDAY:"الثلاثاء",WEDNESDAY:"الأربعاء",THURSDAY:"الخميس",FRIDAY:"الجمعة"
};
const PRINT_TERM_EN: Record<string,string> = {
  "خطة التغذية":"NUTRITION PLAN","التغذية":"NUTRITION","الوجبة":"MEAL","إجمالي الوجبة":"MEAL TOTAL","مكملات الصباح":"MORNING SUPPLEMENTS","قبل التمرين":"PRE WORKOUT","أثناء التمرين":"INTRA WORKOUT","قبل النوم":"BEFORE BED","الماء":"WATER","الملح":"SALT","العجز":"DEFICIT","الفائض":"SURPLUS","حسب Target الكارب":"ACCORDING TO CARB TARGET","حسب خطة الكارديو":"ACCORDING TO CARDIO PLAN","راحة":"REST","تدريب":"TRAINING","خطة التمرين":"TRAINING PLAN","الكارديو":"CARDIO","البطن":"ABS","الكور":"CORE","الإطالات":"STRETCHING","ملاحظات":"NOTES","إرشادات":"GUIDELINES","الهدف":"GOAL","مدة الخطة":"DURATION","غير محددة":"NOT SPECIFIED","نظرة عامة على اللاعب":"ATHLETE OVERVIEW","السعرات والماكروز المستهدفة":"CALORIE & MACRO TARGETS","الجدول الأسبوعي":"WEEKLY SCHEDULE"
};
const PRINT_FOOD_EN: Record<string,string> = {
  "صدور دجاج":"Chicken Breast","لحم بقري قليل الدهون":"Lean Beef","بياض بيض":"Egg Whites","بياض البيض":"Egg Whites","بيض كامل":"Whole Eggs","أرز أبيض مطبوخ":"Cooked White Rice","أرز بسمتي مطبوخ":"Cooked Basmati Rice","أرز بسمتي جاف":"Dry Basmati Rice","بطاطا حلوة":"Sweet Potato","بطاطس":"Potato","كريم أوف رايس":"Cream of Rice","شوفان":"Oats","زبدة فول سوداني":"Peanut Butter","زيت زيتون":"Extra Virgin Olive Oil","أفوكادو":"Avocado","سبانخ":"Spinach","جرجير":"Arugula","خس":"Lettuce","خيار":"Cucumber","كوسة":"Zucchini","طماطم":"Tomato","جزر":"Carrot","فاصوليا خضراء":"Green Beans","فلفل ألوان":"Bell Pepper","موز":"Banana","زبادي يوناني قليل الدسم":"Low-Fat Greek Yogurt","فراولة":"Strawberries","عسل أبيض":"Honey","مربى":"Jam","شوكولاتة داكنة":"Dark Chocolate","قطعة":"pieces","جم":"g","بيضة":"egg"
};

function printTranslateLine(line:string, lang:PrintLanguage) {
  if (lang === "BOTH") return line;
  let out=line;
  if (lang === "EN") {
    for (const [ar,en] of Object.entries(PRINT_FOOD_EN)) out=out.split(ar).join(en);
    for (const [ar,en] of Object.entries(PRINT_TERM_EN)) out=out.split(ar).join(en);
    for (const [ar,en] of Object.entries(PRINT_DAY_EN)) out=out.split(ar).join(en);
    out=out.replace(/(HIGH|MEDIUM|LOW|ZERO|DEPLETE|LOAD|MODERATE|TIGHTEN|SHOW DAY)/g, m=>m);
    // Exercise lines generated by the training engine already contain AR — EN.
    if (out.includes(" — ")) {
      const parts=out.split(" — ");
      if (parts.length>=2 && parts[1].match(/[A-Za-z]/)) out=parts[parts.length-2] + (parts.length>2 ? ` — ${parts[parts.length-1]}` : "");
    }
  }
  if (lang === "AR") {
    for (const [en,ar] of Object.entries(PRINT_DAY_AR)) out=out.split(en).join(ar);
    for (const [ar,en] of Object.entries(PRINT_TERM_EN)) out=out.split(en).join(ar);
    for (const [ar,en] of Object.entries(PRINT_FOOD_EN)) out=out.split(en).join(ar);
  }
  return out;
}

function printNutritionBlocks(text:string) {
  const clean=sanitizePrintContent(text);
  const lines=clean.split("\n");
  const heading=/^━+\s*(HIGH|MEDIUM|LOW|ZERO|DEPLETE|LOAD|MODERATE|TIGHTEN|SHOW DAY)\s*━+$/i;
  const groups:{title:string;body:string}[]=[];
  let current:{title:string;body:string}|null=null;
  for (const line of lines) {
    const m=line.trim().match(heading);
    if (m) {
      if (current) groups.push({...current,body:current.body.trim()});
      current={title:m[1].toUpperCase(),body:""};
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    }
  }
  if (current) groups.push({...current,body:current.body.trim()});
  if (groups.length) return groups;
  return [{title:"NUTRITION PLAN",body:clean.trim()}];
}

function printTrainingDayBlocks(text:string) {
  text=sanitizePrintContent(text);
  const matches=[...text.matchAll(/(?:^|\n)(?:🔴|⚪)\s*(السبت|الأحد|الإثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)\s*—[^\n]*/g)];
  if (!matches.length) return [{title:"TRAINING PROGRAM", body:text}];
  const out:{title:string;body:string}[]=[];
  for (let i=0;i<matches.length;i++) {
    const start=matches[i].index ?? 0;
    const end=i+1<matches.length ? (matches[i+1].index ?? text.length) : text.length;
    const chunk=text.slice(start,end).trim();
    const first=chunk.split("\n")[0];
    out.push({title:first,body:chunk});
  }
  return out;
}


function sanitizePrintContent(text:string) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<\/?(figure|picture|a)[^>]*>/gi, "")
    .replace(/https?:\/\/\S+\.(?:png|jpe?g|webp|gif)(?:\?\S*)?/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function printMealBlocks(text:string) {
  const clean=sanitizePrintContent(text);
  const lines=clean.split("\n");
  const heading=/^🍽️\s*(.+)$/;
  const out:{title:string;body:string}[]=[];
  let current:{title:string;body:string}|null=null;
  for (const raw of lines) {
    const line=raw.trim();
    const m=line.match(heading);
    if (m) {
      if (current) out.push({...current,body:current.body.trim()});
      current={title:m[1],body:""};
    } else if (current) {
      current.body += (current.body ? "\n" : "") + raw;
    }
  }
  if (current) out.push({...current,body:current.body.trim()});
  return out;
}

function printTargetLine(block:string) {
  return block.split("\n").filter(line => /kcal|P\s*\d|C\s*\d|F\s*\d|الماء|الملح|WATER|SALT/i.test(line)).slice(0,2);
}

function printCardioSections(text:string) {
  const lines=sanitizePrintContent(text).split("\n").map(x=>x.trim()).filter(Boolean);
  return lines;
}

export default function Home() {
  const [playerId, setPlayerId] = useState(DEFAULT_PLAYER_ID);
  const [data, setData] = useState<any>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [selectedPlayerName, setSelectedPlayerName] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showEditPlayer, setShowEditPlayer] = useState(false);
  const [editName, setEditName] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editSex, setEditSex] = useState("");
  const [editBodyFat, setEditBodyFat] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [editWaist, setEditWaist] = useState("");
  const [editThigh, setEditThigh] = useState("");
  const [editArm, setEditArm] = useState("");
  const [editingPlayer, setEditingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerPhone, setNewPlayerPhone] = useState("");
  const [newPlayerAge, setNewPlayerAge] = useState("");
  const [newPlayerWeight, setNewPlayerWeight] = useState("");
  const [newPlayerHeight, setNewPlayerHeight] = useState("");
  const [newPlayerSex, setNewPlayerSex] = useState("ذكر");
  const [newPlayerBodyFat, setNewPlayerBodyFat] = useState("");
  const [newPlayerGoal, setNewPlayerGoal] = useState("");
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [dashboardPlayers, setDashboardPlayers] = useState<PlayerOption[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [activePage, setActivePage] = useState<"dashboard" | "clients" | "player" | "updates" | "plans">("dashboard");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printLanguage, setPrintLanguage] = useState<PrintLanguage>("BOTH");
  const [savingPlan, setSavingPlan] = useState(false);
  const [plan, setPlan] = useState<PlayerPlan | null>(null);
  const [selectedPhase, setSelectedPhase] = useState("PHASE 1");
  // V157 — independent phase durations for nutrition and training. A phase can
  // be defined by start/end dates, number of weeks, or both. These are coach
  // metadata and do not force the nutrition/training engines to use the same
  // timeline.
  const [nutritionPhaseStart, setNutritionPhaseStart] = useState("");
  const [nutritionPhaseEnd, setNutritionPhaseEnd] = useState("");
  const [nutritionPhaseWeeks, setNutritionPhaseWeeks] = useState("");
  const [trainingPhaseStart, setTrainingPhaseStart] = useState("");
  const [trainingPhaseEnd, setTrainingPhaseEnd] = useState("");
  const [trainingPhaseWeeks, setTrainingPhaseWeeks] = useState("");
  const [dietSystem, setDietSystem] = useState<DietSystem>("CUTTING");
  const [dietStrategy, setDietStrategy] = useState<DietStrategy>("STANDARD CUT");
  const [carbStructure, setCarbStructure] = useState<CarbStructure>("FIXED");
  const [macroMode, setMacroMode] = useState<MacroMode>("AUTO");
  // TDEECalculator.net methodology: activity is an explicit input, not a hard-coded 1.50 multiplier.
  const [activityLevel, setActivityLevel] = useState("MODERATE");
  const [calorieGoalPreset, setCalorieGoalPreset] = useState("AUTO");
  const [calorieAdjustment, setCalorieAdjustment] = useState("0");
  // Coach controls the meal count for every generated diet system (3–7).
  const [mealCount, setMealCount] = useState<number | null>(null);
  const [peakWeekType, setPeakWeekType] = useState<PeakWeekType>("LINEAR LOAD");
  const [peakStartDate, setPeakStartDate] = useState("");
  const [peakShowDate, setPeakShowDate] = useState("");
  // V141 — manual peak response feedback; never inferred automatically.
  const [peakResponseMode, setPeakResponseMode] = useState<PeakResponseMode>("BALANCED");

  const [planHistory, setPlanHistory] = useState<PlayerPlanHistory[]>([]);
  const [planDiet, setPlanDiet] = useState("");
  const [planTraining, setPlanTraining] = useState("");
  const [planCardio, setPlanCardio] = useState("");
  const [planSupplements, setPlanSupplements] = useState("");
  const [planNotes, setPlanNotes] = useState("");
  const [dayTypes, setDayTypes] = useState<Record<DayKey, DayType>>({
    السبت: "HIGH", الأحد: "MEDIUM", الإثنين: "LOW", الثلاثاء: "HIGH",
    الأربعاء: "MEDIUM", الخميس: "MEDIUM", الجمعة: "LOW",
  });
  const [dayTypesCustomized, setDayTypesCustomized] = useState(false);
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");
  const [generatedTargets, setGeneratedTargets] = useState<Record<DayType, MacroTargets> | null>(null);
  // V151 — Peak targets are keyed by actual calendar day.
  const [peakDailyTargets, setPeakDailyTargets] = useState<Record<DayKey, MacroTargets> | null>(null);
  const [dayMacroModes, setDayMacroModes] = useState<Record<DayType, MacroMode>>({ HIGH: "AUTO", MEDIUM: "AUTO", LOW: "AUTO", ZERO: "AUTO" });
  const [dayMacroOverrides, setDayMacroOverrides] = useState<Record<DayType, Partial<MacroTargets>>>({ HIGH: {}, MEDIUM: {}, LOW: {}, ZERO: {} });

  const [catalogFoods, setCatalogFoods] = useState<CatalogFood[]>([]);
  const [waterSaltRules, setWaterSaltRules] = useState<WaterSaltRule[]>([]);
  const [catalogSupplements, setCatalogSupplements] = useState<CatalogSupplement[]>([]);
  const [trainingSplits, setTrainingSplits] = useState<TrainingSplit[]>([]);
  const [trainingExercises, setTrainingExercises] = useState<TrainingExercise[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedProteinFood, setSelectedProteinFood] = useState<number | "">("");
  const [selectedCarbFood, setSelectedCarbFood] = useState<number | "">("");
  const [selectedFatFood, setSelectedFatFood] = useState<number | "">("");
  const [selectedVegetableFoods, setSelectedVegetableFoods] = useState<number[]>([]);
  const [selectedTrainingSplit, setSelectedTrainingSplit] = useState<number | "">("");
  const [trainingDayStatus, setTrainingDayStatus] = useState<Record<DayKey, TrainingStatus>>({
    السبت: "TRAINING", الأحد: "TRAINING", الإثنين: "TRAINING", الثلاثاء: "TRAINING",
    الأربعاء: "TRAINING", الخميس: "TRAINING", الجمعة: "TRAINING",
  });
  const [trainingDayTemplates, setTrainingDayTemplates] = useState<Record<DayKey, DayKey>>({
    السبت: "السبت", الأحد: "الأحد", الإثنين: "الإثنين", الثلاثاء: "الثلاثاء",
    الأربعاء: "الأربعاء", الخميس: "الخميس", الجمعة: "الجمعة",
  });
  const [coreDays, setCoreDays] = useState<DayKey[]>(["السبت", "الإثنين", "الأربعاء", "الخميس"]);
  const [cardioConfig, setCardioConfig] = useState<Record<DayKey, CardioConfig>>({
    السبت: { mode: "FASTED", fastedType: "LISS Walking", postType: "Incline Treadmill", fastedMinutes: "40", postMinutes: "30", intensity: "LISS" },
    الأحد: { mode: "FASTED", fastedType: "LISS Walking", postType: "Incline Treadmill", fastedMinutes: "45", postMinutes: "30", intensity: "LISS" },
    الإثنين: { mode: "FASTED", fastedType: "LISS Walking", postType: "Incline Treadmill", fastedMinutes: "45", postMinutes: "30", intensity: "LISS" },
    الثلاثاء: { mode: "FASTED", fastedType: "LISS Walking", postType: "Incline Treadmill", fastedMinutes: "60", postMinutes: "30", intensity: "LISS" },
    الأربعاء: { mode: "FASTED", fastedType: "LISS Walking", postType: "Incline Treadmill", fastedMinutes: "45", postMinutes: "30", intensity: "LISS" },
    الخميس: { mode: "FASTED", fastedType: "LISS Walking", postType: "Incline Treadmill", fastedMinutes: "45", postMinutes: "30", intensity: "LISS" },
    الجمعة: { mode: "FASTED", fastedType: "LISS Walking", postType: "Incline Treadmill", fastedMinutes: "45", postMinutes: "30", intensity: "LISS" },
  });

  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [height, setHeight] = useState("");
  const [waist, setWaist] = useState("");
  const [thigh, setThigh] = useState("");
  const [arm, setArm] = useState("");
  const [notes, setNotes] = useState("");


  async function loadCatalog() {
    setCatalogLoading(true);
    const [foodsRes, rulesRes, supplementsRes, splitsRes, exercisesRes] = await Promise.all([
      supabase.from("food_catalog_v30").select("*").eq("active", true).order("category").order("name_ar"),
      supabase.from("water_salt_rules_v30").select("*").order("day_type"),
      supabase.from("supplement_catalog_v30").select("*").eq("active", true).order("name_en"),
      supabase.from("training_splits_v30").select("*").eq("active", true).order("sort_order"),
      supabase.from("training_exercises_v30").select("*").eq("active", true).order("split_id").order("sort_order"),
    ]);

    // V176 — RESILIENT FOOD CATALOG
    // The meal generator already has a deterministic coach-approved fallback
    // catalog. Keep the same fallback available to the editor/dropdowns when
    // Supabase is empty or temporarily unavailable instead of leaving the
    // nutrition UI with no food sources.
    const liveFoods = (!foodsRes.error && Array.isArray(foodsRes.data))
      ? (foodsRes.data as CatalogFood[])
      : [];
    const foods = liveFoods.length ? liveFoods : BUILTIN_GENERATION_FOODS;
    setCatalogFoods(foods);
    const first = (cat: CatalogFood["category"]) => foods.find(f => f.category === cat)?.id ?? "";
    const healthyFat = foods.find(f => f.category === "fat" && /زيت زيتون|olive oil|لوز|almond|أفوكادو|avocado/i.test(`${f.name_ar || ""} ${f.name_en || ""}`));
    setSelectedProteinFood(prev => prev || first("protein"));
    setSelectedCarbFood(prev => prev || first("carb"));
    setSelectedFatFood(prev => prev || healthyFat?.id || first("fat"));
    setSelectedVegetableFoods(prev => {
      const clean = prev.map(Number).filter(Number.isFinite);
      return clean.length ? clean : (first("vegetable") ? [Number(first("vegetable"))] : []);
    });
    if (!rulesRes.error && Array.isArray(rulesRes.data)) setWaterSaltRules(rulesRes.data as WaterSaltRule[]);
    if (!supplementsRes.error && Array.isArray(supplementsRes.data)) setCatalogSupplements(supplementsRes.data as CatalogSupplement[]);
    if (!splitsRes.error && Array.isArray(splitsRes.data)) {
      const splits = splitsRes.data as TrainingSplit[];
      setTrainingSplits(splits);
      setSelectedTrainingSplit(prev => prev || splits[0]?.id || "");
    }
    if (!exercisesRes.error && Array.isArray(exercisesRes.data)) setTrainingExercises(exercisesRes.data as TrainingExercise[]);

    const errors = [foodsRes.error, rulesRes.error, supplementsRes.error, splitsRes.error, exercisesRes.error].filter(Boolean);
    if (errors.length) {
      // Food generation must remain usable even when one of the optional
      // catalog tables is unavailable. The live food catalog is preferred;
      // BUILTIN_GENERATION_FOODS is the deterministic fallback.
      if (foodsRes.error || !liveFoods.length) {
        setMsg("تم تحميل مصادر الطعام الاحتياطية مؤقتًا — سيستمر توليد الوجبات تلقائيًا.");
      }
    }
    setCatalogLoading(false);
  }

  useEffect(() => {
    void loadCatalog();
    void loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setDashboardLoading(true);
    try {
      const rpc = await supabase.rpc("list_players");
      if (!rpc.error && Array.isArray(rpc.data)) {
        const normalized = rpc.data.map((p: any) => ({
          id: String(p.id ?? ""),
          name: String(p.name ?? p.player_name ?? "لاعب"),
        })).filter((p: PlayerOption) => p.id);
        setDashboardPlayers(normalized);
      }
    } catch (error) {
      console.warn("Dashboard clients load failed", error);
    } finally {
      setDashboardLoading(false);
    }
  }

  async function loadPlayersList() {
    setSearching(true);
    setMsg("");
    setPlayers([]);

    // First try the secure RPC. It works even when the players table has RLS enabled.
    const rpc = await supabase.rpc("list_players");

    if (!rpc.error && Array.isArray(rpc.data) && rpc.data.length > 0) {
      const normalized = rpc.data
        .map((p: any) => ({
          id: String(p.id ?? ""),
          name: String(p.name ?? p.player_name ?? "لاعب"),
        }))
        .filter((p: PlayerOption) => p.id);

      setPlayers(normalized);
      setSearching(false);
      return;
    }

    // Fallback: some deployments allow direct read access to public.players.
    const direct = await supabase
      .from("players")
      .select("id,name")
      .order("name", { ascending: true })
      .limit(100);

    if (!direct.error && Array.isArray(direct.data) && direct.data.length > 0) {
      const normalized = direct.data
        .map((p: any) => ({
          id: String(p.id ?? ""),
          name: String(p.name ?? p.player_name ?? "لاعب"),
        }))
        .filter((p: PlayerOption) => p.id);

      setPlayers(normalized);
      setSearching(false);
      return;
    }

    // Last-resort fallback: always keep the currently loaded player selectable.
    // This prevents an empty picker when the RPC was not installed yet.
    const currentPlayerName =
      pick(data?.player, "name", "اسم اللاعب", "player_name") ??
      pick(data?.current, "name", "اسم اللاعب", "player_name");

    if (playerId && currentPlayerName) {
      setPlayers([{ id: String(playerId), name: String(currentPlayerName) }]);
      setMsg("تم تحميل اللاعب الحالي. لتظهر كل اللاعبين شغّل ملف SQL الخاص بالبحث عن اللاعبين.");
    } else if (rpc.error || direct.error) {
      const detail = rpc.error?.message || direct.error?.message || "";
      setMsg(`تعذر تحميل قائمة اللاعبين. تأكد من تشغيل SQL الخاص بالـ Player Picker.${detail ? ` (${detail})` : ""}`);
    }

    setSearching(false);
  }

  async function searchPlayers(term: string) {
    setPlayerSearch(term);

    if (term.trim().length === 0) {
      await loadPlayersList();
      return;
    }

    if (term.trim().length < 2) {
      setPlayers([]);
      return;
    }

    setSearching(true);
    setMsg("");

    // Preferred path: secure RPC created by the SQL below.
    const rpc = await supabase.rpc("search_players", { p_query: term.trim() });

    if (!rpc.error && Array.isArray(rpc.data)) {
      const normalized = rpc.data
        .map((p: any) => ({
          id: String(p.id ?? ""),
          name: String(p.name ?? p.player_name ?? "لاعب"),
        }))
        .filter((p: PlayerOption) => p.id);

      setPlayers(normalized);
      setSearching(false);
      return;
    }

    // Fallback for projects where the players table is directly readable.
    const direct = await supabase
      .from("players")
      .select("id,name")
      .ilike("name", `%${term.trim()}%`)
      .order("name", { ascending: true })
      .limit(20);

    if (!direct.error && Array.isArray(direct.data)) {
      setPlayers(
        direct.data
          .map((p: any) => ({
            id: String(p.id ?? ""),
            name: String(p.name ?? p.player_name ?? "لاعب"),
          }))
          .filter((p: PlayerOption) => p.id)
      );
    } else {
      setPlayers([]);
      setMsg("البحث يحتاج تشغيل SQL الخاص بـ Player Picker في Supabase.");
    }

    setSearching(false);
  }

  async function addPlayer(e: FormEvent) {
    e.preventDefault();
    const name = newPlayerName.trim();
    if (name.length < 2) {
      setMsg("اكتب اسم اللاعب بشكل صحيح.");
      return;
    }

    setAddingPlayer(true);
    setMsg("");

    const { data: created, error } = await supabase.rpc("create_player", {
      p_name: name,
    });

    if (error) {
      setMsg(`فشل إضافة اللاعب: ${error.message}`);
      setAddingPlayer(false);
      return;
    }

    // create_player currently returns the UUID directly (not { id: ... }).
    // Keep compatibility with older return shapes as well.
    const createdId =
      typeof created === "string"
        ? created
        : String(
            created?.id ??
            created?.[0]?.id ??
            created?.create_player ??
            ""
          );

    if (!createdId) {
      setMsg("تمت إضافة اللاعب لكن لم يتم استلام المعرّف.");
      setAddingPlayer(false);
      return;
    }

    setDashboardPlayers(old => [{ id: createdId, name }, ...old.filter(p => p.id !== createdId)]);

    // V170 — New Client Analysis: create the client first, then hydrate the
    // supported profile fields through the existing V27 update RPC. Phone is
    // kept as UI-only until the database schema exposes a dedicated phone field.
    const profileUpdate = await supabase.rpc("update_player_v27", {
      p_player_id: createdId,
      p_name: name,
      p_weight: numberOrNull(newPlayerWeight),
      p_height: numberOrNull(newPlayerHeight),
      p_age: numberOrNull(newPlayerAge),
      p_sex: newPlayerSex.trim() || null,
      p_body_fat: numberOrNull(newPlayerBodyFat),
      p_goal: newPlayerGoal.trim() || null,
      p_waist: null,
      p_thigh: null,
      p_arm: null,
    });

    if (profileUpdate.error) {
      setMsg(`تم إنشاء اللاعب، لكن تعذر حفظ بعض بيانات التحليل الأولي: ${profileUpdate.error.message}`);
    }

    setNewPlayerPhone("");
    setNewPlayerAge("");
    setNewPlayerWeight("");
    setNewPlayerHeight("");
    setNewPlayerSex("ذكر");
    setNewPlayerBodyFat("");
    setNewPlayerGoal("");
    setPlayerId(createdId);
    setSelectedPlayerName(name);
    setData(null);
    setMeasurements([]);
    setNewPlayerName("");
    setShowAddPlayer(false);
    setMsg(`تمت إضافة اللاعب: ${name}`);
    setAddingPlayer(false);
    await load(createdId);
  }

  function openEditPlayer() {
    const p = playerData;
    setEditName(String(pick(p, "name", "اسم اللاعب", "player_name") ?? playerName ?? ""));
    setEditWeight(String(pick(p, "weight", "الوزن", "current_weight") ?? baseWeight ?? ""));
    setEditHeight(String(pick(p, "height", "الطول", "current_height") ?? baseHeight ?? ""));
    setEditAge(String(pick(p, "age", "العمر") ?? ""));
    setEditSex(String(pick(p, "sex", "الجنس") ?? ""));
    setEditBodyFat(String(pick(p, "body_fat", "الدهون", "current_body_fat") ?? baseBodyFat ?? ""));
    setEditGoal(String(pick(p, "goal", "الهدف") ?? ""));
    setEditWaist(String(pick(p, "waist", "waist_cm", "الخصر") ?? ""));
    setEditThigh(String(pick(p, "thigh", "thigh_cm", "الفخذ") ?? ""));
    setEditArm(String(pick(p, "arm", "arm_cm", "الذراع") ?? ""));
    setShowEditPlayer(true);
  }

  async function updatePlayer(e: FormEvent) {
    e.preventDefault();
    const name = editName.trim();
    if (name.length < 2) { setMsg("اكتب اسم اللاعب بشكل صحيح."); return; }
    setEditingPlayer(true); setMsg("");
    const { error } = await supabase.rpc("update_player_v27", {
      p_player_id: playerId,
      p_name: name,
      p_weight: numberOrNull(editWeight),
      p_height: numberOrNull(editHeight),
      p_age: numberOrNull(editAge),
      p_sex: editSex.trim() || null,
      p_body_fat: numberOrNull(editBodyFat),
      p_goal: editGoal.trim() || null,
      p_waist: numberOrNull(editWaist),
      p_thigh: numberOrNull(editThigh),
      p_arm: numberOrNull(editArm)
    });
    if (error) { setMsg(`فشل تعديل اللاعب: ${error.message}`); setEditingPlayer(false); return; }
    setShowEditPlayer(false);
    setMsg("تم تعديل بيانات اللاعب بنجاح — سجل القياسات محفوظ.");
    await load();
    setEditingPlayer(false);
  }

  const phaseOptions = ["PHASE 1", "PHASE 2", "PHASE 3", "PHASE 4", "PEAK WEEK"] as const;
  const weekDays: DayKey[] = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
  const weekdayNames: DayKey[] = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  function peakDateOrder(startDate = peakStartDate, showDate = peakShowDate) {
    if (!startDate || !showDate) return weekDays;
    const start = new Date(`${startDate}T12:00:00`);
    const show = new Date(`${showDate}T12:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(show.getTime())) return weekDays;
    const diff = Math.round((show.getTime() - start.getTime()) / 86400000);
    if (diff !== 6) return weekDays;
    return Array.from({length:7}, (_,i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return weekdayNames[d.getDay()];
    }) as DayKey[];
  }

  function peakDateLabel(day: DayKey, startDate = peakStartDate, showDate = peakShowDate) {
    if (!startDate || !showDate) return day;
    const order = peakDateOrder(startDate, showDate);
    const idx = order.indexOf(day);
    if (idx < 0) return day;
    const d = new Date(`${startDate}T12:00:00`);
    d.setDate(d.getDate() + idx);
    const dateText = d.toLocaleDateString("en-GB", {day:"2-digit", month:"long"});
    return `${day} ${dateText}`;
  }

  const dayTypeOptions: DayType[] = ["HIGH", "MEDIUM", "LOW", "ZERO"];

  // V156 — strategy-driven normal schedule. The coach chooses Fixed vs Carb Cycle.
  function getNormalTemplateSchedule(system: DietSystem, strategy: DietStrategy = dietStrategy, structure: CarbStructure = carbStructure): Record<DayKey, DayType> {
    if (system === "PEAK WEEK" || structure === "FIXED") {
      return { السبت: "MEDIUM", الأحد: "MEDIUM", الإثنين: "MEDIUM", الثلاثاء: "MEDIUM", الأربعاء: "MEDIUM", الخميس: "MEDIUM", الجمعة: "MEDIUM" };
    }
    if (system === "BULK") {
      if (strategy === "MAXIMUM MASS") return { السبت: "HIGH", الأحد: "MEDIUM", الإثنين: "HIGH", الثلاثاء: "MEDIUM", الأربعاء: "HIGH", الخميس: "MEDIUM", الجمعة: "LOW" };
      if (strategy === "LOWER BODY MASS") return { السبت: "HIGH", الأحد: "LOW", الإثنين: "HIGH", الثلاثاء: "MEDIUM", الأربعاء: "HIGH", الخميس: "MEDIUM", الجمعة: "LOW" };
      return { السبت: "HIGH", الأحد: "MEDIUM", الإثنين: "HIGH", الثلاثاء: "LOW", الأربعاء: "HIGH", الخميس: "MEDIUM", الجمعة: "LOW" };
    }
    // Cutting / contest strategies
    if (strategy === "AGGRESSIVE CARB CYCLE") return { السبت: "HIGH", الأحد: "LOW", الإثنين: "MEDIUM", الثلاثاء: "LOW", الأربعاء: "HIGH", الخميس: "MEDIUM", الجمعة: "LOW" };
    if (strategy === "CONTEST PREP") return { السبت: "HIGH", الأحد: "MEDIUM", الإثنين: "LOW", الثلاثاء: "HIGH", الأربعاء: "MEDIUM", الخميس: "LOW", الجمعة: "LOW" };
    if (strategy === "CONTEST CONTINUATION") return { السبت: "MEDIUM", الأحد: "MEDIUM", الإثنين: "LOW", الثلاثاء: "MEDIUM", الأربعاء: "HIGH", الخميس: "MEDIUM", الجمعة: "LOW" };
    return { السبت: "HIGH", الأحد: "MEDIUM", الإثنين: "LOW", الثلاثاء: "HIGH", الأربعاء: "MEDIUM", الخميس: "MEDIUM", الجمعة: "LOW" };
  }

  function getTDEEActivityLevel(): TDEEActivityLevel {
    const v = String(activityLevel || "MODERATE").toUpperCase() as TDEEActivityLevel;
    return TDEE_ACTIVITY_MULTIPLIERS[v] ? v : "MODERATE";
  }

  // V156 — strategy is the primary decision input. Numbers are starting targets,
  // not permanent rules; check-ins can justify keeping or changing them.
  function phaseDaysFromDates(start: string, end: string): number | null {
    if (!start || !end) return null;
    const a = new Date(`${start}T12:00:00`).getTime();
    const b = new Date(`${end}T12:00:00`).getTime();
    if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
    return Math.max(1, Math.round((b - a) / 86400000) + 1);
  }

  function durationLabel(start: string, end: string, weeks: string): string {
    const dateDays = phaseDaysFromDates(start, end);
    const explicitWeeks = Number(weeks);
    if (start && end && dateDays) {
      if (dateDays % 7 === 0) {
        const exactWeeks = dateDays / 7;
        return `${start} → ${end} (${exactWeeks} ${exactWeeks === 1 ? "أسبوع" : "أسابيع"})`;
      }
      return `${start} → ${end} (${dateDays} يومًا)`;
    }
    if (start && explicitWeeks > 0) return `${start} → ${explicitWeeks} ${explicitWeeks === 1 ? "أسبوع" : "أسابيع"}`;
    if (explicitWeeks > 0) return `${explicitWeeks} ${explicitWeeks === 1 ? "أسبوع" : "أسابيع"}`;
    if (start) return `من ${start}`;
    if (end) return `حتى ${end}`;
    return "غير محددة";
  }

  // Fixed nutrition is rendered once. Only Carb Cycle exposes the weekly
  // day-to-type schedule because that schedule changes the generated diet.
  function normalNutritionTypeLabel(schedule: Record<DayKey, DayType>, structure: CarbStructure = carbStructure): string {
    if (structure === "FIXED") {
      return String(schedule[weekDays[0]] || "MEDIUM");
    }
    const types = Array.from(new Set(weekDays.map(day => schedule[day])));
    return `CARB CYCLE — ${types.join(" / ")}`;
  }

  function normalScheduleHeaderLines(schedule: Record<DayKey, DayType>, structure: CarbStructure = carbStructure): string[] {
    const lines = [
      `📋 Nutrition System — ${normalNutritionTypeLabel(schedule, structure)}`,
      `📅 Nutrition Duration — ${durationLabel(nutritionPhaseStart, nutritionPhaseEnd, nutritionPhaseWeeks)}`,
    ];
    if (structure === "CARB CYCLE") {
      lines.push(...weekDays.map(day => `${day} — ${schedule[day]}`));
    }
    return lines;
  }

  function phaseDurationMeta() {
    return {
      nutrition: {
        start: nutritionPhaseStart || null,
        end: nutritionPhaseEnd || null,
        weeks: Number(nutritionPhaseWeeks) > 0 ? Number(nutritionPhaseWeeks) : null,
      },
      training: {
        start: trainingPhaseStart || null,
        end: trainingPhaseEnd || null,
        weeks: Number(trainingPhaseWeeks) > 0 ? Number(trainingPhaseWeeks) : null,
      },
    };
  }

  function restorePhaseDuration(saved: any) {
    const d = saved?.phase_duration;
    if (!d) return;
    setNutritionPhaseStart(String(d?.nutrition?.start || ""));
    setNutritionPhaseEnd(String(d?.nutrition?.end || ""));
    setNutritionPhaseWeeks(d?.nutrition?.weeks ? String(d.nutrition.weeks) : "");
    setTrainingPhaseStart(String(d?.training?.start || ""));
    setTrainingPhaseEnd(String(d?.training?.end || ""));
    setTrainingPhaseWeeks(d?.training?.weeks ? String(d.training.weeks) : "");
  }

  function clearPhaseDuration() {
    setNutritionPhaseStart(""); setNutritionPhaseEnd(""); setNutritionPhaseWeeks("");
    setTrainingPhaseStart(""); setTrainingPhaseEnd(""); setTrainingPhaseWeeks("");
  }

  function automaticGoalOffset(system: DietSystem, strategy: DietStrategy = dietStrategy, phase: string = selectedPhase): number {
    // TDEECalculator.net goal baseline: maintenance = TDEE, cutting = TDEE - 500,
    // bulking = TDEE + 500. Strategy names still control the Carb Cycle schedule,
    // but they no longer silently change the calorie baseline.
    if (system === "PEAK WEEK") return 0;
    if (system === "BULK") return 500;
    if (system === "CUTTING") return -500;
    return 0;
  }

  function calculateBaseMacros(dietSystemOverride?: DietSystem, strategyOverride?: DietStrategy, carbStructureOverride?: CarbStructure): (MacroTargets & { bmr: number; maintenance: number; autoCalories: number; adjustment: number; adjustmentType: "DEFICIT" | "SURPLUS" | "MAINTENANCE" }) | null {
    const w = Number(current.weight), bf = Number(current.body_fat), h = Number(current.height);
    if (!Number.isFinite(w) || w <= 0) return null;
    const age = Number(pick(playerData, "age", "العمر") ?? 25);
    const sex = String(pick(playerData, "sex", "الجنس") ?? "ذكر").toLowerCase();
    const activeDietSystem = dietSystemOverride ?? dietSystem;
    const activeStrategy = strategyOverride ?? dietStrategy;
    const activeStructure = carbStructureOverride ?? carbStructure;
    const activity = getTDEEActivityLevel();
    const tdeeResult = calculateTDEE({
      weightKg: w,
      heightCm: Number.isFinite(h) && h > 0 ? h : undefined,
      ageYears: Number.isFinite(age) ? age : 25,
      sex: sex.includes("أنث") || sex.includes("female") ? "female" : "male",
      bodyFatPercent: Number.isFinite(bf) && bf > 2 && bf < 70 ? bf : undefined,
      activity,
    });
    const bmr = tdeeResult.bmr;
    const maintenance = tdeeResult.tdee;
    const systemGoal = automaticGoalOffset(activeDietSystem, activeStrategy, selectedPhase);
    const autoCalories = Math.round((maintenance + systemGoal));
    const adjusted = Math.max(1200, Math.round(autoCalories + Number(calorieAdjustment || 0)));
    const netAdjustment = Math.round(adjusted - maintenance);
    const adjustmentType = netAdjustment < 0 ? "DEFICIT" : netAdjustment > 0 ? "SURPLUS" : "MAINTENANCE";

    // TDEECalculator.net macro families:
    // Moderate Carb = 30% protein / 35% fat / 35% carbs
    // Lower Carb   = 40% protein / 40% fat / 20% carbs
    // Higher Carb  = 30% protein / 20% fat / 50% carbs
    // These are applied to the goal calories. ZERO remains a coach-specific
    // extension handled in calculateDayTargets.
    const split = activeStructure === "CARB CYCLE"
      ? { protein: 0.30, fat: 0.35, carbs: 0.35 }
      : { protein: 0.30, fat: 0.35, carbs: 0.35 };
    const protein = Math.round((adjusted * split.protein / 4));
    const fat = Math.round((adjusted * split.fat / 9));
    const carbs = Math.max(0, Math.round(adjusted * split.carbs / 4));
    const calories = Math.round(protein * 4 + fat * 9 + carbs * 4);
    return { calories, protein, carbs, fat, bmr, maintenance, autoCalories, adjustment:netAdjustment, adjustmentType };
  }

  // PEAK WEEK uses its own stage vocabulary. LOW/MEDIUM/HIGH are only
  // legacy internal categories used by the normal diet engine. They must
  // never be displayed as the Peak Week stage names.
  const peakWeekSchedules: Record<PeakWeekType, PeakDayMode[]> = {
    // Source plan: Saturday Deplete, Sunday Deplete, Monday Load, Tuesday Load,
    // Wednesday Moderate, Thursday Tighten, Friday Show Day.
    "FRONT LOAD":["DEPLETE","DEPLETE","LOAD","LOAD","MODERATE","TIGHTEN","SHOW DAY"],
    // Source plan: four Deplete days, two Load days, then Show Day.
    "BACK LOAD":["DEPLETE","DEPLETE","DEPLETE","DEPLETE","LOAD","LOAD","SHOW DAY"],
    // Source plan: Low, Low, Moderate, Moderate, High, High, Show Day.
    "LINEAR LOAD":["LOW","LOW","MODERATE","MODERATE","LOAD","LOAD","SHOW DAY"],
    // Source plan: Deplete, Deplete, Moderate, Load, Load, Tighten, Show Day.
    "MID LOAD":["DEPLETE","DEPLETE","MODERATE","LOAD","LOAD","TIGHTEN","SHOW DAY"],
    // Source plan: Moderate x4, Low, Low, Show Day.
    "CONSERVATIVE / NO LOAD":["MODERATE","MODERATE","MODERATE","MODERATE","LOW","LOW","SHOW DAY"]
  };

  const peakModeToLegacyDayType = (mode: PeakDayMode): DayType => {
    if (mode === "LOAD" || mode === "SHOW DAY") return "HIGH";
    if (mode === "MODERATE") return "MEDIUM";
    return "LOW";
  };

  function getPeakWeekModes(type: PeakWeekType, startDate = peakStartDate, showDate = peakShowDate): Record<DayKey, PeakDayMode> {
    const order = peakDateOrder(startDate, showDate);
    const next = {} as Record<DayKey, PeakDayMode>;
    weekDays.forEach(d => { next[d] = "MODERATE"; });
    order.forEach((d, i) => { next[d] = peakWeekSchedules[type][i] || "MODERATE"; });
    return next;
  }

  function getPeakWeekDayTypes(type: PeakWeekType, startDate = peakStartDate, showDate = peakShowDate): Record<DayKey, DayType> {
    const modes = getPeakWeekModes(type, startDate, showDate);
    const next = {} as Record<DayKey, DayType>;
    weekDays.forEach(d => { next[d] = peakModeToLegacyDayType(modes[d]); });
    return next;
  }

  function applyPeakWeekSchedule(type:PeakWeekType, startDate = peakStartDate, showDate = peakShowDate){
    const schedule = getPeakWeekDayTypes(type, startDate, showDate);
    setDayTypes(schedule);
    setSelectedPhase("PEAK WEEK");
    return schedule;
  }

  type DayMacroRule = {
    carbShare: number;
    fatMinPerKg: number;
    fatMaxPerKg: number;
    maxCarbs?: number;
  };

  function dayMacroRule(type: DayType, dietSystemOverride?: DietSystem): DayMacroRule {
    const activeDietSystem = dietSystemOverride ?? dietSystem;
    // Same daily calorie target across normal days; day type changes the macro mix.
    // This prevents HIGH/MEDIUM/LOW from silently becoming fixed surpluses/deficits.
    if (activeDietSystem === "BULK") {
      return {
        // Keep BULK HIGH/MEDIUM/LOW visibly distinct. The old ranges let
        // MEDIUM hit the same fat ceiling as HIGH, so the final calorie
        // balancing step produced identical P/C/F for both day types.
        HIGH:   { carbShare: 0.55, fatMinPerKg: 0.55, fatMaxPerKg: 1.00 },
        MEDIUM: { carbShare: 0.45, fatMinPerKg: 0.70, fatMaxPerKg: 1.05 },
        LOW:    { carbShare: 0.30, fatMinPerKg: 0.90, fatMaxPerKg: 1.10 },
        ZERO:   { carbShare: 0.05, fatMinPerKg: 0.80, fatMaxPerKg: 1.20, maxCarbs: 30 },
      }[type];
    }
    return {
      HIGH:   { carbShare: 0.55, fatMinPerKg: 0.45, fatMaxPerKg: 0.80 },
      MEDIUM: { carbShare: 0.45, fatMinPerKg: 0.50, fatMaxPerKg: 0.85 },
      LOW:    { carbShare: 0.30, fatMinPerKg: 0.55, fatMaxPerKg: 0.90 },
      ZERO:   { carbShare: 0.05, fatMinPerKg: 0.65, fatMaxPerKg: 1.00, maxCarbs: 30 },
    }[type];
  }

  // V137 — PRACTICAL COACH-FACING MACRO ROUNDING
  const roundMacroProtein = (n: number) => Math.max(0, Math.round(Number(n || 0) / 10) * 10);
  const roundMacroCarbs = (n: number) => Math.max(0, Math.ceil(Number(n || 0) / 10) * 10);
  const roundMacroFat = (n: number) => Math.max(0, Math.round(Number(n || 0) / 5) * 5);
  const roundMacro5 = (n: number) => Math.max(0, Math.round(Number(n || 0) / 5) * 5);
  const clampNumber = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

  function peakTDEEForWeight(weight: number) {
    const w = Math.max(1, Number(weight) || 1);
    const bf = Number(current.body_fat);
    const h = Number(current.height);
    const age = Number(pick(playerData, "age", "العمر") ?? 25);
    const sex = String(pick(playerData, "sex", "الجنس") ?? "ذكر").toLowerCase();
    let bmr = 22*w;
    if (Number.isFinite(bf) && bf > 2 && bf < 70) bmr = 370 + 21.6*(w*(1-bf/100));
    else if (Number.isFinite(h) && h > 0) bmr = 10*w + 6.25*h - 5*age + (sex.includes("أنث") || sex.includes("female") ? -161 : 5);
    return bmr * TDEE_ACTIVITY_MULTIPLIERS[getTDEEActivityLevel()];
  }

  // V155 — SINGLE PEAK SOURCE OF TRUTH
  // One function owns every Peak Week P/C/F target. It is keyed by strategy
  // AND calendar day index, so repeated stages (e.g. two LOAD days) can have
  // different targets without being collapsed into LOW/MEDIUM/HIGH buckets.
  // Calories are always derived from P/C/F. Peak days are not forced through
  // the normal-diet TDEE floor/ceiling because that made different strategies
  // converge to the same output, especially on SHOW DAY.
  function peakMacroForDay(type: PeakWeekType, mode: PeakDayMode, weight: number, dayIndex = 0): MacroTargets {
    const w = Math.max(1, Number(weight) || 1);
    const r = (n:number) => roundMacro5(n);

    if (mode === "SHOW DAY") {
      // Strategy-specific coach benchmarks. Ratios are scaled by athlete weight
      // while the stage remains independent from the preceding LOAD day.
      const showBenchmarks: Record<PeakWeekType, {proteinPerKg:number; carbsPerKg:number; fat:number}> = {
        "FRONT LOAD": { proteinPerKg: 150 / 77, carbsPerKg: 380 / 77, fat: 30 },
        "BACK LOAD": { proteinPerKg: 130 / 77, carbsPerKg: 400 / 77, fat: 25 },
        "LINEAR LOAD": { proteinPerKg: 130 / 77, carbsPerKg: 235 / 77, fat: 25 },
        "MID LOAD": { proteinPerKg: 150 / 77, carbsPerKg: 380 / 77, fat: 30 },
        "CONSERVATIVE / NO LOAD": { proteinPerKg: 105 / 77, carbsPerKg: 175 / 77, fat: 30 },
      };
      const b = showBenchmarks[type];
      const protein = r(b.proteinPerKg * w);
      const carbs = r(b.carbsPerKg * w);
      const fat = r(b.fat);
      return { calories: Math.round((protein * 4 + carbs * 4 + fat * 9) / 5) * 5, protein, carbs, fat };
    }

    let carbs = 0, protein = 0, fat = 0;
    switch (type) {
      case "FRONT LOAD":
        if (dayIndex <= 1) { carbs = 0; protein = 3*w; fat = 0.8*w; }
        else if (dayIndex === 2) { carbs = 6*w; protein = 2.2*w; fat = 25; }
        else if (dayIndex === 3) { carbs = 6.5*w; protein = 2.2*w; fat = 25; }
        else if (dayIndex === 4) { carbs = 3*w; protein = 2.5*w; fat = 30; }
        else { carbs = 2*w; protein = 2.5*w; fat = 30; }
        break;
      case "BACK LOAD":
        if (dayIndex <= 3) { carbs = 0; protein = 3*w; fat = 0.8*w; }
        else if (dayIndex === 4) { carbs = 7.5*w; protein = 2.2*w; fat = 25; }
        else { carbs = 8*w; protein = 2.2*w; fat = 25; }
        break;
      case "LINEAR LOAD":
        if (dayIndex <= 1) { carbs = 0; protein = 3*w; fat = 0.8*w; }
        else if (dayIndex === 2) { carbs = 3*w; protein = 2.5*w; fat = 40; }
        else if (dayIndex === 3) { carbs = 3.25*w; protein = 2.5*w; fat = 40; }
        else if (dayIndex === 4) { carbs = 5.5*w; protein = 2.2*w; fat = 25; }
        else { carbs = 4.5*w; protein = 2.2*w; fat = 25; }
        break;
      case "MID LOAD":
        if (dayIndex <= 1) { carbs = 0; protein = 3*w; fat = 0.8*w; }
        else if (dayIndex === 2) { carbs = 3*w; protein = 2.5*w; fat = 40; }
        else if (dayIndex === 3) { carbs = 6.5*w; protein = 2.2*w; fat = 25; }
        else if (dayIndex === 4) { carbs = 6.5*w; protein = 2.2*w; fat = 25; }
        else { carbs = 2.5*w; protein = 2.5*w; fat = 30; }
        break;
      case "CONSERVATIVE / NO LOAD":
        if (dayIndex <= 2) { carbs = 0; protein = 2.5*w; fat = 40; }
        else if (dayIndex === 3) { carbs = 2.5*w; protein = 2.5*w; fat = 40; }
        else if (dayIndex === 4) { carbs = 1.75*w; protein = 2.75*w; fat = 30; }
        else { carbs = 1.5*w; protein = 2.75*w; fat = 30; }
        break;
    }

    // V155 — depletion remains primary-carb-zero. Incidental carbohydrate
    // from locked vegetables/protein foods is counted only by the rendered food
    // totals; it never creates a carb source or changes this target.
    if (mode === "DEPLETE") carbs = 0;

    protein = r(protein);
    carbs = r(carbs);
    fat = r(fat);
    const calories = Math.round((protein * 4 + carbs * 4 + fat * 9) / 5) * 5;
    return { calories, protein, carbs, fat };
  }

  // Backward-compatible wrapper for UI code that only knows the stage name.
  function peakMacroForMode(type: PeakWeekType, mode: PeakDayMode, weight: number): MacroTargets {
    const schedules = peakWeekSchedules[type] || [];
    const idx = schedules.indexOf(mode);
    return peakMacroForDay(type, mode, weight, idx >= 0 ? idx : 0);
  }

  function peakWaterSaltForDay(type: PeakWeekType, mode: PeakDayMode, dayIndex = 0) {
    // Exact day-by-day water/salt/potassium values from the supplied templates.
    switch (type) {
      case "FRONT LOAD":
        // Coach Front Load water/salt/potassium sequence from the supplied template.
        if (dayIndex === 0 || dayIndex === 1) return {water:7, salt:6, potassium:undefined};
        if (dayIndex === 2) return {water:6.5, salt:6, potassium:undefined};
        if (dayIndex === 3) return {water:6, salt:5.5, potassium:undefined};
        if (dayIndex === 4) return {water:5, salt:5, potassium:undefined};
        if (dayIndex === 5) return {water:4, salt:4, potassium:undefined};
        return {water:1.25, salt:2.5, potassium:undefined};
      case "BACK LOAD":
        if (dayIndex <= 1) return {water:7, salt:6, potassium:undefined};
        if (dayIndex === 2) return {water:6.5, salt:6, potassium:undefined};
        if (dayIndex === 3) return {water:6, salt:5.5, potassium:undefined};
        if (dayIndex === 4) return {water:5, salt:5, potassium:undefined};
        if (dayIndex === 5) return {water:4, salt:4.5, potassium:undefined};
        return {water:1.25, salt:2.5, potassium:undefined};
      case "LINEAR LOAD":
        if (dayIndex <= 1) return {water:6, salt:5.5, potassium:undefined};
        if (dayIndex === 2) return {water:6, salt:5, potassium:undefined};
        if (dayIndex === 3) return {water:5.5, salt:5, potassium:undefined};
        if (dayIndex === 4) return {water:5, salt:5, potassium:undefined};
        if (dayIndex === 5) return {water:4, salt:4.5, potassium:undefined};
        return {water:1.75, salt:2.5, potassium:undefined};
      case "MID LOAD":
        if (dayIndex <= 1) return {water:6, salt:6, potassium:undefined};
        if (dayIndex === 2) return {water:6, salt:5.5, potassium:undefined};
        if (dayIndex === 3) return {water:5.5, salt:5, potassium:undefined};
        if (dayIndex === 4) return {water:5, salt:5, potassium:undefined};
        if (dayIndex === 5) return {water:4, salt:4, potassium:undefined};
        return {water:1.5, salt:2.5, potassium:undefined};
      case "CONSERVATIVE / NO LOAD":
        if (dayIndex === 0) return {water:5.5, salt:5, potassium:undefined};
        if (dayIndex === 1) return {water:5.5, salt:5, potassium:undefined};
        if (dayIndex === 2) return {water:5, salt:5, potassium:undefined};
        if (dayIndex === 3) return {water:5, salt:5, potassium:undefined};
        if (dayIndex === 4) return {water:4.5, salt:4.5, potassium:undefined};
        if (dayIndex === 5) return {water:3.25, salt:4, potassium:undefined};
        return {water:1.75, salt:2.5, potassium:undefined};
    }
    return {water:5, salt:5, potassium:undefined};
  }

  function peakWaterSaltForMode(type: PeakWeekType, mode: PeakDayMode): {water:number; salt:number; potassium?:number} {
    const idx = (peakWeekSchedules[type] || []).indexOf(mode);
    return peakWaterSaltForDay(type, mode, idx >= 0 ? idx : 0);
  }

  // Normal Cutting/Bulk water and salt are athlete-dependent rather than fixed
  // display constants. The catalog rule is used as the coach baseline, then scaled
  // to the current athlete weight and system. Manual edits remain possible in the
  // generated plan text.
  function autoWaterSaltForNormalDay(dayType: DayType, dietSystemOverride?: DietSystem) {
    const rule = waterSaltRules.find(r => r.day_type === dayType);
    if (!rule) return null;
    const w = Math.max(1, Number(current.weight) || 60);
    const weightScale = clampNumber(w / 60, 0.75, 1.5);
    const systemScale = (dietSystemOverride ?? dietSystem) === "BULK" ? 1.05 : 1.0;
    return {
      water: Math.round(rule.water_liters * weightScale * systemScale * 10) / 10,
      salt: Math.round(rule.salt_grams * weightScale * 2) / 2,
      potassium: undefined as number | undefined,
    };
  }

  // V153 — regression/safety fix: stable TDEE activity fallback, no automatic potassium target, and Peak SHOW DAY output must not imply potassium dosing.
  // V152 — normal AUTO protein-basis fix + V151 Peak Week day-specific targets.
  // V151 — authoritative day-specific Peak Week targets.
  function calculatePeakDailyTargets(type: PeakWeekType, startDate = peakStartDate, showDate = peakShowDate): Record<DayKey, MacroTargets> {
    const weight = Math.max(1, Number(current.weight) || 1);
    const order = peakDateOrder(startDate, showDate);
    const modes = getPeakWeekModes(type, startDate, showDate);
    const out = {} as Record<DayKey, MacroTargets>;
    order.forEach((day, dayIndex) => {
      out[day] = enforceMacroConsistency(peakMacroForDay(type, modes[day], weight, dayIndex));
    });
    return out;
  }

  function calculateDayTargets(
    base: MacroTargets,
    peakTypeOverride?: PeakWeekType,
    dietSystemOverride?: DietSystem,
    strategyOverride?: DietStrategy,
    carbStructureOverride?: CarbStructure
  ): Record<DayType, MacroTargets> {
    const result = {} as Record<DayType, MacroTargets>;
    const activeDietSystem = dietSystemOverride ?? dietSystem;
    const activeStrategy = strategyOverride ?? dietStrategy;
    const activeStructure = carbStructureOverride ?? carbStructure;

    if (activeDietSystem === "PEAK WEEK") {
      const type = peakTypeOverride ?? peakWeekType;
      const daily = calculatePeakDailyTargets(type, peakStartDate, peakShowDate);
      const order = peakDateOrder(peakStartDate, peakShowDate);
      for (const legacyType of dayTypeOptions) {
        const day = order.find(d => peakModeToLegacyDayType(getPeakWeekModes(type, peakStartDate, peakShowDate)[d]) === legacyType);
        result[legacyType] = day && daily[day] ? daily[day] : { calories:0, protein:0, carbs:0, fat:0 };
      }
      return result;
    }

    // Use the same calorie baseline as TDEECalculator.net:
    // maintenance = TDEE, cutting = TDEE - 500, bulking = TDEE + 500.
    const b = calculateBaseMacros(activeDietSystem, activeStrategy, activeStructure);
    const targetCalories = b?.autoCalories
      ? Math.max(1200, Math.round(b.autoCalories + Number(calorieAdjustment || 0)))
      : base.calories;

    const roundP = (n:number) => Math.max(0, Math.round(n));
    const roundF = (n:number) => Math.max(0, Math.round(n));
    const roundC = (n:number) => Math.max(0, Math.round(n));

    const siteSplit = (type: DayType) => {
      if (type === "HIGH") return { protein:0.30, fat:0.20, carbs:0.50 }; // Higher Carb
      if (type === "LOW") return { protein:0.40, fat:0.40, carbs:0.20 };  // Lower Carb
      if (type === "ZERO") return null; // Coach-specific extension
      return { protein:0.30, fat:0.35, carbs:0.35 }; // Moderate Carb
    };

    if (activeStructure === "FIXED") {
      const s = siteSplit("MEDIUM")!;
      const protein = roundP(targetCalories * s.protein / 4);
      const fat = roundF(targetCalories * s.fat / 9);
      const carbs = roundC(targetCalories * s.carbs / 4);
      const fixed = enforceMacroConsistency({ calories: targetCalories, protein, carbs, fat });
      return { HIGH: fixed, MEDIUM: fixed, LOW: fixed, ZERO: fixed };
    }

    for (const type of dayTypeOptions) {
      if (type === "ZERO") {
        // ZERO is not a category exposed by TDEECalculator.net. Keep it as the
        // coach-specific extension: cap carbs at 30 g, keep protein at 40% of
        // goal calories, and send the remaining calories to fat.
        const protein = roundP(targetCalories * 0.40 / 4);
        const carbs = 30;
        const fat = roundF(Math.max(0, (targetCalories - protein * 4 - carbs * 4) / 9));
        result[type] = enforceMacroConsistency({ calories: targetCalories, protein, carbs, fat });
        continue;
      }

      const s = siteSplit(type)!;
      const protein = roundP(targetCalories * s.protein / 4);
      const fat = roundF(targetCalories * s.fat / 9);
      const carbs = roundC(targetCalories * s.carbs / 4);
      result[type] = enforceMacroConsistency({ calories: targetCalories, protein, carbs, fat });
    }

    return result;
  }

  function enforceMacroConsistency(target: MacroTargets): MacroTargets {
    // V169 — calorie/macro authority: when a calorie target is supplied, keep
    // it authoritative and solve the carbohydrate remainder after protein/fat.
    // This prevents impossible headers such as 3000 kcal with 170P/445C/60F
    // (which actually equals 3020 kcal).
    const protein = Math.max(0, Math.round(Number(target.protein || 0) / 5) * 5);
    const fat = Math.max(0, Math.round(Number(target.fat || 0) / 5) * 5);
    const requestedCalories = Number(target.calories || 0);
    let carbs = Math.max(0, Math.round(Number(target.carbs || 0) / 5) * 5);
    if (requestedCalories > 0) {
      const rawCarbs = (requestedCalories - protein * 4 - fat * 9) / 4;
      // Use a practical 5 g carbohydrate step without exceeding the calorie target.
      carbs = Math.max(0, Math.floor(rawCarbs / 5) * 5);
    }
    return {
      protein,
      carbs,
      fat,
      calories: Math.round(protein * 4 + carbs * 4 + fat * 9),
    };
  }

  function enforceAllMacroConsistency(targets: Record<DayType, MacroTargets>) {
    const fixed = {} as Record<DayType, MacroTargets>;
    for (const type of dayTypeOptions) fixed[type] = enforceMacroConsistency(targets[type]);
    return fixed;
  }

  function resolveDayMacroTargets(autoTargets: Record<DayType, MacroTargets>) {
    const resolved = {} as Record<DayType, MacroTargets>;
    for (const type of dayTypeOptions) {
      const auto = autoTargets[type];
      const override = dayMacroOverrides[type] || {};
      // V144 — AUTO ONLY: manual macro overrides are ignored by the generation engine.
      // The coach can still inspect the legacy fields, but generated plans always
      // come from the current athlete metrics + selected system rules.
      resolved[type] = auto;
      continue;
      // MANUAL is authoritative: never rewrite one macro to satisfy another.
      const protein = Number.isFinite(Number(override.protein)) ? Number(override.protein) : auto.protein;
      const fat = Number.isFinite(Number(override.fat)) ? Number(override.fat) : auto.fat;
      const carbs = Number.isFinite(Number(override.carbs)) ? Number(override.carbs) : auto.carbs;
      resolved[type] = enforceMacroConsistency({ calories: auto.calories, protein, carbs, fat });
    }
    return resolved;
  }

  function ensureManualDay(type: DayType) {
    const base = generatedTargets?.[type];
    setDayMacroModes(prev => ({ ...prev, [type]: "MANUAL" }));
    if (base && Object.keys(dayMacroOverrides[type] || {}).length === 0) {
      setDayMacroOverrides(prev => ({ ...prev, [type]: { ...base } }));
    }
  }

  function updateDayMacro(type: DayType, field: keyof MacroTargets, raw: string) {
    const value = raw === "" ? undefined : Number(raw);
    setDayMacroOverrides(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  }

  function macroConflict(type: DayType, auto: MacroTargets, override: Partial<MacroTargets>) {
    const rule = dayMacroRule(type);
    const weight = Math.max(1, Number(current.weight) || 1);
    const p = Number(override.protein);
    const c = Number(override.carbs);
    const f = Number(override.fat);
    const requestedCalories = Number(override.calories);
    const hasP = Number.isFinite(p);
    const hasC = Number.isFinite(c);
    const hasF = Number.isFinite(f);
    const hasCalories = Number.isFinite(requestedCalories) && requestedCalories > 0;
    const actual = (hasP ? p : auto.protein) * 4 + (hasC ? c : auto.carbs) * 4 + (hasF ? f : auto.fat) * 9;
    const conflicts: string[] = [];

    if (hasCalories && hasP && hasC && hasF && Math.abs(actual - requestedCalories) > 10) {
      conflicts.push(`السعرات المدخلة ${Math.round(requestedCalories)} لا تساوي P/C/F (${Math.round(actual)} kcal)`);
    }
    if (hasC && c < 0) conflicts.push("الكارب لا يمكن أن يكون سالبًا");
    if (hasF && (f < rule.fatMinPerKg * weight - 2.5 || f > rule.fatMaxPerKg * weight + 2.5)) {
      conflicts.push(`الدهون خارج نطاق ${Math.round(rule.fatMinPerKg * weight)}–${Math.round(rule.fatMaxPerKg * weight)} g`);
    }
    if (hasC && rule.maxCarbs != null && c > rule.maxCarbs) conflicts.push(`ZERO يسمح بحد أقصى ${rule.maxCarbs} g كارب`);
    return conflicts;
  }

  function finalDayTargets(autoTargets: Record<DayType, MacroTargets>) {
    return enforceAllMacroConsistency(resolveDayMacroTargets(autoTargets));
  }

  // Final guard for automatic previews/printing: never allow a stale calorie
  // number to survive beside the displayed P/C/F values. This also repairs
  // older saved previews generated before the reconciliation fix.
  function normalizeGeneratedDietMacroHeaders(text: string) {
    return text.replace(
      /(\d+(?:\.\d+)?)\s*kcal\s*\|\s*P\s*(\d+(?:\.\d+)?)\s*g\s*\|\s*C\s*(\d+(?:\.\d+)?)\s*g\s*\|\s*F\s*(\d+(?:\.\d+)?)\s*g/g,
      (_match, _kcal, protein, carbs, fat) => {
        const p = Number(protein);
        const c = Number(carbs);
        const f = Number(fat);
        const kcal = Math.round(p * 4 + c * 4 + f * 9);
        return `${kcal} kcal | P ${p} g | C ${c} g | F ${f} g`;
      }
    );
  }

  function foodById(id: number | "") {
    return catalogFoods.find(f => f.id === Number(id));
  }

  function servingsForMacro(food: CatalogFood | undefined, macro: "protein" | "carbs" | "fat", target: number) {
    if (!food || target <= 0) return 0;
    const perServing = macro === "protein" ? food.protein : macro === "carbs" ? food.carbs : food.fat;
    if (!perServing || perServing <= 0) return 0;
    return target / perServing;
  }

  function foodMacroPerUnit(food: CatalogFood, macro: "protein" | "carbs" | "fat") {
    const value = macro === "protein" ? food.protein : macro === "carbs" ? food.carbs : food.fat;
    const name = `${food.name_ar} ${food.name_en || ""}`.toLowerCase();

    // Normalize eggs to the same display units used by the coach:
    // whole egg = 1 egg; egg white = 1 white (~30 g).
    if (name.includes("بياض البيض") || name.includes("egg whites")) {
      return value * (30 / Math.max(1, food.serving_qty));
    }
    if (name.includes("بيض كامل") || name.includes("whole egg")) {
      return value * (1 / Math.max(1, food.serving_qty));
    }
    return value;
  }

  function foodCaloriesPerUnit(food: CatalogFood) {
    const name = `${food.name_ar} ${food.name_en || ""}`.toLowerCase();
    if (name.includes("بياض البيض") || name.includes("egg whites")) {
      return food.calories * (30 / Math.max(1, food.serving_qty));
    }
    if (name.includes("بيض كامل") || name.includes("whole egg")) {
      return food.calories * (1 / Math.max(1, food.serving_qty));
    }
    return food.calories;
  }

  function solve3x3(A: number[][], b: number[]) {
    const m = A.map((row, i) => [...row, b[i]]);
    for (let col = 0; col < 3; col++) {
      let pivot = col;
      for (let r = col + 1; r < 3; r++) {
        if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
      }
      if (Math.abs(m[pivot][col]) < 1e-9) return null;
      [m[col], m[pivot]] = [m[pivot], m[col]];
      const div = m[col][col];
      for (let c = col; c < 4; c++) m[col][c] /= div;
      for (let r = 0; r < 3; r++) {
        if (r === col) continue;
        const factor = m[r][col];
        for (let c = col; c < 4; c++) m[r][c] -= factor * m[col][c];
      }
    }
    return [m[0][3], m[1][3], m[2][3]];
  }

  function solveMealServings(args: {
    proteinFood?: CatalogFood;
    carbFood?: CatalogFood;
    fatFood?: CatalogFood;
    vegetableFood?: CatalogFood;
    vegetableFoods?: CatalogFood[];
    proteinTarget: number;
    carbsTarget: number;
    fatTarget: number;
    vegetableGrams?: number;
  }) {
    const foods = catalogFoods.filter(f => f.active !== false);
    const macroCapable = (macro: "protein"|"carbs"|"fat") =>
      foods.find(f => Number(f[macro] || 0) > 0);

    const pf = args.proteinFood || macroCapable("protein");
    // Source-locked generation: never invent a carb/fat source when the
    // template did not explicitly provide one. The caller owns source choice.
    const cf = args.carbFood;
    const ff = args.fatFood;
    const vegetableFoods = (args.vegetableFoods && args.vegetableFoods.length)
      ? args.vegetableFoods
      : (args.vegetableFood ? [args.vegetableFood] : []);
    const vf = vegetableFoods[0];

    if (!pf) throw new Error("لم يتم العثور على مصدر بروتين صالح في الكتالوج.");
    if (args.fatTarget > 0 && !ff) throw new Error("لم يتم العثور على مصدر دهون صالح في الكتالوج.");
    if (args.carbsTarget > 0 && !cf) throw new Error("لم يتم العثور على مصدر كربوهيدرات صالح في الكتالوج.");

    const per = (f: CatalogFood, macro: "protein"|"carbs"|"fat") =>
      Number(f[macro] || 0) / Math.max(1, Number(f.serving_qty || 100));

    // IMPORTANT: all solver quantities returned from this function are
    // CATALOG SERVINGS, never grams. The formatter below multiplies servings
    // by serving_qty exactly once. Returning grams here caused the previous
    // 100x/1000x display bug (e.g. 20000 g broccoli, 39000 g rice).
    // Fixed vegetable contribution: requested total grams are split evenly
    // across all selected vegetables. Each source keeps its own catalog macros.
    const vegQtyGrams = vegetableFoods.length ? (args.vegetableGrams ?? 200) : 0;
    const gramsEach = vegetableFoods.length ? vegQtyGrams / vegetableFoods.length : 0;
    const vegServingsByFood = vegetableFoods.map(food => ({
      food,
      servings: gramsEach / Math.max(1, Number(food.serving_qty || 100))
    }));
    const vegP = vegServingsByFood.reduce((sum, x) => sum + Number(x.food.protein || 0) * x.servings, 0);
    const vegC = vegServingsByFood.reduce((sum, x) => sum + Number(x.food.carbs || 0) * x.servings, 0);
    const vegF = vegServingsByFood.reduce((sum, x) => sum + Number(x.food.fat || 0) * x.servings, 0);

    // V143 — solve protein/carb servings together. Protein foods contain
    // incidental C/F and carb foods contain incidental P/F, so sequential
    // solving made rendered totals disagree with the requested macros.
    const pPer = Number(pf.protein || 0);
    const pC = Number(pf.carbs || 0);
    const pF = Number(pf.fat || 0);
    const cPer = cf ? Number(cf.carbs || 0) : 0;
    const cP = cf ? Number(cf.protein || 0) : 0;
    const cF = cf ? Number(cf.fat || 0) : 0;
    const fPer = ff ? Number(ff.fat || 0) : 0;
    const fP = ff ? Number(ff.protein || 0) : 0;
    const fC = ff ? Number(ff.carbs || 0) : 0;

    // V166 — true three-source macro reconciliation for normal diets.
    // The previous solver filled the fat slot from the raw F target before
    // accounting for incidental fat coming from protein/carb foods, which
    // produced plans such as F=60 while the rendered meals contained far more.
    // Iterate: estimate fat -> solve P/C -> solve remaining fat -> re-solve P/C.
    // This keeps healthy-fat foods visible while making the rendered macros
    // materially agree with the requested daily/meal targets.
    const solvePC = (fatServings: number) => {
      const targetP = Math.max(0, args.proteinTarget - vegP - fP * fatServings);
      const targetC = Math.max(0, args.carbsTarget - vegC - fC * fatServings);
      let proteinServings = 0;
      let carbServings = 0;
      if (cf && cPer > 0) {
        const det = pPer * cPer - pC * cP;
        if (Math.abs(det) > 1e-9) {
          proteinServings = Math.max(0, (targetP * cPer - pC * targetC) / det);
          carbServings = Math.max(0, (pPer * targetC - cP * targetP) / det);
        } else {
          proteinServings = targetP / Math.max(0.0001, pPer);
          carbServings = Math.max(0, (targetC - pC * proteinServings) / cPer);
        }
      } else {
        proteinServings = targetP / Math.max(0.0001, pPer);
      }
      return { proteinServings, carbServings };
    };

    let fatServings = ff && args.fatTarget > 0 && fPer > 0
      ? args.fatTarget / fPer
      : 0;
    let proteinServings = 0;
    let carbServings = 0;
    for (let pass = 0; pass < 4; pass++) {
      const solvedPC = solvePC(fatServings);
      proteinServings = solvedPC.proteinServings;
      carbServings = solvedPC.carbServings;
      const incidentalFat = vegF + pF * proteinServings + cF * carbServings + fP * 0;
      fatServings = ff && args.fatTarget > 0 && fPer > 0
        ? Math.max(0, (args.fatTarget - incidentalFat) / fPer)
        : 0;
    }

    // Reconcile once more after the final fat quantity so incidental P/C from
    // the final healthy-fat amount is reflected in the displayed food amounts.
    const finalPC = solvePC(fatServings);
    proteinServings = finalPC.proteinServings;
    carbServings = finalPC.carbServings;

    return {
      protein: proteinServings,
      carb: carbServings,
      fat: fatServings,
      vegetable: vegetableFoods.length ? vegServingsByFood[0]?.servings || 0 : 0,
      vegetableFoods: vegServingsByFood,
    };
  }

function validateGeneratedMacrosV67(
  totals: {protein:number; carbs:number; fat:number},
  target: {protein:number; carbs:number; fat:number}
) {
  return (
    Math.abs(totals.protein - target.protein) <= 2 &&
    Math.abs(totals.carbs - target.carbs) <= 5 &&
    Math.abs(totals.fat - target.fat) <= 3
  );
}

// V96 — PRACTICAL FOOD QUANTITY ROUNDING
// Internal solving remains precise, but coach-facing quantities use practical
// closed numbers. This allows calories to float slightly instead of producing
// awkward values just to hit an exact calorie target.
function roundPracticalFoodGrams(food: CatalogFood, rawQty: number) {
    const category = String(food.category || "").toLowerCase();
    if (!Number.isFinite(rawQty) || rawQty <= 0) return 0;
    if (category === "vegetable") return Math.max(25, Math.round(rawQty / 25) * 25);
    if (category === "protein") return Math.max(10, Math.round(rawQty / 10) * 10);
    if (category === "carb") return Math.max(5, Math.round(rawQty / 5) * 5);
    if (category === "fat") return Math.max(5, Math.round(rawQty / 5) * 5);
    return Math.max(5, Math.round(rawQty / 5) * 5);
  }

function formatFoodAmount(food: CatalogFood | undefined, servings: number) {
    if (!food || !Number.isFinite(servings) || servings <= 0) return "—";

    const name = `${food.name_ar} ${food.name_en || ""}`.toLowerCase();

    if (name.includes("بياض البيض") || name.includes("egg whites")) {
      const grams = servings * Math.max(1, Number(food.serving_qty || 100));
      const whites = Math.max(1, Math.round(grams / 30));
      return `${whites} بياض بيض`;
    }

    if (name.includes("بيض كامل") || name.includes("whole egg")) {
      const eggs = Math.max(1, Math.round(servings * Math.max(1, Number(food.serving_qty || 1))));
      return `${eggs} بيضة كاملة`;
    }

    const rawQty = servings * Number(food.serving_qty || 0);
    const qty = food.serving_unit === "جم"
      ? roundPracticalFoodGrams(food, rawQty)
      : roundNumber(rawQty, 1);
    return `${qty} ${food.serving_unit} ${food.name_ar}`;
  }

  function applyCatalogFoodChanges() {
    const isPeak = dietSystem === "PEAK WEEK";
    const targets = isPeak ? ({} as Record<DayType, MacroTargets>) : generatedTargets;
    const daily = isPeak ? (peakDailyTargets || calculatePeakDailyTargets(peakWeekType, peakStartDate, peakShowDate)) : undefined;
    if (isPeak || targets) {
      const effectiveSchedule = dietSystem === "PEAK WEEK"
        ? getPeakWeekDayTypes(peakWeekType, peakStartDate, peakShowDate)
        : dayTypes;
      const order = dietSystem === "PEAK WEEK"
        ? peakDateOrder(peakStartDate, peakShowDate)
        : weekDays;
      const headers = dietSystem === "PEAK WEEK"
        ? order.map(day => `${peakDateLabel(day, peakStartDate, peakShowDate)} — ${getPeakWeekModes(peakWeekType, peakStartDate, peakShowDate)[day]}`)
        : normalScheduleHeaderLines(effectiveSchedule);
      setPlanDiet(normalizeGeneratedDietMacroHeaders([
        `AUTO PLAN — ${selectedPhase}`,
        ...headers,
        "",
        generateDietText(targets, effectiveSchedule, dietSystem === "PEAK WEEK" ? peakWeekType : undefined, peakStartDate, peakShowDate, dietSystem === "PEAK WEEK" ? "PEAK WEEK" : undefined, daily),
      ].join("\n")));
      setMsg("تم تطبيق مصادر الطعام الجديدة وإعادة حساب الكميات حسب مرحلة Peak Week/الماكروز.");
      return;
    }

    handleGenerateDiet();
  }

  // Peak/phase supplements: non-prescription sports supplements are generated
  // from the coach-approved catalog and placed by timing. Medication, insulin,
  // hormones and diuretics are never auto-dosed by the engine.
  function supplementsForTiming(timing: "wake" | "meal" | "pre" | "intra" | "post" | "evening", dayType: DayType) {
    const map: Record<string, string[]> = {
      wake: ["Electrolytes"],
      meal: ["Omega-3", "Vitamin D3", "Multivitamin", "Vitamin K2", "CoQ10", "NAC"],
      pre: ["Citrulline Malate", "Beta-Alanine", "Taurine", "Caffeine", "Creatine Monohydrate"],
      intra: ["Electrolytes", "EAA", "Carbohydrate Powder"],
      post: ["Whey Protein Isolate"],
      evening: ["Magnesium Glycinate"],
    };
    const names = map[timing] || [];
    const pool = [
      ...catalogSupplements,
      ...BUILTIN_GENERATION_SUPPLEMENTS.filter(b => !catalogSupplements.some(s => Number(s.id) === Number(b.id))),
    ];
    // V165 — supplement catalog de-duplication. The live catalog and built-in
    // fallback can contain the same supplement more than once (often with
    // different dose text). AUTO must render each supplement only once per
    // timing block, preferring the first active catalog entry.
    const seen = new Set<string>();
    return pool
      .filter(s => s.active !== false)
      .filter(s => names.some(n => s.name_en.toLowerCase().includes(n.toLowerCase())))
      .filter(s => !s.day_types?.length || s.day_types.some(d => d.toUpperCase() === dayType))
      .filter(s => {
        const key = s.name_en.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function formatSupplementList(items: CatalogSupplement[]) {
    return items.map(s => `• ${s.name_en}${s.dose ? ` — ${s.dose}` : ""}`).join("\n");
  }

  function generateIntegratedSupplements(dayType: DayType) {
    const blocks: Array<[string, CatalogSupplement[]]> = [
      ["🌅 عند الاستيقاظ", supplementsForTiming("wake", dayType)],
      ["🍽️ مع الوجبات", supplementsForTiming("meal", dayType)],
      ["⚡ قبل التمرين", supplementsForTiming("pre", dayType)],
      ["💪 أثناء التمرين", supplementsForTiming("intra", dayType)],
      ["🍽️ بعد التمرين", supplementsForTiming("post", dayType)],
      ["🌙 قبل النوم", supplementsForTiming("evening", dayType)],
    ];
    return blocks.filter(([,items]) => items.length > 0).map(([title,items]) => `${title}\n${formatSupplementList(items)}`).join("\n\n");
  }

  // Keep non-prescription sports supplements in generated/previewed plans.
  // Medication, insulin, hormones and diuretics are never auto-dosed by the engine.
  function stripSupplementsFromPlanText(text: string) {
    return text || "";
  }

  function generateDietText(targets: Record<DayType, MacroTargets>, schedule: Record<DayKey, DayType> = dayTypes, peakTypeOverride?: PeakWeekType, startDateOverride?: string, showDateOverride?: string, dietSystemOverride?: DietSystem, peakDailyTargetsOverride?: Record<DayKey, MacroTargets>) {
    // V140 — live catalog wins; built-in catalog prevents generation rejection while Supabase loads.
    // V164 — live catalog + deterministic coach fallback sources. Live foods
    // keep priority, while missing template sources (oats, fruit, Greek yogurt,
    // extra vegetables, etc.) remain available instead of collapsing to one
    // repeated source.
    const generationFoods = [
      ...catalogFoods,
      ...BUILTIN_GENERATION_FOODS.filter(b => !catalogFoods.some(c => Number(c.id) === Number(b.id))),
    ];
    // V110 — PEAK WEEK TEMPLATE-LOCKED MEAL BUILDER
    // Peak Week is rendered day-by-day from the selected strategy. Food sources
    // are restricted to the coach-approved Peak universe and meal architecture
    // follows the supplied Peak Week template instead of the generic diet builder.
    const peakFoodAllowed = {
      protein: (f: CatalogFood) => /لحم|لحمة|beef|red meat|صدور دجاج|chicken breast|دجاج صدر|tilapia|بلطي|egg white|egg whites|بياض بيض|بياض البيض/i.test(`${f.name_ar} ${f.name_en || ""}`),
      carb: (f: CatalogFood) => /أرز|ارز|rice|بطاطا حلو|sweet potato|بطاطس|potato|cream of rice|كريم اوف رايس|كريم أوف رايس|rice cake|رايس كيك/i.test(`${f.name_ar} ${f.name_en || ""}`),
      fat: (f: CatalogFood) => /peanut butter|زبدة فول سوداني|almond butter|زبدة لوز|mct/i.test(`${f.name_ar} ${f.name_en || ""}`),
    };
    // Peak Week AUTO vegetable universe: prefer light leafy vegetables and
    // exclude fibrous/cruciferous choices such as broccoli from automatic output.
    const peakLeafyVegetableAllowed = (f: CatalogFood) =>
      /جرجير|arugula|rocket|خس|lettuce|سبانخ|spinach|بقدونس|parsley|كزبرة|coriander|شبت|dill|نعناع|mint/i.test(`${f.name_ar} ${f.name_en || ""}`);
    const activeDietSystem = dietSystemOverride ?? dietSystem;
    const peakRestricted = activeDietSystem === "PEAK WEEK";
    const catalogPool = (category: CatalogFood["category"]) => {
      const live = generationFoods.filter(f =>
        f.active !== false && String(f.category || "").toLowerCase() === category &&
        (!peakRestricted || category === "vegetable" || peakFoodAllowed[category](f))
      );
      // If Supabase is loaded but a category is missing, use the built-in
      // coach-safe sources for that category instead of silently removing
      // vegetables or healthy-fat sources from the generated plan.
      if (live.length) return live;
      return BUILTIN_GENERATION_FOODS.filter(f =>
        f.active !== false && f.category === category &&
        (!peakRestricted || category === "vegetable" || peakFoodAllowed[category](f))
      );
    };
    const validSelected = (id: number | "", category: CatalogFood["category"]) => {
      const f = foodById(id);
      if (!f || f.active === false || f.category !== category) return undefined;
      return !peakRestricted || category === "vegetable" || peakFoodAllowed[category](f) ? f : undefined;
    };
    const selectedProtein = validSelected(selectedProteinFood, "protein") || catalogPool("protein")[0];
    const approvedCarbPool = catalogPool("carb");
    const approvedFatPool = catalogPool("fat");
    const selectedCarb = validSelected(selectedCarbFood, "carb") || approvedCarbPool[0];
    const selectedFat = validSelected(selectedFatFood, "fat") || approvedFatPool[0];
    const selectedVegFoods = (Array.isArray(selectedVegetableFoods) ? selectedVegetableFoods : [])
      .map(id => generationFoods.find(f => f.id === Number(id)))
      .filter((f): f is CatalogFood => Boolean(
        f && f.category === "vegetable" && f.active !== false &&
        (!peakRestricted || peakLeafyVegetableAllowed(f))
      ));
    const leafyVegPool = generationFoods.filter(f =>
      f.category === "vegetable" && f.active !== false && peakLeafyVegetableAllowed(f)
    );

    // V118 — TEMPLATE-LOCKED VEGETABLE ROTATION
    // Never randomize vegetables from the catalog. The vegetable order selected
    // in the coach template is authoritative and is preserved meal-by-meal.
    // Peak Week has a safe leafy fallback in the same order used by the coach
    // template: Spinach -> Arugula -> Lettuce.
    const findVegByName = (patterns: RegExp[]) => generationFoods.find(f =>
      f.category === "vegetable" && f.active !== false &&
      patterns.some(rx => rx.test(`${f.name_ar || ""} ${f.name_en || ""}`))
    );
    const peakTemplateVeg = [
      findVegByName([/سبانخ|spinach/i]),
      findVegByName([/جرجير|arugula|rocket/i]),
      findVegByName([/خس|lettuce/i]),
    ].filter((f): f is CatalogFood => Boolean(f));
    const fallbackVegPool = peakRestricted
      ? (peakTemplateVeg.length ? peakTemplateVeg : leafyVegPool)
      : [];
    // For Cutting/Bulking/etc. the coach-selected vegetable list is also locked.
    // The generator may calculate quantity, but it must never replace the
    // vegetable type/order with another catalog item.
    const vegSources = selectedVegFoods.length
      ? selectedVegFoods
      : (peakRestricted ? fallbackVegPool : catalogPool("vegetable"));

    function diversified(category: CatalogFood["category"], preferred: CatalogFood | undefined) {
      const pool = catalogPool(category);
      if (!pool.length) return [] as CatalogFood[];
      if (!preferred) return pool;
      return [preferred, ...pool.filter(f => f.id !== preferred.id)];
    }
    // Peak Week source pools are intentionally deterministic and restricted to
    // the coach-approved universe. The first selected source is preferred, then
    // the remaining approved catalog sources rotate by meal/day.
    const proteinPool = diversified("protein", selectedProtein).filter(f =>
      /لحم|لحمة|beef|red meat|صدور دجاج|chicken breast|دجاج صدر|tilapia|بلطي|egg white|egg whites|بياض بيض|بياض البيض/i.test(`${f.name_ar} ${f.name_en || ""}`)
    );
    const carbPool = diversified("carb", selectedCarb).filter(f =>
      /أرز|ارز|rice|بطاطا حلو|sweet potato|بطاطس|potato|cream of rice|كريم اوف رايس|كريم أوف رايس|rice cake|رايس كيك/i.test(`${f.name_ar} ${f.name_en || ""}`)
    );
    const fatPool = diversified("fat", selectedFat).filter(f =>
      /peanut butter|زبدة فول سوداني|almond butter|زبدة لوز|mct/i.test(`${f.name_ar} ${f.name_en || ""}`)
    );
    // V119 — VEGETABLE SOURCE IS TEMPLATE-AUTHORITATIVE
    // Never fall back to the catalog vegetable list. If the coach template has
    // no vegetable source for a stage, keep it empty rather than inventing one.
    const vegPool = vegSources;

    function pickDistinct(pool: CatalogFood[], index: number) {
      if (!pool.length) return undefined;
      return pool[index % pool.length];
    }

    const effectivePeakType = peakTypeOverride ?? peakWeekType;
    const effectiveStartDate = startDateOverride ?? peakStartDate;
    const effectiveShowDate = showDateOverride ?? peakShowDate;
    const outputOrder = activeDietSystem === "PEAK WEEK" ? peakDateOrder(effectiveStartDate, effectiveShowDate) : weekDays;
    const outputEntries = outputOrder.map((day, dayIndex) => ({
      day,
      dayIndex,
      legacyType: schedule[day],
      peakMode: activeDietSystem === "PEAK WEEK" ? getPeakWeekModes(effectivePeakType, effectiveStartDate, effectiveShowDate)[day] : null,
    }));

    const lines: string[] = [
      `AUTO DIET — ${activeDietSystem === "PEAK WEEK" ? "PEAK WEEK" : selectedPhase}`,
      `Current: ${formatNumber(current.weight)} kg | BF ${formatNumber(current.body_fat)}% | Height ${formatNumber(current.height)} cm`,
      `مصادر الطعام مقيدة بالمصادر المعتمدة — يمكن تغيير أي مصدر من المعاينة`,
      "",
    ];

    // V113 — SOURCE-LOCKED MEAL ARCHITECTURE
    // The stage controls the exact number/position of protein, carb, fat and
    // vegetable slots. The solver only calculates quantities; it never decides
    // where a macro/source belongs. This is the key difference from the old
    // generic macro solver.
    type PeakMealSpec = {
      meals:number;
      carbs:number[];
      fats:number[];
      veg:number[];
      // Exact coach-template fat quantities in grams, indexed by meal.
      // Undefined means the template does NOT explicitly add a fat source.
      // This prevents the macro solver from inventing Peanut Butter/MCT/etc.
      fatGrams?: Record<number, number>;
      // Per-meal share of the stage macro target. These shares preserve the
      // coach template instead of dividing macros equally between meals.
      proteinShares:number[];
      carbShares:number[];
      fatShares:number[];
    };
    function stageTemplate(mode: PeakDayMode | DayType | null): PeakMealSpec {
      // V129 — NORMAL PHASE TEMPLATE LOCK
      // Normal Bulk/Cutting phases preserve the coach meal architecture.
      // ZERO is a manual day-type override: no primary carb slot is allowed;
      // incidental carbs may only come from foods/vegetables already in the template.
      if (activeDietSystem !== "PEAK WEEK") {
        // V164 — coach nutrition template: 5 meals, varied vegetables, and
        // explicit healthy-fat slots. Carb Cycle changes targets/schedule; it
        // does not duplicate the same meal template for every weekday.
        if (activeDietSystem === "BULK") {
          if (mode === "HIGH" || mode === "MEDIUM") return {
            meals:5, carbs:[0,1,2,3,4], fats:[1,2,4], veg:[0,1,2,3,4],
            fatGrams:{1:10,2:5,4:10}, proteinShares:Array(5).fill(.2), carbShares:Array(5).fill(.2), fatShares:[1/3,1/3,1/3]
          };
          if (mode === "LOW") return {
            meals:5, carbs:[0,1,2,3,4], fats:[1,2,4], veg:[0,1,2,3,4],
            fatGrams:{1:10,2:5,4:10}, proteinShares:Array(5).fill(.2), carbShares:Array(5).fill(.2), fatShares:[1/3,1/3,1/3]
          };
          return {
            meals:5, carbs:[], fats:[1,2,4], veg:[0,1,2,3,4],
            fatGrams:{1:15,2:10,4:15}, proteinShares:Array(5).fill(.2), carbShares:[], fatShares:[1/3,1/3,1/3]
          };
        } else {
          if (mode === "HIGH" || mode === "MEDIUM") return {
            meals:5, carbs:[0,1,2,3,4], fats:[0,2,4], veg:[0,1,2,3,4],
            fatGrams:{0:10,2:5,4:10}, proteinShares:Array(5).fill(.2), carbShares:Array(5).fill(.2), fatShares:[1/3,1/3,1/3]
          };
          if (mode === "LOW") return {
            meals:5, carbs:[0,1,2,3,4], fats:[0,2,4], veg:[0,1,2,3,4],
            fatGrams:{0:10,2:5,4:10}, proteinShares:Array(5).fill(.2), carbShares:Array(5).fill(.2), fatShares:[1/3,1/3,1/3]
          };
          return {
            meals:5, carbs:[], fats:[0,2,4], veg:[0,1,2,3,4],
            fatGrams:{0:15,2:10,4:15}, proteinShares:Array(5).fill(.2), carbShares:[], fatShares:[1/3,1/3,1/3]
          };
        }
      }
      // V125 — PEAK WEEK FAT SOURCE LOCK
      // The supplied coach template is authoritative: the engine may solve
      // quantities, but it must not turn Peak Week into a generic meal builder.
      if (mode === "DEPLETE") return {
        // Front Load source template: fat is explicitly added only at meals
        // 1/3/4/6, with Peanut Butter quantities 25/10/25/10 g.
        meals:6, carbs:[], fats:[0,2,3,5], veg:[0,1,2,3,4,5],
        fatGrams:{0:25, 2:10, 3:25, 5:10},
        proteinShares:[.16,.18,.18,.16,.18,.14], carbShares:[], fatShares:[.25,.25,.25,.25]
      };
      if (mode === "LOAD") return {
        // Coach template specifies low fat (<30 g) but no added Peanut Butter
        // slot. Do not invent one just to solve the macro target.
        meals:6, carbs:[0,1,2,3,4,5], fats:[], veg:[],
        proteinShares:[.16,.16,.16,.16,.16,.20], carbShares:[.18,.18,.18,.18,.14,.14], fatShares:[]
      };
      if (mode === "MODERATE") return {
        // Exact coach template: 6 meals. Primary carb sources exist only
        // where the supplied template places them; added Peanut Butter is
        // locked to the explicit template quantities.
        meals:6, carbs:[0,1,3,4,5], fats:[0,3,5], veg:[0,1,2,3,4,5],
        fatGrams:{0:15,3:15,5:20},
        proteinShares:[.18,.18,.14,.18,.16,.16], carbShares:[.20,.20,.20,.20,.20], fatShares:[.25,.25,.3333]
      };
      if (mode === "TIGHTEN") return {
        // Exact coach template: 6 meals. No invented sources or meal-count
        // compression; quantities alone are auto-adjustable.
        meals:6, carbs:[0,1,3,5], fats:[0,3,5], veg:[0,1,2,3,4,5],
        fatGrams:{0:5,3:5,5:15},
        proteinShares:[.18,.16,.16,.18,.16,.16], carbShares:[.25,.25,.25,.25], fatShares:[.3333,.3333,.3334]
      };
      if (mode === "LOW") return {
        // Linear/Conservative LOW templates do not specify an added fat food.
        meals:5, carbs:[0,1,2,3,4], fats:[], veg:[0,1,2,3,4],
        proteinShares:[.20,.20,.20,.20,.20], carbShares:[.20,.20,.20,.20,.20], fatShares:[]
      };
      if (mode === "SHOW DAY") return {
        meals:0, carbs:[], fats:[], veg:[], proteinShares:[], carbShares:[], fatShares:[]
      };
      return {
        meals:5, carbs:[0,1,2,3,4], fats:[0,2,4], veg:[],
        proteinShares:[.2,.2,.2,.2,.2], carbShares:[.2,.2,.2,.2,.2], fatShares:[.34,.33,.33]
      };
    }

    // V115 — Coach-controlled meal count. Keep the stage architecture, but
    // resize category slots to the selected 3–7 meals instead of forcing a
    // hidden meal count. Protein is present in every meal; carb/fat/vegetable
    // slots are distributed across the selected meal count and their shares
    // are normalized automatically.
    function resizePeakTemplate(base: PeakMealSpec, requested: number): PeakMealSpec {
      const meals = Math.min(7, Math.max(3, Math.round(Number(requested) || base.meals)));
      const spread = (count: number) => {
        const n = Math.min(count, meals);
        if (n <= 0) return [] as number[];
        if (n === meals) return Array.from({length: meals}, (_, i) => i);
        const out: number[] = [];
        for (let j = 0; j < n; j++) {
          const idx = Math.round(j * (meals - 1) / (n - 1 || 1));
          if (!out.includes(idx)) out.push(idx);
        }
        for (let i = 0; out.length < n && i < meals; i++) if (!out.includes(i)) out.push(i);
        return out.sort((a,b)=>a-b);
      };
      const carbCount = Math.min(meals, Math.max(0, base.carbs.length));
      const fatCount = Math.min(meals, Math.max(0, base.fats.length));
      const vegCount = Math.min(meals, Math.max(0, base.veg.length));
      const carbs = spread(carbCount);
      const fats = spread(fatCount);
      const veg = spread(vegCount);
      const equalShares = (count:number) => count ? Array.from({length:count},()=>1/count) : [];
      return {
        meals, carbs, fats, veg,
        proteinShares: Array.from({length:meals},()=>1/meals),
        carbShares: equalShares(carbs.length),
        fatShares: equalShares(fats.length),
      };
    }

    if (activeDietSystem === "PEAK WEEK") {
      if (!proteinPool.length) throw new Error("كتالوج Peak Week لا يحتوي على مصدر بروتين معتمد. أضف/فعّل Lean Beef أو Chicken Breast أو Tilapia أو Egg Whites في Catalog V74.");
      // Carb/fat availability is validated per template slot below.
      // A DEPLETE day may intentionally have zero primary-carb slots.
      if (!fatPool.length) throw new Error("كتالوج Peak Week لا يحتوي على مصدر دهون معتمد. أضف/فعّل Peanut Butter أو Almond Butter أو MCT Oil في Catalog V74.");
    }

    // V158 — TEMPLATE ONCE / SCHEDULE REPEAT
    // Normal Bulk/Cutting plans should render each unique day-type meal
    // template only once. The weekly schedule above remains the source of
    // truth for repetition (e.g. Saturday→MEDIUM, Sunday→MEDIUM). Peak Week
    // stays day-specific and is intentionally rendered entry-by-entry.
    const renderedNormalDayTypes = new Set<string>();

    for (const entry of outputEntries) {
      const type = entry.legacyType;
      const peakMode = entry.peakMode;
      if (activeDietSystem !== "PEAK WEEK") {
        const templateKey = String(type || "").toUpperCase();
        if (renderedNormalDayTypes.has(templateKey)) continue;
        renderedNormalDayTypes.add(templateKey);
      }
      const t = activeDietSystem === "PEAK WEEK" && peakMode
        ? (peakDailyTargetsOverride?.[entry.day] || peakMacroForDay(effectivePeakType, peakMode, Math.max(1, Number(current.weight) || 1), entry.dayIndex))
        : enforceMacroConsistency(targets[type]);
      const water = activeDietSystem === "PEAK WEEK" && peakMode
        ? peakWaterSaltForDay(effectivePeakType, peakMode, entry.dayIndex)
        : autoWaterSaltForNormalDay(type, activeDietSystem);
      // SHOW DAY is a completely separate coach template. It must never be
      // passed through the normal Peak meal solver, because the coach source
      // defines stage-day feedings rather than ordinary protein/carb/fat meal slots.
      if (peakMode === "SHOW DAY") {
        lines.push(`━━━━━━━━ SHOW DAY ━━━━━━━━`);
        lines.push(`📅 ${peakDateLabel(entry.day, effectiveStartDate, effectiveShowDate)}`);
        lines.push("🎯 SHOW DAY");
        // V145 — SHOW DAY uses the selected Peak strategy's own tested benchmark.
        // It never copies or derives its macro target from the preceding LOAD day.
        const showKcal = Math.round(t.protein * 4 + t.carbs * 4 + t.fat * 9);
        lines.push(`AUTO SHOW DAY — ${showKcal} kcal | P ${t.protein} g | C ${t.carbs} g | F ${t.fat} g`);
        if (water) lines.push(`الماء ${Number(water.water)} L | الملح ${Number(water.salt)} g | البوتاسيوم — حسب التحاليل/الوصفة فقط`);

        // V145 — SHOW DAY FOOD/SUPPLEMENT TEMPLATE. The template sources are fixed;
        // only quantities/distribution change with the strategy's calculated target.
        const showFood = (patterns: RegExp[], category?: CatalogFood["category"]) => {
          // V146 — live catalog wins; deterministic built-in Show Day sources
          // fill only when the database seed is missing.
          const pool = [...catalogFoods, ...BUILTIN_GENERATION_FOODS];
          return pool.find(f =>
            f.active !== false &&
            (!category || f.category === category) &&
            patterns.some(rx => rx.test(`${f.name_ar || ""} ${f.name_en || ""}`))
          );
        };
        const riceCake = showFood([/rice cake|rice cakes|رايس كيك|كيك أرز/i], "carb");
        const honey = showFood([/honey|عسل أبيض|عسل/i], "carb");
        const jam = showFood([/jam|مربى/i], "carb");
        const whiteRice = showFood([/أرز أبيض مطبوخ|cooked white rice/i], "carb");
        const chicken = showFood([/صدور دجاج|دجاج صدر|chicken breast/i], "protein");
        const peanutButter = showFood([/زبدة فول سوداني|peanut butter/i], "fat");
        const darkChocolate = showFood([/dark chocolate|شوكولاتة داكنة|شوكولاتة دارك/i], "fat");

        const carbPerServing = (food: CatalogFood | undefined) => Number(food?.carbs || 0);
        const amountForCarb = (food: CatalogFood | undefined, carbGrams: number) => {
          if (!food || carbGrams <= 0 || carbPerServing(food) <= 0) return "—";
          const servings = carbGrams / carbPerServing(food);
          if (/rice cake|رايس كيك|كيك أرز/i.test(`${food.name_ar || ""} ${food.name_en || ""}`)) return `${Math.max(1, Math.round(servings))} قطعة ${food.name_ar || food.name_en || "Rice Cakes"}`;
          const grams = servings * Number(food.serving_qty || 100);
          return `${Math.max(5, Math.round(grams / 5) * 5)} جم ${food.name_ar}`;
        };
        const fixedAmount = (food: CatalogFood | undefined, grams: number) => food ? `${grams} جم ${food.name_ar}` : "—";

        // Strategy-specific carb timing: more front-loaded strategies feed earlier;
        // conservative/no-load keeps the smallest early and pre-stage feedings.
        const timingShares: Record<PeakWeekType, [number, number, number, number]> = {
          "FRONT LOAD": [0.50, 0.20, 0.20, 0.10],
          "BACK LOAD": [0.45, 0.20, 0.20, 0.15],
          "LINEAR LOAD": [0.50, 0.20, 0.20, 0.10],
          "MID LOAD": [0.50, 0.20, 0.20, 0.10],
          "CONSERVATIVE / NO LOAD": [0.40, 0.25, 0.20, 0.15],
        };
        const [wakeShare, meal1Share, meal2Share, stageShare] = timingShares[effectivePeakType];
        const wakeC = Math.round(t.carbs * wakeShare);
        const meal1C = Math.round(t.carbs * meal1Share);
        const meal2C = Math.round(t.carbs * meal2Share);
        const stageC = Math.max(0, t.carbs - wakeC - meal1C - meal2C);

        lines.push("", "🌅 أول اليوم / الاستيقاظ", "━━━━━━━━━━━━━━━━━━");
        lines.push(`• ${amountForCarb(riceCake, wakeC * 0.70)}`);
        lines.push(`• ${amountForCarb(honey, wakeC * 0.30)}`);
        lines.push(`• ${fixedAmount(peanutButter, effectivePeakType === "CONSERVATIVE / NO LOAD" ? 10 : 15)}`);
        lines.push("• الملح — ضمن Target اليوم");

        lines.push("", "🍽️ الوجبة الأولى (قبل العرض بـ ساعتين)", "━━━━━━━━━━━━━━━━━━");
        lines.push(`• ${amountForCarb(whiteRice, meal1C * 0.80)}`);
        lines.push(`• ${fixedAmount(chicken, 100)}`);
        lines.push(`• ${amountForCarb(honey, meal1C * 0.20)}`);

        lines.push("", "🍽️ الوجبة الثانية (قبل العرض بـ ساعة)", "━━━━━━━━━━━━━━━━━━");
        lines.push(`• ${amountForCarb(riceCake, meal2C * 0.60)}`);
        lines.push(`• ${amountForCarb(jam, meal2C * 0.25)}`);
        lines.push(`• ${amountForCarb(honey, meal2C * 0.15)}`);
        lines.push("• الملح — ضمن Target اليوم");

        lines.push("", "⏰ قبل المسرح بـ 30–45 دقيقة", "━━━━━━━━━━━━━━━━━━");
        lines.push(`• ${amountForCarb(riceCake, stageC * 0.70)}`);
        lines.push(`• ${amountForCarb(jam, stageC * 0.30)}`);
        lines.push(`• ${fixedAmount(darkChocolate, effectivePeakType === "CONSERVATIVE / NO LOAD" ? 3 : 5)}`);
        lines.push("• الملح — حسب Target اليوم", "• NO Booster (Pump)", "• Pump Bands والتسخين الخلفي");

        lines.push("", "💊 المكملات والتحضير النهائي", "━━━━━━━━━━━━━━━━━━");
        lines.push("• Vitamin C — 1000 mg");
        lines.push("• Cialis — حسب وصف الطبيب فقط؛ لا يتم توليد جرعة تلقائيًا");
        lines.push("• Potassium — لا يتم توليد جرعة تلقائيًا؛ حسب الوصفة/التحاليل فقط");
        lines.push("", "ملاحظة: SHOW DAY أصبح مرتبطًا مباشرةً بالـPeak Strategy المختارة. مصادر الطعام والمكملات من القالب ثابتة، بينما توزيع المصادر يتغير تلقائيًا حسب Target الـSHOW DAY، ويتم اشتقاق السعرات المعروضة من P/C/F الفعليين. لا يتم نسخ يوم LOAD السابق ولا يتم توليد جرعات Prescription.", "");
        continue;
      }

      const tpl = stageTemplate(activeDietSystem === "PEAK WEEK" ? peakMode : type);
      // V127 — TEMPLATE DEFAULT / MANUAL MEAL COUNT OVERRIDE
      // Blank means: preserve the exact coach-template meal count.
      // A selected value is a manual override and is the only case where
      // the meal architecture is resized.
      const effectiveTpl = tpl;
      const mealCountForDay = effectiveTpl.meals;
      const proteinPerMeal = t.protein / mealCountForDay;
      // Normal diets always include a meaningful vegetable serving.
      // 100 g per occupied vegetable slot keeps the plan practical while
      // allowing the coach to change the selected vegetable sources.
      const vegGrams = tpl.veg.length ? 100 : 0;

      lines.push(`━━━━━━━━ ${peakMode || type} ━━━━━━━━`);
      if (activeDietSystem === "PEAK WEEK") {
        lines.push(`📅 ${peakDateLabel(entry.day, effectiveStartDate, effectiveShowDate)}`);
      }

      // V134 — DISPLAY ACTUAL FOOD MACROS FOR SOURCE-ZERO DAYS
      // DEPLETE has zero PRIMARY carbohydrate sources, but carbohydrates
      // naturally present in the locked vegetables/protein/fat foods still
      // count toward the displayed daily total. The engine must not report
      // C=0 when the rendered template actually contains incidental carbs.
      // A placeholder header is patched after the exact meal quantities are
      // solved below. Other stages keep their template macro target header.
      const headerMacroIndex = lines.length;
      const displayCalories = Math.round(t.protein * 4 + t.carbs * 4 + t.fat * 9);
      lines.push(`${displayCalories} kcal | P ${t.protein} g | C ${t.carbs} g | F ${t.fat} g`);
      const base = calculateBaseMacros(activeDietSystem);
      if (base) {
        const delta = Math.round(displayCalories - base.maintenance);
        lines.push(delta > 0 ? `الفارق عن TDEE: +${delta} kcal فائض` : delta < 0 ? `الفارق عن TDEE: ${delta} kcal عجز` : "الفارق عن TDEE: ثبات");
      }
      if (water) lines.push(`الماء ${Number(water.water)} L | الملح ${Number(water.salt)} g | البوتاسيوم — حسب التحاليل/الوصفة فقط`);

      lines.push("", "🌅 عند الاستيقاظ", "🏃‍♂️ LISS Cardio — حسب خطة الكارديو");
      const wakeSupp = supplementsForTiming("wake", type);
      if (wakeSupp.length) lines.push(formatSupplementList(wakeSupp));
      const mealSupp = supplementsForTiming("meal", type);

      // V132 — EXACT PEAK TEMPLATE SOURCE MATRIX + ZERO-CARB DEPLETION LOCK
      // The coach template is authoritative at the MEAL level, not merely by
      // category. AUTO may scale grams, but it may not rotate/replace the
      // source, vegetable, fat slot, or meal architecture.
      // DEPLETE is explicitly source-zero: no primary carb slot is permitted.
      // Any incidental carbohydrate may only come from foods/vegetables already
      // present in the coach template; the engine never invents a carb source.
      type TemplateSlot = {
        protein: "egg"|"chicken"|"beef";
        carb?: "white_rice"|"basmati_cooked"|"basmati_dry"|"potato"|"sweet_potato"|"cream_rice";
        veg?: "spinach"|"arugula"|"lettuce";
        fatGrams?: number;
      };
      const peakTemplateSources: Record<string, TemplateSlot[][]> = {
        DEPLETE: [
          [
            {protein:"egg",veg:"spinach",fatGrams:25},
            {protein:"chicken",veg:"arugula"},
            {protein:"beef",veg:"lettuce",fatGrams:10},
            {protein:"chicken",veg:"spinach",fatGrams:25},
            {protein:"chicken",veg:"arugula"},
            {protein:"beef",veg:"lettuce",fatGrams:10},
          ],
          [
            {protein:"chicken",veg:"spinach",fatGrams:25},
            {protein:"beef",veg:"arugula"},
            {protein:"egg",veg:"lettuce",fatGrams:10},
            {protein:"chicken",veg:"spinach",fatGrams:25},
            {protein:"beef",veg:"arugula"},
            {protein:"egg",veg:"lettuce",fatGrams:10},
          ],
        ],
        LOAD: [
          [
            {protein:"beef",carb:"basmati_cooked"},
            {protein:"egg",carb:"potato"},
            {protein:"chicken",carb:"white_rice"},
            {protein:"beef",carb:"basmati_cooked"},
            {protein:"egg",carb:"potato"},
            {protein:"chicken",carb:"white_rice"},
          ],
          [
            {protein:"egg",carb:"white_rice"},
            {protein:"chicken",carb:"basmati_cooked"},
            {protein:"beef",carb:"potato"},
            {protein:"egg",carb:"white_rice"},
            {protein:"chicken",carb:"basmati_cooked"},
            {protein:"beef",carb:"potato"},
          ],
        ],
        MODERATE: [[
          {protein:"chicken",carb:"potato",veg:"spinach",fatGrams:15},
          {protein:"beef",carb:"white_rice",veg:"arugula"},
          {protein:"egg",veg:"lettuce"},
          {protein:"chicken",carb:"sweet_potato",veg:"spinach",fatGrams:15},
          {protein:"beef",carb:"cream_rice",veg:"arugula"},
          {protein:"egg",carb:"basmati_dry",veg:"lettuce",fatGrams:20},
        ]],
        TIGHTEN: [[
          {protein:"beef",carb:"basmati_cooked",veg:"spinach",fatGrams:5},
          {protein:"egg",carb:"potato",veg:"arugula"},
          {protein:"chicken",veg:"lettuce"},
          {protein:"beef",carb:"basmati_dry",veg:"spinach",fatGrams:5},
          {protein:"egg",veg:"arugula"},
          {protein:"chicken",carb:"sweet_potato",veg:"lettuce",fatGrams:15},
        ]],
      };

      const modeOccurrence = (mode: string, dayIndex: number) => {
        let n = 0;
        for (let j = 0; j < dayIndex; j++) {
          const prev = outputEntries[j]?.peakMode;
          if (prev === mode) n++;
        }
        return n;
      };
      const peakTemplateForEntry = (mode: string|null, dayIndex: number) => {
        if (!mode || !peakTemplateSources[mode]) return undefined;
        const rows = peakTemplateSources[mode];
        return rows[Math.min(modeOccurrence(mode, dayIndex), rows.length - 1)];
      };
      const exactSlotFood = (slot: TemplateSlot, category: CatalogFood["category"]) => {
        const pool = catalogPool(category);
        const text = (f: CatalogFood) => `${f.name_ar || ""} ${f.name_en || ""}`;
        if (category === "protein") {
          const rx = slot.protein === "egg" ? /بياض بيض|بياض البيض|egg white|egg whites/i
            : slot.protein === "chicken" ? /صدور دجاج|دجاج صدر|chicken breast/i
            : /لحم|لحمة|beef|red meat/i;
          return pool.find(f => rx.test(text(f))) || pool[0];
        }
        if (category === "fat") return pool.find(f => /زبدة فول سوداني|peanut butter/i.test(text(f))) || pool[0];
        const c = slot.carb;
        if (category === "carb" && c) {
          const rx = c === "white_rice" ? /أرز أبيض مطبوخ|cooked white rice/i
            : c === "basmati_cooked" ? /أرز بسمتي مطبوخ|cooked basmati rice/i
            : c === "basmati_dry" ? /أرز بسمتي جاف|dry basmati rice/i
            : c === "potato" ? /بطاطس|potato/i
            : c === "sweet_potato" ? /بطاطا حلوة|sweet potato/i
            : /كريم أوف رايس|كريم اوف رايس|cream of rice/i;
          return pool.find(f => rx.test(text(f))) || pool[0];
        }
        return undefined;
      };

      type NormalMealSpec = {
        protein: RegExp[];
        carb?: RegExp[];
        fat?: RegExp[];
        veg: RegExp[];
      };
      const normalMealSpecs: NormalMealSpec[] = [
        {protein:[/بيض كامل|whole egg/i, /بياض بيض|egg white/i], carb:[/شوفان|oats/i], veg:[/خيار|cucumber/i,/طماطم|tomato/i]},
        {protein:[/صدور دجاج|chicken breast/i], carb:[/أرز أبيض مطبوخ|cooked white rice|أرز بسمتي|rice/i], fat:[/زيت زيتون|olive oil/i], veg:[/كوسة|zucchini/i,/بروكلي|broccoli/i,/جزر|carrot/i]},
        {protein:[/صدور دجاج|chicken breast/i], carb:[/أرز أبيض مطبوخ|cooked white rice|rice/i], fat:[/زيت زيتون|olive oil/i], veg:[/فاصوليا خضراء|green beans/i,/كوسة|zucchini/i,/خس|lettuce/i]},
        {protein:[/لحم بقري|lean beef|beef/i], carb:[/بطاطس|potato/i], veg:[/خيار|cucumber/i,/طماطم|tomato/i,/فلفل ألوان|bell pepper/i]},
        {protein:[/زبادي يوناني|greek yogurt/i,/لحم بقري|lean beef|beef/i], carb:[/شوفان|oats/i,/فراولة|strawberries|توت|berries/i], fat:[/لوز|almond/i,/زبدة فول سوداني|peanut butter/i], veg:[/خس|lettuce/i,/خيار|cucumber/i]},
      ];
      const findNormalSource = (category: CatalogFood["category"], patterns: RegExp[] | undefined, fallback: CatalogFood | undefined) => {
        if (!patterns?.length) return fallback;
        const pool = catalogPool(category);
        return pool.find(f => patterns.some(rx => rx.test(`${f.name_ar || ""} ${f.name_en || ""}`))) || fallback;
      };

      // V168 — NORMAL DIET DAILY FAT RECONCILIATION
      // Resolve the exact food sources first, then solve all meal fat slots
      // against the DAILY fat target. This is important because chicken, beef,
      // oats, rice and vegetables already contribute incidental fat.
      const normalSourcesForMeal = (i:number) => {
        const rotation = entry.dayIndex * 4 + i;
        const spec = normalMealSpecs[i % normalMealSpecs.length];
        const protein = findNormalSource("protein", spec.protein, pickDistinct(proteinPool, rotation));
        const carb = findNormalSource("carb", spec.carb, pickDistinct(carbPool, rotation + i));
        // The phase template, not the descriptive meal flavor, owns the fat slot.
        // Cutting uses fat slots at meals 1/3/5 while the normal meal flavor
        // matrix only explicitly names olive oil/PB on some meals. Resolve a
        // valid fat source whenever the template requests one, with the coach
        // selected source first and the catalog/built-in source as fallback.
        const templateWantsFat = effectiveTpl.fats.includes(i);
        const fat = templateWantsFat
          ? (findNormalSource("fat", spec.fat, selectedFat || pickDistinct(fatPool, rotation + i))
              || selectedFat
              || catalogPool("fat")[0])
          : undefined;
        const veg = findNormalSource("vegetable", spec.veg, pickDistinct(vegPool, rotation + i));
        return { protein, carb, fat, veg };
      };

      const normalFatTargets = Array(mealCountForDay).fill(0) as number[];
      if (activeDietSystem !== "PEAK WEEK" && t.fat > 0) {
        const fatSlots = effectiveTpl.fats.filter(i => i >= 0 && i < mealCountForDay);
        if (fatSlots.length) {
          const initial = t.fat / fatSlots.length;
          fatSlots.forEach(i => { normalFatTargets[i] = initial; });

          // Iterate because the added fat source itself can contain protein/carbs,
          // and the protein/carb sources contain incidental fat.
          for (let pass = 0; pass < 8; pass++) {
            let actualFat = 0;
            for (let i = 0; i < mealCountForDay; i++) {
              const src = normalSourcesForMeal(i);
              const carbSlot = effectiveTpl.carbs.includes(i);
              const fatSlot = effectiveTpl.fats.includes(i);
              const carbIndex = effectiveTpl.carbs.indexOf(i);
              const carbShare = carbSlot
                ? (effectiveTpl.carbShares[carbIndex] ?? (1 / Math.max(1, effectiveTpl.carbs.length)))
                : 0;
              const fixedFat = 0;
              const solved = solveMealServings({
                proteinFood: src.protein,
                carbFood: carbSlot ? src.carb : undefined,
                fatFood: fatSlot ? src.fat : undefined,
                vegetableFoods: src.veg ? [src.veg] : [],
                proteinTarget: proteinPerMeal,
                carbsTarget: carbSlot ? Math.max(0, t.carbs * carbShare - fixedFat) : 0,
                fatTarget: fatSlot ? Math.max(0, normalFatTargets[i]) : 0,
                vegetableGrams: vegGrams,
              });
              if (src.protein) actualFat += Number(src.protein.fat || 0) * Number(solved.protein || 0);
              if (src.carb) actualFat += Number(src.carb.fat || 0) * Number(solved.carb || 0);
              if (src.fat && fatSlot) actualFat += Number(src.fat.fat || 0) * Number(solved.fat || 0);
              if (src.veg) actualFat += Number(src.veg.fat || 0) * Number(solved.vegetable || 0);
            }
            const residual = t.fat - actualFat;
            if (Math.abs(residual) <= 0.25) break;
            const addPerSlot = residual / fatSlots.length;
            fatSlots.forEach(i => { normalFatTargets[i] = Math.max(0, normalFatTargets[i] + addPerSlot); });
          }
        }
      }

      let renderedTotals = {protein:0, carbs:0, fat:0};
      for (let i = 0; i < mealCountForDay; i++) {
        // Approved sources rotate deterministically by day/meal, while the
        // template decides which category appears in each meal.
        const rotation = entry.dayIndex * 4 + i;
        const exactTemplate = peakMode ? peakTemplateForEntry(peakMode, entry.dayIndex) : undefined;
        const slot = exactTemplate?.[i];
        const normalSpec = activeDietSystem !== "PEAK WEEK" ? normalMealSpecs[i % normalMealSpecs.length] : undefined;
        const normalSources = activeDietSystem !== "PEAK WEEK" ? normalSourcesForMeal(i) : undefined;
        const proteinFood = slot ? exactSlotFood(slot, "protein") : (normalSources?.protein || pickDistinct(proteinPool, rotation));
        // HARD LOCK: DEPLETE is primary-carb-source zero. Never allow either
        // the exact slot or the generic stage template to create a carb slot.
        // Incidental carbs from the already-locked protein/fat/vegetable foods
        // are still counted in renderedTotals below.
        const carbSlot = peakMode === "DEPLETE"
          ? false
          : (Boolean(slot?.carb) || effectiveTpl.carbs.includes(i));
        const fatSlot = Number(slot?.fatGrams || 0) > 0 || effectiveTpl.fats.includes(i);
        const vegSlot = Boolean(slot?.veg) || effectiveTpl.veg.includes(i);
        const carbIndex = effectiveTpl.carbs.indexOf(i);
        const fatIndex = effectiveTpl.fats.indexOf(i);
        const carbShare = carbSlot ? (effectiveTpl.carbShares[carbIndex] ?? (1 / Math.max(1, effectiveTpl.carbs.length))) : 0;
        const fatShare = fatSlot ? (effectiveTpl.fatShares[fatIndex] ?? 0) : 0;
        const carbFood = peakMode === "DEPLETE"
          ? undefined
          : (slot?.carb ? exactSlotFood(slot, "carb") : (carbSlot ? (normalSources?.carb || pickDistinct(carbPool, rotation + carbIndex)) : undefined));
        const fatFood = fatSlot
          ? (activeDietSystem === "PEAK WEEK"
              ? exactSlotFood(slot || {protein:"egg"}, "fat")
              : (normalSources?.fat || selectedFat || fatPool[0] || BUILTIN_GENERATION_FOODS.find(f => f.id === -118)))
          : undefined;
        const vegFood = slot?.veg
          ? generationFoods.find(f => f.category === "vegetable" && f.active !== false && (
              slot.veg === "spinach" ? /سبانخ|spinach/i.test(`${f.name_ar || ""} ${f.name_en || ""}`) :
              slot.veg === "arugula" ? /جرجير|arugula|rocket/i.test(`${f.name_ar || ""} ${f.name_en || ""}`) :
              /خس|lettuce/i.test(`${f.name_ar || ""} ${f.name_en || ""}`)
            ))
          : (vegSlot ? (normalSources?.veg || pickDistinct(vegPool, i)) : undefined);
        // IMPORTANT: Peak Week fat quantities are template-authoritative.
        // If the coach template says 25 g Peanut Butter, output 25 g; never
        // increase it to satisfy a daily fat macro target. If no fat source is
        // present in the template, fatTarget is zero and no fat food is added.
        const templateFatGrams = activeDietSystem === "PEAK WEEK"
          ? (fatSlot ? (slot?.fatGrams ?? effectiveTpl.fatGrams?.[i]) : undefined)
          : undefined;
        // V141 — fixed template fat sources can contain incidental carbs. Count
        // them before solving the primary carb source.
        const fixedFatFood = fatFood;
        const fixedFatServings = fixedFatFood && templateFatGrams && templateFatGrams > 0
          ? Number(templateFatGrams) / Math.max(1, Number(fixedFatFood.serving_qty || 100))
          : 0;
        const fixedFatCarbs = fixedFatFood ? Number(fixedFatFood.carbs || 0) * fixedFatServings : 0;
        const solved = solveMealServings({
          proteinFood,
          carbFood,
          // V143 — pass the fixed template fat into the reconciliation solver
          // so its incidental protein/carbs are subtracted before solving the
          // protein + carb sources. The rendered fat grams remain unchanged.
          fatFood: fatFood,
          vegetableFoods: vegFood ? [vegFood] : [],
          proteinTarget: proteinPerMeal,
          carbsTarget: (carbSlot && carbFood)
            ? Math.max(0, t.carbs * carbShare - fixedFatCarbs)
            : 0,
          fatTarget: activeDietSystem === "PEAK WEEK"
            ? (templateFatGrams || 0)
            : (normalFatTargets[i] || 0),
          vegetableGrams: vegFood ? vegGrams : 0,
        });

        lines.push("", `🍽️ الوجبة ${i + 1}`, "━━━━━━━━━━━━━━━━━━", "");
        if (proteinFood) {
          lines.push(formatFoodAmount(proteinFood, solved.protein));
          const servings = Number(solved.protein || 0);
          renderedTotals.protein += Number(proteinFood.protein || 0) * servings;
          renderedTotals.carbs += Number(proteinFood.carbs || 0) * servings;
          renderedTotals.fat += Number(proteinFood.fat || 0) * servings;
        }
        if (vegFood && solved.vegetableFoods?.length) {
          lines.push(formatFoodAmount(vegFood, solved.vegetableFoods[0].servings));
          const servings = Number(solved.vegetableFoods[0].servings || 0);
          renderedTotals.protein += Number(vegFood.protein || 0) * servings;
          renderedTotals.carbs += Number(vegFood.carbs || 0) * servings;
          renderedTotals.fat += Number(vegFood.fat || 0) * servings;
        }
        if (carbFood) {
          lines.push(formatFoodAmount(carbFood, solved.carb));
          const servings = Number(solved.carb || 0);
          renderedTotals.protein += Number(carbFood.protein || 0) * servings;
          renderedTotals.carbs += Number(carbFood.carbs || 0) * servings;
          renderedTotals.fat += Number(carbFood.fat || 0) * servings;
        }
        // V125 — EXACT COACH FAT QUANTITY. The template owns the fat slot;
        // e.g. 25 g Peanut Butter stays exactly 25 g and is never converted
        // into a larger serving to chase the daily F target.
        if (fatFood) {
          if (activeDietSystem === "PEAK WEEK" && templateFatGrams && templateFatGrams > 0) {
            lines.push(`${templateFatGrams} ${fatFood.serving_unit || "جم"} ${fatFood.name_ar}`);
            const servings = Number(templateFatGrams) / Math.max(1, Number(fatFood.serving_qty || 100));
            renderedTotals.protein += Number(fatFood.protein || 0) * servings;
            renderedTotals.carbs += Number(fatFood.carbs || 0) * servings;
            renderedTotals.fat += Number(fatFood.fat || 0) * servings;
          } else if (activeDietSystem !== "PEAK WEEK" && fatSlot) {
            const servings = Number(solved.fat || 0);
            if (servings > 0) {
              lines.push(formatFoodAmount(fatFood, servings));
              renderedTotals.protein += Number(fatFood.protein || 0) * servings;
              renderedTotals.carbs += Number(fatFood.carbs || 0) * servings;
              renderedTotals.fat += Number(fatFood.fat || 0) * servings;
            }
          }
        }
        if (i === 0 && mealSupp.length) {
          lines.push("", "💊 مكملات الوجبة", formatSupplementList(mealSupp));
        }
        if (i === 3 && mealCountForDay >= 5) {
          const preSupp = supplementsForTiming("pre", type);
          if (preSupp.length) lines.push("", "⚡ قبل التمرين", formatSupplementList(preSupp));
        }
      }

      // V134 — Patch DEPLETE header with ACTUAL rendered incidental carbs.
      // Primary carb target remains zero; only carbs physically present in the
      // locked template are counted. Never add a primary carb source to chase
      // the target.
      if (peakMode === "DEPLETE") {
        const p = Math.round(renderedTotals.protein / 5) * 5;
        const c = Math.max(0, Math.round(renderedTotals.carbs / 5) * 5);
        const f = Math.round(renderedTotals.fat / 5) * 5;
        const kcal = Math.round((p * 4 + c * 4 + f * 9) / 5) * 5;
        lines[headerMacroIndex] = `${kcal} kcal | P ${p} g | C ${c} g (Actual Incidental) | F ${f} g`;
        if (base) {
          const delta = Math.round(kcal - base.maintenance);
          // Replace the previously inserted TDEE line only for DEPLETE.
          // It remains immediately after the macro header.
          const tdeeLineIndex = headerMacroIndex + 1;
          lines[tdeeLineIndex] = delta > 0 ? `الفارق عن TDEE: +${delta} kcal فائض` : delta < 0 ? `الفارق عن TDEE: ${delta} kcal عجز` : "الفارق عن TDEE: ثبات";
        }
      }

      // V130 — No automatic post-workout food additions.
      // If Whey Isolate exists in a coach template it must be represented by
      // the template itself or by an explicit manual coach edit; the engine
      // never invents it to close a protein target.

      const intraSupp = supplementsForTiming("intra", type);
      const eveningSupp = supplementsForTiming("evening", type);
      if (intraSupp.length) lines.push("", "💪 أثناء التمرين", formatSupplementList(intraSupp));
      if (eveningSupp.length) lines.push("🌙 قبل النوم", formatSupplementList(eveningSupp));
      lines.push("");
    }

    lines.push("ملاحظة: الـAUTO Engine يلتزم بقالب المدرب ومصادره المعتمدة، ويحسب تلقائيًا Schedule + TDEE + السعرات + P/C/F + كميات الطعام. لا يلزم تدخل يدوي في الخطة الغذائية.");
    return lines.join("\n");
  }

  function defaultTrainingStatusForSplit(splitId:number): Record<DayKey, TrainingStatus> {
    const rows = trainingExercises.filter(e => e.split_id === splitId);
    const result = {} as Record<DayKey, TrainingStatus>;
    for (const day of weekDays) {
      const dayRows = rows.filter(e => e.day_name === day && e.muscle_group !== "Rest" && e.exercise_en !== "Rest");
      result[day] = dayRows.length ? "TRAINING" : "REST";
    }
    return result;
  }

  const autoExerciseTemplates: Record<string, Record<DayKey, TrainingExercise[]>> = {
    "Pro Split": {
      السبت: [
        {id:0,split_id:0,day_name:"السبت",muscle_group:"Chest",exercise_ar:"بنش برس بالبار",exercise_en:"Barbell Bench Press",sets:"4",reps:"6–8",rest:"2–3 min",sort_order:10},
        {id:0,split_id:0,day_name:"السبت",muscle_group:"Chest",exercise_ar:"بنش مائل دمبل",exercise_en:"Incline Dumbbell Press",sets:"4",reps:"8–10",rest:"2 min",sort_order:20},
        {id:0,split_id:0,day_name:"السبت",muscle_group:"Chest",exercise_ar:"ضغط صدر جهاز",exercise_en:"Machine Chest Press",sets:"3",reps:"10–12",rest:"2 min",sort_order:30},
        {id:0,split_id:0,day_name:"السبت",muscle_group:"Chest",exercise_ar:"تفتيح كيبل",exercise_en:"Cable Fly",sets:"3",reps:"12–15",rest:"60–90 sec",sort_order:40},
        {id:0,split_id:0,day_name:"السبت",muscle_group:"Triceps",exercise_ar:"ضغط ترايسبس كيبل",exercise_en:"Cable Pushdown",sets:"4",reps:"10–12",rest:"60–90 sec",sort_order:50},
        {id:0,split_id:0,day_name:"السبت",muscle_group:"Triceps",exercise_ar:"ترايسبس فوق الرأس بالكيبل",exercise_en:"Overhead Cable Extension",sets:"3",reps:"10–12",rest:"60–90 sec",sort_order:60},
        {id:0,split_id:0,day_name:"السبت",muscle_group:"Triceps",exercise_ar:"ترايسبس جهاز",exercise_en:"Machine Dip",sets:"3",reps:"10–15",rest:"60–90 sec",sort_order:70},
      ],
      الأحد: [
        {id:0,split_id:0,day_name:"الأحد",muscle_group:"Back",exercise_ar:"سحب أمامي واسع",exercise_en:"Wide-Grip Lat Pulldown",sets:"4",reps:"8–10",rest:"2–3 min",sort_order:10},
        {id:0,split_id:0,day_name:"الأحد",muscle_group:"Back",exercise_ar:"سحب لات ذراع واحد",exercise_en:"Single Arm Lat Pulldown",sets:"3",reps:"10–12",rest:"90 sec",sort_order:20},
        {id:0,split_id:0,day_name:"الأحد",muscle_group:"Back",exercise_ar:"تجديف صدر مدعوم",exercise_en:"Chest-Supported Row",sets:"4",reps:"8–10",rest:"2–3 min",sort_order:30},
        {id:0,split_id:0,day_name:"الأحد",muscle_group:"Back",exercise_ar:"سحب أرضي",exercise_en:"Seated Cable Row",sets:"3",reps:"10–12",rest:"2 min",sort_order:40},
        {id:0,split_id:0,day_name:"الأحد",muscle_group:"Back",exercise_ar:"سحب ذراع مستقيم",exercise_en:"Straight-Arm Pulldown",sets:"3",reps:"12–15",rest:"60–90 sec",sort_order:50},
        {id:0,split_id:0,day_name:"الأحد",muscle_group:"Biceps",exercise_ar:"باربل كيرل",exercise_en:"Barbell Curl",sets:"3",reps:"8–10",rest:"60–90 sec",sort_order:60},
        {id:0,split_id:0,day_name:"الأحد",muscle_group:"Biceps",exercise_ar:"دمبل كيرل مائل",exercise_en:"Incline Dumbbell Curl",sets:"3",reps:"10–12",rest:"60–90 sec",sort_order:70},
        {id:0,split_id:0,day_name:"الأحد",muscle_group:"Biceps",exercise_ar:"هامر كيرل",exercise_en:"Hammer Curl",sets:"3",reps:"10–12",rest:"60–90 sec",sort_order:80},
      ],
      الإثنين: [
        {id:0,split_id:0,day_name:"الإثنين",muscle_group:"Shoulders",exercise_ar:"ضغط كتف جهاز",exercise_en:"Machine Shoulder Press",sets:"4",reps:"8–10",rest:"2 min",sort_order:10},
        {id:0,split_id:0,day_name:"الإثنين",muscle_group:"Shoulders",exercise_ar:"رفرفة جانبية كيبل",exercise_en:"Cable Lateral Raise",sets:"4",reps:"12–15",rest:"60–90 sec",sort_order:20},
        {id:0,split_id:0,day_name:"الإثنين",muscle_group:"Shoulders",exercise_ar:"رفرفة جانبية جهاز",exercise_en:"Machine Lateral Raise",sets:"3",reps:"12–15",rest:"60–90 sec",sort_order:30},
        {id:0,split_id:0,day_name:"الإثنين",muscle_group:"Rear Delts",exercise_ar:"رفرفة خلفية جهاز",exercise_en:"Reverse Pec Deck",sets:"4",reps:"12–15",rest:"60–90 sec",sort_order:40},
        {id:0,split_id:0,day_name:"الإثنين",muscle_group:"Traps",exercise_ar:"شراگز دمبل",exercise_en:"Dumbbell Shrug",sets:"4",reps:"10–12",rest:"90 sec",sort_order:50},
        {id:0,split_id:0,day_name:"الإثنين",muscle_group:"Rear Delts",exercise_ar:"فيس بول",exercise_en:"Face Pull",sets:"3",reps:"12–15",rest:"60–90 sec",sort_order:60},
      ],
      الثلاثاء: [
        {id:0,split_id:0,day_name:"الثلاثاء",muscle_group:"Biceps",exercise_ar:"EZ بار كيرل",exercise_en:"EZ-Bar Curl",sets:"4",reps:"8–10",rest:"60–90 sec",sort_order:10},
        {id:0,split_id:0,day_name:"الثلاثاء",muscle_group:"Biceps",exercise_ar:"Preacher Curl",exercise_en:"Preacher Curl",sets:"3",reps:"10–12",rest:"60–90 sec",sort_order:20},
        {id:0,split_id:0,day_name:"الثلاثاء",muscle_group:"Biceps",exercise_ar:"كيبل كيرل",exercise_en:"Cable Curl",sets:"3",reps:"12–15",rest:"60–90 sec",sort_order:30},
        {id:0,split_id:0,day_name:"الثلاثاء",muscle_group:"Triceps",exercise_ar:"ضغط قبضة ضيقة",exercise_en:"Close-Grip Bench Press",sets:"3",reps:"8–10",rest:"2 min",sort_order:40},
        {id:0,split_id:0,day_name:"الثلاثاء",muscle_group:"Triceps",exercise_ar:"روپ بوش داون",exercise_en:"Rope Pushdown",sets:"4",reps:"10–12",rest:"60–90 sec",sort_order:50},
        {id:0,split_id:0,day_name:"الثلاثاء",muscle_group:"Triceps",exercise_ar:"ترايسبس فوق الرأس",exercise_en:"Overhead Cable Extension",sets:"3",reps:"10–12",rest:"60–90 sec",sort_order:60},
      ],
      الأربعاء: [
        {id:0,split_id:0,day_name:"الأربعاء",muscle_group:"Quads",exercise_ar:"هاك سكوات",exercise_en:"Hack Squat",sets:"4",reps:"6–10",rest:"2–3 min",sort_order:10},
        {id:0,split_id:0,day_name:"الأربعاء",muscle_group:"Quads",exercise_ar:"ليج برس",exercise_en:"Leg Press",sets:"4",reps:"10–12",rest:"2–3 min",sort_order:20},
        {id:0,split_id:0,day_name:"الأربعاء",muscle_group:"Quads",exercise_ar:"ليج إكستنشن",exercise_en:"Leg Extension",sets:"3",reps:"12–15",rest:"60–90 sec",sort_order:30},
        {id:0,split_id:0,day_name:"الأربعاء",muscle_group:"Hamstrings",exercise_ar:"رومانيان ديدليفت",exercise_en:"Romanian Deadlift",sets:"3",reps:"8–10",rest:"2–3 min",sort_order:40},
        {id:0,split_id:0,day_name:"الأربعاء",muscle_group:"Hamstrings",exercise_ar:"ليج كيرل جالس",exercise_en:"Seated Leg Curl",sets:"4",reps:"10–12",rest:"60–90 sec",sort_order:50},
        {id:0,split_id:0,day_name:"الأربعاء",muscle_group:"Hamstrings",exercise_ar:"ليج كيرل راقد",exercise_en:"Lying Leg Curl",sets:"3",reps:"12–15",rest:"60–90 sec",sort_order:60},
        {id:0,split_id:0,day_name:"الأربعاء",muscle_group:"Calves",exercise_ar:"كالف واقف",exercise_en:"Standing Calf Raise",sets:"4",reps:"10–15",rest:"60–90 sec",sort_order:70},
        {id:0,split_id:0,day_name:"الأربعاء",muscle_group:"Calves",exercise_ar:"كالف جالس",exercise_en:"Seated Calf Raise",sets:"3",reps:"12–15",rest:"60–90 sec",sort_order:80},
      ],
      الخميس: [
        {id:0,split_id:0,day_name:"الخميس",muscle_group:"Chest",exercise_ar:"إنكلاين ماشين برس",exercise_en:"Incline Machine Press",sets:"3",reps:"8–10",rest:"2 min",sort_order:10},
        {id:0,split_id:0,day_name:"الخميس",muscle_group:"Back",exercise_ar:"تجديف صدر مدعوم",exercise_en:"Chest-Supported Row",sets:"3",reps:"8–10",rest:"2 min",sort_order:20},
        {id:0,split_id:0,day_name:"الخميس",muscle_group:"Back",exercise_ar:"لات بول داون",exercise_en:"Lat Pulldown",sets:"3",reps:"10–12",rest:"2 min",sort_order:30},
        {id:0,split_id:0,day_name:"الخميس",muscle_group:"Chest",exercise_ar:"كيبل فلاي",exercise_en:"Cable Fly",sets:"3",reps:"12–15",rest:"60–90 sec",sort_order:40},
        {id:0,split_id:0,day_name:"الخميس",muscle_group:"Shoulders",exercise_ar:"رفرفة جانبية كيبل",exercise_en:"Cable Lateral Raise",sets:"4",reps:"12–15",rest:"60–90 sec",sort_order:50},
        {id:0,split_id:0,day_name:"الخميس",muscle_group:"Rear Delts",exercise_ar:"رفرفة خلفية جهاز",exercise_en:"Reverse Pec Deck",sets:"3",reps:"12–15",rest:"60–90 sec",sort_order:60},
        {id:0,split_id:0,day_name:"الخميس",muscle_group:"Triceps",exercise_ar:"روپ بوش داون",exercise_en:"Rope Pushdown",sets:"3",reps:"12–15",rest:"60–90 sec",sort_order:70},
        {id:0,split_id:0,day_name:"الخميس",muscle_group:"Biceps",exercise_ar:"كيبل كيرل",exercise_en:"Cable Curl",sets:"3",reps:"12–15",rest:"60–90 sec",sort_order:80},
      ],
      الجمعة: [],
    },
    "Push Pull Legs": {
      السبت: [], الأحد: [], الإثنين: [], الثلاثاء: [], الأربعاء: [], الخميس: [], الجمعة: []
    },
    "Upper Lower": {
      السبت: [], الأحد: [], الإثنين: [], الثلاثاء: [], الأربعاء: [], الخميس: [], الجمعة: []
    },
    "Full Body": {
      السبت: [], الأحد: [], الإثنين: [], الثلاثاء: [], الأربعاء: [], الخميس: [], الجمعة: []
    }
  };

  function makeAutoExercise(day:DayKey, ar:string, en:string, sets:string, reps:string, rest:string, muscle:string, order:number): TrainingExercise {
    return { id:0, split_id:0, day_name:day, muscle_group:muscle, exercise_ar:ar, exercise_en:en, sets, reps, rest, sort_order:order };
  }

  function genericAutoRows(splitName:string, day:DayKey): TrainingExercise[] {
    const pushDays: DayKey[] = ["السبت", "الأربعاء"];
    const pullDays: DayKey[] = ["الأحد", "الخميس"];
    const legDays: DayKey[] = ["الإثنين", "الجمعة"];
    if (splitName === "Push Pull Legs") {
      if (pushDays.includes(day)) return [
        makeAutoExercise(day,"بنش مائل دمبل","Incline Dumbbell Press","4","6–8","2–3 min","Chest",10),
        makeAutoExercise(day,"ضغط صدر جهاز","Machine Chest Press","3","8–10","2 min","Chest",20),
        makeAutoExercise(day,"دمبل برس مستوي","Flat Dumbbell Press","3","8–12","2 min","Chest",30),
        makeAutoExercise(day,"كيبل فلاي","Cable Fly","3","12–15","60–90 sec","Chest",40),
        makeAutoExercise(day,"ضغط كتف جهاز","Machine Shoulder Press","3","8–10","2 min","Shoulders",50),
        makeAutoExercise(day,"رفرفة جانبية كيبل","Cable Lateral Raise","4","12–15","60–90 sec","Shoulders",60),
        makeAutoExercise(day,"روپ بوش داون","Rope Pushdown","3","10–15","60–90 sec","Triceps",70),
        makeAutoExercise(day,"ترايسبس فوق الرأس","Overhead Cable Extension","3","10–12","60–90 sec","Triceps",80),
      ];
      if (pullDays.includes(day)) return [
        makeAutoExercise(day,"سحب أمامي واسع","Wide-Grip Lat Pulldown","4","8–10","2–3 min","Back",10),
        makeAutoExercise(day,"سحب لات ذراع واحد","Single Arm Lat Pulldown","3","10–12","90 sec","Back",20),
        makeAutoExercise(day,"تجديف صدر مدعوم","Chest-Supported Row","4","8–10","2–3 min","Back",30),
        makeAutoExercise(day,"سحب أرضي","Seated Cable Row","3","10–12","2 min","Back",40),
        makeAutoExercise(day,"سحب ذراع مستقيم","Straight-Arm Pulldown","3","12–15","60–90 sec","Back",50),
        makeAutoExercise(day,"رفرفة خلفية جهاز","Reverse Pec Deck","3","12–15","60–90 sec","Rear Delts",60),
        makeAutoExercise(day,"كيبل كيرل","Cable Curl","3","10–12","60–90 sec","Biceps",70),
        makeAutoExercise(day,"هامر كيرل","Hammer Curl","3","10–12","60–90 sec","Biceps",80),
      ];
      if (legDays.includes(day)) return [
        makeAutoExercise(day,"هاك سكوات","Hack Squat","4","6–10","2–3 min","Quads",10),
        makeAutoExercise(day,"ليج برس","Leg Press","4","8–12","2–3 min","Quads",20),
        makeAutoExercise(day,"ليج إكستنشن","Leg Extension","3","12–15","60–90 sec","Quads",30),
        makeAutoExercise(day,"رومانيان ديدليفت","Romanian Deadlift","3","8–10","2–3 min","Hamstrings",40),
        makeAutoExercise(day,"ليج كيرل جالس","Seated Leg Curl","4","10–12","60–90 sec","Hamstrings",50),
        makeAutoExercise(day,"ليج كيرل راقد","Lying Leg Curl","3","12–15","60–90 sec","Hamstrings",60),
        makeAutoExercise(day,"كالف واقف","Standing Calf Raise","4","10–15","60–90 sec","Calves",70),
        makeAutoExercise(day,"كالف جالس","Seated Calf Raise","3","12–15","60–90 sec","Calves",80),
      ];
    }
    if (splitName === "Upper Lower") {
      const upper = day === "السبت" || day === "الثلاثاء" || day === "الجمعة";
      const lower = day === "الأحد" || day === "الأربعاء";
      if (upper) return [
        makeAutoExercise(day,"بنش مائل دمبل","Incline Dumbbell Press","4","8–10","2 min","Chest",10),
        makeAutoExercise(day,"ضغط صدر جهاز","Machine Chest Press","3","10–12","2 min","Chest",20),
        makeAutoExercise(day,"سحب أمامي","Lat Pulldown","4","8–12","2 min","Back",30),
        makeAutoExercise(day,"تجديف صدر مدعوم","Chest-Supported Row","3","8–12","2 min","Back",40),
        makeAutoExercise(day,"رفرفة جانبية كيبل","Cable Lateral Raise","4","12–15","60–90 sec","Shoulders",50),
        makeAutoExercise(day,"كيبل كيرل","Cable Curl","3","10–12","60–90 sec","Biceps",60),
        makeAutoExercise(day,"روپ بوش داون","Rope Pushdown","3","10–15","60–90 sec","Triceps",70),
      ];
      if (lower) return [
        makeAutoExercise(day,"هاك سكوات","Hack Squat","4","8–10","2–3 min","Quads",10),
        makeAutoExercise(day,"ليج برس","Leg Press","4","10–12","2 min","Quads",20),
        makeAutoExercise(day,"ليج إكستنشن","Leg Extension","3","12–15","60–90 sec","Quads",30),
        makeAutoExercise(day,"رومانيان ديدليفت","Romanian Deadlift","3","8–10","2–3 min","Hamstrings",40),
        makeAutoExercise(day,"ليج كيرل جالس","Seated Leg Curl","4","10–15","60–90 sec","Hamstrings",50),
        makeAutoExercise(day,"ليج كيرل راقد","Lying Leg Curl","3","12–15","60–90 sec","Hamstrings",60),
        makeAutoExercise(day,"كالف واقف","Standing Calf Raise","4","10–15","60–90 sec","Calves",70),
      ];
    }
    if (splitName === "Full Body") {
      const restDays: DayKey[] = ["الإثنين", "الأربعاء", "الجمعة"];
      if (!restDays.includes(day)) return [
        makeAutoExercise(day,"ليج برس","Leg Press","3","8–12","2 min","Legs",10),
        makeAutoExercise(day,"بنش مائل جهاز","Incline Machine Press","3","8–12","2 min","Chest",20),
        makeAutoExercise(day,"سحب أمامي","Lat Pulldown","3","8–12","2 min","Back",30),
        makeAutoExercise(day,"تجديف صدر مدعوم","Chest-Supported Row","3","10–12","2 min","Back",40),
        makeAutoExercise(day,"ضغط كتف جهاز","Machine Shoulder Press","3","8–10","2 min","Shoulders",50),
        makeAutoExercise(day,"كيبل كيرل","Cable Curl","2","10–15","60–90 sec","Biceps",60),
        makeAutoExercise(day,"روپ بوش داون","Rope Pushdown","2","10–15","60–90 sec","Triceps",70),
      ];
    }
    return [];
  }

  function getAutoTrainingRows(split:TrainingSplit, day:DayKey, catalogRows:TrainingExercise[]) {
    const template = autoExerciseTemplates[split.name_en]?.[day] ?? [];
    if (template.length) return template;
    const generic = genericAutoRows(split.name_en, day);
    if (generic.length) return generic;
    return catalogRows.filter(e => e.day_name === day && e.muscle_group !== "Rest" && e.exercise_en !== "Rest");
  }

  const autoCoreTemplates: Record<DayKey, TrainingExercise[]> = {
    السبت: [
      makeAutoExercise("السبت","كابل كرنش","Cable Crunch","3","15–20","60 sec","Core",10),
      makeAutoExercise("السبت","رفع الرجلين معلق","Hanging Leg Raise","3","12–15","60 sec","Core",20),
    ],
    الأحد: [
      makeAutoExercise("الأحد","كرنش عكسي","Reverse Crunch","3","15–20","60 sec","Core",10),
      makeAutoExercise("الأحد","بلانك","Plank","3","45–60 sec","60 sec","Core",20),
    ],
    الإثنين: [
      makeAutoExercise("الإثنين","كرنش عكسي","Reverse Crunch","3","15–20","60 sec","Core",10),
      makeAutoExercise("الإثنين","بلانك","Plank","3","45–60 sec","60 sec","Core",20),
    ],
    الثلاثاء: [
      makeAutoExercise("الثلاثاء","كابل كرنش","Cable Crunch","3","15–20","60 sec","Core",10),
      makeAutoExercise("الثلاثاء","Ab Wheel","Ab Wheel Rollout","3","10–15","60–90 sec","Core",20),
    ],
    الأربعاء: [
      makeAutoExercise("الأربعاء","كابل كرنش","Cable Crunch","3","15–20","60 sec","Core",10),
      makeAutoExercise("الأربعاء","أب ويل","Ab Wheel Rollout","3","10–15","60–90 sec","Core",20),
    ],
    الخميس: [
      makeAutoExercise("الخميس","رفع الركبة معلق","Hanging Knee Raise","3","15–20","60 sec","Core",10),
      makeAutoExercise("الخميس","فاكيوم","Stomach Vacuum","4","20–30 sec","45–60 sec","Core",20),
    ],
    الجمعة: [
      makeAutoExercise("الجمعة","بلانك","Plank","3","45–60 sec","60 sec","Core",10),
      makeAutoExercise("الجمعة","كابل كرنش","Cable Crunch","3","15–20","60 sec","Core",20),
    ],
  };

  function generateCoreText(status: Record<DayKey, TrainingStatus> = trainingDayStatus) {
    const active = coreDays.filter(day => status[day] === "TRAINING");
    const lines = ["━━━━━━━━━━━━━━━━━━", "🔥 CORE — 4 أيام / قابل للتعديل", "━━━━━━━━━━━━━━━━━━", ""];
    if (!active.length) {
      lines.push("لا توجد أيام CORE مفعلة حاليًا.");
      return lines.join("\n");
    }
    active.forEach(day => {
      lines.push(day);
      autoCoreTemplates[day].forEach(e => lines.push(`• ${e.exercise_ar} — ${e.exercise_en} — ${e.sets} × ${e.reps}`));
      lines.push("");
    });
    lines.push("يمكن للمدرب تغيير أيام CORE، تبديل أي حركة، أو تعديل الـSets × Reps يدويًا في المعاينة.");
    return lines.join("\n").trim();
  }

  function availableTrainingTemplateDays(split: TrainingSplit, catalogRows: TrainingExercise[]): DayKey[] {
    return weekDays.filter(day => getAutoTrainingRows(split, day, catalogRows).length > 0);
  }

  // V91: A coach can mark ANY weekday as TRAINING, even when the selected
  // split has no native catalog/template rows for that weekday (for example,
  // Pro Split may not define Friday). Resolve the saved template assignment
  // first, then fall back to the target day, then to the first available
  // template. This prevents a TRAINING day from rendering with zero exercises
  // after save/reload.
  function getTrainingRowsForAssignedTemplate(
    split: TrainingSplit,
    targetDay: DayKey,
    catalogRows: TrainingExercise[],
    assignments: Record<DayKey, DayKey> = trainingDayTemplates
  ) {
    const assignedDay = assignments[targetDay] || targetDay;
    let rows = getAutoTrainingRows(split, assignedDay, catalogRows);

    if (!rows.length && assignedDay !== targetDay) {
      rows = getAutoTrainingRows(split, targetDay, catalogRows);
    }

    if (!rows.length) {
      const fallbackDay = availableTrainingTemplateDays(split, catalogRows)[0];
      if (fallbackDay) {
        rows = getAutoTrainingRows(split, fallbackDay, catalogRows);
      }
    }

    return rows.map((e, index) => ({
      ...e,
      day_name: targetDay,
      sort_order: e.sort_order ?? (index + 1) * 10
    }));
  }

  function normalizeTrainingTemplateAssignments(split: TrainingSplit, catalogRows: TrainingExercise[]) {
    const options = availableTrainingTemplateDays(split, catalogRows);
    if (!options.length) return;
    setTrainingDayTemplates(prev => {
      const next = { ...prev };
      for (const day of weekDays) {
        if (!options.includes(next[day])) next[day] = options.includes(day) ? day : options[0];
      }
      return next;
    });
  }

  function generateTrainingText() {
    const split = trainingSplits.find(s => s.id === Number(selectedTrainingSplit));
    if (!split) return "";
    const rows = trainingExercises.filter(e => e.split_id === split.id);
    const splitTitle = split.name_en && split.name_en.trim() !== split.name_ar.trim()
      ? `${split.name_ar} — ${split.name_en}` : split.name_ar;
    const lines = ["━━━━━━━━━━━━━━━━━━", `🏋️ ${selectedPhase} — TRAINING PROGRAM`, "━━━━━━━━━━━━━━━━━━", `📅 Training Phase — ${durationLabel(trainingPhaseStart, trainingPhaseEnd, trainingPhaseWeeks)}`, "", splitTitle, ""];
    for (const day of weekDays) {
      lines.push(`━━━━━━━━━━━━━━━━━━`);
      lines.push(`${trainingDayStatus[day] === "REST" ? "⚪" : "🔴"} ${day} — ${trainingDayStatus[day] === "REST" ? "REST / RECOVERY" : "TRAINING"}`);
      lines.push(`━━━━━━━━━━━━━━━━━━`);
      if (trainingDayStatus[day] === "REST") {
        lines.push("• راحة من الحديد — Rest");
      } else {
        const dayRows = getTrainingRowsForAssignedTemplate(split, day, rows).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
        dayRows.forEach(e => lines.push(`• ${e.exercise_ar} — ${e.exercise_en} — ${e.sets} × ${e.reps}`));
      }
      lines.push("");
    }
    lines.push("");
    lines.push(generateCoreText());
    return lines.join("\n").trim();
  }

  function openPrintPreview() {
    // Prefer the text already generated/saved. If it is empty, generate a
    // fresh preview from the current targets and catalog before opening.
    if (!planDiet.trim()) {
      let targets = generatedTargets;
      const peak = dietSystem === "PEAK WEEK";
      let daily: Record<DayKey, MacroTargets> | undefined;
      if (peak) {
        daily = peakDailyTargets || calculatePeakDailyTargets(peakWeekType, peakStartDate, peakShowDate);
        setPeakDailyTargets(daily);
        targets = {} as Record<DayType, MacroTargets>;
      } else if (!targets) {
        const base = calculateBaseMacros();
        if (base) targets = calculateDayTargets(base);
      }
      if (targets && catalogFoods.length) {
        const order = peak ? peakDateOrder(peakStartDate, peakShowDate) : weekDays;
        const diet = [
          `AUTO PLAN — ${selectedPhase}`,
          ...(peak
            ? order.map((day, i) => `${peakDateLabel(day, peakStartDate, peakShowDate)} — ${getPeakWeekModes(peakWeekType, peakStartDate, peakShowDate)[day]}`)
            : normalScheduleHeaderLines(dayTypes)),
          "",
          generateDietText(targets, peak ? getPeakWeekDayTypes(peakWeekType, peakStartDate, peakShowDate) : dayTypes, peak ? peakWeekType : undefined, peakStartDate, peakShowDate, peak ? "PEAK WEEK" : undefined, peak ? daily : undefined),
        ].join("\n");
        setPlanDiet(normalizeGeneratedDietMacroHeaders(diet));
      } else if (plan?.diet_system) {
        setPlanDiet(stripSupplementsFromPlanText(normalizeGeneratedDietMacroHeaders(plan.diet_system)));
      }
    }

    if (!planTraining.trim() && plan?.training_program) {
      setPlanTraining(plan.training_program);
    }
    if (!planCardio.trim() && plan?.cardio_plan) {
      setPlanCardio(plan.cardio_plan);
    }

    setShowPrintPreview(true);
  }

  function handleGenerateTraining() {
    const splitId = selectedTrainingSplit === "" ? trainingSplits[0]?.id : Number(selectedTrainingSplit);
    if (!splitId) { setMsg("لم يتم تحميل أنظمة التمرين من قاعدة البيانات بعد."); return; }
    const split = trainingSplits.find(x => x.id === splitId);
    if (!split) { setMsg("نظام التمرين المختار غير موجود في الكتالوج."); return; }
    if (!selectedTrainingSplit) setSelectedTrainingSplit(splitId);

    const catalogRows = trainingExercises.filter(e => e.split_id === split.id);
    const templateOptions = availableTrainingTemplateDays(split, catalogRows);
    const effectiveTemplates = { ...trainingDayTemplates };
    if (templateOptions.length) {
      for (const d of weekDays) {
        if (!templateOptions.includes(effectiveTemplates[d])) {
          effectiveTemplates[d] = templateOptions.includes(d) ? d : templateOptions[0];
        }
      }
      setTrainingDayTemplates(effectiveTemplates);
    }
    const inferred = defaultTrainingStatusForSplit(split.id);
    // Keep coach-selected status; only fill missing/invalid values from catalog.
    const status = { ...inferred, ...trainingDayStatus };
    setTrainingDayStatus(status);

    const lines = ["━━━━━━━━━━━━━━━━━━", `🏋️ ${selectedPhase} — TRAINING PROGRAM`, "━━━━━━━━━━━━━━━━━━", "", split.name_en && split.name_en.trim() !== split.name_ar.trim() ? `${split.name_ar} — ${split.name_en}` : split.name_ar, ""];
    for (const day of weekDays) {
      const isTraining = status[day] === "TRAINING";
      lines.push("━━━━━━━━━━━━━━━━━━");
      lines.push(`${isTraining ? "🔴" : "⚪"} ${day} — ${isTraining ? "TRAINING" : "REST / RECOVERY"}`);
      lines.push("━━━━━━━━━━━━━━━━━━");
      if (!isTraining) {
        lines.push("• راحة من الحديد — Rest");
      } else {
        const dayRows = getTrainingRowsForAssignedTemplate(split, day, catalogRows, effectiveTemplates).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
        if (!dayRows.length) {
          lines.push("• لم يتم العثور على حركات لهذا اليوم — أضفها أو عدّلها يدويًا");
        } else {
          dayRows.forEach(e => lines.push(`• ${e.exercise_ar} — ${e.exercise_en} — ${e.sets} × ${e.reps}`));
        }
      }
      lines.push("");
    }
    lines.push("");
    lines.push(generateCoreText(status));
    setPlanTraining(lines.join("\n").trim());
    setMsg(`تم توليد ${split.name_en} تلقائيًا مع إمكانية اختيار قالب تمرين مستقل لكل يوم وحفظه.`);
  }

  function generateCardioText(config: Record<DayKey, CardioConfig> = cardioConfig) {
    const lines: string[] = [];
    for (const day of weekDays) {
      const c = config[day];
      if (!c || c.mode === "NONE") {
        lines.push(`${day} — NO CARDIO`);
        continue;
      }
      const fastedType = c.fastedType || "LISS Walking";
      const postType = c.postType || "Incline Treadmill";
      if (c.mode === "FASTED") {
        lines.push(`${day} — ${fastedType} — ${c.fastedMinutes} دقيقة — Fasted`);
      } else if (c.mode === "POST_WORKOUT") {
        lines.push(`${day} — ${postType} — ${c.postMinutes} دقيقة — Post-Workout`);
      } else {
        lines.push(`${day} — 2× CARDIO`);
        lines.push(`   • Fasted — ${fastedType} — ${c.fastedMinutes} دقيقة`);
        lines.push(`   • Post-Workout — ${postType} — ${c.postMinutes} دقيقة`);
      }
    }
    return lines.join("\n");
  }

  function generateSupplementText() {
    if (!catalogSupplements.length) return "";
    return catalogSupplements.map(s => `• ${s.name_en}${s.dose ? ` — ${s.dose}` : ""}${s.timing ? ` — ${s.timing}` : ""}`).join("\n");
  }

  function generateDietFallback(targets: Record<DayType, MacroTargets>) {
    const lines: string[] = [
      `AUTO DIET — ${selectedPhase}`,
      ...normalScheduleHeaderLines(dayTypes),
      `Current: ${formatNumber(current.weight)} kg | BF ${formatNumber(current.body_fat)}% | Height ${formatNumber(current.height)} cm`,
      "",
    ];
    const types = Array.from(new Set(weekDays.map(d => dayTypes[d])));
    for (const type of types) {
      const t = targets[type];
      lines.push(`━━━━━━━━ ${type} ━━━━━━━━`);
      lines.push(`${t.calories} kcal | P ${t.protein} g | C ${t.carbs} g | F ${t.fat} g`);
      lines.push("");
      lines.push("الوجبات تُولّد من الكتالوج بعد اكتمال تحميل مصادر الطعام.");
      lines.push("");
    }
    return lines.join("\n");
  }

  // V109 — AUTHORITATIVE AUTO GENERATE ACTION
  // The main "توليد تلقائي" button must execute a real generation pipeline.
  // Keep Peak Week independent from the legacy LOW/MEDIUM/HIGH scheduler.
  function generatePlan(
    phaseOverride?: string,
    peakTypeOverride?: PeakWeekType,
    startDateOverride?: string,
    showDateOverride?: string,
    dietSystemOverride?: DietSystem,
    strategyOverride?: DietStrategy,
    carbStructureOverride?: CarbStructure,
  ) {
    const phase = phaseOverride || selectedPhase;
    const activeDietSystem = dietSystemOverride || dietSystem;
    const activeStrategy = strategyOverride ?? dietStrategy;
    const activeStructure = carbStructureOverride ?? carbStructure;
    const base = calculateBaseMacros(activeDietSystem, activeStrategy, activeStructure);
    if (!base) {
      setMsg("لا يمكن التوليد: أدخل الوزن الحالي أولًا.");
      return;
    }

    if (phase === "PEAK WEEK" || activeDietSystem === "PEAK WEEK") {
      const type = peakTypeOverride || peakWeekType;
      const start = startDateOverride ?? peakStartDate;
      const show = showDateOverride ?? peakShowDate;
      const schedule = getPeakWeekDayTypes(type, start, show);
      const order = peakDateOrder(start, show);
      const dailyTargets = calculatePeakDailyTargets(type, start, show);

      setSelectedPhase("PEAK WEEK");
      setDietSystem("PEAK WEEK");
      setPeakWeekType(type);
      setPeakDailyTargets(dailyTargets);
      // Peak Week is day-specific. Keep generatedTargets empty so legacy
      // HIGH/MEDIUM/LOW/ZERO targets can never become the authoritative Peak
      // source through preview/save/apply flows.
      setGeneratedTargets(null);
      setDayTypes(schedule);

      // V140: never reject generation because the live catalog is still loading.
      // generateDietText uses the deterministic built-in fallback until live data arrives.

      try {
        const headers = order.map(day =>
          `${peakDateLabel(day, start, show)} — ${getPeakWeekModes(type, start, show)[day]}`
        );
        const generatedBody = generateDietText({} as Record<DayType, MacroTargets>, schedule, type, start, show, "PEAK WEEK", dailyTargets);
        const diet = normalizeGeneratedDietMacroHeaders([
          "AUTO PLAN — PEAK WEEK",
          ...headers,
          "",
          generatedBody,
        ].join("\n"));
        setPlanDiet(diet);
        setMsg(`تم توليد PEAK WEEK تلقائيًا — ${type} — بالترتيب اليومي الصحيح.`);
      } catch (error: any) {
        console.error("Peak Week generation failed", error);
        const detail = String(error?.message || "خطأ غير معروف");
        setPlanDiet([
          "AUTO PLAN — PEAK WEEK",
          ...order.map(day => `${peakDateLabel(day, start, show)} — ${getPeakWeekModes(type, start, show)[day]}`),
          "",
          `تعذر بناء وجبات Peak Week من الكتالوج: ${detail}`,
          "راجع مصادر Catalog V74 ثم اضغط «توليد تلقائي» مرة أخرى."
        ].join("\n"));
        setMsg(`تعذر توليد وجبات PEAK WEEK: ${detail}`);
      }
      return;
    }

    // Always use the override that triggered this generation. The previous
    // code used the stale React state here, so CUTTING/BULK could change the
    // title while retaining the previous system's weekly meal template.
    const templateSchedule = getNormalTemplateSchedule(activeDietSystem, activeStrategy, activeStructure);
    setDayTypes(templateSchedule);
    const calculated = calculateDayTargets(base, peakWeekType, activeDietSystem, activeStrategy, activeStructure);
    const resolved = finalDayTargets(enforceAllMacroConsistency(calculated));
    setGeneratedTargets(resolved);
    setPeakDailyTargets(null);


    try {
      const diet = normalizeGeneratedDietMacroHeaders([
        `AUTO PLAN — ${activeDietSystem === "BULK" ? "BULK" : activeDietSystem === "CUTTING" ? "CUTTING" : phase}`,
        ...normalScheduleHeaderLines(templateSchedule, activeStructure),
        "",
        generateDietText(resolved, templateSchedule, undefined, undefined, undefined, activeDietSystem),
      ].join("\n"));
      setPlanDiet(diet);
      setMsg(`تم توليد التغذية تلقائيًا لـ ${activeDietSystem === "BULK" ? "BULK" : phase}.`);
    } catch (error: any) {
      console.error("Diet generation failed", error);
      const detail = String(error?.message || "خطأ غير معروف");
      setPlanDiet(generateDietFallback(resolved));
      setMsg(`تم حساب الماكروز، لكن مولد الوجبات رفض المصدر الحالي: ${detail}`);
    }
  }

  function handleGenerateDiet() {
    const base = calculateBaseMacros(dietSystem, dietStrategy, carbStructure);
    if (!base) {
      setMsg("لا يمكن توليد التغذية: أدخل الوزن الحالي أولًا.");
      return;
    }

    if (dietSystem === "PEAK WEEK") {
      // Peak preview must use the selected strategy/date sequence directly.
      // Never route Peak through the legacy LOW/MEDIUM/HIGH generator.
      generatePlan("PEAK WEEK", peakWeekType, peakStartDate, peakShowDate);
      return;
    }

    const activeStrategy = dietStrategy;
    const activeStructure = carbStructure;
    const templateSchedule = getNormalTemplateSchedule(dietSystem, activeStrategy, activeStructure);
    setDayTypes(templateSchedule);
    const calculatedTargets = calculateDayTargets(base, peakWeekType, dietSystem, activeStrategy, activeStructure);
    const autoTargets = enforceAllMacroConsistency(calculatedTargets);
    const consistentTargets = finalDayTargets(autoTargets);
    setGeneratedTargets(consistentTargets);

    // V176 — NEVER BLOCK MEAL GENERATION ON SUPABASE CATALOG STATE.
    // generateDietText() merges the live catalog with the deterministic
    // BUILTIN_GENERATION_FOODS fallback, so an empty/failed food query must not
    // downgrade the result to a macro-only placeholder.
    let diet = "";
    try {
      diet = [
        `AUTO PLAN — ${selectedPhase}`,
        ...normalScheduleHeaderLines(templateSchedule, activeStructure),
        "",
        generateDietText(consistentTargets, templateSchedule),
      ].join("\n");
    } catch (error) {
      console.error("Nutrition generation failed", error);
      // A true generation error should still be visible to the coach, but do
      // not hide it behind the old "catalog not loaded" placeholder.
      diet = [
        `AUTO PLAN — ${selectedPhase}`,
        ...normalScheduleHeaderLines(templateSchedule),
        "",
        "تعذر توليد الوجبات تلقائيًا: " + (error instanceof Error ? error.message : String(error)),
      ].join("\n");
      setMsg("تعذر توليد الوجبات تلقائيًا — راجع مصدر الخطأ في المعاينة.");
    }

    setPlanDiet(normalizeGeneratedDietMacroHeaders(diet));
    setMsg(`تم توليد التغذية بنجاح لـ ${selectedPhase}.`);
  }

  function changeDayType(day: DayKey, type: DayType) {
    const nextDayTypes = { ...dayTypes, [day]: type };
    setDayTypes(nextDayTypes);
    setDayTypesCustomized(true);

    // Changing the weekly schedule must immediately update the generated
    // diet preview and the printable plan. Do not throw away generated
    // macro targets: HIGH/LOW/MEDIUM/ZERO targets are already calculated.
    if (generatedTargets) {
      const refreshedDiet = [
        `AUTO PLAN — ${selectedPhase}`,
        ...weekDays.map(d => `${d} — ${nextDayTypes[d]}`),
        "",
        generateDietText(generatedTargets, nextDayTypes),
      ].join("\n");
      setPlanDiet(normalizeGeneratedDietMacroHeaders(refreshedDiet));

      setPlanCardio(generateCardioText());
    }
  }

  function openPlanEditor() {
    if (!playerId) {
      setMsg("اختر لاعبًا أولًا قبل تعديل الخطة.");
      return;
    }
    setPlanDiet(stripSupplementsFromPlanText(plan?.diet_system ?? ""));
    setPlanTraining(plan?.training_program ?? "");
    setPlanCardio(plan?.cardio_plan ?? "");
    setPlanSupplements("");
    setPlanNotes(plan?.notes ?? "");
    setPeakWeekType((plan?.peak_week_type as PeakWeekType) || "LINEAR LOAD");
    try {
      const saved = typeof plan?.day_macro_overrides === "string" ? JSON.parse(plan.day_macro_overrides as any) : (plan?.day_macro_overrides || {});
      if (saved?.diet_strategy) setDietStrategy(String(saved.diet_strategy) as DietStrategy);
      if (saved?.carb_structure) setCarbStructure(String(saved.carb_structure) as CarbStructure);
      if (saved?.activity_level) setActivityLevel(String(saved.activity_level));
    } catch {}
    setPeakStartDate(plan?.peak_start_date || "");
    setPeakShowDate(plan?.peak_show_date || "");
    setGeneratedTargets(null);
    setPeakDailyTargets(null);
    setShowPlanForm(true);
    // Do not auto-generate on editor open. The previous delayed generation
    // raced React state updates and could regenerate a Peak plan before the
    // editor was ready, causing stale targets and editor crashes.
    if (!plan?.diet_system) setMsg("تم فتح محرر الخطة. اضغط «توليد تلقائي» عند الحاجة.");
  }

  async function runSupabaseWithTimeout<T>(query: any, timeoutMs = 15000): Promise<{ data: T | null; error: any | null }> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await query.abortSignal(controller.signal);
    } catch (error: any) {
      if (controller.signal.aborted) {
        return { data: null, error: { message: "انتهت مهلة الاتصال بقاعدة البيانات بعد 15 ثانية. تأكد من اتصال Supabase ثم حاول الحفظ مرة أخرى." } };
      }
      return { data: null, error };
    } finally {
      window.clearTimeout(timer);
    }
  }

  const LOCAL_PLAN_PREFIX = "ifbb-coach:plan:";

  function localPlanKey(playerIdValue: string, phaseValue: string) {
    return `${LOCAL_PLAN_PREFIX}${String(playerIdValue)}:${String(phaseValue).trim().toUpperCase()}`;
  }

  function persistLocalPlan(snapshot: any) {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(localPlanKey(String(snapshot.player_id), String(snapshot.phase)), JSON.stringify({
        ...snapshot,
        _local_saved_at: new Date().toISOString(),
      }));
    } catch (storageError) {
      console.warn("Local plan backup failed", storageError);
    }
  }

  function readLocalPlan(playerIdValue: string, phaseValue: string) {
    try {
      if (typeof window === "undefined") return null;
      const raw = window.localStorage.getItem(localPlanKey(String(playerIdValue), String(phaseValue)));
      return raw ? JSON.parse(raw) : null;
    } catch (storageError) {
      console.warn("Local plan restore failed", storageError);
      return null;
    }
  }

  async function savePlan(e: FormEvent) {
    e.preventDefault();
    if (savingPlan) return;
    setSavingPlan(true);
    setMsg("");

    let normalizedDiet = planDiet.trim();
    let normalizedTraining = planTraining.trim();
    let normalizedCardio = planCardio.trim();
    const normalizedSupplements = "";
    const normalizedNotes = planNotes.trim();

    // PEAK WEEK has a generated preview that can be visible through the
    // textarea fallback even when React's planDiet state is still empty.
    // Saving must use the same authoritative generator instead of rejecting
    // the plan with "أدخل بيانات الخطة أولًا".
    if (dietSystem === "PEAK WEEK") {
      const peakDaily = calculatePeakDailyTargets(peakWeekType, peakStartDate, peakShowDate);
      setPeakDailyTargets(peakDaily);
      if (!normalizedDiet) {
        const effectiveSchedule = getPeakWeekDayTypes(peakWeekType, peakStartDate, peakShowDate);
        const outputOrder = peakDateOrder(peakStartDate, peakShowDate);
        const headers = outputOrder.map(day =>
          `${peakDateLabel(day, peakStartDate, peakShowDate)} — ${getPeakWeekModes(peakWeekType, peakStartDate, peakShowDate)[day]}`
        );
        normalizedDiet = normalizeGeneratedDietMacroHeaders([
          `AUTO PLAN — PEAK WEEK`,
          ...headers,
          "",
          generateDietText({} as Record<DayType, MacroTargets>, effectiveSchedule, peakWeekType, peakStartDate, peakShowDate, "PEAK WEEK", peakDaily),
        ].join("\n"));
        setPlanDiet(normalizedDiet);
      }
      if (!normalizedTraining && selectedTrainingSplit) {
        normalizedTraining = generateTrainingText();
        setPlanTraining(normalizedTraining);
      }
      if (!normalizedCardio) {
        normalizedCardio = generateCardioText();
        setPlanCardio(normalizedCardio);
      }
    }

    // Never create an empty phase or an empty history snapshot.
    // A player may have a completely different plan in every phase, but a
    // phase must contain at least one real plan field before it can be saved.
    if (!normalizedDiet && !normalizedTraining && !normalizedCardio && !normalizedNotes) {
      setMsg(`لا يمكن حفظ ${selectedPhase}: أدخل بيانات الخطة أولًا.`);
      setSavingPlan(false);
      return;
    }

    const payload = {
      p_player_id: playerId, p_phase:selectedPhase, p_diet_system:normalizedDiet||null, p_training_program:normalizedTraining||null,
      p_cardio_plan:normalizedCardio||null, p_supplements:null, p_notes:normalizedNotes||null,
      p_diet_system_type:dietSystem, p_macro_mode:macroMode, p_calorie_adjustment:Number(calorieAdjustment)||0,
      p_auto_calories:calculateBaseMacros()?.autoCalories ?? null,
      p_target_calories:dietSystem === "PEAK WEEK" && peakDailyTargets
        ? Math.round(Object.values(peakDailyTargets as Record<string, MacroTargets>).reduce((sum: number, x: MacroTargets) => sum + x.calories, 0) / Math.max(1, Object.keys(peakDailyTargets).length))
        : (generatedTargets ? generatedTargets.MEDIUM.calories : null), p_peak_week_type:dietSystem === "PEAK WEEK" ? peakWeekType : null,
      p_day_macro_overrides: { modes: dayMacroModes, overrides: dayMacroOverrides, weekly_day_types: dayTypesCustomized ? dayTypes : null, training_templates: trainingDayTemplates, training_status: trainingDayStatus, training_split_id: selectedTrainingSplit, activity_level: activityLevel, diet_strategy: dietStrategy, carb_structure: carbStructure, phase_duration: phaseDurationMeta(), peak_week_type: dietSystem === "PEAK WEEK" ? peakWeekType : null, peak_start_date: dietSystem === "PEAK WEEK" ? peakStartDate || null : null, peak_show_date: dietSystem === "PEAK WEEK" ? peakShowDate || null : null, peak_schedule: dietSystem === "PEAK WEEK" ? getPeakWeekModes(peakWeekType, peakStartDate, peakShowDate) : null }
    };

    // V154 SAFETY: persist the exact editor state locally BEFORE any network
    // request. On iPhone/Safari this guarantees that pressing Save never
    // loses the edited plan because of a slow/offline Supabase request.
    // The database write continues below and remains the authoritative sync.
    const localSnapshot = {
      player_id: playerId,
      phase: selectedPhase.trim().toUpperCase(),
      diet_system: payload.p_diet_system,
      training_program: payload.p_training_program,
      cardio_plan: payload.p_cardio_plan,
      supplements: null,
      notes: payload.p_notes,
      diet_system_type: payload.p_diet_system_type,
      macro_mode: payload.p_macro_mode,
      calorie_adjustment: payload.p_calorie_adjustment,
      auto_calories: payload.p_auto_calories,
      target_calories: payload.p_target_calories,
      peak_week_type: payload.p_peak_week_type,
      day_macro_overrides: payload.p_day_macro_overrides,
    };
    persistLocalPlan(localSnapshot);
    setPlan(localSnapshot);
    // V170 SAVE GUARD: do NOT close the editor or release the saving lock
    // before the database sync finishes. This was the main iPhone/Safari UX
    // failure: the editor disappeared while the network write was still running.
    setMsg(`تم حفظ ${selectedPhase} محليًا فورًا — جاري مزامنة الخطة مع قاعدة البيانات...`);

    // Primary path: secure RPC.
    let rpcResult = await runSupabaseWithTimeout<any>(supabase.rpc("save_player_plan", payload));
    let error = rpcResult.error;

    // Fallback for deployments where the RPC is temporarily missing from
    // PostgREST's schema cache: write directly to player_plans. The V24 SQL
    // creates a unique (player_id, phase) index, so this is safe as an upsert.
    if (error) {
      // Direct fallback: update the selected phase first, then insert if it
      // does not exist. This avoids depending on a specific ON CONFLICT
      // signature while keeping the V24/V82 phase model intact.
      const phaseKey = selectedPhase.trim().toUpperCase();
      const row = {
        player_id: playerId,
        phase: phaseKey,
        diet_system: payload.p_diet_system,
        training_program: payload.p_training_program,
        cardio_plan: payload.p_cardio_plan,
        supplements: null,
        notes: payload.p_notes,
        diet_system_type: payload.p_diet_system_type,
        macro_mode: payload.p_macro_mode,
        calorie_adjustment: payload.p_calorie_adjustment,
        auto_calories: payload.p_auto_calories,
        target_calories: payload.p_target_calories,
        peak_week_type: payload.p_peak_week_type,
        // Peak dates are stored in the existing JSONB field for compatibility
        // with deployments that have not run the V97 schema migration.
        day_macro_overrides: payload.p_day_macro_overrides || {},
        updated_at: new Date().toISOString(),
      };

      const existing = await runSupabaseWithTimeout<any>(supabase
        .from("player_plans")
        .select("id")
        .eq("player_id", playerId)
        .eq("phase", phaseKey)
        .maybeSingle());

      if (existing.error) {
        error = existing.error;
      } else if (existing.data?.id) {
        const directUpdate = await runSupabaseWithTimeout<any>(supabase
          .from("player_plans")
          .update(row)
          .eq("id", existing.data.id));
        error = directUpdate.error;
      } else {
        const directInsert = await runSupabaseWithTimeout<any>(supabase
          .from("player_plans")
          .insert(row));
        error = directInsert.error;
      }
    }

    if (error) {
      setMsg(`الخطة محفوظة على الجهاز بالفعل، لكن تعذرت المزامنة مع قاعدة البيانات: ${error.message}`);
      setSavingPlan(false);
      return;
    }

    // V91 persistence + rendering guard: keep saved day/template assignments usable even when a split has no native rows for a selected weekday.\n    // V90 persistence guard: some deployments have an older save_player_plan
    // RPC that accepts p_day_macro_overrides but does not persist newer nested
    // training_templates data. Always persist the authoritative assignment
    // directly after a successful save so TRAINING -> template survives reload.
    const phaseKeyForTemplate = selectedPhase.trim().toUpperCase();
    const templatePersist = await runSupabaseWithTimeout<any>(supabase
      .from("player_plans")
      .update({
        day_macro_overrides: payload.p_day_macro_overrides || {},
        updated_at: new Date().toISOString(),
      })
      .eq("player_id", playerId)
      .eq("phase", phaseKeyForTemplate));

    if (templatePersist.error) {
      setMsg(`الخطة محفوظة على الجهاز وبقاعدة البيانات، لكن تعذر تثبيت قوالب التمرين: ${templatePersist.error.message}`);
      setSavingPlan(false);
      return;
    }

    setMsg(`تم حفظ ${selectedPhase} للاعب ${selectedPlayerName || playerName} بنجاح.`);
    setSavingPlan(false);
    setShowPlanForm(false);
    // Refresh in the background. The Save button must not remain disabled
    // while dashboard/history queries are loading.
    void load(playerId).catch((refreshError: any) => {
      console.error("Post-save refresh failed", refreshError);
      setMsg("تم الحفظ بنجاح، لكن تعذر تحديث المعاينة تلقائيًا. أعد فتح الخطة للتأكد من البيانات المحفوظة.");
    });
  }

  function choosePlayer(p: PlayerOption) {
    const id = String(p.id || "").trim();
    if (!id) {
      setMsg("تعذر اختيار اللاعب: المعرّف غير موجود.");
      return;
    }
    setPlayerId(id);
    setSelectedPlayerName(p.name);
    setPlayers([]);
    setPlayerSearch("");
    setShowPlayerPicker(false);
    setActivePage("player");
    setData(null);
    setMeasurements([]);
    // Clear the previous player's plan immediately so it can never appear
    // under the newly selected player while the new data is loading.
    setPlan(null);
    setPlanHistory([]);
    setShowPlanForm(false);
    setPlanDiet("");
    setPlanTraining("");
    setPlanCardio("");
    setPlanSupplements("");
    setPlanNotes("");
    setMsg(`تم اختيار اللاعب: ${p.name} — جاري تحميل خطته...`);
    setTimeout(() => load(id), 0);
  }

  async function changePhase(nextPhase: string) {
    const normalizedPhase = nextPhase.trim().toUpperCase();
    setSelectedPhase(normalizedPhase);
    setPlan(null);
    setPlanDiet("");
    setPlanTraining("");
    setPlanCardio("");
    setPlanSupplements("");
    setPlanNotes("");
    if (playerId) {
      await load(playerId, normalizedPhase);
    }
  }

  async function load(selectedId = playerId, phase = selectedPhase) {
    setLoading(true);
    setMsg("");

    const [dashboardResult, historyResult, bodyHistoryResult, planResult, planHistoryResult] = await Promise.all([
      supabase.rpc("get_player_dashboard", { p_player_id: selectedId }),
      supabase.rpc("get_player_measurement_history", { p_player_id: selectedId }),
      supabase.rpc("get_body_measurement_history_v27", { p_player_id: selectedId }),
      supabase.rpc("get_player_plan", { p_player_id: selectedId, p_phase: phase }),
      supabase.rpc("get_player_plan_history", { p_player_id: selectedId }),
    ]);

    if (dashboardResult.error) {
      setMsg(dashboardResult.error.message);
      setData(null);
    } else {
      setData(dashboardResult.data);
      const loadedPlayerName =
        pick(dashboardResult.data?.player, "name", "اسم اللاعب", "player_name") ??
        pick(dashboardResult.data?.current, "name", "اسم اللاعب", "player_name");
      if (loadedPlayerName) setSelectedPlayerName(String(loadedPlayerName));
    }

    const legacyHistory = !historyResult.error && Array.isArray(historyResult.data)
      ? historyResult.data.map((m: any) => ({ ...m }))
      : [];

    const bodyHistory = !bodyHistoryResult.error && Array.isArray(bodyHistoryResult.data)
      ? bodyHistoryResult.data.map((m: any) => ({
          ...m,
          body_fat: m.body_fat ?? m.bodyfat ?? null,
          measured_at: m.measured_at ?? m.recorded_at ?? m.created_at ?? null,
        }))
      : [];

    // V27 rows carry waist/thigh/arm. Keep legacy history intact and merge
    // the two timelines without deleting any existing measurements.
    const mergedHistory = [...bodyHistory, ...legacyHistory].sort((a: any, b: any) =>
      new Date(b.measured_at ?? b.recorded_at ?? b.created_at ?? 0).getTime() -
      new Date(a.measured_at ?? a.recorded_at ?? a.created_at ?? 0).getTime()
    );
    setMeasurements(mergedHistory);

    // Load the selected phase through the secure RPC first.
    // If the RPC is absent/stale in PostgREST schema cache, fall back to the
    // table directly. This also makes phase selection resilient across V21/V24.
    let loadedPlan: any = null;
    let planError: any = planResult.error ?? null;

    if (!planResult.error) {
      loadedPlan = Array.isArray(planResult.data)
        ? planResult.data[0] ?? null
        : planResult.data ?? null;
    }

    if (!loadedPlan) {
      const directPlan = await supabase
        .from("player_plans")
        .select("*")
        .eq("player_id", selectedId)
        .eq("phase", String(phase).trim().toUpperCase())
        .maybeSingle();

      if (!directPlan.error) {
        loadedPlan = directPlan.data ?? null;
        planError = null;
      } else if (!planError) {
        planError = directPlan.error;
      }
    }

    // Treat an existing database row with no actual plan content as
    // "no plan". This prevents old test/empty rows from appearing as a
    // valid phase and keeps the UI honest without deleting historical data.
    const hasPlanContent = !!loadedPlan && [
      loadedPlan.diet_system,
      loadedPlan.training_program,
      loadedPlan.cardio_plan,
      loadedPlan.supplements,
      loadedPlan.notes,
    ].some((value) => String(value ?? '').trim() !== '');

    if (!hasPlanContent) {
      loadedPlan = null;
      const localPlan = readLocalPlan(String(selectedId), String(phase));
      if (localPlan && [localPlan.diet_system, localPlan.training_program, localPlan.cardio_plan, localPlan.notes].some((value) => String(value ?? '').trim() !== '')) {
        loadedPlan = localPlan;
        if (planError) {
          setMsg(`تم استرجاع آخر نسخة محفوظة على الجهاز لـ ${String(phase).trim().toUpperCase()} — ستتم مزامنتها مع قاعدة البيانات عند نجاح الاتصال.`);
        }
      }
    }
    if (loadedPlan?.diet_system) {
      const parsed = { ...dayTypes };
      const text = String(loadedPlan.diet_system);
      for (const day of weekDays) {
        const match = text.match(new RegExp(`${day}\\s*[—-]\\s*(HIGH|MEDIUM|LOW|ZERO)`, "i"));
        if (match) parsed[day] = match[1].toUpperCase() as DayType;
      }
      setDayTypes(parsed);
      setDayTypesCustomized(true);
    }
    setPlan(loadedPlan);
    if (loadedPlan?.phase) setSelectedPhase(String(loadedPlan.phase));
    if (loadedPlan?.diet_system_type) setDietSystem(String(loadedPlan.diet_system_type).toUpperCase() as DietSystem);
    if (loadedPlan?.peak_week_type) setPeakWeekType(String(loadedPlan.peak_week_type) as PeakWeekType);
    if (loadedPlan?.peak_start_date) setPeakStartDate(String(loadedPlan.peak_start_date));
    if (loadedPlan?.peak_show_date) setPeakShowDate(String(loadedPlan.peak_show_date));
    if (loadedPlan?.day_macro_overrides) {
      try {
        const saved = typeof loadedPlan.day_macro_overrides === "string" ? JSON.parse(loadedPlan.day_macro_overrides) : loadedPlan.day_macro_overrides;
        if (saved?.diet_strategy) setDietStrategy(String(saved.diet_strategy) as DietStrategy);
        if (saved?.carb_structure) setCarbStructure(String(saved.carb_structure) as CarbStructure);
        if (saved?.activity_level) setActivityLevel(String(saved.activity_level));
        if (saved?.peak_week_type) setPeakWeekType(String(saved.peak_week_type) as PeakWeekType);
        if (saved?.peak_start_date) setPeakStartDate(String(saved.peak_start_date));
        if (saved?.peak_show_date) setPeakShowDate(String(saved.peak_show_date));
        if (saved?.weekly_day_types) {
          const weekly = saved.weekly_day_types;
          setDayTypes({
            السبت: weekly.السبت || dayTypes.السبت, الأحد: weekly.الأحد || dayTypes.الأحد,
            الإثنين: weekly.الإثنين || dayTypes.الإثنين, الثلاثاء: weekly.الثلاثاء || dayTypes.الثلاثاء,
            الأربعاء: weekly.الأربعاء || dayTypes.الأربعاء, الخميس: weekly.الخميس || dayTypes.الخميس,
            الجمعة: weekly.الجمعة || dayTypes.الجمعة,
          });
          setDayTypesCustomized(true);
        }
        if (saved?.overrides) setDayMacroOverrides({ HIGH: saved.overrides.HIGH || {}, MEDIUM: saved.overrides.MEDIUM || {}, LOW: saved.overrides.LOW || {}, ZERO: saved.overrides.ZERO || {} });
        if (saved?.modes) setDayMacroModes({ HIGH: saved.modes.HIGH || "AUTO", MEDIUM: saved.modes.MEDIUM || "AUTO", LOW: saved.modes.LOW || "AUTO", ZERO: saved.modes.ZERO || "AUTO" });
        if (saved?.training_templates) setTrainingDayTemplates({
          السبت: saved.training_templates.السبت || "السبت", الأحد: saved.training_templates.الأحد || "الأحد",
          الإثنين: saved.training_templates.الإثنين || "الإثنين", الثلاثاء: saved.training_templates.الثلاثاء || "الثلاثاء",
          الأربعاء: saved.training_templates.الأربعاء || "الأربعاء", الخميس: saved.training_templates.الخميس || "الخميس",
          الجمعة: saved.training_templates.الجمعة || "الجمعة",
        });
        if (saved?.training_status) setTrainingDayStatus({
          السبت: saved.training_status.السبت === "REST" ? "REST" : "TRAINING",
          الأحد: saved.training_status.الأحد === "REST" ? "REST" : "TRAINING",
          الإثنين: saved.training_status.الإثنين === "REST" ? "REST" : "TRAINING",
          الثلاثاء: saved.training_status.الثلاثاء === "REST" ? "REST" : "TRAINING",
          الأربعاء: saved.training_status.الأربعاء === "REST" ? "REST" : "TRAINING",
          الخميس: saved.training_status.الخميس === "REST" ? "REST" : "TRAINING",
          الجمعة: saved.training_status.الجمعة === "REST" ? "REST" : "TRAINING",
        });
        if (saved?.training_split_id !== undefined && saved?.training_split_id !== null && saved.training_split_id !== "") {
          setSelectedTrainingSplit(Number(saved.training_split_id));
        }
        restorePhaseDuration(saved);
      } catch { /* ignore malformed legacy override data */ }
    } else {
      setDayMacroOverrides({ HIGH: {}, MEDIUM: {}, LOW: {}, ZERO: {} });
      setDayMacroModes({ HIGH: "AUTO", MEDIUM: "AUTO", LOW: "AUTO", ZERO: "AUTO" });
      setTrainingDayTemplates({ السبت:"السبت", الأحد:"الأحد", الإثنين:"الإثنين", الثلاثاء:"الثلاثاء", الأربعاء:"الأربعاء", الخميس:"الخميس", الجمعة:"الجمعة" });
      clearPhaseDuration();
    }

    if (planError && !loadedPlan) {
      setMsg((old) =>
        old
          ? `${old} | تعذر تحميل ${phase}: ${planError.message}`
          : `تعذر تحميل ${phase}: ${planError.message}`
      );
    }

    if (!planHistoryResult.error) {
      const history = Array.isArray(planHistoryResult.data) ? planHistoryResult.data : [];
      // Hide legacy empty test snapshots; real saved versions remain intact.
      setPlanHistory(history.filter((h: any) => [
        h.diet_system, h.training_program, h.cardio_plan, h.supplements, h.notes,
      ].some((value) => String(value ?? '').trim() !== '')));
    } else {
      setPlanHistory([]);
    }

    if (!dashboardResult.error && !historyResult.error && !planResult.error && !planHistoryResult.error) {
      setMsg("تم الاتصال بقاعدة البيانات وتحميل البيانات بنجاح");
    }

    setLoading(false);
  }

  async function addUpdate(e: FormEvent) {
    e.preventDefault();
    setMsg("");

    const fallbackWeight = Number.isFinite(Number(current.weight)) ? Number(current.weight) : null;
    const fallbackBodyFat = Number.isFinite(Number(current.body_fat)) ? Number(current.body_fat) : null;
    const fallbackHeight = Number.isFinite(Number(current.height)) ? Number(current.height) : null;
    const fallbackWaist = Number.isFinite(Number(current.waist)) ? Number(current.waist) : null;
    const fallbackThigh = Number.isFinite(Number(current.thigh)) ? Number(current.thigh) : null;
    const fallbackArm = Number.isFinite(Number(current.arm)) ? Number(current.arm) : null;

    const w = numberOrNull(weight) ?? fallbackWeight;
    const bf = numberOrNull(bodyFat) ?? fallbackBodyFat;
    const h = numberOrNull(height) ?? fallbackHeight;
    const wa = numberOrNull(waist) ?? fallbackWaist;
    const th = numberOrNull(thigh) ?? fallbackThigh;
    const ar = numberOrNull(arm) ?? fallbackArm;

    if (w === null && bf === null && h === null && wa === null && th === null && ar === null && !notes.trim()) {
      setMsg("اكتب قيمة واحدة على الأقل قبل حفظ التحديث.");
      return;
    }

    if (w !== null && (w <= 0 || w > 500)) { setMsg("الوزن غير صحيح."); return; }
    if (bf !== null && (bf < 0 || bf > 100)) { setMsg("نسبة الدهون يجب أن تكون بين 0 و100."); return; }
    if (h !== null && (h <= 0 || h > 300)) { setMsg("الطول غير صحيح."); return; }
    if (wa !== null && (wa <= 0 || wa > 250)) { setMsg("مقاس الخصر غير صحيح."); return; }
    if (th !== null && (th <= 0 || th > 150)) { setMsg("مقاس الفخذ غير صحيح."); return; }
    if (ar !== null && (ar <= 0 || ar > 100)) { setMsg("مقاس الذراع غير صحيح."); return; }

    setSaving(true);

    const { data: inserted, error } = await supabase.rpc("add_body_measurement_v27", {
      p_player_id: playerId,
      p_weight: w,
      p_body_fat: bf,
      p_height: h,
      p_waist: wa,
      p_thigh: th,
      p_arm: ar,
      p_notes: notes.trim() || null,
    });

    if (error) {
      setMsg(`فشل حفظ التحديث: ${error.message}`);
      setSaving(false);
      return;
    }

    const newMeasurement = inserted as Measurement;
    setMeasurements((old) => [newMeasurement, ...old]);
    setMsg("تم حفظ التحديث بنجاح — كل القياسات القديمة محفوظة.");
    setWeight("");
    setBodyFat("");
    setHeight("");
    setWaist("");
    setThigh("");
    setArm("");
    setNotes("");
    setShowForm(false);

    await load();
    setSaving(false);
  }

  const player = data?.player ?? {};
  const dashboardCurrent = data?.current ?? {};
  const playerData = { ...player, ...dashboardCurrent };

  // The existing RPC returns Arabic keys, while the update-history RPC returns English keys.
  // Support both formats so the original player data never disappears from the UI.
  const playerName =
    pick(player, "name", "اسم اللاعب", "player_name") ??
    pick(dashboardCurrent, "name", "اسم اللاعب", "player_name") ??
    selectedPlayerName ??
    "لاعب";
  const playerAge = pick(playerData, "age", "العمر", "p_age");
  const playerGoalRaw = pick(playerData, "goal", "الهدف", "goal_type", "diet_goal") ?? dietSystem;
  const playerGoal = (() => {
    const g = String(playerGoalRaw || "").toUpperCase();
    if (g.includes("BULK")) return "BULKING";
    if (g.includes("CUT")) return "CUTTING";
    if (g.includes("PEAK")) return "CUTTING";
    return String(playerGoalRaw || "—");
  })();
  const baseWeight = pick(dashboardCurrent, "weight", "الوزن الحالي", "current_weight");
  const baseBodyFat = pick(dashboardCurrent, "body_fat", "الدهون الحالية", "current_body_fat");
  const baseHeight = pick(dashboardCurrent, "height", "الطول الحالي", "current_height");
  const baseRecordedAt = pick(
    dashboardCurrent,
    "recorded_at",
    "تاريخ القياس الحالي",
    "measured_at",
    "تاريخ القياس"
  );

  const latest = measurements[0];

  // Measurements are stored in two timelines (legacy + V27). A newer legacy
  // row can exist without waist/thigh/arm, so do NOT read these three fields
  // only from measurements[0]. Find the newest non-empty value for each one,
  // then fall back to the player's current columns.
  const latestValue = (key: keyof Measurement) => {
    const row = measurements.find((m) => m?.[key] !== null && m?.[key] !== undefined && m?.[key] !== "");
    return row?.[key] ?? null;
  };

  const current = {
    weight: latest?.weight ?? baseWeight,
    body_fat: latest?.body_fat ?? baseBodyFat,
    height: latest?.height ?? baseHeight,
    waist:
      latestValue("waist") ??
      pick(dashboardCurrent, "waist", "waist_cm", "الخصر") ??
      pick(playerData, "waist", "waist_cm", "الخصر"),
    thigh:
      latestValue("thigh") ??
      pick(dashboardCurrent, "thigh", "thigh_cm", "الفخذ") ??
      pick(playerData, "thigh", "thigh_cm", "الفخذ"),
    arm:
      latestValue("arm") ??
      pick(dashboardCurrent, "arm", "arm_cm", "الذراع") ??
      pick(playerData, "arm", "arm_cm", "الذراع"),
    recorded_at: latest?.measured_at ?? baseRecordedAt,
  };

  // If there is only one saved update, compare it against the original dashboard measurement.
  const previous: Measurement | null = measurements[1] ?? (
    latest && (baseWeight !== null || baseBodyFat !== null || baseHeight !== null)
      ? {
          weight: baseWeight,
          body_fat: baseBodyFat,
          height: baseHeight,
          measured_at: baseRecordedAt,
        }
      : null
  );

  const change = useMemo(() => {
    if (!latest || !previous) return null;

    const diff = (a?: number | null, b?: number | null) =>
      a !== null &&
      a !== undefined &&
      b !== null &&
      b !== undefined
        ? roundNumber(Number(a) - Number(b), 2)
        : null;

    return {
      weight: diff(latest.weight, previous.weight),
      body_fat: diff(latest.body_fat, previous.body_fat),
      height: diff(latest.height, previous.height),
      waist: diff(latest.waist, previous.waist),
      thigh: diff(latest.thigh, previous.thigh),
      arm: diff(latest.arm, previous.arm),
    };
  }, [latest, previous]);

  return (
    <main className="wrap" dir="rtl">
      <section className={`card coachDashboard ${activePage !== "dashboard" ? "dashboardHidden" : ""}`}>
        <div className="dashboardHero">
          <div>
            <div className="dashboardEyebrow">IFBB COACH APP · COACH DASHBOARD</div>
            <h1>Welcome back, Coach Mohamed Kamal</h1>
            <p>إدارة اللاعبين، القياسات، الخطط الغذائية والتمرين من مكان واحد.</p>
          </div>
          <div className="dashboardHeroActions">
            <button className="btn" type="button" onClick={() => setShowAddPlayer(true)}>＋ لاعب جديد</button>
            <button className="btn secondary" type="button" onClick={() => { setActivePage("clients"); setPlayerSearch(""); void loadPlayersList(); }}>⌕ بحث اللاعبين</button>
          </div>
        </div>

        <div className="dashboardStats">
          <div className="dashboardStat"><span>إجمالي اللاعبين</span><strong>{dashboardLoading ? "…" : dashboardPlayers.length}</strong><small>Total Clients</small></div>
          <div className="dashboardStat"><span>اللاعبون النشطون</span><strong>{dashboardLoading ? "…" : dashboardPlayers.length}</strong><small>Active Clients</small></div>
          <div className="dashboardStat"><span>آخر التحديثات</span><strong>{measurements.length}</strong><small>Recent Visits</small></div>
          <div className="dashboardStat"><span>تحديثات الشهر</span><strong>{measurements.filter(m => { const d = new Date(m.measured_at ?? m.recorded_at ?? ""); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length}</strong><small>This Month</small></div>
        </div>

        <div className="dashboardQuick">
          <div className="dashboardSectionTitle">Quick Actions</div>
          <div className="quickActionGrid">
            <button className="quickAction" type="button" onClick={() => setShowAddPlayer(true)}><b>＋</b><span><strong>New Client</strong><small>إضافة لاعب جديد</small></span></button>
            <button className="quickAction" type="button" onClick={() => { setActivePage("clients"); setPlayerSearch(""); void loadPlayersList(); }}><b>♙</b><span><strong>Clients</strong><small>عرض اللاعبين</small></span></button>
            <button className="quickAction" type="button" onClick={() => { setActivePage("updates"); setShowForm(true); }}><b>⌕</b><span><strong>New Update</strong><small>إضافة قياس جديد</small></span></button>
            <button className="quickAction" type="button" onClick={() => { setActivePage("plans"); openPlanEditor(); }}><b>▣</b><span><strong>Nutrition Plan</strong><small>فتح مولد الخطة</small></span></button>
          </div>
        </div>

        <div className="dashboardColumns">
          <div className="dashboardPanel">
            <div className="dashboardPanelHead"><strong>Recent Clients</strong><span>{dashboardPlayers.length} لاعب</span></div>
            <div className="dashboardList">
              {(dashboardPlayers.length ? dashboardPlayers.slice(0, 6) : [{id: String(playerId), name: playerName}]).map(p => (
                <button className="dashboardClient" key={p.id} type="button" onClick={() => choosePlayer(p)}>
                  <span className="clientAvatar">{p.name.trim().charAt(0) || "P"}</span><span><strong>{p.name}</strong><small>Active Client</small></span><b>›</b>
                </button>
              ))}
            </div>
          </div>
          <div className="dashboardPanel">
            <div className="dashboardPanelHead"><strong>Recent Visits</strong><span>Current Player</span></div>
            <div className="dashboardList">
              {measurements.slice(0, 5).map((m, i) => (
                <div className="dashboardVisit" key={m.id ?? `${m.measured_at}-${i}`}>
                  <span className="visitPulse">•</span><span><strong>تحديث قياسات</strong><small>{formatDate(m.measured_at)}</small></span><b>{formatNumber(m.weight)} kg</b>
                </div>
              ))}
              {!measurements.length && <div className="empty">لا توجد زيارات/تحديثات محفوظة للاعب الحالي.</div>}
            </div>
          </div>
        </div>
      </section>

      <nav className="appNav" aria-label="التنقل الرئيسي">
        <button className={activePage === "dashboard" ? "active" : ""} type="button" onClick={() => setActivePage("dashboard")}>🏠 الرئيسية</button>
        <button className={activePage === "clients" ? "active" : ""} type="button" onClick={() => { setActivePage("clients"); setPlayerSearch(""); void loadPlayersList(); }}>👥 اللاعبين</button>
        <button className={activePage === "player" ? "active" : ""} type="button" onClick={() => setActivePage("player")}>👤 اللاعب</button>
        <button className={activePage === "updates" ? "active" : ""} type="button" onClick={() => setActivePage("updates")}>📏 التحديثات</button>
        <button className={activePage === "plans" ? "active" : ""} type="button" onClick={() => setActivePage("plans")}>📋 الخطط</button>
        <button className="printNavBtn" type="button" onClick={() => { setActivePage("plans"); openPrintPreview(); }}>🖨️ PDF / طباعة</button>
      </nav>

      {activePage === "clients" && (
        <section className="card pageCard">
          <div className="sectionHead">
            <div><h2>اللاعبين</h2><div className="muted">ابحث عن اللاعب واختره لفتح صفحته.</div></div>
            <button className="btn" type="button" onClick={() => setShowAddPlayer(true)}>＋ لاعب جديد</button>
          </div>
          <div className="clientSearchRow">
            <input className="input" autoFocus value={playerSearch} onChange={e => void searchPlayers(e.currentTarget.value)} placeholder="اكتب اسم اللاعب..." />
            <button className="btn secondary" type="button" onClick={() => { setPlayerSearch(""); void loadPlayersList(); }} disabled={searching}>{searching ? "جاري التحميل..." : "عرض الكل"}</button>
          </div>
          <div className="clientPageList">
            {players.map(p => <button key={p.id} type="button" className="clientPageItem" onClick={() => choosePlayer(p)}><span className="clientAvatar">{p.name.trim().charAt(0) || "P"}</span><span><strong>{p.name}</strong><small>{p.id}</small></span><b>‹</b></button>)}
            {!searching && players.length === 0 && <div className="empty">اكتب حرفين على الأقل للبحث، أو اضغط «عرض الكل».</div>}
          </div>
        </section>
      )}

      {activePage === "player" && (
        <section className="card pageCard">
          <div className="sectionHead"><div><h2>بيانات اللاعب</h2><div className="muted">{playerName}</div></div><div className="headerActions"><button className="btn secondary" type="button" onClick={() => { setActivePage("plans"); void load(playerId, selectedPhase); }}>📋 الخطط</button><button className="btn secondary" type="button" onClick={() => setShowEditPlayer(true)}>✏️ تعديل اللاعب</button></div></div>
          <div className="grid">
            <div className="stat"><div className="label">اسم اللاعب</div><div className="value">{playerName}</div></div>
            <div className="stat"><div className="label">الوزن الحالي</div><div className="value">{formatNumber(current.weight)} كجم</div></div>
            <div className="stat"><div className="label">الدهون الحالية</div><div className="value">{formatNumber(current.body_fat)}%</div></div>
            <div className="stat"><div className="label">الطول الحالي</div><div className="value">{formatNumber(current.height)} سم</div></div>
            <div className="stat"><div className="label">الخصر</div><div className="value">{formatNumber(current.waist)} سم</div></div>
            <div className="stat"><div className="label">الفخذ</div><div className="value">{formatNumber(current.thigh)} سم</div></div>
            <div className="stat"><div className="label">الذراع</div><div className="value">{formatNumber(current.arm)} سم</div></div>
            <div className="stat"><div className="label">تاريخ القياس</div><div className="value small">{formatDate(current.recorded_at)}</div></div>
          </div>
          {change && <div className="comparison">{Object.entries({weight:change.weight,body_fat:change.body_fat,height:change.height,waist:change.waist,thigh:change.thigh,arm:change.arm}).map(([k,v])=><div key={k}><span>{k}</span><strong>{v===null?"—":`${Number(v)>0?"+":""}${formatNumber(v)}`}</strong></div>)}</div>}
        </section>
      )}

      {activePage === "updates" && (
        <section className="card pageCard">
          <div className="sectionHead"><div><h2>التحديثات والقياسات</h2><div className="muted">{measurements.length ? `${measurements.length} تحديث محفوظ` : "لا توجد تحديثات محفوظة."}</div></div><button className="btn" type="button" onClick={() => setShowForm(true)}>＋ إضافة تحديث</button></div>
          {measurements.length ? <div className="history">{measurements.map((m,index)=><article className="historyItem" key={m.id ?? `${m.measured_at}-${index}`}><div className="historyTop"><strong>تحديث #{measurements.length-index}</strong><span>{formatDate(m.measured_at)}</span></div><div className="historyGrid"><div><span>الوزن</span><b>{formatNumber(m.weight)} كجم</b></div><div><span>الدهون</span><b>{formatNumber(m.body_fat)}%</b></div><div><span>الخصر</span><b>{formatNumber(m.waist)} سم</b></div><div><span>الفخذ</span><b>{formatNumber(m.thigh)} سم</b></div><div><span>الذراع</span><b>{formatNumber(m.arm)} سم</b></div></div>{m.notes && <div className="notes"><span>ملاحظات:</span> {m.notes}</div>}</article>)}</div> : <div className="empty">اضغط «إضافة تحديث» وسجل أول قياس جديد.</div>}
        </section>
      )}

      {activePage === "plans" && (
        <section className="card pageCard">
          <div className="sectionHead"><div><h2>خطط اللاعب</h2><div className="muted">الخطة الحالية وسجل الخطط المحفوظة.</div></div><div className="headerActions"><button className="btn" type="button" onClick={openPlanEditor}>＋ إنشاء / تعديل الخطة</button><button className="btn secondary" type="button" onClick={openPrintPreview}>🖨️ معاينة PDF / طباعة</button></div></div>
          <div className="planGrid"><div className="planBlock"><span>المرحلة</span><div>{plan?.phase || selectedPhase}</div></div><div className="planBlock"><span>نظام التغذية</span><div>{plan?.diet_system_type || dietSystem}</div></div><div className="planBlock"><span>الاستراتيجية</span><div>{dietStrategy} · {carbStructure === "CARB CYCLE" ? "Carb Cycle" : "Fixed"}</div></div><div className="planBlock fullPlan"><span>التغذية</span><div>{stripSupplementsFromPlanText(plan?.diet_system || planDiet || "") || "—"}</div></div><div className="planBlock fullPlan"><span>التمرين</span><div>{plan?.training_program || planTraining || "—"}</div></div><div className="planBlock fullPlan"><span>الكارديو</span><div>{plan?.cardio_plan || planCardio || "—"}</div></div></div>
          <div className="sectionHead planHistoryHead"><div><h3>سجل الخطط</h3><div className="muted">{planHistory.length} نسخة محفوظة</div></div></div>
          {planHistory.length ? <div className="history">{planHistory.map((h,index)=><article className="historyItem" key={h.id ?? `${h.created_at}-${index}`}><div className="historyTop"><strong>خطة #{planHistory.length-index}</strong><span>{formatDate(h.created_at ?? h.updated_at)}</span></div><div className="historyGrid"><div><span>المرحلة</span><b>{h.phase || "PHASE 1"}</b></div><div><span>التغذية</span><b>{stripSupplementsFromPlanText(h.diet_system || "") || "—"}</b></div></div></article>)}</div> : <div className="empty">لا توجد نسخ سابقة.</div>}
        </section>
      )}

      <header className="header legacyHeaderHidden">
        <div>
          <div className="title">IFBB Coach App</div>
          <div className="sub">لوحة متابعة اللاعبين</div>
        </div>

        <div className="headerActions">
          <button
            className="btn secondary"
            type="button"
            onClick={() => { setShowPlayerPicker(true); loadPlayersList(); }}
          >
            🔎 بحث عن لاعب
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={() => setShowAddPlayer(true)}
          >
            ➕ إضافة لاعب
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={() => setShowForm(true)}
          >
            ➕ إضافة تحديث
          </button>
          <button className="btn secondary" type="button" onClick={openEditPlayer}>✏️ تعديل اللاعب</button>
          <button className="btn secondary" type="button" onClick={openPlanEditor}>📋 خطة اللاعب</button>
          <button className="btn" onClick={() => load()} disabled={loading}>
            {loading ? "جاري التحميل..." : "تحميل بيانات اللاعب"}
          </button>
        </div>
      </header>

      {msg && (
        <div
          className={`card message ${
            msg.includes("فشل") || msg.includes("غير صحيح")
              ? "error"
              : "ok"
          }`}
        >
          {msg}
        </div>
      )}

      {showPlayerPicker && (
        <div className="modalBackdrop" role="dialog" aria-modal="true" aria-label="البحث عن لاعب">
          <section className="modalCard playerPicker">
            <div className="modalHead">
              <div>
                <h2>البحث عن لاعب</h2>
                <div className="muted">اكتب اسم اللاعب ثم اختره لعرض بياناته.</div>
              </div>
              <button className="closeBtn" type="button" onClick={() => setShowPlayerPicker(false)} aria-label="إغلاق">×</button>
            </div>
            <input
              className="input"
              autoFocus
              value={playerSearch}
              onChange={(e) => searchPlayers(e.currentTarget.value)}
              placeholder="اكتب اسم اللاعب..."
            />
            <div className="pickerToolbar">
              <button
                className="btn secondary smallBtn"
                type="button"
                onClick={() => { setPlayerSearch(""); loadPlayersList(); }}
                disabled={searching}
              >
                {searching ? "جاري التحميل..." : "عرض كل اللاعبين"}
              </button>
              <button
                className="btn secondary smallBtn"
                type="button"
                onClick={() => loadPlayersList()}
                disabled={searching}
              >
                ↻ تحديث القائمة
              </button>
              <div className="searchStatus">
                {searching
                  ? "جاري التحميل..."
                  : playerSearch.trim().length < 2
                    ? "اكتب حرفين على الأقل أو اضغط عرض كل اللاعبين"
                    : ""}
              </div>
            </div>
            <div className="playerResults">
              {players.map((p) => (
                <button key={p.id} type="button" className="playerResult" onClick={() => choosePlayer(p)}>
                  <strong>{p.name}</strong>
                  <span>{p.id}</span>
                </button>
              ))}
              {!searching && players.length === 0 && (
                <div className="empty">
                  {playerSearch.trim().length >= 2
                    ? "لا يوجد لاعب بهذا الاسم."
                    : "لا توجد لاعبين في القائمة. تأكد من تشغيل SQL الخاص بـ Player Picker."}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {showAddPlayer && (
        <div className="modalBackdrop" role="dialog" aria-modal="true" aria-label="إضافة لاعب جديد">
          <section className="modalCard">
            <div className="modalHead">
              <div>
                <h2>إضافة لاعب جديد</h2>
                <div className="muted">اكتب اسم اللاعب فقط، وبعدها نبدأ تسجيل قياساته.</div>
              </div>
              <button className="closeBtn" type="button" onClick={() => setShowAddPlayer(false)} aria-label="إغلاق">×</button>
            </div>

            <form className="updateForm" onSubmit={addPlayer}>
              <label className="full">
                <span>اسم اللاعب *</span>
                <input className="input" type="text" autoFocus autoComplete="off" value={newPlayerName} onChange={(e) => setNewPlayerName(e.currentTarget.value)} placeholder="مثال: أحمد محمد" />
              </label>
              <label><span>رقم الهاتف</span><input className="input" type="tel" inputMode="tel" value={newPlayerPhone} onChange={e=>setNewPlayerPhone(e.currentTarget.value)} placeholder="اختياري" /></label>
              <label><span>العمر</span><input className="input inputNumber" type="text" inputMode="numeric" value={newPlayerAge} onChange={e=>setNewPlayerAge(e.currentTarget.value)} placeholder="28" /></label>
              <label><span>الوزن (كجم)</span><input className="input inputNumber" type="text" inputMode="decimal" value={newPlayerWeight} onChange={e=>setNewPlayerWeight(e.currentTarget.value)} placeholder="77" /></label>
              <label><span>الطول (سم)</span><input className="input inputNumber" type="text" inputMode="decimal" value={newPlayerHeight} onChange={e=>setNewPlayerHeight(e.currentTarget.value)} placeholder="180" /></label>
              <label><span>الجنس</span><select className="input" value={newPlayerSex} onChange={e=>setNewPlayerSex(e.currentTarget.value)}><option value="ذكر">ذكر</option><option value="أنثى">أنثى</option></select></label>
              <label><span>نسبة الدهون (%)</span><input className="input inputNumber" type="text" inputMode="decimal" value={newPlayerBodyFat} onChange={e=>setNewPlayerBodyFat(e.currentTarget.value)} placeholder="اختياري" /></label>
              <label><span>الهدف</span><select className="input" value={newPlayerGoal} onChange={e=>setNewPlayerGoal(e.currentTarget.value)}><option value="">اختر الهدف</option><option value="زيادة الوزن">زيادة الوزن</option><option value="خسارة الوزن">خسارة الوزن</option><option value="تثبيت الوزن">تثبيت الوزن</option><option value="Contest Prep">Contest Prep</option></select></label>
              <div className="notes full">التحليل الأولي يحفظ البيانات التي يدعمها النظام الحالي، ويمكن استكمال قياسات الجسم من «إضافة تحديث» بعد إنشاء اللاعب.</div>
              <div className="formActions">
                <button className="btn saveBtn" type="submit" disabled={addingPlayer}>
                  {addingPlayer ? "جاري الإضافة..." : "حفظ اللاعب"}
                </button>
                <button className="btn secondary" type="button" onClick={() => setShowAddPlayer(false)} disabled={addingPlayer}>
                  إلغاء
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showEditPlayer && (
        <div className="modalBackdrop" role="dialog" aria-modal="true" aria-label="تعديل بيانات اللاعب">
          <section className="modalCard">
            <div className="modalHead">
              <div><h2>تعديل بيانات اللاعب</h2><div className="muted">التعديل لا يحذف سجل القياسات القديمة.</div></div>
              <button className="closeBtn" type="button" onClick={() => setShowEditPlayer(false)}>×</button>
            </div>
            <form className="updateForm" onSubmit={updatePlayer}>
              <label className="full"><span>اسم اللاعب</span><input className="input" value={editName} onChange={e=>setEditName(e.currentTarget.value)} /></label>
              <label><span>الوزن الأساسي (كجم)</span><input className="input inputNumber" inputMode="decimal" value={editWeight} onChange={e=>setEditWeight(e.currentTarget.value)} /></label>
              <label><span>الدهون (%)</span><input className="input inputNumber" inputMode="decimal" value={editBodyFat} onChange={e=>setEditBodyFat(e.currentTarget.value)} /></label>
              <label><span>الطول (سم)</span><input className="input inputNumber" inputMode="decimal" value={editHeight} onChange={e=>setEditHeight(e.currentTarget.value)} /></label>
              <label><span>العمر</span><input className="input inputNumber" inputMode="numeric" value={editAge} onChange={e=>setEditAge(e.currentTarget.value)} /></label>
              <label><span>الجنس</span><input className="input" value={editSex} onChange={e=>setEditSex(e.currentTarget.value)} placeholder="ذكر" /></label>
              <label className="full"><span>الهدف</span><input className="input" value={editGoal} onChange={e=>setEditGoal(e.currentTarget.value)} placeholder="تنشيف / تضخيم / لياقة" /></label>
              <label><span>الخصر (سم)</span><input className="input inputNumber" inputMode="decimal" value={editWaist} onChange={e=>setEditWaist(e.currentTarget.value)} /></label>
              <label><span>الفخذ (سم)</span><input className="input inputNumber" inputMode="decimal" value={editThigh} onChange={e=>setEditThigh(e.currentTarget.value)} /></label>
              <label><span>الذراع (سم)</span><input className="input inputNumber" inputMode="decimal" value={editArm} onChange={e=>setEditArm(e.currentTarget.value)} /></label>
              <div className="formActions"><button className="btn saveBtn" type="submit" disabled={editingPlayer}>{editingPlayer?"جاري الحفظ...":"حفظ التعديل"}</button><button className="btn secondary" type="button" onClick={()=>setShowEditPlayer(false)} disabled={editingPlayer}>إلغاء</button></div>
            </form>
          </section>
        </div>
      )}

      {showPlanForm && (
        <div className="modalBackdrop" role="dialog" aria-modal="true" aria-label="خطة اللاعب">
          <section className="modalCard">
            <div className="modalHead">
              <div>
                <h2>خطة اللاعب — {playerName}</h2>
                <div className="muted">أي تعديل هنا يُحفظ لهذا اللاعب فقط، وتُحفظ نسخة جديدة في سجل الخطط.</div>
              </div>
              <button className="closeBtn" type="button" onClick={() => setShowPlanForm(false)} aria-label="إغلاق">×</button>
            </div>

            <form className="updateForm" onSubmit={savePlan}>
              <label className="full">
                <span>المرحلة</span>
                <select className="input" value={selectedPhase} onChange={e=>changePhase(e.currentTarget.value)} disabled={savingPlan}>
                  {phaseOptions.map(phase => <option key={phase} value={phase}>{phase}</option>)}
                </select>
              </label>
              <div className="card fullPlan" style={{borderColor:"rgba(212,175,55,.35)", marginTop:10}}>
                <div className="sectionHead"><div><h2>🗓️ Phase Duration Control</h2><div className="muted">حدد مدة التغذية والتمرين بشكل مستقل. تقدر تستخدم تاريخ بداية ونهاية، أو عدد أسابيع، أو الاثنين معًا.</div></div></div>
                <div className="updateForm manualMacros">
                  <div className="full" style={{fontWeight:800, marginTop:4}}>🍽️ Nutrition Phase</div>
                  <label><span>بداية التغذية</span><input className="input" type="date" value={nutritionPhaseStart} onChange={e=>setNutritionPhaseStart(e.currentTarget.value)} disabled={savingPlan}/></label>
                  <label><span>نهاية التغذية</span><input className="input" type="date" value={nutritionPhaseEnd} onChange={e=>setNutritionPhaseEnd(e.currentTarget.value)} disabled={savingPlan}/></label>
                  <label><span>عدد أسابيع التغذية</span><input className="input" type="number" min="1" max="104" step="1" placeholder="مثال: 6" value={nutritionPhaseWeeks} onChange={e=>setNutritionPhaseWeeks(e.currentTarget.value)} disabled={savingPlan}/></label>
                  <div className="notes full">المدة الحالية: <strong>{durationLabel(nutritionPhaseStart, nutritionPhaseEnd, nutritionPhaseWeeks)}</strong></div>
                  <div className="full" style={{fontWeight:800, marginTop:10}}>🏋️ Training Phase</div>
                  <label><span>بداية التمرين</span><input className="input" type="date" value={trainingPhaseStart} onChange={e=>setTrainingPhaseStart(e.currentTarget.value)} disabled={savingPlan}/></label>
                  <label><span>نهاية التمرين</span><input className="input" type="date" value={trainingPhaseEnd} onChange={e=>setTrainingPhaseEnd(e.currentTarget.value)} disabled={savingPlan}/></label>
                  <label><span>عدد أسابيع التمرين</span><input className="input" type="number" min="1" max="104" step="1" placeholder="مثال: 8" value={trainingPhaseWeeks} onChange={e=>setTrainingPhaseWeeks(e.currentTarget.value)} disabled={savingPlan}/></label>
                  <div className="notes full">المدة الحالية: <strong>{durationLabel(trainingPhaseStart, trainingPhaseEnd, trainingPhaseWeeks)}</strong></div>
                  <button className="btn secondary full" type="button" onClick={clearPhaseDuration} disabled={savingPlan}>مسح مدد المرحلة</button>
                </div>
              </div>
              <div className="card fullPlan" style={{borderColor:"rgba(212,175,55,.35)"}}>
                <div className="sectionHead"><div><h2>⚙️ Nutrition Control Engine</h2><div className="muted">الحساب تلقائي بالكامل، والسعرات والماكروز وكميات الوجبات تُستخرج من بيانات اللاعب وقواعد النظام دون Override يدوي.</div></div></div>
                <div className="updateForm manualMacros">
                  <label><span>نوع البرنامج</span><select className="input" value={dietSystem} disabled={savingPlan} onChange={e=>{const v=e.currentTarget.value as DietSystem;const nextStrategy=v==="BULK"?"LEAN GROWTH":v==="CUTTING"?"STANDARD CUT":dietStrategy;const nextStructure=(v==="PEAK WEEK"?"FIXED":(v==="CUTTING"&&nextStrategy==="AGGRESSIVE CARB CYCLE"?"CARB CYCLE":carbStructure)) as CarbStructure;setDietSystem(v);setDietStrategy(nextStrategy);setCarbStructure(nextStructure);setPlanDiet("");setGeneratedTargets(null);setDayTypesCustomized(false);if(v==="PEAK WEEK"){const schedule=applyPeakWeekSchedule(peakWeekType, peakStartDate, peakShowDate);setDayTypes(schedule);setTimeout(()=>generatePlan("PEAK WEEK", peakWeekType, peakStartDate, peakShowDate, v),0);}else{const schedule=getNormalTemplateSchedule(v,nextStrategy,nextStructure);setDayTypes(schedule);setDayTypesCustomized(false);setTimeout(()=>generatePlan(selectedPhase, undefined, undefined, undefined, v, nextStrategy, nextStructure),0);}}}><option value="BULK">BULKING</option><option value="CUTTING">CUTTING</option><option value="PEAK WEEK">PEAK WEEK</option></select></label>
                  {dietSystem!=="PEAK WEEK"&&<label><span>الاستراتيجية</span><select className="input" value={dietStrategy} onChange={e=>{const v=e.currentTarget.value as DietStrategy;const nextStructure=(v==="AGGRESSIVE CARB CYCLE" ? "CARB CYCLE" : carbStructure) as CarbStructure;setDietStrategy(v);if(v==="AGGRESSIVE CARB CYCLE") setCarbStructure("CARB CYCLE");const schedule=getNormalTemplateSchedule(dietSystem,v,nextStructure);setDayTypes(schedule);setDayTypesCustomized(false);setTimeout(()=>generatePlan(selectedPhase,undefined,undefined,undefined,dietSystem,v,nextStructure),0);}}>{dietSystem==="BULK"?<><option value="LEAN GROWTH">Lean Growth</option><option value="FULLNESS FOCUSED">Fullness Focused</option><option value="MAXIMUM MASS">Maximum Mass</option><option value="LOWER BODY MASS">Lower Body Mass</option></>:<><option value="STANDARD CUT">Standard Cut</option><option value="AGGRESSIVE CARB CYCLE">Aggressive Carb Cycle</option><option value="CONTEST PREP">Contest Prep</option><option value="CONTEST CONTINUATION">Contest Continuation</option></>}</select></label>}
                  {dietSystem!=="PEAK WEEK"&&<label><span>نظام الكارب</span><select className="input" value={carbStructure} onChange={e=>{const v=e.currentTarget.value as CarbStructure;if(dietStrategy==="AGGRESSIVE CARB CYCLE" && v!=="CARB CYCLE") return;setCarbStructure(v);const schedule=getNormalTemplateSchedule(dietSystem,dietStrategy,v);setDayTypes(schedule);setDayTypesCustomized(false);setTimeout(()=>generatePlan(selectedPhase,undefined,undefined,undefined,dietSystem,dietStrategy,v),0);}}><option value="FIXED">Fixed Macros — ثابت</option><option value="CARB CYCLE">Carb Cycle — High / Medium / Low</option></select></label>}
                  <label><span>طريقة الحساب</span><select className="input" value="AUTO" disabled><option value="AUTO">AUTO — إلزامي</option></select></label>
                  <label><span>مستوى النشاط — TDEE</span><select className="input" value={activityLevel} onChange={e=>setActivityLevel(e.currentTarget.value)}><option value="SEDENTARY">Sedentary — قليل/بدون تمرين</option><option value="LIGHT">Light — 1–2 يوم/أسبوع</option><option value="MODERATE">Moderate — 3–5 أيام/أسبوع</option><option value="HEAVY">Heavy — 6–7 أيام/أسبوع</option><option value="ATHLETE">Athlete — مرتين يوميًا</option></select></label>
                  <label><span>هدف السعرات</span><select className="input" value="AUTO" disabled><option value="AUTO">AUTO — حسب النظام</option></select></label>
                  <label><span>تعديل الكوتش على هدف النظام</span><input className="input inputNumber" inputMode="numeric" value={calorieAdjustment} onChange={e=>setCalorieAdjustment(e.currentTarget.value)} placeholder="مثال +150 أو -150" /></label>
                  <label><span>عدد الوجبات</span><select className="input" value="TEMPLATE" disabled><option value="TEMPLATE">قالب المدرب — AUTO</option></select></label>
                  {dietSystem==="PEAK WEEK"&&<label><span>Peak Week Type</span><select className="input" value={peakWeekType} onChange={e=>{const v=e.currentTarget.value as PeakWeekType;setPeakWeekType(v);applyPeakWeekSchedule(v, peakStartDate, peakShowDate);setTimeout(()=>generatePlan("PEAK WEEK", v, peakStartDate, peakShowDate),50);}}>{["FRONT LOAD","BACK LOAD","LINEAR LOAD","MID LOAD","CONSERVATIVE / NO LOAD"].map(v=><option key={v} value={v}>{v}</option>)}</select></label>}
                  {dietSystem==="PEAK WEEK"&&<label><span>استجابة اللاعب</span><select className="input" value="BALANCED" disabled><option value="BALANCED">BALANCED — AUTO</option></select></label>}
                   {dietSystem==="PEAK WEEK"&&<>
                    <label><span>Peak Start Date</span><input className="input" type="date" value={peakStartDate} onChange={e=>{const v=e.currentTarget.value;setPeakStartDate(v);applyPeakWeekSchedule(peakWeekType,v,peakShowDate);setTimeout(()=>generatePlan("PEAK WEEK", peakWeekType, v, peakShowDate),50)}} /></label>
                    <label><span>Show Date</span><input className="input" type="date" value={peakShowDate} onChange={e=>{const v=e.currentTarget.value;setPeakShowDate(v);applyPeakWeekSchedule(peakWeekType,peakStartDate,v);setTimeout(()=>generatePlan("PEAK WEEK", peakWeekType, peakStartDate, v),50)}} /></label>
                    {peakStartDate&&peakShowDate&&Math.round((new Date(`${peakShowDate}T12:00:00`).getTime()-new Date(`${peakStartDate}T12:00:00`).getTime())/86400000)!==6&&
                      <div className="notes full" style={{marginTop:8}}>Peak Week القياسي هنا 7 أيام. اختار Start Date وShow Date بفارق 6 أيام حتى يتم توزيع الاستراتيجية كاملة بدون ضغط أو حذف أيام.</div>}
                  </>}
                </div>
                <div className="quickAdjust">
                  <span className="muted">هدف النظام:</span>
                  <span className="chip active">{automaticGoalOffset(dietSystem) > 0 ? `+${automaticGoalOffset(dietSystem)} kcal` : automaticGoalOffset(dietSystem) < 0 ? `${automaticGoalOffset(dietSystem)} kcal` : "TDEE baseline"}</span>
                </div>
                <div className="notes" style={{marginTop:8}}>الـEngine يختار نقطة بداية من بيانات اللاعب + الاستراتيجية + مستوى النشاط. الـCheck-in هو الحكم النهائي؛ ثبات الوزن أو الشكل لا يفرض تعديلًا تلقائيًا بدون سبب.</div>
                {(()=>{const b=calculateBaseMacros();return b?<div className="macroCards">
                  <div className="stat"><div className="label">BMR</div><div className="value small">{Math.round(b.bmr)} kcal</div></div>
                  <div className="stat"><div className="label">Maintenance / TDEE</div><div className="value small">{Math.round(b.maintenance)} kcal</div></div>
                  <div className="stat"><div className="label">{dietSystem === "PEAK WEEK" ? "Peak Baseline / TDEE" : "Auto Target"}</div><div className="value small">{b.autoCalories} kcal</div></div>
                  <div className="stat"><div className="label">Coach Adjustment</div><div className="value small">{b.adjustment > 0 ? `+${b.adjustment}` : b.adjustment} kcal<br/><span className="muted">{b.adjustmentType === "DEFICIT" ? "عجز" : b.adjustmentType === "SURPLUS" ? "فائض" : "ثبات"}</span></div></div>
                  <div className="stat"><div className="label">Target After Control</div><div className="value small">{b.calories} kcal</div></div>
                  <div className="stat"><div className="label">Auto Macros</div><div className="value small">P {b.protein}g · C {b.carbs}g · F {b.fat}g</div></div>
                </div>:null})()}
                <div className="notes" style={{marginTop:12}}>BMR/TDEE = نقطة البداية. بعد ذلك تُطبق Strategy مختارة ثم Fixed أو Carb Cycle. HIGH/MEDIUM/LOW تغيّر توزيع P/C/F فقط عندما تختار Carb Cycle. Peak Week له Engine مستقل.</div>
                {dietSystem==="PEAK WEEK"&&<div className="notes" style={{marginTop:12}}>القوالب الخمسة محفوظة كاستراتيجيات اختيارية. عند اختيار أي نوع Peak تتغير مراحل الأسبوع حسب القالب الأصلي، وتبقى بنية الوجبات ومصادر الطعام كما هي افتراضيًا. الجرامات والسعرات والماكروز فقط تتكيف مع قياسات اللاعب؛ أي تغيير في مصدر طعام أو عدد وجبات هو تعديل يدوي.  التطبيق لا يضيف تلقائيًا جرعات هرمونات أو إنسولين أو مدرات؛ هذه قرارات منفصلة يراجعها الكوتش والطبيب عند الحاجة.</div>}
              </div>
              <div className="card autoPlanCard fullPlan">
                <div className="sectionHead">
                  <div><h2>مولد الخطة التلقائي</h2><div className="muted">يستخدم أحدث قياسات اللاعب ويولد السعرات والماكروز حسب نوع كل يوم.</div></div>
                  <button className="btn" type="button" onClick={() => generatePlan()}>⚙️ توليد تلقائي</button>
                </div>
                <div className="grid">
                  <div className="stat"><div className="label">الوزن الحالي</div><div className="value">{formatNumber(current.weight)} كجم</div></div>
                  <div className="stat"><div className="label">الدهون</div><div className="value">{formatNumber(current.body_fat)}%</div></div>
                  <div className="stat"><div className="label">الخصر</div><div className="value">{formatNumber(current.waist)} سم</div></div>
                  <div className="stat"><div className="label">الفخذ</div><div className="value">{formatNumber(current.thigh)} سم</div></div>
                  <div className="stat"><div className="label">الذراع</div><div className="value">{formatNumber(current.arm)} سم</div></div>
                </div>
                <div className="weekPlanGrid">
                  {dietSystem === "PEAK WEEK"
                    ? peakDateOrder().map(day => {
                        const mode = getPeakWeekModes(peakWeekType)[day];
                        return <label key={day}><span>{peakDateLabel(day)}</span><select className="input" value={mode} disabled><option value={mode}>{mode}</option></select></label>;
                      })
                    : weekDays.map(day => (
                        <label key={day}>
                          <span>{day}</span>
                          <select
                            className="input"
                            value={dayTypes[day] || getNormalTemplateSchedule(dietSystem, dietStrategy, carbStructure)[day]}
                            disabled={savingPlan || carbStructure !== "CARB CYCLE"}
                            onChange={e => changeDayType(day, e.currentTarget.value as DayType)}
                          >
                            {dayTypeOptions.map(t=><option key={t} value={t}>{t}</option>)}
                          </select>
                        </label>
                      ))}
                </div>
                <div className="notes" style={{marginTop:12}}>المحرك يعمل AUTO بالكامل: يختار Schedule المرحلة، يحسب TDEE والسعرات والماكروز، ثم يوزعها على قالب الوجبات المعتمد. لا توجد حاجة لتعديل P/C/F أو عدد الوجبات يدويًا.</div>
                {(generatedTargets || (dietSystem === "PEAK WEEK" && peakDailyTargets)) && <div className="macroCards" style={{marginTop:12}}>
                  {dietSystem === "PEAK WEEK" && peakDailyTargets
                    ? peakDateOrder().map(day => {
                        const t = peakDailyTargets[day];
                        const mode = getPeakWeekModes(peakWeekType)[day];
                        return <div className="stat" key={day} style={{minWidth:260,textAlign:"right"}}>
                          <div className="label" style={{fontWeight:800,fontSize:15}}>{peakDateLabel(day)} — {mode}</div>
                          <div className="value small" style={{marginTop:8}}>{t.calories} kcal<br/>P {t.protein}g · C {t.carbs}g · F {t.fat}g</div>
                        </div>;
                      })
                    : dayTypeOptions.map(t => {
                        const b = calculateBaseMacros();
                        const auto = b ? calculateDayTargets(b)[t] : generatedTargets[t];
                        const display = finalDayTargets(generatedTargets)[t];
                        return <div className="stat" key={t} style={{minWidth:260,textAlign:"right"}}>
                          <div className="label" style={{fontWeight:800,fontSize:15}}>{t}</div>
                          <div className="muted" style={{fontSize:12,margin:"4px 0 4px"}}>AUTO: {auto.calories} kcal · P {auto.protein} · C {auto.carbs} · F {auto.fat}</div>
                          <div className="value small" style={{marginTop:8}}>FINAL: {display.calories} kcal<br/>P {display.protein}g · C {display.carbs}g · F {display.fat}g</div>
                        </div>;
                      })}
                </div>}

                <div className="catalogPanel">
                  <div className="sectionHead">
                    <div><h3>مصادر التغذية — Catalog V74</h3><div className="muted">اختار المصدر قبل المعاينة؛ الكمية تتغير تلقائيًا حسب الماكروز.</div></div>
                    <span className="badge">{catalogLoading ? "جاري تحميل الكتالوج..." : "متصل"}</span>
                  </div>
                  <div className="catalogGrid">
                    <label><span>البروتين — تغيير المصدر</span><select className="input" value={selectedProteinFood} onChange={e=>setSelectedProteinFood(e.currentTarget.value ? Number(e.currentTarget.value) : "")}>
                      <option value="">اختيار</option>{catalogFoods.filter(f=>f.category==="protein" && (dietSystem !== "PEAK WEEK" || /لحم|لحمة|beef|red meat|صدور دجاج|chicken breast|دجاج صدر|tilapia|بلطي|egg white|egg whites|بياض بيض|بياض البيض/i.test(`${f.name_ar} ${f.name_en || ""}`))).map(f=><option key={f.id} value={f.id}>{f.name_ar}{f.name_en ? ` — ${f.name_en}` : ""}</option>)}
                    </select></label>
                    <label><span>الكربوهيدرات — تغيير المصدر</span><select className="input" value={selectedCarbFood} onChange={e=>setSelectedCarbFood(e.currentTarget.value ? Number(e.currentTarget.value) : "")}>
                      <option value="">اختيار</option>{catalogFoods.filter(f=>f.category==="carb" && (dietSystem !== "PEAK WEEK" || /أرز|ارز|rice|بطاطا حلو|sweet potato|بطاطس|potato|cream of rice|كريم اوف رايس|كريم أوف رايس|rice cake|رايس كيك/i.test(`${f.name_ar} ${f.name_en || ""}`))).map(f=><option key={f.id} value={f.id}>{f.name_ar}{f.name_en ? ` — ${f.name_en}` : ""}</option>)}
                    </select></label>
                    <label><span>الدهون — تغيير المصدر</span><select className="input" value={selectedFatFood} onChange={e=>setSelectedFatFood(e.currentTarget.value ? Number(e.currentTarget.value) : "")}>
                      <option value="">اختيار</option>{catalogFoods.filter(f=>f.category==="fat" && (dietSystem !== "PEAK WEEK" || /peanut butter|زبدة فول سوداني|almond butter|زبدة لوز|mct/i.test(`${f.name_ar} ${f.name_en || ""}`))).map(f=><option key={f.id} value={f.id}>{f.name_ar}{f.name_en ? ` — ${f.name_en}` : ""}</option>)}
                    </select></label>
                    <div className="full">
                      <span style={{display:"block",fontWeight:700,marginBottom:6}}>الخضار — {dietSystem === "PEAK WEEK" ? "مصادر ورقية خفيفة للـAUTO في Peak Week" : "مصادر متاحة للـAUTO ويمكن تغييرها يدويًا"}</span>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8,padding:10,border:"1px solid #333",borderRadius:8}}>
                        {catalogFoods.filter(f=>String(f.category || "").toLowerCase()==="vegetable" && f.active !== false && Number.isFinite(Number(f.id)) && (dietSystem !== "PEAK WEEK" || peakLeafyVegetableAllowedGlobal(f))).map(f=>{
                          const foodId = Number(f.id);
                          const checked = selectedVegetableFoods.some(id => Number(id) === foodId);
                          return <label key={foodId} style={{display:"flex",gap:8,alignItems:"center",cursor:"pointer"}}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={e=>{
                                const isChecked = Boolean(e.target.checked);
                                setSelectedVegetableFoods(prev => {
                                  const clean = prev.map(Number).filter(Number.isFinite);
                                  if (isChecked) return Array.from(new Set([...clean, foodId]));
                                  return clean.filter(id => id !== foodId);
                                });
                              }}
                            />
                            <span>{String(f.name_ar || "")}
                              {f.name_en ? ` — ${String(f.name_en)}` : ""}
                            </span>
                          </label>;
                        })}
                      </div>
                      <div className="muted" style={{marginTop:6}}>{dietSystem === "PEAK WEEK" ? "في Peak Week الـAUTO يعتمد على الخضار الورقية الأخف مثل الجرجير والخس والسبانخ، ولا يختار الخضار الليفية مثل البروكلي تلقائيًا. تقدر تغيّر الاختيار يدويًا من المعاينة." : "الاختيارات هنا هي مصادر متاحة للمولد. التوزيع والكمية يتبعان قالب اليوم المختار، ويمكن تعديل أي وجبة يدويًا من المعاينة."}</div>
                    </div>
                    <div className="full" style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                      <button className="btn" type="button" onClick={applyCatalogFoodChanges}>🔄 تطبيق التغييرات وإعادة حساب الكميات</button>
                      <span className="muted">اختار أي مصدر من الكتالوج ثم طبّق التغيير. كمية المصدر الجديد تُحسب من قيمه الغذائية.</span>
                    </div>
                  </div>
                  <button className="btn secondary" type="button" onClick={handleGenerateDiet}>🔄 تحديث معاينة التغذية</button>
                </div>
              </div>
              <label className="full">
                <span>النظام الغذائي</span>
                <textarea className="input textarea" rows={8} value={planDiet} onChange={e=>setPlanDiet(e.currentTarget.value)} placeholder="اضغط توليد تلقائي أو اكتب/عدّل الخطة يدويًا..." />
              </label>
              <div className="catalogPanel full">
                <div className="sectionHead">
                  <div><h3>نظام التمرين — Catalog V74</h3><div className="muted">النظام يختلف حسب اللاعب؛ اختار Split ثم عدّل التمارين في المعاينة.</div></div>
                </div>
                <div className="catalogGrid">
                  <label className="full"><span>نوع التمرين</span><select className="input" value={selectedTrainingSplit} onChange={e=>{ const id = e.currentTarget.value ? Number(e.currentTarget.value) : ""; setSelectedTrainingSplit(id); if (id !== "") { const split = trainingSplits.find(s=>s.id===Number(id)); const rows = trainingExercises.filter(x=>x.split_id===Number(id)); if (split) normalizeTrainingTemplateAssignments(split, rows); setTrainingDayStatus(defaultTrainingStatusForSplit(Number(id))); } }}>
                    <option value="">اختيار النظام</option>{trainingSplits.map(s=><option key={s.id} value={s.id}>{s.name_en && s.name_en.trim() !== s.name_ar.trim() ? `${s.name_ar} — ${s.name_en}` : s.name_ar}</option>)}
                  </select></label>
                </div>
                <div className="catalogGrid" style={{marginTop:12}}>
                  {weekDays.map(day => (
                    <div key={day} className="stat" style={{display:"flex",flexDirection:"column",gap:8}}>
                      <div className="label">{day}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <button type="button" className={`btn ${trainingDayStatus[day] === "TRAINING" ? "" : "secondary"}`} onClick={()=>setTrainingDayStatus(prev=>({...prev,[day]:"TRAINING"}))}>🏋️ تدريب</button>
                        <button type="button" className={`btn ${trainingDayStatus[day] === "REST" ? "" : "secondary"}`} onClick={()=>setTrainingDayStatus(prev=>({...prev,[day]:"REST"}))}>⚪ راحة</button>
                      </div>
                      {trainingDayStatus[day] === "TRAINING" && selectedTrainingSplit !== "" && (() => {
                        const split = trainingSplits.find(s=>s.id===Number(selectedTrainingSplit));
                        if (!split) return null;
                        const options = availableTrainingTemplateDays(split, trainingExercises.filter(x=>x.split_id===split.id));
                        return <label style={{display:"flex",flexDirection:"column",gap:4}}><span className="muted">قالب التمرين لهذا اليوم</span><select className="input" value={trainingDayTemplates[day]} onChange={e=>setTrainingDayTemplates(prev=>({...prev,[day]:e.currentTarget.value as DayKey}))}>{options.map(source=><option key={source} value={source}>{source}</option>)}</select></label>;
                      })()}
                    </div>
                  ))}
                </div>
                <div className="catalogPanel full" style={{marginTop:12}}>
                  <div className="sectionHead"><div><h3>🔥 CORE — تحكم تلقائي ويدوي</h3><div className="muted">اختار أيام الـCORE. الحركات تتولد تلقائيًا ويمكن تعديل النص بعد التوليد.</div></div></div>
                  <div className="catalogGrid">
                    {weekDays.map(day => (
                      <div key={`core-${day}`} className="stat" style={{display:"flex",flexDirection:"column",gap:8}}>
                        <div className="label">{day}</div>
                        <button type="button" className={`btn ${coreDays.includes(day) ? "" : "secondary"}`} onClick={()=>setCoreDays(prev=>prev.includes(day) ? prev.filter(d=>d!==day) : [...prev,day])}>
                          {coreDays.includes(day) ? "🔥 CORE ON" : "CORE OFF"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="btn secondary" type="button" onClick={handleGenerateTraining}>🔄 توليد التمرين تلقائيًا</button>
              </div>
              <label className="full">
                <span>خطة التمرين</span>
                <textarea className="input textarea" rows={12} value={planTraining} onChange={e=>setPlanTraining(e.currentTarget.value)} placeholder="اختار نظام التمرين ثم ولّد المعاينة..." />
              </label>
              <div className="catalogPanel full">
                <div className="sectionHead"><div><h3>🏃‍♂️ AUTO CARDIO — تحكم يومي</h3><div className="muted">اختار لكل يوم: على الريق، بعد التمرين، الاثنين، أو بدون كارديو. في وضع الجلستين يمكنك تحديد نوع ومدة كل جلسة بشكل مستقل.</div></div></div>
                <div className="catalogGrid">
                  {weekDays.map(day => {
                    const c = cardioConfig[day];
                    const update = (patch: Partial<CardioConfig>) => setCardioConfig(prev => ({...prev, [day]: {...prev[day], ...patch}}));
                    return <div key={`cardio-${day}`} className="stat" style={{display:"flex",flexDirection:"column",gap:8}}>
                      <div className="label">{day}</div>
                      <select className="input" value={c.mode} onChange={e=>update({mode:e.currentTarget.value as CardioMode})}>
                        <option value="FASTED">جلسة واحدة — على الريق — Fasted</option>
                        <option value="POST_WORKOUT">جلسة واحدة — بعد التمرين — Post-Workout</option>
                        <option value="FASTED_POST_WORKOUT">مرتين يوميًا — على الريق + بعد التمرين</option>
                        <option value="NONE">بدون كارديو — No Cardio</option>
                      </select>
                      {c.mode === "FASTED_POST_WORKOUT" && (
                        <div className="muted" style={{fontSize:12}}>
                          جلستان مستقلتان: حدد نوع ومدة جلسة الريق ونوع ومدة جلسة بعد التمرين.
                        </div>
                      )}
                      {(c.mode === "FASTED" || c.mode === "FASTED_POST_WORKOUT") && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                        <select className="input" value={c.fastedType} onChange={e=>update({fastedType:e.currentTarget.value})}>
                          <option>LISS Walking</option><option>Incline Treadmill</option><option>StairMaster</option><option>Bike</option><option>Elliptical</option>
                        </select>
                        <input className="input" type="number" min="1" value={c.fastedMinutes} onChange={e=>update({fastedMinutes:e.currentTarget.value})} placeholder="دقائق الريق" />
                      </div>}
                      {(c.mode === "POST_WORKOUT" || c.mode === "FASTED_POST_WORKOUT") && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                        <select className="input" value={c.postType} onChange={e=>update({postType:e.currentTarget.value})}>
                          <option>LISS Walking</option><option>Incline Treadmill</option><option>StairMaster</option><option>Bike</option><option>Elliptical</option>
                        </select>
                        <input className="input" type="number" min="1" value={c.postMinutes} onChange={e=>update({postMinutes:e.currentTarget.value})} placeholder="دقائق بعد التمرين" />
                      </div>}
                    </div>;
                  })}
                </div>
                <button className="btn secondary" type="button" onClick={()=>setPlanCardio(generateCardioText())}>🔄 تحديث معاينة الكارديو</button>
              </div>
              <label className="full">
                <span>الكارديو — المعاينة القابلة للتعديل</span>
                <textarea className="input textarea" rows={8} value={planCardio} onChange={e=>setPlanCardio(e.currentTarget.value)} placeholder="الأيام + النوع + التوقيت + المدة..." />
              </label>
              <div className="catalogPanel full">
                <div className="sectionHead"><div><h3>الماء والملح</h3><div className="muted">القيم تُحسب تلقائيًا من قاعدة البيانات + وزن اللاعب + نوع النظام/اليوم، ويمكن تعديلها يدويًا في المعاينة قبل الحفظ.</div></div></div>
                <div className="macroCards">
                  {dayTypeOptions.map(t => {
                    const rule = autoWaterSaltForNormalDay(t);
                    return <div className="stat" key={t}><div className="label">{t}</div><div className="value small">{rule ? `${rule.water} L ماء` : "—"}<br/>{rule ? `${rule.salt} g ملح` : "—"}</div></div>;
                  })}
                </div>
              </div>
              <label className="full">
                <span>ملاحظات الخطة</span>
                <textarea className="input textarea" rows={3} value={planNotes} onChange={e=>setPlanNotes(e.currentTarget.value)} placeholder="ملاحظات المدرب..." />
              </label>
              <div className="formActions">
                <button className="btn saveBtn" type="submit" disabled={savingPlan}>{savingPlan ? "جاري الحفظ..." : "حفظ الخطة"}</button>
                <button className="btn secondary" type="button" onClick={()=>setShowPlanForm(false)} disabled={savingPlan}>إلغاء</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showPrintPreview && (plan || planDiet.trim()) && (
        <div className="modalBackdrop printModalBackdrop" role="dialog" aria-modal="true" aria-label="معاينة وطباعة الخطة">
          <section className="modalCard printPreview">
            <div className="modalHead printEditorHead">
              <div>
                <h2>{playerName} — {plan?.phase || selectedPhase}</h2>
                <div className="muted">معاينة وتحرير قبل الطباعة — يتم إخراج الخطة كصفحات منظمة تلقائيًا.</div>
              </div>
              <button className="closeBtn" type="button" onClick={()=>setShowPrintPreview(false)} aria-label="إغلاق">×</button>
            </div>

            <div className="printControls">
              <div className="printLangGroup">
                <span>لغة الطباعة / PRINT LANGUAGE</span>
                <button className={`btn ${printLanguage==="AR" ? "" : "secondary"}`} type="button" onClick={()=>setPrintLanguage("AR")}>العربية</button>
                <button className={`btn ${printLanguage==="EN" ? "" : "secondary"}`} type="button" onClick={()=>setPrintLanguage("EN")}>English</button>
                <button className={`btn ${printLanguage==="BOTH" ? "" : "secondary"}`} type="button" onClick={()=>setPrintLanguage("BOTH")}>عربي + English</button>
              </div>
            </div>

            <div className="printEditPanel">
              <label><span>التغذية / NUTRITION</span><textarea className="input textarea" rows={10} value={sanitizePrintContent(stripSupplementsFromPlanText(planDiet || plan?.diet_system || ""))} onChange={e=>setPlanDiet(e.currentTarget.value)} /></label>
              <label><span>التمرين / TRAINING</span><textarea className="input textarea" rows={10} value={sanitizePrintContent(planTraining || plan?.training_program || (trainingSplits.length && selectedTrainingSplit ? generateTrainingText() : ""))} onChange={e=>setPlanTraining(e.currentTarget.value)} /></label>
              <label><span>الكارديو + الكور + البطن + الإطالات / CARDIO + CORE + ABS + STRETCHING</span><textarea className="input textarea" rows={7} value={sanitizePrintContent(planCardio || plan?.cardio_plan || "")} onChange={e=>setPlanCardio(e.currentTarget.value)} /></label>
              <label><span>الملاحظات / NOTES</span><textarea className="input textarea" rows={4} value={planNotes || plan?.notes || ""} onChange={e=>setPlanNotes(e.currentTarget.value)} /></label>
            </div>

            <div className="printDocument" dir={printLanguage === "EN" ? "ltr" : "rtl"}>
              <section className="printPage printCoverPage">
                <div className="printCoverPhoto"><img src="/coach-mohamed-kamal.png" alt="Coach Mohamed Kamal" /></div>
                <div className="printCoverBrand"><span>COACH</span><strong>MOHAMED KAMAL</strong><small>IFBB PROFESSIONAL COACH</small></div>
                <div className="printCoverAthlete">
                  <div><small>{printLanguage === "AR" ? "الاسم" : "NAME"}</small><strong>{playerName || "—"}</strong></div>
                  <div><small>{printLanguage === "AR" ? "الهدف" : "GOAL"}</small><strong>{printLanguage === "AR" ? (playerGoal === "BULKING" ? "تضخيم" : playerGoal === "CUTTING" ? "تنشيف" : playerGoal || "—") : (playerGoal || "—")}</strong></div>
                  <div><small>{printLanguage === "AR" ? "السن" : "AGE"}</small><strong>{playerAge ? `${playerAge} ${printLanguage === "AR" ? "سنة" : "YEARS"}` : "—"}</strong></div>
                </div>
                <div className="printFooterBrand">IFBB COACH APP</div>
              </section>

              <section className="printPage">
                <div className="printPageTitle">{printLanguage === "EN" ? "WEEKLY SCHEDULE & NOTES" : printLanguage === "AR" ? "الجدول الأسبوعي والملاحظات" : "الجدول الأسبوعي · WEEKLY SCHEDULE & NOTES"}</div>
                <div className="printScheduleGrid">{weekDays.map(day=><div key={day}><b>{printLanguage === "EN" ? PRINT_DAY_EN[day] : printLanguage === "AR" ? day : `${day} · ${PRINT_DAY_EN[day]}`}</b><span>{dietSystem === "PEAK WEEK" ? (getPeakWeekModes(peakWeekType, peakStartDate, peakShowDate)[day] || "—") : (dayTypes[day] || "—")}</span></div>)}</div>
                <div className="printNotesBox"><h3>{printLanguage === "EN" ? "NOTES / GUIDELINES" : printLanguage === "AR" ? "الملاحظات والإرشادات" : "الملاحظات · NOTES / GUIDELINES"}</h3><div>{printTranslateLine(planNotes || plan?.notes || "—", printLanguage)}</div></div>
              </section>

              {printNutritionBlocks(stripSupplementsFromPlanText(planDiet || plan?.diet_system || "")).map((block,i)=>{
                const meals=printMealBlocks(block.body);
                const intro=block.body.split("\n").filter(line=>!/^🍽️/.test(line.trim()) && line.trim() && !/^━/.test(line.trim())).slice(0,8);
                return <section className="printPage printNutritionPage" key={`diet-${i}`}>
                  <div className="printSectionKicker">NUTRITION SYSTEM</div>
                  <div className="printPageTitle">{printTranslateLine(block.title, printLanguage)}</div>
                  {intro.length>0 && <div className="printTargetStrip">{intro.map((line,j)=><span key={j}>{printTranslateLine(line, printLanguage)}</span>)}</div>}
                  <div className="printMealGrid">{meals.map((meal,j)=><article className="printMealCard" key={j}>
                    <div className="printMealHead"><span>{String(j+1).padStart(2,"0")}</span><strong>{printTranslateLine(meal.title, printLanguage)}</strong></div>
                    <div className="printMealBody">{meal.body.split("\n").filter(x=>x.trim() && !/^━/.test(x.trim())).map((line,k)=><div key={k} className="printFoodLine">{printTranslateLine(line, printLanguage)}</div>)}</div>
                  </article>)}</div>
                  {meals.length===0 && <div className="printRawBody">{block.body.split("\n").map((line,j)=><div key={j}>{printTranslateLine(line, printLanguage)}</div>)}</div>}
                  <div className="printPageFooter">MOHAMED KAMAL · IFBB COACH APP</div>
                </section>;
              })}

              {printTrainingDayBlocks(planTraining || plan?.training_program || "").map((block,i)=><section className="printPage printTrainingPage" key={`training-${i}`}>
                <div className="printSectionKicker">TRAINING PROGRAM</div>
                <div className="printPageTitle">{printTranslateLine(block.title, printLanguage)}</div>
                <div className="printExerciseGrid">{block.body.split("\n").slice(1).filter(x=>x.trim()).map((line,j)=><div key={j} className="printExerciseCard"><span>{String(j+1).padStart(2,"0")}</span><div>{printTranslateLine(line, printLanguage)}</div></div>)}</div>
                <div className="printPageFooter">MOHAMED KAMAL · IFBB COACH APP</div>
              </section>)}

              <section className="printPage printCardioPage">
                <div className="printPageTitle">{printLanguage === "EN" ? "CARDIO · CORE · ABS · STRETCHING" : printLanguage === "AR" ? "الكارديو · الكور · البطن · الإطالات" : "الكارديو · CARDIO · CORE · ABS · STRETCHING"}</div>
                <div className="printCardioBody">{printCardioSections(planCardio || plan?.cardio_plan || "").map((line,i)=><div key={i}>{printTranslateLine(line, printLanguage)}</div>)}</div>
                <div className="printNotesBox"><h3>{printLanguage === "EN" ? "COACH NOTES" : printLanguage === "AR" ? "ملاحظات المدرب" : "ملاحظات المدرب · COACH NOTES"}</h3><div>{printTranslateLine(planNotes || plan?.notes || "—", printLanguage)}</div></div>
              </section>
            </div>

            <div className="formActions printNoPageBreak">
              <button className="btn saveBtn" type="button" onClick={()=>window.print()}>🖨️ طباعة / Save as PDF</button>
              <button className="btn secondary" type="button" onClick={()=>setShowPrintPreview(false)}>إغلاق</button>
            </div>
          </section>
        </div>
      )}

      {showForm && (
        <div className="modalBackdrop" role="dialog" aria-modal="true" aria-label="إضافة تحديث جديد">
          <section className="modalCard">
            <div className="modalHead">
              <div>
                <h2>إضافة تحديث جديد</h2>
                <div className="muted">اكتب القياسات ثم اضغط حفظ التحديث.</div>
              </div>
              <button
                className="closeBtn"
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <form className="updateForm" onSubmit={addUpdate}>
              <label>
                <span>الوزن الحالي (كجم)</span>
                <input
                  className="input inputNumber"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={weight}
                  onChange={(e) => setWeight(e.currentTarget.value)}
                  placeholder="78.5"
                />
              </label>

              <label>
                <span>نسبة الدهون (%)</span>
                <input
                  className="input inputNumber"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.currentTarget.value)}
                  placeholder="14"
                />
              </label>

              <label>
                <span>الطول (سم)</span>
                <input
                  className="input inputNumber"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={height}
                  onChange={(e) => setHeight(e.currentTarget.value)}
                  placeholder="180"
                />
              </label>

              <label>
                <span>الخصر (سم)</span>
                <input className="input inputNumber" type="text" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.currentTarget.value)} placeholder="80" />
              </label>
              <label>
                <span>الفخذ (سم)</span>
                <input className="input inputNumber" type="text" inputMode="decimal" value={thigh} onChange={(e) => setThigh(e.currentTarget.value)} placeholder="60" />
              </label>
              <label>
                <span>الذراع (سم)</span>
                <input className="input inputNumber" type="text" inputMode="decimal" value={arm} onChange={(e) => setArm(e.currentTarget.value)} placeholder="40" />
              </label>

              <label className="full">
                <span>ملاحظات المدرب</span>
                <textarea
                  className="input textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.currentTarget.value)}
                  placeholder="اكتب ملاحظات التحديث..."
                  rows={4}
                />
              </label>

              <div className="formActions">
                <button className="btn saveBtn" type="submit" disabled={saving}>
                  {saving ? "جاري الحفظ..." : "حفظ التحديث"}
                </button>
                <button
                  className="btn secondary"
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="card legacyContent">
        <div className="sectionHead">
          <div>
            <h2>بيانات اللاعب</h2>
            <div className="muted">{playerName}</div>
          </div>
          {latest && <span className="badge">آخر تحديث محفوظ</span>}
        </div>

        <div className="grid">
          <div className="stat">
            <div className="label">اسم اللاعب</div>
            <div className="value">{playerName}</div>
          </div>
          <div className="stat">
            <div className="label">الوزن الحالي</div>
            <div className="value">
              {formatNumber(current.weight)}
              {current.weight !== null && current.weight !== undefined ? " كجم" : ""}
            </div>
          </div>
          <div className="stat">
            <div className="label">الدهون الحالية</div>
            <div className="value">
              {formatNumber(current.body_fat)}
              {current.body_fat !== null && current.body_fat !== undefined ? "%" : ""}
            </div>
          </div>
          <div className="stat">
            <div className="label">الطول الحالي</div>
            <div className="value">
              {formatNumber(current.height)}
              {current.height !== null && current.height !== undefined ? " سم" : ""}
            </div>
          </div>
          <div className="stat">
            <div className="label">الخصر</div>
            <div className="value">
              {formatNumber(current.waist)}
              {current.waist !== null && current.waist !== undefined ? " سم" : ""}
            </div>
          </div>
          <div className="stat">
            <div className="label">الفخذ</div>
            <div className="value">
              {formatNumber(current.thigh)}
              {current.thigh !== null && current.thigh !== undefined ? " سم" : ""}
            </div>
          </div>
          <div className="stat">
            <div className="label">الذراع</div>
            <div className="value">
              {formatNumber(current.arm)}
              {current.arm !== null && current.arm !== undefined ? " سم" : ""}
            </div>
          </div>
          <div className="stat">
            <div className="label">تاريخ القياس</div>
            <div className="value small">{formatDate(current.recorded_at)}</div>
          </div>
        </div>
      </section>

      {change && (
        <section className="card">
          <h2>مقارنة آخر تحديثين</h2>
          <div className="comparison">
            <div>
              <span>الوزن</span>
              <strong>{change.weight === null ? "—" : `${change.weight > 0 ? "+" : ""}${formatNumber(change.weight)} كجم`}</strong>
            </div>
            <div>
              <span>الدهون</span>
              <strong>{change.body_fat === null ? "—" : `${change.body_fat > 0 ? "+" : ""}${formatNumber(change.body_fat)}%`}</strong>
            </div>
            <div>
              <span>الطول</span>
              <strong>
                {change.height === null
                  ? "—"
                  : roundNumber(Math.abs(change.height), 2) === 0
                    ? "ثابت"
                    : `${change.height > 0 ? "+" : ""}${formatNumber(change.height)} سم`}
              </strong>
            </div>
            <div>
              <span>الخصر</span>
              <strong>{change.waist === null ? "—" : `${change.waist > 0 ? "+" : ""}${formatNumber(change.waist)} سم`}</strong>
            </div>
            <div>
              <span>الفخذ</span>
              <strong>{change.thigh === null ? "—" : `${change.thigh > 0 ? "+" : ""}${formatNumber(change.thigh)} سم`}</strong>
            </div>
            <div>
              <span>الذراع</span>
              <strong>{change.arm === null ? "—" : `${change.arm > 0 ? "+" : ""}${formatNumber(change.arm)} سم`}</strong>
            </div>
          </div>
        </section>
      )}

      <section className="card legacyContent">
        <div className="sectionHead">
          <div>
            <h2>سجل القياسات والتحديثات</h2>
            <div className="muted">
              {measurements.length
                ? `${measurements.length} تحديث محفوظ`
                : "لا توجد تحديثات محفوظة حتى الآن."}
            </div>
          </div>
        </div>

        {measurements.length > 0 ? (
          <div className="history">
            {measurements.map((m, index) => (
              <article className="historyItem" key={m.id ?? `${m.measured_at}-${index}`}>
                <div className="historyTop">
                  <strong>تحديث #{measurements.length - index}</strong>
                  <span>{formatDate(m.measured_at)}</span>
                </div>

                <div className="historyGrid">
                  <div>
                    <span>الوزن</span>
                    <b>{formatNumber(m.weight)} كجم</b>
                  </div>
                  <div>
                    <span>الدهون</span>
                    <b>{formatNumber(m.body_fat)}%</b>
                  </div>
                  <div>
                    <span>الطول</span>
                    <b>{formatNumber(m.height)} سم</b>
                  </div>
                  <div>
                    <span>الخصر</span>
                    <b>{formatNumber(m.waist)} سم</b>
                  </div>
                  <div>
                    <span>الفخذ</span>
                    <b>{formatNumber(m.thigh)} سم</b>
                  </div>
                  <div>
                    <span>الذراع</span>
                    <b>{formatNumber(m.arm)} سم</b>
                  </div>
                </div>

                {m.notes && (
                  <div className="notes">
                    <span>ملاحظات:</span> {m.notes}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            اضغط «إضافة تحديث» وسجل أول قياس جديد للاعب.
          </div>
        )}
      </section>

      <section className="card legacyContent">
        <div className="sectionHead">
          <div>
            <h2>الخطة الحالية</h2>
            <div className="muted">{plan?.updated_at ? `آخر تعديل: ${formatDate(plan.updated_at)}` : (planDiet ? `معاينة حية غير محفوظة لـ ${selectedPhase} — اضغط «تعديل الخطة» ثم «حفظ الخطة» للحفظ الدائم.` : `لا توجد خطة محفوظة لـ ${selectedPhase} بعد.`)}</div>
          </div>
          <div className="phasePickerInline">
            <span>المرحلة</span>
            <select className="input smallSelect" value={selectedPhase} onChange={e=>changePhase(e.currentTarget.value)} disabled={loading}>
              {phaseOptions.map(phase => <option key={phase} value={phase}>{phase}</option>)}
            </select>
          </div>
          <div className="headerActions">
            <button className="btn secondary smallBtn" type="button" onClick={openPlanEditor}>✏️ تعديل الخطة</button>
            <button className="btn smallBtn" type="button" onClick={openPrintPreview} disabled={!plan && !planDiet.trim()}>🖨️ معاينة / طباعة</button>
          </div>
        </div>

        <div className="planGrid">
          <div className="planBlock"><span>المرحلة</span><div>{plan?.phase || selectedPhase}</div></div>
          <div className="planBlock"><span>نظام التغذية</span><div>{plan?.diet_system_type || dietSystem}</div></div><div className="planBlock"><span>الاستراتيجية</span><div>{dietStrategy} · {carbStructure === "CARB CYCLE" ? "Carb Cycle" : "Fixed"}</div></div><div className="planBlock"><span>التغذية</span><div>{stripSupplementsFromPlanText(plan?.diet_system || planDiet || "") || "—"}</div></div>
          <div className="planBlock"><span>التمرين</span><div>{plan?.training_program || planTraining || "—"}</div></div>
          <div className="planBlock"><span>الكارديو</span><div>{plan?.cardio_plan || planCardio || "—"}</div></div>
          {plan?.notes && <div className="planBlock fullPlan"><span>ملاحظات</span><div>{plan.notes}</div></div>}
        </div>
      </section>

      <section className="card legacyContent">
        <div className="sectionHead">
          <div>
            <h2>سجل خطط اللاعب</h2>
            <div className="muted">{planHistory.length ? `${planHistory.length} نسخة محفوظة` : "لا توجد نسخ سابقة."}</div>
          </div>
        </div>
        {planHistory.length > 0 ? (
          <div className="history">
            {planHistory.map((h, index) => (
              <article className="historyItem" key={h.id ?? `${h.created_at}-${index}`}>
                <div className="historyTop">
                  <strong>خطة #${planHistory.length - index}</strong>
                  <span>{formatDate(h.created_at ?? h.updated_at)}</span>
                </div>
                <div className="historyGrid">
                  <div><span>المرحلة</span><b>{h.phase || "PHASE 1"}</b></div>
                  <div><span>التغذية</span><b>{stripSupplementsFromPlanText(h.diet_system || "") || "—"}</b></div>
                  <div><span>التمرين</span><b>{h.training_program || "—"}</b></div>
                  <div><span>الكارديو</span><b>{h.cardio_plan || "—"}</b></div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">اضغط «خطة اللاعب» واحفظ أول خطة.</div>
        )}
      </section>

      <section className="card legacyContent">
        <h2>معرّف اللاعب</h2>
        <input className="input" readOnly value={playerId} />
      </section>
    </main>
  );
}
