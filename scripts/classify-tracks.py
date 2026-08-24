#!/usr/bin/env python3
"""Assign country / China province / prefecture labels to travel-route.json."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROUTE = ROOT / "public" / "travel-route.json"
OUT = ROOT / "public" / "travel-places.json"
CACHE = Path("/tmp/geo")

COUNTRIES_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/"
    "geojson/ne_50m_admin_0_countries.geojson"
)
PROVINCES_URL = "https://unpkg.com/cn-atlas@0.1.2/provinces.json"
PREFECTURES_URL = "https://unpkg.com/cn-atlas@0.1.2/prefectures.json"


def fetch(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 1000:
        return
    print(f"download {url}")
    subprocess.check_call(["curl", "-sL", "-o", str(dest), url])


def ring_bbox(ring: list) -> tuple[float, float, float, float]:
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return min(xs), min(ys), max(xs), max(ys)


def union_bbox(boxes: list[tuple[float, float, float, float]]):
    return (
        min(b[0] for b in boxes),
        min(b[1] for b in boxes),
        max(b[2] for b in boxes),
        max(b[3] for b in boxes),
    )


def in_bbox(lng: float, lat: float, b: tuple[float, float, float, float], pad: float = 0.0) -> bool:
    return b[0] - pad <= lng <= b[2] + pad and b[1] - pad <= lat <= b[3] + pad


def point_in_ring(lng: float, lat: float, ring: list) -> bool:
    inside = False
    n = len(ring)
    if n < 3:
        return False
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > lat) != (yj > lat):
            xint = (xj - xi) * (lat - yi) / (yj - yi + 0.0) + xi
            if lng < xint:
                inside = not inside
        j = i
    return inside


def point_in_polygon(lng: float, lat: float, rings: list) -> bool:
    if not rings or not point_in_ring(lng, lat, rings[0]):
        return False
    for hole in rings[1:]:
        if point_in_ring(lng, lat, hole):
            return False
    return True


def geom_polygons(geom: dict) -> list[list]:
    t = geom.get("type")
    coords = geom.get("coordinates") or []
    if t == "Polygon":
        return [coords]
    if t == "MultiPolygon":
        return coords
    return []


def prepare_features(features: list, name_fn) -> list[dict]:
    out = []
    for feat in features:
        geom = feat.get("geometry") or {}
        polys = []
        boxes = []
        for rings in geom_polygons(geom):
            if not rings:
                continue
            polys.append(rings)
            boxes.append(ring_bbox(rings[0]))
        if not polys:
            continue
        out.append(
            {
                "name": name_fn(feat),
                "props": feat.get("properties") or {},
                "polys": polys,
                "bbox": union_bbox(boxes),
            }
        )
    return out


def hit_feature(lng: float, lat: float, features: list[dict]) -> dict | None:
    for feat in features:
        if not in_bbox(lng, lat, feat["bbox"]):
            continue
        for rings in feat["polys"]:
            if point_in_polygon(lng, lat, rings):
                return feat
    return None


COUNTRY_ALIAS = {
    "大韩民国": "韩国",
    "阿拉伯联合酋长国": "阿联酋",
    "北塞浦路斯土耳其共和国": "塞浦路斯",
}

HIDDEN_COUNTRIES = {"美国", "保加利亚"}

def feature_area(feat: dict) -> float:
    b = feat["bbox"]
    return max(0.0001, (b[2] - b[0]) * (b[3] - b[1]))


def nearest_feature(lng: float, lat: float, features: list[dict], pad: float = 0.25) -> dict | None:
    best = None
    best_area = None
    for feat in features:
        if not in_bbox(lng, lat, feat["bbox"], pad=pad):
            continue
        area = feature_area(feat)
        if best is None or area < best_area:
            best = feat
            best_area = area
    return best


def load_layers() -> dict:
    fetch(COUNTRIES_URL, CACHE / "ne_50m_admin_0_countries.geojson")
    fetch(PROVINCES_URL, CACHE / "provinces.json")
    fetch(PREFECTURES_URL, CACHE / "prefectures.json")
    countries_raw = json.loads((CACHE / "ne_50m_admin_0_countries.geojson").read_text())
    provinces_raw = json.loads((CACHE / "provinces.json").read_text())
    prefectures_raw = json.loads((CACHE / "prefectures.json").read_text())
    countries = prepare_features(
        countries_raw["features"],
        lambda f: (f["properties"].get("NAME_ZH") or f["properties"].get("NAME") or "").strip(),
    )
    countries = [f for f in countries if f["props"].get("ADM0_A3") not in {"CHN", "TWN", "HKG", "MAC"}]
    provinces = prepare_features(provinces_raw["features"], lambda f: f["properties"]["地名"])
    prefectures = prepare_features(prefectures_raw["features"], lambda f: f["properties"]["地名"])
    province_by_prefix = {
        str(f["properties"]["区划码"])[:2]: f["properties"]["地名"] for f in provinces_raw["features"]
    }
    return {
        "countries": countries,
        "provinces": provinces,
        "prefectures": prefectures,
        "province_by_prefix": province_by_prefix,
    }


def classify_latlng(lat: float, lng: float, layers: dict) -> tuple[str, str, str]:
    country = ""
    province = ""
    city = ""
    pref = hit_feature(lng, lat, layers["prefectures"])
    if pref:
        city = pref["name"]
        prefix = str(pref["props"].get("区划码") or "")[:2]
        province = layers["province_by_prefix"].get(prefix, "")
        country = "中国"
    else:
        prov = hit_feature(lng, lat, layers["provinces"])
        if prov:
            province = prov["name"]
            city = province
            country = "中国"
        else:
            nat = hit_feature(lng, lat, layers["countries"])
            if nat:
                country = nat["name"]
            else:
                near_pref = nearest_feature(lng, lat, layers["prefectures"], pad=0.08)
                near_prov = nearest_feature(lng, lat, layers["provinces"], pad=0.1)
                near_nat = nearest_feature(lng, lat, layers["countries"], pad=0.4)
                if near_pref:
                    city = near_pref["name"]
                    prefix = str(near_pref["props"].get("区划码") or "")[:2]
                    province = layers["province_by_prefix"].get(prefix, "")
                    country = "中国"
                elif near_prov:
                    province = near_prov["name"]
                    city = province
                    country = "中国"
                elif near_nat:
                    country = near_nat["name"]
    if country in {"朝鲜民主主义人民共和国", "朝鲜"} and lng > 128 and 41.5 <= lat <= 44.5:
        country = "中国"
        province = "吉林省"
        city = "延边朝鲜族自治州"
    if country:
        country = COUNTRY_ALIAS.get(country, country)
    if country in HIDDEN_COUNTRIES:
        country = ""
        province = ""
        city = ""
    return country, province, city


def intern(store: list[str], index: dict[str, int], value: str) -> int:
    if value not in index:
        index[value] = len(store)
        store.append(value)
    return index[value]


def main() -> None:
    layers = load_layers()
    points = json.loads(ROUTE.read_text())
    countries_list: list[str] = []
    provinces_list: list[str] = []
    cities_list: list[str] = []
    country_i: dict[str, int] = {}
    province_i: dict[str, int] = {}
    city_i: dict[str, int] = {}
    intern(countries_list, country_i, "")
    intern(provinces_list, province_i, "")
    intern(cities_list, city_i, "")

    hits: list[list[int]] = []
    unknown = 0
    china_n = 0

    for idx, (lat, lng, _ts) in enumerate(points):
        country, province, city = classify_latlng(lat, lng, layers)
        if country == "中国":
            china_n += 1
        if not country:
            unknown += 1
        hits.append(
            [
                intern(countries_list, country_i, country),
                intern(provinces_list, province_i, province),
                intern(cities_list, city_i, city),
            ]
        )
        if (idx + 1) % 2000 == 0:
            print(f"classified {idx + 1}/{len(points)}")

    payload = {
        "countries": countries_list,
        "provinces": provinces_list,
        "cities": cities_list,
        "hits": hits,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    print(f"points {len(points)} china {china_n} unknown {unknown}")
    print(f"countries {len(countries_list) - 1}: {', '.join(x for x in countries_list if x)}")
    print(f"provinces {len(provinces_list) - 1}")
    print(f"cities {len(cities_list) - 1}")
    print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
