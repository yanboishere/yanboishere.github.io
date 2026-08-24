export type PlaceCatalog = {
  countries: string[];
  provinces: string[];
  cities: string[];
  hits: [number, number, number][];
};

export type PlaceHit = {
  country: string;
  province: string;
  city: string;
};

const PLACE_PALETTE = [
  "#dda75c",
  "#3d8b5d",
  "#ec6322",
  "#b73716",
  "#2d6a4f",
  "#5b8e7d",
  "#bc6c25",
  "#6a4c93",
  "#277da1",
  "#90be6d",
];

const HIDDEN_COUNTRIES = new Set(["美国", "保加利亚"]);

const COUNTRY_EMOJI: Record<string, string> = {
  中国: "🇨🇳",
  越南: "🇻🇳",
  马来西亚: "🇲🇾",
  新加坡: "🇸🇬",
  印度尼西亚: "🇮🇩",
  泰国: "🇹🇭",
  老挝: "🇱🇦",
  菲律宾: "🇵🇭",
  日本: "🇯🇵",
  柬埔寨: "🇰🇭",
  阿塞拜疆: "🇦🇿",
  格鲁吉亚: "🇬🇪",
  土耳其: "🇹🇷",
  塞浦路斯: "🇨🇾",
  埃及: "🇪🇬",
  阿联酋: "🇦🇪",
  阿曼: "🇴🇲",
  韩国: "🇰🇷",
  哈萨克斯坦: "🇰🇿",
  乌兹别克斯坦: "🇺🇿",
  尼泊尔: "🇳🇵",
};

export function countryLabel(name: string): string {
  const emoji = COUNTRY_EMOJI[name];
  return emoji ? `${emoji} ${name}` : name;
}

export function colorForPlace(name: string): string {
  if (name === "中国") return "#b73716";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 33 + name.charCodeAt(i)) >>> 0;
  return PLACE_PALETTE[hash % PLACE_PALETTE.length];
}

export function hitAt(catalog: PlaceCatalog | null, index: number): PlaceHit {
  if (!catalog) return { country: "", province: "", city: "" };
  const triple = catalog.hits[index] || [0, 0, 0];
  return {
    country: catalog.countries[triple[0]] || "",
    province: catalog.provinces[triple[1]] || "",
    city: catalog.cities[triple[2]] || "",
  };
}

export function countBy(
  catalog: PlaceCatalog,
  field: "country" | "province" | "city",
  pred?: (hit: PlaceHit, index: number) => boolean
): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (let i = 0; i < catalog.hits.length; i++) {
    const hit = hitAt(catalog, i);
    if (pred && !pred(hit, i)) continue;
    const name = hit[field];
    if (!name) continue;
    if (field === "country" && HIDDEN_COUNTRIES.has(name)) continue;
    map.set(name, (map.get(name) || 0) + 1);
  }
  const rows = [...map.entries()].map(([name, count]) => ({ name, count }));
  rows.sort((a, b) => {
    if (a.name === "中国") return -1;
    if (b.name === "中国") return 1;
    return b.count - a.count || a.name.localeCompare(b.name, "zh");
  });
  return rows;
}

export function shortProvince(name: string): string {
  return name
    .replace(/维吾尔自治区$/, "")
    .replace(/壮族自治区$/, "")
    .replace(/回族自治区$/, "")
    .replace(/自治区$/, "")
    .replace(/特别行政区$/, "");
}

export function citiesForProvince(catalog: PlaceCatalog, province: string): { name: string; count: number }[] {
  const rows = countBy(catalog, "city", (hit) => hit.province === province);
  if (rows.length === 0) return [];
  if (rows.length === 1 && rows[0].name === province) return [];
  return rows;
}
