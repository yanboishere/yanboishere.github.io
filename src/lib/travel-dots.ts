import L from "leaflet";

export type PackedDots = {
  countries: string[];
  provinces: string[];
  cities: string[];
  lat: Float32Array;
  lng: Float32Array;
  monthTs: Uint32Array;
  countryIdx: Uint8Array;
  provinceIdx: Uint16Array;
  cityIdx: Uint16Array;
  count: number;
};

function readName(view: DataView, offset: { n: number }): string {
  const len = view.getUint16(offset.n, true);
  offset.n += 2;
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset.n, len);
  offset.n += len;
  return new TextDecoder().decode(bytes);
}

function readNames(view: DataView, offset: { n: number }, count: number): string[] {
  const names: string[] = [];
  for (let i = 0; i < count; i++) names.push(readName(view, offset));
  return names;
}

export function parseTravelDots(buffer: ArrayBuffer): PackedDots {
  const view = new DataView(buffer);
  const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (magic !== "TD01") throw new Error("travel-dots: bad magic");
  const count = view.getUint32(4, true);
  const nC = view.getUint16(8, true);
  const nP = view.getUint16(10, true);
  const nY = view.getUint16(12, true);
  const offset = { n: 14 };
  const countries = readNames(view, offset, nC);
  const provinces = readNames(view, offset, nP);
  const cities = readNames(view, offset, nY);

  const lat = new Float32Array(count);
  const lng = new Float32Array(count);
  const monthTs = new Uint32Array(count);
  const countryIdx = new Uint8Array(count);
  const provinceIdx = new Uint16Array(count);
  const cityIdx = new Uint16Array(count);
  for (let i = 0; i < count; i++) {
    lat[i] = view.getFloat32(offset.n, true);
    lng[i] = view.getFloat32(offset.n + 4, true);
    monthTs[i] = view.getUint32(offset.n + 8, true);
    countryIdx[i] = view.getUint8(offset.n + 12);
    provinceIdx[i] = view.getUint16(offset.n + 13, true);
    cityIdx[i] = view.getUint16(offset.n + 15, true);
    offset.n += 17;
  }
  return { countries, provinces, cities, lat, lng, monthTs, countryIdx, provinceIdx, cityIdx, count };
}

export type DotQuery = {
  year?: string | null;
  monthYear?: number | null;
  monthIndex?: number | null;
  country?: string | null;
  province?: string | null;
  city?: string | null;
};

export function filterDotIndices(dots: PackedDots, query: DotQuery): number[] | null {
  const year = query.year ? Number(query.year) : 0;
  const monthYear = query.monthYear || 0;
  const monthIndex = query.monthIndex || 0;
  const country = query.country || "";
  const province = query.province || "";
  const city = query.city || "";
  if (!year && !monthYear && !country && !province && !city) return null;

  const out: number[] = [];
  for (let i = 0; i < dots.count; i++) {
    if (city && dots.cities[dots.cityIdx[i]] !== city) continue;
    if (province && dots.provinces[dots.provinceIdx[i]] !== province) continue;
    if (country && dots.countries[dots.countryIdx[i]] !== country) continue;
    if (year || monthYear) {
      const d = new Date(dots.monthTs[i] * 1000);
      if (year && d.getFullYear() !== year) continue;
      if (monthYear && (d.getFullYear() !== monthYear || d.getMonth() + 1 !== monthIndex)) continue;
    }
    out.push(i);
  }
  return out;
}

export function mountDotCanvas(
  map: L.Map,
  dots: PackedDots,
  indices: number[] | null,
  colorForIndex: (i: number) => string
): { remove: () => void } {
  const canvas = document.createElement("canvas");
  canvas.className = "travel-dot-canvas";
  canvas.style.position = "absolute";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "450";
  map.getPanes().overlayPane.appendChild(canvas);

  let lastW = 0;
  let lastH = 0;
  let lastDpr = 0;

  const draw = () => {
    const size = map.getSize();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(size.x * dpr));
    const h = Math.max(1, Math.floor(size.y * dpr));
    if (w !== lastW || h !== lastH || dpr !== lastDpr) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
      lastW = w;
      lastH = h;
      lastDpr = dpr;
    }
    const panePos = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(canvas, panePos);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.x, size.y);

    const bounds = map.getBounds().pad(0.15);
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const west = bounds.getWest();
    const east = bounds.getEast();
    const buckets = new Map<string, number[]>();
    const n = indices ? indices.length : dots.count;
    for (let k = 0; k < n; k++) {
      const i = indices ? indices[k] : k;
      const lat = dots.lat[i];
      const lng = dots.lng[i];
      if (lat < south || lat > north || lng < west || lng > east) continue;
      const color = colorForIndex(i);
      const bucket = buckets.get(color);
      if (bucket) bucket.push(i);
      else buckets.set(color, [i]);
    }
    for (const [color, ids] of buckets) {
      ctx.fillStyle = color;
      for (const i of ids) {
        const pt = map.latLngToContainerPoint([dots.lat[i], dots.lng[i]]);
        ctx.fillRect(pt.x, pt.y, 1.5, 1.5);
      }
    }
  };

  map.on("moveend zoomend resize", draw);
  draw();
  return {
    remove() {
      map.off("moveend zoomend resize", draw);
      canvas.remove();
    },
  };
}
