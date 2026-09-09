
// V39 — Clean Coach Preview
export type PreviewMeal = {
  number:number;
  label?:string;
  foods:string[];
  supplements?:string[];
};

export function renderCoachDay(args:{
  type:string;
  kcal:number;
  protein:number;
  carbs:number;
  fat:number;
  water:string;
  salt:string;
  wake:string[];
  cardio?:string;
  meals:PreviewMeal[];
  preWorkout?:string[];
  intraWorkout?:string[];
  postWorkout?:string[];
  evening?:string[];
}) {
  const out:string[] = [];

  out.push(`━━━━━━━━ ${args.type} ━━━━━━━━`);
  out.push(`${args.kcal} kcal | P ${args.protein} g | C ${args.carbs} g | F ${args.fat} g`);
  out.push(`الماء ${args.water} | الملح ${args.salt}`);
  out.push("");

  if (args.wake.length) {
    out.push("🌅 عند الاستيقاظ");
    args.wake.forEach(x => out.push(`• ${x}`));
  }

  if (args.cardio) {
    out.push(`🏃‍♂️ LISS Cardio — ${args.cardio}`);
  }

  args.meals.forEach((m) => {
    out.push("");
    out.push(`🍽️ الوجبة ${m.number}${m.label ? ` — ${m.label}` : ""}`);
    m.foods.forEach(x => out.push(`• ${x}`));
    if (m.supplements?.length) {
      out.push("💊 المكملات");
      m.supplements.forEach(x => out.push(`• ${x}`));
    }
  });

  if (args.preWorkout?.length) {
    out.push("");
    out.push("💊 قبل التمرين");
    args.preWorkout.forEach(x => out.push(`• ${x}`));
  }

  if (args.intraWorkout?.length) {
    out.push("");
    out.push("🏋️ أثناء التمرين");
    args.intraWorkout.forEach(x => out.push(`• ${x}`));
  }

  if (args.postWorkout?.length) {
    out.push("");
    out.push("💊 بعد التمرين");
    args.postWorkout.forEach(x => out.push(`• ${x}`));
  }

  if (args.evening?.length) {
    out.push("");
    out.push("🌙 المساء");
    args.evening.forEach(x => out.push(`• ${x}`));
  }

  return out.join("\n");
}
