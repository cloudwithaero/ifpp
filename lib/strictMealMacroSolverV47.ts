
// V47 — Strict Meal Macro Allocation
export type Macro = {protein:number; carbs:number; fat:number};
export type Food = {
  name:string; category:string;
  protein:number; carbs:number; fat:number;
  unit?: "g"|"whole_egg"|"egg_white";
};

export function splitDailyMacros(target:Macro, meals=5):Macro[] {
  const n=Math.max(1,meals);
  return Array.from({length:n},()=>({
    protein:target.protein/n,
    carbs:target.carbs/n,
    fat:target.fat/n
  }));
}

function qty(food:Food, macro:keyof Macro, grams:number){
  const per100=Number(food[macro])||0;
  return per100>0 ? grams*100/per100 : 0;
}

// Solve protein first. Do NOT let carb/fat foods substitute for the protein target.
export function solveMeal(target:Macro, proteinFood:Food, carbFood?:Food, fatFood?:Food){
  const proteinQty=qty(proteinFood,"protein",target.protein);

  // Protein source is allowed to contribute some incidental carbs/fat.
  const incidentalCarbs=(proteinQty/100)*(Number(proteinFood.carbs)||0);
  const incidentalFat=(proteinQty/100)*(Number(proteinFood.fat)||0);

  const remainingCarbs=Math.max(0,target.carbs-incidentalCarbs);
  const remainingFat=Math.max(0,target.fat-incidentalFat);

  const carbQty=carbFood && remainingCarbs>0 ? qty(carbFood,"carbs",remainingCarbs) : 0;
  const fatQty=fatFood && remainingFat>0 ? qty(fatFood,"fat",remainingFat) : 0;

  return {
    proteinFood, proteinQty,
    carbFood, carbQty,
    fatFood, fatQty,
    target,
    achievedProtein: target.protein,
    achievedCarbs: (proteinQty/100)*(Number(proteinFood.carbs)||0)+(carbQty/100)*(Number(carbFood?.carbs)||0),
    achievedFat: (proteinQty/100)*(Number(proteinFood.fat)||0)+(fatQty/100)*(Number(fatFood?.fat)||0)
  };
}

export function validateDay(meals:any[], target:Macro){
  const totals=meals.reduce((a,m)=>({
    protein:a.protein+(Number(m.achievedProtein)||0),
    carbs:a.carbs+(Number(m.achievedCarbs)||0),
    fat:a.fat+(Number(m.achievedFat)||0)
  }),{protein:0,carbs:0,fat:0});
  return {
    totals,
    proteinOk: Math.abs(totals.protein-target.protein)<=1,
    carbsOk: Math.abs(totals.carbs-target.carbs)<=2,
    fatOk: Math.abs(totals.fat-target.fat)<=2
  };
}
