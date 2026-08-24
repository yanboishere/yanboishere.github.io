/**
 * Journey motion model from mahlernim/google-timeline-visualizer (MIT),
 * matching the Android TimelinePainter / JourneyTiming defaults:
 * distance-based timing, great-circle hops, balanced long-trip compression,
 * time-window trail, and a steady camera with a dead zone.
 */

export type LatLng = [number, number];

export const JOURNEY_DURATION_MS = 300_000;
export const OUTRO_TRANSITION_MS = 1000;
export const HOLD_MS = 500;
export const CAMERA_DEAD_ZONE = 0.2;
export const TRAIL_VISIBLE_SECONDS = 2.5;
export const MIN_TRAIL_KM = 80;
export const MAX_TRAIL_KM = 2000;
export const TRAIL_OLD_END = 0.45;
export const TRAIL_MIDDLE_END = 0.75;
export const OVERVIEW_ROUTE_ALPHA = 190 / 255;
export const OVERVIEW_PADDING = 1.22;
export const MAX_RENDER_STEP_KM = 75;
export const MAX_STEPS_PER_SEGMENT = 320;

export const STEADY_CAMERA = {
  contextKm: 650,
  padding: 2.8,
  zoomOutAlpha: 0.14,
  zoomInAlpha: 0.035,
  minViewportSpan: 0.0006,
  maxViewportSpan: 0.72,
  minZoom: 2,
  maxZoom: 15,
};

const COMPRESSION_EXPONENT = 0.85;
const MAX_LATITUDE = 85.05112878;

export interface RenderSample {
  coord: LatLng;
  km: number;
}

export interface JourneyRoute {
  coords: LatLng[];
  timestamps: number[];
  cumDist: number[];
  totalKm: number;
  samples: RenderSample[];
  distanceAt: (progress: number) => number;
}

