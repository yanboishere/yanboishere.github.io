#!/usr/bin/env python3
"""Merge a year's GPS export (CSV) into the footprint map and refresh "where I am now".

    npm run travel:update -- ~/Downloads/2026.01.01-2026.12.31.csv

Pass the full-year export. Re-running with a newer export of the same year is safe.

1. public/travel-dots.bin   the dot layer. Every usable point (accuracy <= 100 m,
   outside the private zones) of the months the CSV covers replaces those months.
   Other months are kept as they are.
2. public/travel-route.json the journey line. Existing points are left alone (they
   include the hand-made decoys around the private zones). Only fixes newer than
   what the file already has are appended, thinned to roughly the density of the
   existing months: every KEEP_EVERY-th usable fix is kept, plus any fix that jumps
   more than JUMP_METRES from the last kept one (so flights and trains still show).
   Fixes inside the private zones are never appended.
3. public/travel-places.json country / province / city for the appended route points,
   from the classifier the site already uses (scripts/classify-tracks.py). Labels of
   points that were already there are kept as they are.
4. src/data/now.ts          `location` becomes the city of the last fix, e.g.
   "🇨🇳深圳，中国", and `lastUpdated` its date. Only the city name is written, never
   coordinates. Fixes in the air (above AIRBORNE_ALTITUDE_M or faster than
   AIRBORNE_SPEED_MS) are skipped, and if the last fix is in a private zone or
   outside every known country the location is left unchanged.
5. src/data/travelStats.ts  the number of GPS points on the map, shown on the home page.

The CSV itself stays out of git (*.csv is in .gitignore).
"""

from __future__ import annotations

import csv
import importlib.util
import json
import math
import re
import struct
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOTS = ROOT / "public" / "travel-dots.bin"
ROUTE = ROOT / "public" / "travel-route.json"
PLACES = ROOT / "public" / "travel-places.json"
NOW_TS = ROOT / "src" / "data" / "now.ts"
STATS_TS = ROOT / "src" / "data" / "travelStats.ts"
CST = timezone(timedelta(hours=8))

MAX_ACCURACY_M = 100
AIRBORNE_ALTITUDE_M = 3000
AIRBORNE_SPEED_MS = 70
KEEP_EVERY = 36
JUMP_METRES = 5000

# Same flags as COUNTRY_EMOJI in src/lib/travel-places.ts.
COUNTRY_FLAG = {
    "中国": "🇨🇳", "越南": "🇻🇳", "马来西亚": "🇲🇾", "新加坡": "🇸🇬", "印度尼西亚": "🇮🇩",
    "泰国": "🇹🇭", "老挝": "🇱🇦", "菲律宾": "🇵🇭", "日本": "🇯🇵", "柬埔寨": "🇰🇭",
    "阿塞拜疆": "🇦🇿", "格鲁吉亚": "🇬🇪", "土耳其": "🇹🇷", "塞浦路斯": "🇨🇾", "埃及": "🇪🇬",
    "阿联酋": "🇦🇪", "阿曼": "🇴🇲", "韩国": "🇰🇷", "哈萨克斯坦": "🇰🇿", "乌兹别克斯坦": "🇺🇿",
    "尼泊尔": "🇳🇵",
}

RECORD = struct.Struct("<ffIBHH")


def load_classifier():
    spec = importlib.util.spec_from_file_location("classify_tracks", ROOT / "scripts" / "classify-tracks.py")
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(mod)
    return mod


def in_private(lat: float, lng: float) -> bool:
    # Keep in sync with scripts/build-travel-dots.py.
    return (42.8 <= lat <= 44.0 and 128.8 <= lng <= 130.2) or (43.3 <= lat <= 44.7 and 125.8 <= lng <= 127.2)


def month_ts(ts: int) -> int:
    d = datetime.fromtimestamp(ts, CST)
    return int(datetime(d.year, d.month, 1, tzinfo=CST).timestamp())


def metres(a: tuple[float, float], b: tuple[float, float]) -> float:
    lat1, lng1, lat2, lng2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    return 6_371_000 * 2 * math.asin(math.sqrt(h))


