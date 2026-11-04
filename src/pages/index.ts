import type { Lang, PageSource } from '../grid.ts';
import { about, graveyard, index } from './static.ts';
import { news, prayer, quakes, weather } from './live.ts';

type Builder = (lang: Lang, q: URLSearchParams) => PageSource | Promise<PageSource>;
export const PAGES: Record<number, { en: string; ar: string; build: Builder }> = {
  100: { en: 'Index', ar: 'الفهرس', build: index },
  101: { en: 'About', ar: 'عن الخدمة', build: about },
  200: { en: 'News', ar: 'الأخبار', build: news },
  300: { en: 'Weather', ar: 'الطقس', build: weather },
  400: { en: 'Prayer times', ar: 'مواقيت الصلاة', build: prayer },
  666: { en: 'Graveyard', ar: 'المقبرة', build: graveyard },
  888: { en: 'Quake alerts', ar: 'تنبيهات', build: quakes },
};
export async function getPage(num: number, lang: Lang, q = new URLSearchParams()): Promise<PageSource> {
  return (PAGES[num] ?? PAGES[100]).build(lang, q);
}
