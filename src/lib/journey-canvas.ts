import {
  cameraView,
  latLngToScreen,
  STEADY_CAMERA,
  tileKey,
  type LatLng,
  type WorldCamera,
} from "@/lib/journey";

export type TileCache = Map<string, HTMLImageElement>;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function coveringTile(
  cache: TileCache,
  z: number,
  x: number,
  y: number
): { img: HTMLImageElement; sx: number; sy: number; sw: number; sh: number } | null {
  const direct = cache.get(tileKey(z, x, y));
  if (direct && direct.complete && direct.naturalWidth > 0) {
    return { img: direct, sx: 0, sy: 0, sw: direct.naturalWidth, sh: direct.naturalHeight };
  }

  for (let dz = 1; dz <= 4; dz++) {
    const pz = z - dz;
    if (pz < STEADY_CAMERA.minZoom) break;
    const scale = 2 ** dz;
    const px = Math.floor(x / scale);
    const py = Math.floor(y / scale);
    const parent = cache.get(tileKey(pz, px, py));
    if (!parent || !parent.complete || parent.naturalWidth === 0) continue;
    const tw = parent.naturalWidth / scale;
    const th = parent.naturalHeight / scale;
    return {
      img: parent,
      sx: (x % scale) * tw,
      sy: (y % scale) * th,
      sw: tw,
      sh: th,
    };
  }
  return null;
}

function drawTileLevel(
  ctx: CanvasRenderingContext2D,
  cam: WorldCamera,
  width: number,
  height: number,
  cache: TileCache,
  z: number
) {
  const view = cameraView(cam, width, height);
  const count = 2 ** z;
  const xMin = Math.floor(view.minX * count) - 1;
  const xMax = Math.floor(view.maxX * count) + 1;
  const yMin = Math.max(0, Math.floor(view.minY * count) - 1);
  const yMax = Math.min(count - 1, Math.floor(view.maxY * count) + 1);

  for (let x = xMin; x <= xMax; x++) {
    const wrappedX = ((x % count) + count) % count;
    for (let y = yMin; y <= yMax; y++) {
      const cover = coveringTile(cache, z, wrappedX, y);
      if (!cover) continue;
      const worldX0 = x / count;
      const worldX1 = (x + 1) / count;
      const worldY0 = y / count;
      const worldY1 = (y + 1) / count;
      const dx = ((worldX0 - view.minX) / view.spanX) * width;
      const dy = ((worldY0 - view.minY) / view.spanY) * height;
      const dw = ((worldX1 - worldX0) / view.spanX) * width;
      const dh = ((worldY1 - worldY0) / view.spanY) * height;
      ctx.drawImage(cover.img, cover.sx, cover.sy, cover.sw, cover.sh, dx, dy, dw + 0.75, dh + 0.75);
    }
  }
}

function strokeCoords(
  ctx: CanvasRenderingContext2D,
  coords: LatLng[],
  cam: WorldCamera,
  width: number,
  height: number,
  color: string,
  lineWidth: number,
  alpha: number
) {
  if (coords.length < 2 || alpha <= 0) return;
  ctx.beginPath();
  const first = latLngToScreen(coords[0][0], coords[0][1], cam, width, height);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < coords.length; i++) {
    const p = latLngToScreen(coords[i][0], coords[i][1], cam, width, height);
    ctx.lineTo(p.x, p.y);
  }
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

export interface JourneyFrameDraw {
  camera: WorldCamera;
  cache: TileCache;
  tileZoom: number;
  width: number;
  height: number;
  color: string;
  oldTrail: LatLng[];
  middleTrail: LatLng[];
  recentTrail: LatLng[];
  overviewPath: LatLng[];
  head: LatLng;
  trailFade: number;
  overviewAlpha: number;
}

export function drawJourneyFrame(ctx: CanvasRenderingContext2D, frame: JourneyFrameDraw) {
  const { camera, cache, tileZoom, width, height, color, trailFade, overviewAlpha } = frame;
  ctx.clearRect(0, 0, width, height);

  const baseZoom = Math.max(STEADY_CAMERA.minZoom, tileZoom - 1);
  drawTileLevel(ctx, camera, width, height, cache, baseZoom);
  if (tileZoom !== baseZoom) {
    drawTileLevel(ctx, camera, width, height, cache, tileZoom);
  }

  ctx.save();
  strokeCoords(ctx, frame.oldTrail, camera, width, height, color, 2, (55 / 255) * trailFade);
  strokeCoords(ctx, frame.middleTrail, camera, width, height, color, 3.2, (135 / 255) * trailFade);
  strokeCoords(ctx, frame.recentTrail, camera, width, height, color, 4.5, trailFade);
  strokeCoords(ctx, frame.overviewPath, camera, width, height, color, 3.5, overviewAlpha);

  if (trailFade > 0.04) {
    const head = latLngToScreen(frame.head[0], frame.head[1], camera, width, height);
    ctx.beginPath();
    ctx.arc(head.x, head.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(17, 17, 17, ${trailFade})`;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = rgba(color, trailFade);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(head.x, head.y, 10, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(color, 0.28 * trailFade);
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
}

export function sizePlayCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D | null {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
