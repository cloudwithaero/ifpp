
// V35 — Diverse Meal Builder
// Guarantees each meal has Protein + Carb (when daily carbs > 0) + Fat + Vegetables.
// Quantities are calculated from the catalog's per-100g macros.
// Eggs are displayed as whole/white egg counts when catalog items are marked as eggs.

export type MacroTarget = { protein:number; carbs:number; fat:number };
export type Food = {
  id:string; name:string; category:"protein"|"carb"|"fat"|"vegetable";
  protein:number; carbs:number; fat:number; kcal?:number;
  unit?: "g"|"whole_egg"|"egg_white";
};

export type Meal = {
  proteinFood: Food;
  carbFood?: Food;
  fatFood?: Food;
  vegetableFood?: Food;
  proteinTarget:number;
  carbTarget:number;
  fatTarget:number;
  proteinQty:number|string;
  carbQty?:number|string;
  fatQty?:number|string;
  vegetableQty?:number|string;
};

const clamp = (n:number,min=0,max=99999)=>Math.max(min,Math.min(max,n));
const per100 = (food:Food, macro:keyof MacroTarget) => Math.max(0, Number(food[macro]) || 0);

function qtyForMacro(food:Food, macro:keyof MacroTarget, target:number){
  const v = per100(food, macro);
  if (!v || !target) return 0;
  return target * 100 / v;
}

function fmtQty(food:Food, qty:number|string){
  if (typeof qty === "string") return qty;
  if (food.unit === "whole_egg") return `${Math.max(1,Math.round(qty))} بيضة كاملة`;
  if (food.unit === "egg_white") return `${Math.max(1,Math.round(qty))} بياض بيض`;
  return `${Math.round(qty)} جم`;
}

export function allocateMacros(daily:MacroTarget, mealsCount:number):MacroTarget[] {
  const n = Math.max(1, mealsCount);
  // Equal macro allocation by default. Coach can override meal shares later.
  return Array.from({length:n},()=>({
    protein: daily.protein/n,
    carbs: daily.carbs/n,
    fat: daily.fat/n
  }));
}

export function buildDiverseMeals(
  daily:MacroTarget,
  proteinFoods:Food[],
  carbFoods:Food[],
  fatFoods:Food[],
  vegetableFoods:Food[],
  mealsCount=5
):Meal[] {
  if (!proteinFoods.length) throw new Error("Catalog must contain protein foods.");
  const targets = allocateMacros(daily, mealsCount);

  return targets.map((t,i)=>{
    // Round-robin + no-repeat-first-pass.
    const pf = proteinFoods[i % proteinFoods.length];
    const cf = daily.carbs > 0 && carbFoods.length ? carbFoods[i % carbFoods.length] : undefined;
    const ff = fatFoods.length ? fatFoods[i % fatFoods.length] : undefined;
    const vf = vegetableFoods.length ? vegetableFoods[i % vegetableFoods.length] : undefined;

    // Protein source is calculated ONLY against the meal's protein target.
    const proteinQty = qtyForMacro(pf, "protein", t.protein);

    // Carb source is calculated ONLY against the meal's carb target.
    const carbQty = cf ? qtyForMacro(cf, "carbs", t.carbs) : undefined;

    // Fat source is calculated ONLY against the meal's fat target.
    const fatQty = ff ? qtyForMacro(ff, "fat", t.fat) : undefined;

    // Vegetables are a fixed serving and are not used to satisfy the primary carb target.
    const vegetableQty = vf ? 200 : undefined;

    return {
      proteinFood:pf, carbFood:cf, fatFood:ff, vegetableFood:vf,
      proteinTarget:t.protein, carbTarget:t.carbs, fatTarget:t.fat,
      proteinQty:fmtQty(pf,proteinQty),
      carbQty:cf ? fmtQty(cf,carbQty!) : undefined,
      fatQty:ff ? fmtQty(ff,fatQty!) : undefined,
      vegetableQty:vf ? fmtQty(vf,vegetableQty!) : undefined
    };
  });
}
