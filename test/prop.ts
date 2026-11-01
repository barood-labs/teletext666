export function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; }; }
const EN = 'the flood warning shelter water road closed open clinic 2G page 12:45 -3C km/h'.split(' ');
const AR = 'الفجر الظهر مطر ملجأ ماء طريق مغلق مفتوح عيادة صفحة 12:45 مُستَشفى'.split(' ');
export function sentence(r: () => number, ar: boolean): string {
  const words = ar ? AR : EN; const n = 1 + Math.floor(r() * 30); const out: string[] = [];
  for (let i = 0; i < n; i++) { let w = words[Math.floor(r() * words.length)]; if (r() < .05) w = w.repeat(8); if (r() < .2) w = '{' + 'rgyc'[Math.floor(r() * 4)] + '}' + w; out.push(w); }
  return out.join(' ');
}
