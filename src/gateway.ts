import type { Lang } from './grid.ts';
export function parseCommand(body: string): { num: number; lang: Lang } {
  const s = body.trim().toUpperCase();
  const lang: Lang = /^(AR|ع)\b/.test(s) || /[\u0600-\u06FF]/.test(body) ? 'ar' : 'en';
  const m = s.match(/(\d{3})/);
  const n = m ? Number(m[1]) : 100;
  return { num: n >= 100 && n <= 899 || n === 666 ? n : 100, lang };
}