export interface WorldCamera {
  centerX: number;
  centerY: number;
  spanY: number;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Spherical interpolation so long hops sweep instead of teleporting. */
export function interpolateLatLng(a: LatLng, b: LatLng, fraction: number): LatLng {
  if (fraction <= 0) return a;
  if (fraction >= 1) return b;

  const p1 = (a[0] * Math.PI) / 180;
  const l1 = (a[1] * Math.PI) / 180;
  const p2 = (b[0] * Math.PI) / 180;
  const l2 = (b[1] * Math.PI) / 180;

  const ax = Math.cos(p1) * Math.cos(l1);
  const ay = Math.cos(p1) * Math.sin(l1);
  const az = Math.sin(p1);
  const bx = Math.cos(p2) * Math.cos(l2);
  const by = Math.cos(p2) * Math.sin(l2);
  const bz = Math.sin(p2);

  const dot = Math.max(-1, Math.min(1, ax * bx + ay * by + az * bz));
  const omega = Math.acos(dot);
  let left: number;
  let right: number;
  if (Math.sin(omega) < 1e-8) {
    left = 1 - fraction;
    right = fraction;
  } else {
    left = Math.sin((1 - fraction) * omega) / Math.sin(omega);
    right = Math.sin(fraction * omega) / Math.sin(omega);
  }

  const x = left * ax + right * bx;
  const y = left * ay + right * by;
  const z = left * az + right * bz;
  return [
    (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI,
    (Math.atan2(y, x) * 180) / Math.PI,
  ];
}

export function bisectLeft(arr: number[], value: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function positionAtDistance(route: JourneyRoute, distanceKm: number): LatLng {
  const { cumDist, coords } = route;
  if (coords.length === 0) return [0, 0];
  if (coords.length === 1 || route.totalKm <= 0) return coords[0];

  const distance = Math.max(0, Math.min(route.totalKm, distanceKm));
  const toIndex = Math.min(Math.max(bisectLeft(cumDist, distance), 1), cumDist.length - 1);
  const segment = cumDist[toIndex] - cumDist[toIndex - 1];
  const fraction = segment <= 0 ? 0 : (distance - cumDist[toIndex - 1]) / segment;
  return interpolateLatLng(coords[toIndex - 1], coords[toIndex], fraction);
}

export function indexAtDistance(cumDist: number[], distanceKm: number): number {
  if (cumDist.length === 0) return 0;
  return Math.min(Math.max(bisectLeft(cumDist, distanceKm) - 1, 0), cumDist.length - 1);
}

function endpointSlope(firstWidth: number, secondWidth: number, first: number, second: number): number {
  const slope = ((2 * firstWidth + secondWidth) * first - firstWidth * second) / (firstWidth + secondWidth);
  if (slope <= 0) return 0;
  return Math.min(slope, 3 * first);
}

function monotoneSlopes(xValues: number[], yValues: number[]): number[] {
  const count = xValues.length - 1;
  const delta = Array.from({ length: count }, (_, i) => {
    const dx = xValues[i + 1] - xValues[i];
    if (dx <= 0) return 0;
    return (yValues[i + 1] - yValues[i]) / dx;
  });
  if (count === 1) return [delta[0], delta[0]];

  const slopes = new Array<number>(xValues.length).fill(0);
  slopes[0] = endpointSlope(xValues[1] - xValues[0], xValues[2] - xValues[1], delta[0], delta[1]);
  for (let i = 1; i < xValues.length - 1; i++) {
    const beforeWidth = xValues[i] - xValues[i - 1];
    const afterWidth = xValues[i + 1] - xValues[i];
    const d0 = delta[i - 1];
    const d1 = delta[i];
    if (d0 === 0 || d1 === 0) {
      slopes[i] = 0;
      continue;
    }
    const weightBefore = 2 * afterWidth + beforeWidth;
    const weightAfter = afterWidth + 2 * beforeWidth;
    slopes[i] = (weightBefore + weightAfter) / (weightBefore / d0 + weightAfter / d1);
  }
  slopes[slopes.length - 1] = endpointSlope(
    xValues[xValues.length - 1] - xValues[xValues.length - 2],
    xValues[xValues.length - 2] - xValues[xValues.length - 3],
    delta[delta.length - 1],
    delta[delta.length - 2]
  );
  return slopes;
}

function buildJourneyTiming(cumDist: number[]): (progress: number) => number {
  const totalKm = cumDist.length ? cumDist[cumDist.length - 1] : 0;
  if (cumDist.length < 2 || totalKm <= 0) {
    return (progress) => totalKm * Math.max(0, Math.min(1, progress));
  }

  const distances = [0];
  const effective = [0];
  let effectiveTotal = 0;
  for (let i = 1; i < cumDist.length; i++) {
    const segment = cumDist[i] - cumDist[i - 1];
    if (segment <= 0) continue;
    effectiveTotal += segment ** COMPRESSION_EXPONENT;
    distances.push(cumDist[i]);
    effective.push(effectiveTotal);
  }
  if (effectiveTotal <= 0 || distances.length < 2) {
    return (progress) => totalKm * Math.max(0, Math.min(1, progress));
  }

  const xValues = effective.map((value) => value / effectiveTotal);
  const slopes = monotoneSlopes(xValues, distances);

  return (progress: number) => {
    const elapsed = Math.max(0, Math.min(1, progress));
    const toIndex = Math.min(Math.max(bisectLeft(xValues, elapsed), 1), xValues.length - 1);
    const fromIndex = toIndex - 1;
    const width = xValues[toIndex] - xValues[fromIndex];
    const t = width <= 0 ? 0 : (elapsed - xValues[fromIndex]) / width;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * distances[fromIndex] +
      (t3 - 2 * t2 + t) * width * slopes[fromIndex] +
      (-2 * t3 + 3 * t2) * distances[toIndex] +
      (t3 - t2) * width * slopes[toIndex]
    );
  };
}

function renderSteps(segmentKm: number): number {
  return Math.min(MAX_STEPS_PER_SEGMENT, Math.max(1, Math.ceil(segmentKm / MAX_RENDER_STEP_KM)));
}

function buildRenderSamples(coords: LatLng[], cumDist: number[]): RenderSample[] {
  if (coords.length === 0) return [];
  const samples: RenderSample[] = [{ coord: coords[0], km: 0 }];
  for (let i = 1; i < coords.length; i++) {
    const hop = cumDist[i] - cumDist[i - 1];
    const steps = renderSteps(hop);
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      samples.push({
        coord: interpolateLatLng(coords[i - 1], coords[i], t),
        km: cumDist[i - 1] + hop * t,
      });
    }
  }
  return samples;
}

export function buildRoute(points: Array<[number, number, number]>): JourneyRoute | null {
  if (points.length === 0) return null;

  const coords: LatLng[] = [];
  const timestamps: number[] = [];
  const cumDist = [0];
  let total = 0;

  for (let i = 0; i < points.length; i++) {
    coords.push([points[i][0], points[i][1]]);
    timestamps.push(points[i][2]);
    if (i === 0) continue;
    total += haversineKm(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
    cumDist.push(total);
  }

  return {
    coords,
    timestamps,
    cumDist,
    totalKm: total,
    samples: buildRenderSamples(coords, cumDist),
    distanceAt: buildJourneyTiming(cumDist),
  };
}

function sampleIndexAtKm(samples: RenderSample[], km: number): number {
  let lo = 0;
  let hi = samples.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].km < km) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function pathBetweenDistances(route: JourneyRoute, startKm: number, endKm: number): LatLng[] {
  if (endKm <= startKm || route.samples.length === 0) return [];
  const start = Math.max(0, startKm);
  const end = Math.min(route.totalKm, endKm);
  const from = sampleIndexAtKm(route.samples, start);
  const to = sampleIndexAtKm(route.samples, end);
  const pts: LatLng[] = [positionAtDistance(route, start)];
  for (let i = from; i < to; i++) {
    const coord = route.samples[i].coord;
    const last = pts[pts.length - 1];
    if (coord[0] !== last[0] || coord[1] !== last[1]) pts.push(coord);
  }
  const head = positionAtDistance(route, end);
  const last = pts[pts.length - 1];
  if (head[0] !== last[0] || head[1] !== last[1]) pts.push(head);
  return pts.length >= 2 ? pts : [head, head];
}

export function trailWindowKm(totalKm: number, durationSeconds = JOURNEY_DURATION_MS / 1000): number {
  if (totalKm <= 0) return 0;
  const distance = (totalKm * TRAIL_VISIBLE_SECONDS) / Math.max(1, durationSeconds);
  return Math.min(totalKm, Math.max(MIN_TRAIL_KM, Math.min(MAX_TRAIL_KM, distance)));
}

export function trailRanges(currentKm: number, windowKm: number) {
  const trailStart = Math.max(0, currentKm - windowKm);
  const visible = Math.max(0, currentKm - trailStart);
  return {
    old: [trailStart, trailStart + visible * TRAIL_OLD_END] as const,
    middle: [trailStart + visible * TRAIL_OLD_END, trailStart + visible * TRAIL_MIDDLE_END] as const,
    recent: [trailStart + visible * TRAIL_MIDDLE_END, currentKm] as const,
  };
}

export function durationMsForScope(): number {
  return JOURNEY_DURATION_MS;
}

export function contextKmForScope(): number {
  return STEADY_CAMERA.contextKm;
}

export function formatJourneyMonth(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeOutCubic(t: number): number {
  const inverse = 1 - Math.max(0, Math.min(1, t));
  return 1 - inverse * inverse * inverse;
}

export function easeInOutCubic(t: number): number {
  const amount = Math.max(0, Math.min(1, t));
  if (amount < 0.5) return 4 * amount * amount * amount;
  const inverse = -2 * amount + 2;
  return 1 - (inverse * inverse * inverse) / 2;
}

export function projectWorld(lat: number, lng: number): { x: number; y: number } {
  const clamped = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat));
  const x = (lng + 180) / 360;
  const sinLat = Math.sin((clamped * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
  return { x, y: Math.max(0, Math.min(1, y)) };
}

export function unprojectWorld(x: number, y: number): LatLng {
  const lng = x * 360 - 180;
  const n = Math.PI * (1 - 2 * y);
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return [lat, lng];
}

export function unwrapNear(value: number, reference: number): number {
  let result = value;
  while (result - reference > 0.5) result -= 1;
  while (result - reference < -0.5) result += 1;
  return result;
}

function clampCenterY(centerY: number, spanY: number): number {
  const half = spanY / 2;
  if (half >= 0.5) return 0.5;
  return Math.min(Math.max(centerY, half), 1 - half);
}

export function rawSteadyCamera(
  route: JourneyRoute,
  currentKm: number,
  width: number,
  height: number
): WorldCamera {
  const current = positionAtDistance(route, currentKm);
  const center = projectWorld(current[0], current[1]);
  const contextKm = STEADY_CAMERA.contextKm;
  const tailKm = Math.max(0, currentKm - contextKm);
  const lookKm = Math.min(route.totalKm, currentKm + contextKm);

  let minX = center.x;
  let maxX = center.x;
  let minY = center.y;
  let maxY = center.y;

  const include = (lat: number, lng: number) => {
    const p = projectWorld(lat, lng);
    const x = unwrapNear(p.x, center.x);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  };

  include(...positionAtDistance(route, tailKm));
  include(...positionAtDistance(route, lookKm));

  const from = sampleIndexAtKm(route.samples, tailKm);
  const to = sampleIndexAtKm(route.samples, lookKm);
  const step = Math.max(1, Math.ceil((to - from) / 240));
  for (let i = from; i < to; i += step) {
    include(route.samples[i].coord[0], route.samples[i].coord[1]);
  }

  const contentSpanX = Math.max(0.00015, maxX - minX);
  const contentSpanY = Math.max(0.00015, maxY - minY);
  const aspect = width / Math.max(height, 1);
  let spanY = Math.max(contentSpanY * STEADY_CAMERA.padding, (contentSpanX * STEADY_CAMERA.padding) / aspect);
  spanY = Math.min(Math.max(spanY, STEADY_CAMERA.minViewportSpan), STEADY_CAMERA.maxViewportSpan);

  return { centerX: center.x, centerY: clampCenterY(center.y, spanY), spanY };
}

export function stepSteadyCamera(
  prev: WorldCamera,
  raw: WorldCamera,
  marker: LatLng,
  width: number,
  height: number
): WorldCamera {
  const aspect = width / Math.max(height, 1);
  const alpha = raw.spanY > prev.spanY ? STEADY_CAMERA.zoomOutAlpha : STEADY_CAMERA.zoomInAlpha;
  const spanY = Math.exp(Math.log(prev.spanY) + (Math.log(raw.spanY) - Math.log(prev.spanY)) * alpha);
  const clampedSpan = Math.min(Math.max(spanY, STEADY_CAMERA.minViewportSpan), STEADY_CAMERA.maxViewportSpan);
  const spanX = clampedSpan * aspect;
  const markerWorld = projectWorld(marker[0], marker[1]);
  const markerX = unwrapNear(markerWorld.x, prev.centerX);
  let centerX = prev.centerX;
  let centerY = prev.centerY;
  const deadX = spanX * CAMERA_DEAD_ZONE;
  const deadY = clampedSpan * CAMERA_DEAD_ZONE;
  if (markerX < centerX - deadX) centerX = markerX + deadX;
  else if (markerX > centerX + deadX) centerX = markerX - deadX;
  if (markerWorld.y < centerY - deadY) centerY = markerWorld.y + deadY;
  else if (markerWorld.y > centerY + deadY) centerY = markerWorld.y - deadY;
  return {
    centerX,
    centerY: clampCenterY(centerY, clampedSpan),
    spanY: clampedSpan,
  };
}

export function overviewCamera(route: JourneyRoute, width: number, height: number): WorldCamera {
  if (route.coords.length === 0) {
    return { centerX: 0.5, centerY: 0.5, spanY: 0.4 };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const step = Math.max(1, Math.ceil(route.samples.length / 1500));
  for (let i = 0; i < route.samples.length; i += step) {
    const p = projectWorld(route.samples[i].coord[0], route.samples[i].coord[1]);
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const contentSpanX = Math.max(0.0003, maxX - minX);
  const contentSpanY = Math.max(0.0003, maxY - minY);
  const worldPerPixel = Math.max(contentSpanX / Math.max(width, 1), contentSpanY / Math.max(height, 1)) * OVERVIEW_PADDING;
  const spanY = Math.min(Math.max(worldPerPixel * height, 0.0003), 1.25);
  return {
    centerX: (minX + maxX) / 2,
    centerY: clampCenterY((minY + maxY) / 2, spanY),
    spanY,
  };
}

export function blendCamera(from: WorldCamera, to: WorldCamera, t: number): WorldCamera {
  const amount = Math.max(0, Math.min(1, t));
  const toX = unwrapNear(to.centerX, from.centerX);
  const spanY = Math.exp(lerp(Math.log(from.spanY), Math.log(to.spanY), amount));
  return {
    centerX: lerp(from.centerX, toX, amount),
    centerY: clampCenterY(lerp(from.centerY, to.centerY, amount), spanY),
    spanY,
  };
}

export function tileKey(z: number, x: number, y: number): string {
  return `${z}/${x}/${y}`;
}

export const TILE_ZOOM_HYSTERESIS = 0.35;

export function stabilizeTileZoom(previous: number | null, zoom: number): number {
  const rounded = Math.round(zoom);
  if (previous == null) return rounded;
  if (rounded > previous && zoom < previous + 0.5 + TILE_ZOOM_HYSTERESIS) return previous;
  if (rounded < previous && zoom > previous - 0.5 - TILE_ZOOM_HYSTERESIS) return previous;
  return Math.max(STEADY_CAMERA.minZoom, Math.min(STEADY_CAMERA.maxZoom, rounded));
}

export function cameraView(cam: WorldCamera, width: number, height: number) {
  const aspect = width / Math.max(height, 1);
  const spanX = cam.spanY * aspect;
  return {
    minX: cam.centerX - spanX / 2,
    maxX: cam.centerX + spanX / 2,
    minY: cam.centerY - cam.spanY / 2,
    maxY: cam.centerY + cam.spanY / 2,
    spanX,
    spanY: cam.spanY,
  };
}

export function latLngToScreen(lat: number, lng: number, cam: WorldCamera, width: number, height: number): { x: number; y: number } {
  const point = projectWorld(lat, lng);
  const view = cameraView(cam, width, height);
  const x = unwrapNear(point.x, cam.centerX);
  return {
    x: ((x - view.minX) / view.spanX) * width,
    y: ((point.y - view.minY) / view.spanY) * height,
  };
}

export function cameraToLeaflet(cam: WorldCamera, width: number, height: number): { center: LatLng; zoom: number } {
  const aspect = width / Math.max(height, 1);
  const spanX = cam.spanY * aspect;
  const zoom = Math.log2(Math.max(width, 1) / (256 * Math.max(spanX, 1e-12)));
  return {
    center: unprojectWorld(cam.centerX, cam.centerY),
    zoom: Math.max(STEADY_CAMERA.minZoom, Math.min(STEADY_CAMERA.maxZoom, zoom)),
  };
}

export const CAMERA_TRACK_SAMPLES = 240;

export interface TileCoord {
  z: number;
  x: number;
  y: number;
}

function cameraBounds(cam: WorldCamera, width: number, height: number) {
  const aspect = width / Math.max(height, 1);
  const spanX = cam.spanY * aspect;
  return {
    minX: cam.centerX - spanX / 2,
    maxX: cam.centerX + spanX / 2,
    minY: cam.centerY - cam.spanY / 2,
    maxY: cam.centerY + cam.spanY / 2,
  };
}

export function tilesForCamera(
  cam: WorldCamera,
  width: number,
  height: number,
  pad = 1,
  extraZooms = true
): TileCoord[] {
  const { zoom } = cameraToLeaflet(cam, width, height);
  const centerZoom = Math.round(zoom);
  const zooms = extraZooms
    ? [centerZoom - 1, centerZoom, centerZoom + 1]
    : [centerZoom];
  const bounds = cameraBounds(cam, width, height);
  const tiles: TileCoord[] = [];

  for (const z of zooms) {
    if (z < STEADY_CAMERA.minZoom || z > STEADY_CAMERA.maxZoom) continue;
    const count = 2 ** z;
    const xMin = Math.floor(bounds.minX * count) - pad;
    const xMax = Math.floor(bounds.maxX * count) + pad;
    const yMin = Math.max(0, Math.floor(bounds.minY * count) - pad);
    const yMax = Math.min(count - 1, Math.floor(bounds.maxY * count) + pad);
    for (let x = xMin; x <= xMax; x++) {
      const wrappedX = ((x % count) + count) % count;
      for (let y = yMin; y <= yMax; y++) {
        tiles.push({ z, x: wrappedX, y });
      }
    }
  }
  return tiles;
}

export function buildCameraTrack(
  route: JourneyRoute,
  width: number,
  height: number,
  samples = CAMERA_TRACK_SAMPLES
): WorldCamera[] {
  const frames: WorldCamera[] = [];
  let camera: WorldCamera | null = null;
  for (let i = 0; i <= samples; i++) {
    const progress = i / samples;
    const km = route.distanceAt(progress);
    const raw = rawSteadyCamera(route, km, width, height);
    const marker = positionAtDistance(route, km);
    camera = camera ? stepSteadyCamera(camera, raw, marker, width, height) : raw;
    frames.push(camera);
  }
  return frames;
}

export function cameraAt(track: WorldCamera[], progress: number): WorldCamera {
  if (track.length === 0) {
    return { centerX: 0.5, centerY: 0.5, spanY: 0.4 };
  }
  if (track.length === 1) return track[0];
  const position = Math.max(0, Math.min(1, progress)) * (track.length - 1);
  const fromIndex = Math.min(Math.floor(position), track.length - 1);
  const toIndex = Math.min(fromIndex + 1, track.length - 1);
  return blendCamera(track[fromIndex], track[toIndex], position - fromIndex);
}

export function collectJourneyTiles(
  track: WorldCamera[],
  overview: WorldCamera,
  width: number,
  height: number
): TileCoord[] {
  const seen = new Set<string>();
  const tiles: TileCoord[] = [];
  const add = (cam: WorldCamera, extraZooms: boolean) => {
    for (const tile of tilesForCamera(cam, width, height, 1, extraZooms)) {
      const key = `${tile.z}/${tile.x}/${tile.y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      tiles.push(tile);
    }
  };

  const nearHalf = (cam: WorldCamera) => {
    const z = cameraToLeaflet(cam, width, height).zoom;
    return Math.abs(z - Math.round(z)) > 0.32;
  };

  const step = Math.max(1, Math.floor(track.length / 96));
  for (let i = 0; i < track.length; i += step) add(track[i], nearHalf(track[i]));
  if (track.length) add(track[track.length - 1], nearHalf(track[track.length - 1]));

  if (track.length) {
    const from = track[track.length - 1];
    for (let i = 0; i <= 8; i++) {
      const cam = blendCamera(from, overview, i / 8);
      add(cam, nearHalf(cam));
    }
  }
  add(overview, nearHalf(overview));
  return tiles;
}