def is_airborne(row: dict) -> bool:
    try:
        return float(row.get("altitude") or 0) > AIRBORNE_ALTITUDE_M or float(row.get("speed") or 0) > AIRBORNE_SPEED_MS
    except ValueError:
        return False


def read_csv(path: Path) -> tuple[list[tuple[int, float, float, float]], list[tuple[int, float, float, float]]]:
    """All fixes, and the subset that was on the ground."""
    rows = []
    ground = []
    with path.open(newline="") as f:
        for row in csv.DictReader(f):
            try:
                ts = int(float(row["dataTime"]))
                lat = float(row["latitude"])
                lng = float(row["longitude"])
                acc = float(row["accuracy"])
            except (KeyError, TypeError, ValueError):
                continue
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                continue
            rows.append((ts, lat, lng, acc))
            if not is_airborne(row):
                ground.append((ts, lat, lng, acc))
    rows.sort()
    ground.sort()
    return rows, ground


def read_dots():
    buf = DOTS.read_bytes()
    if buf[:4] != b"TD01":
        raise SystemExit("travel-dots.bin: unexpected format")
    count, nc, np_, ny = struct.unpack_from("<IHHH", buf, 4)
    off = 14
    tables = []
    for size in (nc, np_, ny):
        names = []
        for _ in range(size):
            (length,) = struct.unpack_from("<H", buf, off)
            off += 2
            names.append(buf[off : off + length].decode("utf-8"))
            off += length
        tables.append(names)
    records = [RECORD.unpack_from(buf, off + RECORD.size * i) for i in range(count)]
    return tables, records


def write_dots(tables: list[list[str]], records: list[tuple]) -> None:
    buf = bytearray(b"TD01")
    buf.extend(struct.pack("<IHHH", len(records), *(len(t) for t in tables)))
    for names in tables:
        for name in names:
            raw = name.encode("utf-8")
            buf.extend(struct.pack("<H", len(raw)))
            buf.extend(raw)
    for rec in records:
        buf.extend(RECORD.pack(*rec))
    DOTS.write_bytes(buf)


def intern(names: list[str], index: dict[str, int], value: str) -> int:
    if value not in index:
        index[value] = len(names)
        names.append(value)
    return index[value]


def city_label(country: str, province: str, city: str) -> str:
    flag = COUNTRY_FLAG.get(country, "")
    if country != "中国" or not (city or province):
        return f"{flag}{country}"
    name = city or province
    if name.endswith("市") and len(name) > 2:
        name = name[:-1]
    return f"{flag}{name}，{country}"


