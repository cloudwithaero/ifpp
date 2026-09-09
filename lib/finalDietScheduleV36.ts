
// V36 — Final Diet Preview / Max Layout
// Eggs and egg whites are count-based in display.
// Supplements are grouped by timing exactly like the coach's template.

export type ScheduleBlock = {
  title: string;
  items: string[];
};

export function formatEggFood(name: string, count: number, whole = false) {
  const n = Math.max(1, Math.round(count));
  return whole ? `${n} بيضة كاملة` : `${n} بياض بيض`;
}

export function buildFinalDaySchedule(opts: {
  wakeItems?: string[];
  cardio?: string;
  meals: Array<{
    title?: string;
    foods: string[];
    supplements?: string[];
  }>;
  preWorkout?: string[];
  intraWorkout?: string[];
  postWorkout?: string[];
  water?: string;
  salt?: string;
}): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];

  if (opts.wakeItems?.length) blocks.push({
    title: "🌅 عند الاستيقاظ",
    items: opts.wakeItems
  });

  if (opts.cardio) blocks.push({
    title: "🏃‍♂️ الكارديو",
    items: [opts.cardio]
  });

  opts.meals.forEach((meal, i) => {
    const items = [...meal.foods];
    if (meal.supplements?.length) items.push(...meal.supplements);
    blocks.push({
      title: meal.title || `🍽️ الوجبة ${i + 1}`,
      items
    });
  });

  if (opts.preWorkout?.length) blocks.push({
    title: "💊 قبل التمرين",
    items: opts.preWorkout
  });

  if (opts.intraWorkout?.length) blocks.push({
    title: "🏋️ أثناء التمرين",
    items: opts.intraWorkout
  });

  if (opts.postWorkout?.length) blocks.push({
    title: "💊 بعد التمرين",
    items: opts.postWorkout
  });

  const hydration: string[] = [];
  if (opts.water) hydration.push(`الماء — ${opts.water}`);
  if (opts.salt) hydration.push(`الملح — ${opts.salt}`);
  if (hydration.length) blocks.push({
    title: "💧 الماء والملح",
    items: hydration
  });

  return blocks;
}
