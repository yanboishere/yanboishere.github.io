#!/usr/bin/env python3
"""Reference motion numbers from mahlernim/google-timeline-visualizer (Python + Android)."""
import json
import math
import statistics
from pathlib import Path

# --- exact copies from visualizer.py ---
R_EARTH_HAVERSINE = 6371.0
ANDROID_HAVERSINE_R = 6371.0088
COMPRESSION_EXPONENT = 0.85
CAMERA_DEAD_ZONE_HALF = 0.20
TRAIL_VISIBLE_SECONDS = 2.5
MIN_TRAIL_KM = 80.0
MAX_TRAIL_KM = 2000.0
OUTRO_SECONDS = 1.5
OUTRO_TRANSITION_SECONDS = 1.0
DEFAULT_DURATION = 30
STEADY_CONTEXT = 650.0
STEADY_PADDING = 2.8


def haversine_py(lat1, lon1, lat2, lon2):
    R = R_EARTH_HAVERSINE
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def haversine_android(lat1, lon1, lat2, lon2):
    lat1r = math.radians(lat1)
    lat2r = math.radians(lat2)
    dlat = lat2r - lat1r
    dlon = math.radians(lon2 - lon1)
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1r) * math.cos(lat2r) * math.sin(dlon / 2) ** 2
    return ANDROID_HAVERSINE_R * 2 * math.asin(min(1.0, math.sqrt(h)))


def interpolate_latlon(lat1, lon1, lat2, lon2, fraction):
    if fraction <= 0:
        return lat1, lon1
    if fraction >= 1:
        return lat2, lon2
    p1, l1 = math.radians(lat1), math.radians(lon1)
    p2, l2 = math.radians(lat2), math.radians(lon2)
    ax, ay, az = math.cos(p1) * math.cos(l1), math.cos(p1) * math.sin(l1), math.sin(p1)
    bx, by, bz = math.cos(p2) * math.cos(l2), math.cos(p2) * math.sin(l2), math.sin(p2)
    dot = max(-1.0, min(1.0, ax * bx + ay * by + az * bz))
    omega = math.acos(dot)
    if math.sin(omega) < 1e-8:
        left, right = 1 - fraction, fraction
    else:
        left = math.sin((1 - fraction) * omega) / math.sin(omega)
        right = math.sin(fraction * omega) / math.sin(omega)
    x, y, z = left * ax + right * bx, left * ay + right * by, left * az + right * bz
    return math.degrees(math.atan2(z, math.sqrt(x * x + y * y))), math.degrees(math.atan2(y, x))


def _endpoint_slope(first_width, second_width, first, second):
    slope = ((2 * first_width + second_width) * first - first_width * second) / (first_width + second_width)
    if slope <= 0:
        return 0.0
    return min(slope, 3 * first)


def _monotone_slopes(x_values, y_values):
    count = len(x_values) - 1
    delta = [(y_values[i + 1] - y_values[i]) / (x_values[i + 1] - x_values[i]) for i in range(count)]
    if count == 1:
        return [delta[0], delta[0]]
    slopes = [0.0] * len(x_values)
    slopes[0] = _endpoint_slope(x_values[1] - x_values[0], x_values[2] - x_values[1], delta[0], delta[1])
    for index in range(1, len(x_values) - 1):
        before_width = x_values[index] - x_values[index - 1]
        after_width = x_values[index + 1] - x_values[index]
        if delta[index - 1] <= 0 or delta[index] <= 0:
            slopes[index] = 0.0
            continue
        weight_before = 2 * after_width + before_width
        weight_after = after_width + 2 * before_width
        slopes[index] = (weight_before + weight_after) / (
            weight_before / delta[index - 1] + weight_after / delta[index]
        )
    slopes[-1] = _endpoint_slope(
        x_values[-1] - x_values[-2], x_values[-2] - x_values[-3], delta[-1], delta[-2],
    )
    return slopes


