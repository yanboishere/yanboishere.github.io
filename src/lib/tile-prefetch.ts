/**
 * Keyless basemap tiles plus a session-wide shared tile cache.
 *
 * CARTO started watermarking anonymous basemap requests with "API KEY
 * REQUIRED", so the map now uses OpenStreetMap (light) and Esri's World Dark
 * Gray canvas (dark) — both served without an API key.
 *
 * The cache is shared between the embedded home map, the fullscreen theater
 * and the background prefetch that starts when a visitor lands on the site,
 * so each tile is downloaded at most once per session even across routes.
 */
import {
  buildCameraTrack,
  collectJourneyTiles,
  overviewCamera,
  tileKey,
  type JourneyRoute,
  type TileCoord,
} from "@/lib/journey";
import type { TileCache } from "@/lib/journey-canvas";

export const LIGHT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const DARK_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
export const MAP_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://www.esri.com/">Esri</a>';

const TILE_TIMEOUT_MS = 8000;

export function tileUrl(tile: TileCoord, dark: boolean): string {
  const template = dark ? DARK_TILE_URL : LIGHT_TILE_URL;
  return template
    .replace("{z}", String(tile.z))
    .replace("{x}", String(tile.x))
    .replace("{y}", String(tile.y));
}

const caches: Record<"light" | "dark", TileCache> = { light: new Map(), dark: new Map() };
const pending = new Map<string, Promise<HTMLImageElement | null>>();

export function sharedTileCache(dark: boolean): TileCache {
  return dark ? caches.dark : caches.light;
}

function loadTileImage(tile: TileCoord, dark: boolean): Promise<HTMLImageElement | null> {
  const key = tileKey(tile.z, tile.x, tile.y);
  const id = `${dark ? "d" : "l"}:${key}`;
  const inflight = pending.get(id);
  if (inflight) return inflight;

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      pending.delete(id);
      if (ok && img.complete && img.naturalWidth > 0) {
        sharedTileCache(dark).set(key, img);
        resolve(img);
      } else {
        resolve(null);
      }
    };
    const timer = window.setTimeout(() => done(false), TILE_TIMEOUT_MS);
    img.onload = () => done(true);
    img.onerror = () => done(false);
    img.src = tileUrl(tile, dark);
  });
  pending.set(id, promise);
  return promise;
}

export interface LoadTilesOptions {
  concurrency?: number;
  signal?: AbortSignal;
  onProgress?: (loaded: number, total: number) => void;
}

/**
 * Ensure every listed tile is in the shared cache. Already-cached tiles count
 * as loaded immediately, in-flight downloads are deduplicated, and an abort
 * resolves early without cancelling downloads that already started (they keep
 * warming the shared cache). Resolves with the shared cache for that mode.
 */
export function loadJourneyTiles(
  tiles: TileCoord[],
  dark: boolean,
  options: LoadTilesOptions = {}
): Promise<TileCache> {
  const { concurrency = 8, signal, onProgress } = options;
  const cache = sharedTileCache(dark);

  const unique = new Map<string, TileCoord>();
  for (const tile of tiles) unique.set(tileKey(tile.z, tile.x, tile.y), tile);
  const missing = [...unique.entries()].filter(([key]) => !cache.has(key)).map(([, tile]) => tile);

  const total = unique.size;
  let finished = total - missing.length;
  onProgress?.(finished, total);
  if (missing.length === 0 || signal?.aborted) return Promise.resolve(cache);

  return new Promise((resolve) => {
    let nextIndex = 0;
    let active = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      resolve(cache);
    };

    const tick = () => {
      if (done) return;
      if (signal?.aborted || finished >= total) {
        finish();
        return;
      }
      while (active < concurrency && nextIndex < missing.length) {
        const tile = missing[nextIndex++];
        active += 1;
        void loadTileImage(tile, dark).then(() => {
          active -= 1;
          finished += 1;
          if (!done && !signal?.aborted) onProgress?.(finished, total);
          tick();
        });
      }
    };

    tick();
  });
}

/** Union of the journey tile sets for several viewport sizes, deduplicated. */
export function journeyTilesForSizes(
  route: JourneyRoute,
  sizes: Array<[number, number]>
): TileCoord[] {
  const seen = new Set<string>();
  const tiles: TileCoord[] = [];
  for (const [width, height] of sizes) {
    if (width <= 0 || height <= 0) continue;
    const track = buildCameraTrack(route, width, height);
    const overview = overviewCamera(route, width, height);
    for (const tile of collectJourneyTiles(track, overview, width, height)) {
      const key = tileKey(tile.z, tile.x, tile.y);
      if (seen.has(key)) continue;
      seen.add(key);
      tiles.push(tile);
    }
  }
  return tiles;
}

/**
 * Background prefetch stops at this zoom: it keeps the entry download modest
 * (~a few MB) while still giving every journey segment a base layer, since the
 * playback canvas upgrades tiles as the detail zooms stream in during play.
 */
export const PREFETCH_MAX_ZOOM = 6;

/** Below this count just load everything up front (small filtered journeys). */
const STREAM_THRESHOLD = 320;
/** Zoom levels fully loaded before playback starts. */
const BASE_ZOOM = 5;
/** Tiles at the head of the camera track loaded before playback starts. */
const HEAD_TILES = 100;
/** Must stay within journey-canvas coveringTile's 4-level parent walk. */
const FALLBACK_LEVELS = 4;

export interface JourneyTileSplit {
  blocking: TileCoord[];
  streaming: TileCoord[];
}

/**
 * Split a journey tile list (already in camera-track order) into the small set
 * playback must wait for and the rest, which can stream in during playback.
 * The blocking set keeps low zooms, the start of the track, and one ancestor
 * for every streamed tile so the canvas always has a fallback to draw.
 */
export function splitJourneyTiles(tiles: TileCoord[]): JourneyTileSplit {
  if (tiles.length <= STREAM_THRESHOLD) return { blocking: [...tiles], streaming: [] };

  const blockingKeys = new Set<string>();
  const blocking: TileCoord[] = [];
  const addBlocking = (tile: TileCoord) => {
    const key = tileKey(tile.z, tile.x, tile.y);
    if (blockingKeys.has(key)) return;
    blockingKeys.add(key);
    blocking.push(tile);
  };

  tiles.forEach((tile, index) => {
    if (index < HEAD_TILES || tile.z <= BASE_ZOOM) addBlocking(tile);
  });
  const streaming = tiles.filter((tile) => !blockingKeys.has(tileKey(tile.z, tile.x, tile.y)));
  for (const tile of streaming) {
    const ancestorZoom = Math.max(2, tile.z - FALLBACK_LEVELS);
    if (ancestorZoom >= tile.z) continue;
    const scale = 2 ** (tile.z - ancestorZoom);
    addBlocking({ z: ancestorZoom, x: Math.floor(tile.x / scale), y: Math.floor(tile.y / scale) });
  }
  return { blocking, streaming };
}

/** Skip the background prefetch on data-saver or very slow connections. */
export function connectionAllowsPrefetch(): boolean {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const conn = nav.connection;
  if (!conn) return true;
  if (conn.saveData) return false;
  if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") return false;
  return true;
}
