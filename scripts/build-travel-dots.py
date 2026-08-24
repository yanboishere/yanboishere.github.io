#!/usr/bin/env python3
"""Pack every usable CSV GPS point (except private zones) for scatter view."""

from __future__ import annotations

import csv
import importlib.util
import struct
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV = Path("/Users/yanbo/Downloads/backUpData-all 2.csv")
OUT = ROOT / "public" / "travel-dots.bin"
CST = timezone(timedelta(hours=8))

spec = importlib.util.spec_from_file_location("classify_tracks", ROOT / "scripts" / "classify-tracks.py")
mod = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(mod)


def in_private(lat: float, lng: float) -> bool:
    return (42.8 <= lat <= 44.0 and 128.8 <= lng <= 130.2) or (
        43.3 <= lat <= 44.7 and 125.8 <= lng <= 127.2
    )


def month_ts(ts: int) -> int:
    d = datetime.fromtimestamp(ts, CST)
    return int(datetime(d.year, d.month, 1, tzinfo=CST).timestamp())


def write_name(buf: bytearray, name: str) -> None:
    raw = name.encode("utf-8")
    buf.extend(struct.pack("<H", len(raw)))
    buf.extend(raw)


def main() -> None:
    layers = mod.load_layers()
    intern_c: dict[str, int] = {"": 0}
    intern_p: dict[str, int] = {"": 0}
    intern_y: dict[str, int] = {"": 0}
    countries = [""]
    provinces = [""]
    cities = [""]

    cell_place: dict[tuple[float, float], tuple[int, int, int]] = {}
    records: list[tuple[float, float, int, int, int, int]] = []

    with CSV.open(newline="") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, 1):
            ts = int(float(row["dataTime"]))
            lng = float(row["longitude"])
            lat = float(row["latitude"])
            acc = float(row["accuracy"])
            if in_private(lat, lng) or acc > 100:
                continue
            if lat < -90 or lat > 90 or lng < -180 or lng > 180:
                continue
            key = (round(lat, 2), round(lng, 2))
            if key not in cell_place:
                country, province, city = mod.classify_latlng(lat, lng, layers)
                cell_place[key] = (
                    mod.intern(countries, intern_c, country),
                    mod.intern(provinces, intern_p, province),
                    mod.intern(cities, intern_y, city),
                )
            ci, pi, yi = cell_place[key]
            records.append((lat, lng, month_ts(ts), ci, pi, yi))
            if i % 50000 == 0:
                print(f"read {i} csv rows, kept {len(records)}")

    buf = bytearray()
    buf.extend(b"TD01")
    buf.extend(struct.pack("<IHHH", len(records), len(countries), len(provinces), len(cities)))
    for name in countries:
        write_name(buf, name)
    for name in provinces:
        write_name(buf, name)
    for name in cities:
        write_name(buf, name)
    for lat, lng, ts, ci, pi, yi in records:
        buf.extend(struct.pack("<ffIBHH", lat, lng, ts, ci, pi, yi))

    OUT.write_bytes(buf)
    print(f"dots {len(records)} cells {len(cell_place)} countries {len(countries) - 1}")
    print(f"wrote {OUT} ({OUT.stat().st_size / 1024 / 1024:.2f} MB)")


if __name__ == "__main__":
    main()
