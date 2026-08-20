import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildRoute,
  contextKmForScope,
  durationMsForScope,
  HOLD_MS,
  interpolateLatLng,
  OUTRO_TRANSITION_MS,
  positionAtDistance,
  rawSteadyCamera,
  trailWindowKm,
} from "../src/lib/journey.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const points = JSON.parse(readFileSync(resolve(root, "public/travel-route.json"), "utf8")) as [
  number,
  number,
  number,
][];
const ref = JSON.parse(readFileSync(resolve(root, "scripts/.visualizer-reference.json"), "utf8"));

type Check = { name: string; pass: boolean; detail: string };
const checks: Check[] = [];

function near(a: number, b: number, eps: number) {
  return Math.abs(a - b) <= eps;
}

function check(name: string, pass: boolean, detail: string) {
  checks.push({ name, pass, detail });
}

const route = buildRoute(points)!;
const progress = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];

check(
  "total distance vs Python haversine R=6371",
  near(route.totalKm, ref.all.km_py, 0.05),
  `ours=${route.totalKm.toFixed(3)} py=${ref.all.km_py} androidR=${ref.all.km_android_r}`
);

for (const p of progress) {
  const ours = route.distanceAt(p);
  const theirs = ref.all.distance_at[String(p)];
  check(
    `balanced timing progress=${p}`,
    near(ours, theirs, 0.5),
    `ours=${ours.toFixed(3)} visualizer=${theirs}`
  );
}

const mid = interpolateLatLng([31.23, 121.47], [13.75, 100.52], 0.5);
const refMid = ref.great_circle_mid_shanghai_bangkok;
check(
  "great-circle midpoint Shanghai→Bangkok",
  near(mid[0], refMid[0], 1e-8) && near(mid[1], refMid[1], 1e-8),
  `ours=[${mid[0]}, ${mid[1]}] visualizer=[${refMid[0]}, ${refMid[1]}]`
);

const synPts: Array<[number, number, number]> = [
  [0, 0, 0],
  [0, 0.1, 1],
  [0, 10.1, 2],
  [0, 10.2, 3],
];
const syn = buildRoute(synPts)!;
for (const p of progress) {
  const ours = syn.distanceAt(p);
  const theirs = ref.synthetic.balanced[String(p)];
  check(
    `synthetic balanced progress=${p}`,
    near(ours, theirs, 1e-6),
    `ours=${ours} visualizer=${theirs}`
  );
}
check(
  "synthetic long hop compressed vs linear at 0.1",
  syn.distanceAt(0.1) < syn.totalKm * 0.1 - 1,
  `compressed=${syn.distanceAt(0.1).toFixed(3)} linear=${(syn.totalKm * 0.1).toFixed(3)}`
);

const pos0 = positionAtDistance(route, 0);
const pos1 = positionAtDistance(route, route.totalKm);
check("positionAt 0 is first point", pos0[0] === points[0][0] && pos0[1] === points[0][1], `${pos0}`);
check(
  "positionAt end is last point",
  near(pos1[0], points[points.length - 1][0], 1e-6) && near(pos1[1], points[points.length - 1][1], 1e-6),
  `${pos1} vs ${points[points.length - 1]}`
);

check(
  "tail length matches Android (time window 2.5s, 80–2000km)",
  near(trailWindowKm(route.totalKm, 30), ref.all.android_trail_km_30s, 0.5),
  `ours=${trailWindowKm(route.totalKm, 30)} android=${ref.all.android_trail_km_30s}`
);

check(
  "steady context is always 650km like Android STEADY",
  contextKmForScope() === 650,
  `contextKm=${contextKmForScope()} expected=650`
);

check(
  "outro is 1.0s zoom + 0.5s hold (Android OUTRO 1.5s total, transition 1.0s)",
  OUTRO_TRANSITION_MS === 1000 && HOLD_MS === 500,
  `ours transition=${OUTRO_TRANSITION_MS}ms hold=${HOLD_MS}ms`
);

const yearMs = durationMsForScope();
check(
  "1x duration is 300s",
  yearMs === 300000,
  `ours 1x duration=${yearMs}ms`
);

const localRoute = buildRoute([
  [27.7172, 85.324, 1],
  [27.72, 85.33, 2],
  [27.71, 85.32, 3],
])!;
const hopRoute = buildRoute([
  [31.23, 121.47, 1],
  [13.75, 100.52, 2],
])!;
const localCam = rawSteadyCamera(localRoute, localRoute.totalKm / 2, 800, 480);
const hopCam = rawSteadyCamera(hopRoute, hopRoute.totalKm / 2, 800, 480);
check(
  "camera uses bbox of ±contextKm then padding, not fixed visible-km",
  localCam.spanY < hopCam.spanY * 0.5,
  `local spanY=${localCam.spanY.toFixed(5)} hop spanY=${hopCam.spanY.toFixed(5)}`
);

const failed = checks.filter((c) => !c.pass);
const passed = checks.filter((c) => c.pass);
console.log("=== MATCHES ===");
for (const c of passed) console.log(`PASS  ${c.name}  ${c.detail}`);
console.log("\n=== DIFFERENCES ===");
for (const c of failed) console.log(`DIFF  ${c.name}  ${c.detail}`);
console.log(`\n${passed.length} match, ${failed.length} differ, ${checks.length} checks`);
if (failed.length) process.exit(1);
