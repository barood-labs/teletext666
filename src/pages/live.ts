import type { Lang, PageSource } from '../grid.ts';
import { cachedFetch, city } from '../feeds/fetch.ts';

const offAir = (num: number, lang: Lang, src: string): PageSource => ({ num, lang, title: lang === 'ar' ? 'خارج البث' : 'OFF AIR',
  lines: lang === 'ar' ? ['{r}المصدر غير متاح الآن', `{w}${src}`, '', '{w}حاول لاحقاً.'] : ['{r}SOURCE OFF AIR', `{w}${src} is not responding.`, '', '{w}Try again shortly.'] });

const WMO: Record<number, [string, string]> = { 0: ['Clear', 'صافٍ'], 1: ['Mostly clear', 'صافٍ غالباً'], 2: ['Partly cloudy', 'غائم جزئياً'], 3: ['Overcast', 'غائم'], 45: ['Fog', 'ضباب'], 48: ['Fog', 'ضباب'], 51: ['Drizzle', 'رذاذ'], 61: ['Rain', 'مطر'], 63: ['Rain', 'مطر'], 65: ['Heavy rain', 'مطر غزير'], 71: ['Snow', 'ثلج'], 80: ['Showers', 'زخات'], 95: ['Thunder', 'رعد'] };
const wmo = (c: number, lang: Lang) => (WMO[c] ?? WMO[Math.floor(c / 10) * 10] ?? ['?', '?'])[lang === 'ar' ? 1 : 0];

export async function weather(lang: Lang, q: URLSearchParams): Promise<PageSource> {
  const c = city(q.get('city'));
  try {
    const d = await cachedFetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(c.tz)}&forecast_days=5`);
    const cur = d.current, dl = d.daily;
    const days = dl.time.map((t: string, i: number) => `{w}${t.slice(5)} {c}${String(Math.round(dl.temperature_2m_min[i])).padStart(3)}/${String(Math.round(dl.temperature_2m_max[i])).padStart(3)}C {w}${wmo(dl.weather_code[i], lang)}`);
    return lang === 'ar' ? { num: 300, lang, title: 'الطقس', lines: [`{y}الطقس في ${c.ar}`, '', `{w}الآن: {c}${Math.round(cur.temperature_2m)}C {w}${wmo(cur.weather_code, lang)}`, `{w}الرياح: ${Math.round(cur.wind_speed_10m)} كم/س`, '', '{g}توقعات 5 أيام', ...days, '', '{w}المصدر: Open-Meteo'] }
      : { num: 300, lang, title: 'WEATHER', lines: [`{y}WEATHER ${c.name.toUpperCase()}`, '', `{w}Now: {c}${Math.round(cur.temperature_2m)}C {w}${wmo(cur.weather_code, lang)}`, `{w}Wind: ${Math.round(cur.wind_speed_10m)} km/h`, '', '{g}5-DAY OUTLOOK', ...days, '', '{w}Source: Open-Meteo'] };
  } catch { return offAir(300, lang, 'Open-Meteo'); }
}

export async function prayer(lang: Lang, q: URLSearchParams): Promise<PageSource> {
  const c = city(q.get('city'));
  try {
    const d = await cachedFetch(`https://api.aladhan.com/v1/timings?latitude=${c.lat}&longitude=${c.lon}&method=3`);
    const t = d.data.timings, h = d.data.date.hijri;
    const names: [string, string, string][] = [['Fajr', 'Fajr', 'الفجر'], ['Sunrise', 'Sunrise', 'الشروق'], ['Dhuhr', 'Dhuhr', 'الظهر'], ['Asr', 'Asr', 'العصر'], ['Maghrib', 'Maghrib', 'المغرب'], ['Isha', 'Isha', 'العشاء']];
    const rows = names.map(([k, en, ar]) => lang === 'ar' ? `{w}${ar.padEnd(8)} {y}${t[k]}` : `{w}${en.padEnd(8)} {y}${t[k]}`);
    return lang === 'ar' ? { num: 400, lang, title: 'مواقيت الصلاة', lines: [`{y}مواقيت الصلاة - ${c.ar}`, `{c}${h.day} ${h.month.ar} ${h.year}`, '', ...rows, '', '{w}المصدر: Aladhan'] }
      : { num: 400, lang, title: 'PRAYER TIMES', lines: [`{y}PRAYER TIMES ${c.name.toUpperCase()}`, `{c}${h.day} ${h.month.en} ${h.year} AH`, '', ...rows, '', '{w}Source: Aladhan (MWL)'] };
  } catch { return offAir(400, lang, 'Aladhan'); }
}

export async function quakes(lang: Lang): Promise<PageSource> {
  try {
    const d = await cachedFetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson');
    const fs = d.features.slice(0, 12).map((f: any) => {
      const m = f.properties.mag.toFixed(1), at = new Date(f.properties.time).toISOString().slice(11, 16);
      const place = String(f.properties.place || '').replace(/^\d+ km [NSEW]+ of /, '');
      return `{${f.properties.mag >= 6 ? 'r' : 'y'}}M${m} {w}${at} ${place}`;
    });
    return { num: 888, lang, title: lang === 'ar' ? 'تنبيهات' : 'ALERTS', lines: [
      lang === 'ar' ? '{r}زلازل 4.5+ آخر 24 ساعة (UTC)' : '{r}QUAKES M4.5+ LAST 24H (UTC)', '',
      ...(fs.length ? fs : [lang === 'ar' ? '{g}لا توجد زلازل كبيرة' : '{g}No major quakes.']), '', lang === 'ar' ? '{w}المصدر: USGS' : '{w}Source: USGS'] };
  } catch { return offAir(888, lang, 'USGS'); }
}
