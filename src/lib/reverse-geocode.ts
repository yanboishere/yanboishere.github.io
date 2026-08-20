export interface PlaceInfo {
  country: string;
  region: string;
  city: string;
}

const cache = new Map<string, PlaceInfo | null>();

function cellKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueParts(country: string, region: string, city: string): PlaceInfo | null {
  if (!country) return null;
  if (region === country) region = "";
  if (city === country || city === region) city = "";
  return { country, region, city };
}

function parsePhoton(data: unknown): PlaceInfo | null {
  if (!data || typeof data !== "object") return null;
  const features = (data as { features?: unknown[] }).features;
  if (!Array.isArray(features) || features.length === 0) return null;
  const props = (features[0] as { properties?: Record<string, unknown> })?.properties;
  if (!props) return null;
  const country = clean(props.country);
  if (!country && !clean(props.countrycode)) return null;
  const region = clean(props.state) || clean(props.county);
  const city = clean(props.city) || clean(props.district) || clean(props.locality) || clean(props.county);
  return uniqueParts(country, region, city);
}

function parseBigDataCloud(data: unknown): PlaceInfo | null {
  if (!data || typeof data !== "object") return null;
  const rec = data as Record<string, unknown>;
  const country = clean(rec.countryName);
  if (!country && !clean(rec.countryCode)) return null;
  const region = clean(rec.principalSubdivision);
  const city = clean(rec.city) || clean(rec.locality);
  return uniqueParts(country, region, city);
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`geocode ${res.status}`);
  return res.json();
}

export async function lookupPlace(lat: number, lng: number): Promise<PlaceInfo | null> {
  const key = cellKey(lat, lng);
  if (cache.has(key)) return cache.get(key) ?? null;

  try {
    const photon = await fetchJson(
      `https://photon.komoot.io/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`
    );
    const parsed = parsePhoton(photon);
    cache.set(key, parsed);
    return parsed;
  } catch {
    try {
      const bdc = await fetchJson(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(String(lat))}&longitude=${encodeURIComponent(String(lng))}&localityLanguage=zh`
      );
      const parsed = parseBigDataCloud(bdc);
      cache.set(key, parsed);
      return parsed;
    } catch {
      return cache.get(key) ?? null;
    }
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function createPlaceTracker(onChange: (place: PlaceInfo | null) => void) {
  let gen = 0;
  let inflight = false;
  let pending: { lat: number; lng: number } | null = null;
  let lastResolved: { lat: number; lng: number } | null = null;
  let lastCell = "";

  const run = async (lat: number, lng: number) => {
    const myGen = gen;
    inflight = true;
    try {
      const info = await lookupPlace(lat, lng);
      if (myGen !== gen) return;
      lastResolved = { lat, lng };
      onChange(info);
    } catch {
      /* keep previous label */
    }
    if (myGen !== gen) return;
    inflight = false;
    if (!pending) return;
    const next = pending;
    pending = null;
    const nextKey = cellKey(next.lat, next.lng);
    if (nextKey === lastCell) return;
    lastCell = nextKey;
    void run(next.lat, next.lng);
  };

  return {
    update(lat: number, lng: number) {
      const key = cellKey(lat, lng);
      if (cache.has(key)) {
        lastResolved = { lat, lng };
        lastCell = key;
        onChange(cache.get(key) ?? null);
        pending = null;
        return;
      }

      if (lastResolved && haversineKm(lastResolved.lat, lastResolved.lng, lat, lng) > 80) {
        onChange(null);
      }

      if (inflight) {
        pending = { lat, lng };
        return;
      }
      if (key === lastCell) return;
      lastCell = key;
      void run(lat, lng);
    },
    cancel() {
      gen += 1;
      inflight = false;
      pending = null;
      lastResolved = null;
      lastCell = "";
    },
  };
}
