
// V39 — Egg display
export function formatEggSource(name:string, qty:number) {
  const n = Math.max(1, Math.round(Number(qty) || 0));
  const lower = name.toLowerCase();
  if (lower.includes("بيض") && (lower.includes("بياض") || lower.includes("white"))) {
    return `${n} بياض بيض`;
  }
  if (lower.includes("بيض") || lower.includes("egg")) {
    return `${n} بيضة كاملة`;
  }
  return `${Math.round(qty)} جم ${name}`;
}