def set_ts_string(path: Path, key: str, value: str) -> bool:
    src = path.read_text()
    new = re.sub(rf'({key}:\s*)"[^"]*"', lambda m: f'{m.group(1)}{json.dumps(value, ensure_ascii=False)}', src, count=1)
    if new != src:
        path.write_text(new)
    return new != src


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    csv_path = Path(sys.argv[1]).expanduser()
    rows, ground = read_csv(csv_path)
    if not rows:
        raise SystemExit(f"{csv_path}: no usable rows")
    usable = [r for r in rows if r[3] <= MAX_ACCURACY_M and not in_private(r[1], r[2])]
    first_month, last_month_csv = month_ts(rows[0][0]), month_ts(rows[-1][0])
    span = f"{datetime.fromtimestamp(rows[0][0], CST):%Y-%m-%d} – {datetime.fromtimestamp(rows[-1][0], CST):%Y-%m-%d}"
    print(f"csv: {len(rows):,} rows ({span}), {len(usable):,} usable")

    clf = load_classifier()
    layers = clf.load_layers()
    cells: dict[tuple[float, float], tuple[str, str, str]] = {}

    def place(lat: float, lng: float) -> tuple[str, str, str]:
        key = (round(lat, 2), round(lng, 2))
        if key not in cells:
            cells[key] = clf.classify_latlng(lat, lng, layers)
        return cells[key]

    # 1. dots: the CSV's months replace what was there
    tables, records = read_dots()
    index = [{name: i for i, name in enumerate(t)} for t in tables]
    dots = [r for r in records if not first_month <= r[2] <= last_month_csv]
    for ts, lat, lng, _acc in usable:
        country, province, city = place(lat, lng)
        dots.append(
            (
                lat,
                lng,
                month_ts(ts),
                intern(tables[0], index[0], country),
                intern(tables[1], index[1], province),
                intern(tables[2], index[2], city),
            )
        )
    dots.sort(key=lambda r: r[2])
    write_dots(tables, dots)
    print(f"dots: {len(records):,} -> {len(dots):,}")

    # 2. route: append fixes newer than the last one the file already has
    route = json.loads(ROUTE.read_text())
    last_route_month = max((p[2] for p in route), default=0)
    seen = {(p[0], p[1]) for p in route if p[2] == last_route_month}
    matched = [r for r in usable if month_ts(r[0]) == last_route_month and (round(r[1], 5), round(r[2], 5)) in seen]
    if matched:
        last = matched[-1]  # continue thinning from the newest fix already on the line
        cutoff = last[0]
    else:
        last = None
        cutoff = int(datetime.fromtimestamp(last_route_month, CST).replace(day=28).timestamp()) + 4 * 86400
        cutoff = month_ts(cutoff) - 1  # end of the last month in the file
    added = []
    since_kept = 0
    for row in usable:
        ts, lat, lng, _acc = row
        if ts <= cutoff:
            continue
        since_kept += 1
        if last is None or since_kept >= KEEP_EVERY or metres(last[1:3], (lat, lng)) >= JUMP_METRES:
            added.append([round(lat, 5), round(lng, 5), month_ts(ts)])
            last = row
            since_kept = 0
    route.extend(added)
    route.sort(key=lambda p: p[2])
    ROUTE.write_text(json.dumps(route, separators=(",", ":")))
    print(f"route: +{len(added):,} -> {len(route):,} points")

    # 3. places: keep the existing labels, classify only the appended points
    old_places = json.loads(PLACES.read_text()) if PLACES.exists() else None
    if old_places and len(old_places.get("hits", [])) == len(route) - len(added):
        countries, provinces, cities = old_places["countries"], old_places["provinces"], old_places["cities"]
        hits = old_places["hits"]
        new_points = route[len(hits):] if added and route[-len(added):] == added else None
        if new_points is None:  # appended points were not at the end after sorting
            hits, new_points = [], route
    else:
        countries, provinces, cities, hits, new_points = [""], [""], [""], [], route
    ci = {name: i for i, name in enumerate(countries)}
    pi = {name: i for i, name in enumerate(provinces)}
    yi = {name: i for i, name in enumerate(cities)}
    for lat, lng, _ts in new_points:
        country, province, city = place(lat, lng)
        hits.append([intern(countries, ci, country), intern(provinces, pi, province), intern(cities, yi, city)])
    PLACES.write_text(
        json.dumps(
            {"countries": countries, "provinces": provinces, "cities": cities, "hits": hits},
            ensure_ascii=False,
            separators=(",", ":"),
        )
    )
    print(f"places: {len(hits):,} points, {len(countries) - 1} countries")

    # 4. where I am now (city level only)
    good = [r for r in ground if r[3] <= MAX_ACCURACY_M] or ground or rows
    ts, lat, lng, _acc = good[-1]
    when = datetime.fromtimestamp(ts, CST)
    if in_private(lat, lng):
        print(f"now: last fix ({when:%Y-%m-%d %H:%M}) is in a private zone, location left unchanged")
    else:
        country, province, city = place(lat, lng)
        if country:
            label = city_label(country, province, city)
            changed = set_ts_string(NOW_TS, "location", label)
            changed |= set_ts_string(NOW_TS, "lastUpdated", f"{when:%Y-%m-%d}")
            print(f"now: {label} (last fix {when:%Y-%m-%d %H:%M}){'' if changed else ', unchanged'}")
        else:
            print(f"now: last fix ({when:%Y-%m-%d %H:%M}) is outside every known country, location left unchanged")

    # 5. stats for the home page
    STATS_TS.write_text(
        "// Generated by scripts/update-travel.py, do not edit by hand.\n"
        f"export const travelStats = {{ gpsPoints: {len(dots)} }};\n"
    )
    print(f"stats: {len(dots):,} GPS points on the map")


if __name__ == "__main__":
    main()
