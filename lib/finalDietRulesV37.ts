
// V37 — Final Diet Display Rules

export function formatEggCount(count:number, type:"whole"|"white") {
  const n = Math.max(1, Math.round(Number(count) || 0));
  return type === "whole" ? `${n} بيضة كاملة` : `${n} بياض بيض`;
}

export type DailyMeal = {
  title:string;
  foods:string[];
  supplements:string[];
};

export function buildIntegratedDailyPlan(args:{
  wake:string[];
  cardio:string[];
  meals:DailyMeal[];
  preWorkout:string[];
  intraWorkout:string[];
  postWorkout:string[];
  water:string;
  salt:string;
}) {
  return {
    wake: args.wake,
    cardio: args.cardio,
    meals: args.meals.map((m,i)=>({
      title:m.title || `🍽️ الوجبة ${i+1}`,
      foods:m.foods,
      supplements:m.supplements
    })),
    preWorkout: args.preWorkout,
    intraWorkout: args.intraWorkout,
    postWorkout: args.postWorkout,
    hydration: [`الماء — ${args.water}`, `الملح — ${args.salt}`]
  };
}