def build_journey_timing(cum_dist, exponent=COMPRESSION_EXPONENT):
    total_km = cum_dist[-1] if cum_dist else 0.0
    if exponent == 1.0 or len(cum_dist) < 2:
        return lambda progress: total_km * max(0.0, min(1.0, progress))
    distances = [0.0]
    effective = [0.0]
    effective_total = 0.0
    for before, after in zip(cum_dist, cum_dist[1:]):
        segment = after - before
        if segment <= 0:
            continue
        effective_total += segment ** exponent
        distances.append(after)
        effective.append(effective_total)
    if effective_total <= 0 or len(distances) < 2:
        return lambda progress: total_km * max(0.0, min(1.0, progress))
    x_values = [value / effective_total for value in effective]
    slopes = _monotone_slopes(x_values, distances)

    def distance_at(progress):
        elapsed = max(0.0, min(1.0, progress))
        # bisect_left
        lo, hi = 0, len(x_values)
        while lo < hi:
            mid = (lo + hi) // 2
            if x_values[mid] < elapsed:
                lo = mid + 1
            else:
                hi = mid
        to_index = min(max(lo, 1), len(x_values) - 1)
        from_index = to_index - 1
        width = x_values[to_index] - x_values[from_index]
        t = 0.0 if width <= 0 else (elapsed - x_values[from_index]) / width
        t2, t3 = t * t, t * t * t
        return ((2 * t3 - 3 * t2 + 1) * distances[from_index]
                + (t3 - 2 * t2 + t) * width * slopes[from_index]
                + (-2 * t3 + 3 * t2) * distances[to_index]
                + (t3 - t2) * width * slopes[to_index])

    return distance_at


def trail_window_km(total_km, duration_s=DEFAULT_DURATION):
    if total_km <= 0:
        return 0.0
    distance = total_km * TRAIL_VISIBLE_SECONDS / max(1, duration_s)
    return min(total_km, max(MIN_TRAIL_KM, min(MAX_TRAIL_KM, distance)))


def outro_frame(elapsed_s, journey_s):
    if elapsed_s <= journey_s:
        return elapsed_s / journey_s, 0.0
    outro_elapsed = elapsed_s - journey_s
    return 1.0, max(0.0, min(1.0, outro_elapsed / OUTRO_TRANSITION_SECONDS))


def main():
    root = Path(__file__).resolve().parents[1]
    with open(root / "public" / "travel-route.json") as f:
        points = json.load(f)

    cum = [0.0]
    total = 0.0
    for i in range(1, len(points)):
        total += haversine_py(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1])
        cum.append(total)
    distance_at = build_journey_timing(cum)

    # synthetic: 0, 0.1, 10.1, 10.2 degrees longitude at equator ~ hops 11.1 / 1112 / 11.1 km
    syn = [(0.0, 0.0), (0.0, 0.1), (0.0, 10.1), (0.0, 10.2)]
    syn_cum = [0.0]
    for i in range(1, len(syn)):
        syn_cum.append(syn_cum[-1] + haversine_py(syn[i - 1][0], syn[i - 1][1], syn[i][0], syn[i][1]))
    syn_bal = build_journey_timing(syn_cum)
    syn_off = build_journey_timing(syn_cum, exponent=1.0)

    hop_sh_bkk = interpolate_latlon(31.23, 121.47, 13.75, 100.52, 0.5)

    # year slices
    by_year = {}
    for p in points:
        y = str(__import__("datetime").datetime.utcfromtimestamp(p[2]).year)
        by_year.setdefault(y, []).append(p)
    year_stats = {}
    for y, pts in sorted(by_year.items()):
        c = [0.0]
        t = 0.0
        for i in range(1, len(pts)):
            t += haversine_py(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1])
            c.append(t)
        year_stats[y] = {
            "points": len(pts),
            "km": round(t, 3),
            "android_trail_km_30s": round(trail_window_km(t, 30), 3),
            "python_tail_km": 500,
        }

    progress = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0]
    payload = {
        "all": {
            "points": len(points),
            "km_py": round(total, 6),
            "km_android_r": round(
                sum(
                    haversine_android(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1])
                    for i in range(1, len(points))
                ),
                6,
            ),
            "distance_at": {format(p, "g"): round(distance_at(p), 6) for p in progress},
            "android_trail_km_30s": round(trail_window_km(total, 30), 3),
            "python_tail_km": 500,
        },
        "synthetic": {
            "cum": syn_cum,
            "balanced": {format(p, "g"): syn_bal(p) for p in progress},
            "linear": {format(p, "g"): syn_off(p) for p in progress},
            "long_segment_km": syn_cum[2] - syn_cum[1],
        },
        "great_circle_mid_shanghai_bangkok": hop_sh_bkk,
        "years": year_stats,
        "outro": {
            "at_30s": outro_frame(30, 30),
            "at_30_5s": outro_frame(30.5, 30),
            "at_31s": outro_frame(31, 30),
            "at_31_5s": outro_frame(31.5, 30),
        },
        "camera": {
            "steady_context_km": STEADY_CONTEXT,
            "steady_padding": STEADY_PADDING,
            "dead_zone": CAMERA_DEAD_ZONE_HALF,
            "note": "span comes from bbox of points within ±contextKm, then * padding — not a fixed visible-km zoom",
        },
    }
    out = root / "scripts" / ".visualizer-reference.json"
    out.write_text(json.dumps(payload, indent=2))
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
