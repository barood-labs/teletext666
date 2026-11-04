const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 10 * 60 * 1000;

export interface FetchOpts {
  /** request timeout in ms (default 4000, R1) */
  timeout?: number;
  /** response decoder; default `res.json()`, RSS callers pass `res.text()` */
  parse?: (res: Response) => Promise<unknown>;
}

// Signature stays (url, timeoutMs=4000)-compatible: a trailing optional `opts`
// object so the existing JSON callers (weather/prayer/quakes) are byte-for-byte
// unchanged — they call cachedFetch(url) and get res.json() with a 4 s timeout.
export async function cachedFetch<T = any>(url: string, opts: FetchOpts = {}): Promise<T> {
  const timeoutMs = opts.timeout ?? 4000;
  const parse = opts.parse ?? ((res: Response) => res.json());
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL) return hit.data as T;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { 'user-agent': 'teletext666/0.1' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await parse(res);
    cache.set(url, { at: Date.now(), data });
    return data as T;
  } catch (e) {
    // stale-on-error (R3): serve the last good copy if we have one
    if (hit) return hit.data as T;
    throw e;
  }
}

// test hook: clear the in-memory cache so offline/failure cases are deterministic
export function resetCache(): void { cache.clear(); }
export const CITIES: Record<string, { name: string; ar: string; lat: number; lon: number; tz: string; country: string }> = {
  boise: { name: 'Boise', ar: 'بويزي', lat: 43.615, lon: -116.2023, tz: 'America/Boise', country: 'US' },
  london: { name: 'London', ar: 'لندن', lat: 51.5072, lon: -0.1276, tz: 'Europe/London', country: 'GB' },
  amman: { name: 'Amman', ar: 'عمّان', lat: 31.9539, lon: 35.9106, tz: 'Asia/Amman', country: 'JO' },
  cairo: { name: 'Cairo', ar: 'القاهرة', lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo', country: 'EG' },
  gaza: { name: 'Gaza', ar: 'غزة', lat: 31.5017, lon: 34.4668, tz: 'Asia/Gaza', country: 'PS' },
  beirut: { name: 'Beirut', ar: 'بيروت', lat: 33.8938, lon: 35.5018, tz: 'Asia/Beirut', country: 'LB' },
};
export function city(q?: string | null) { return CITIES[(q || 'amman').toLowerCase()] ?? CITIES.amman; }
