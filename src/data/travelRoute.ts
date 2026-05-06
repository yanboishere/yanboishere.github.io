// 哈哈 生成一条走过20个国家的真实轨迹数据
// 几万个GPS点，模拟真实GPX轨迹

interface TrackPoint {
  lat: number;
  lng: number;
  timestamp: number;
  country: string;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function addNoise(val: number, scale: number): number {
  return val + (Math.random() - 0.5) * scale;
}

// 在两个点之间生成密集的中间点，模拟真实GPS轨迹
function interpolateSegment(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  country: string,
  startTime: number,
  pointCount: number,
  noiseScale: number = 0.002
): TrackPoint[] {
  const points: TrackPoint[] = [];
  for (let i = 0; i <= pointCount; i++) {
    const t = i / pointCount;
    // 使用非线性插值让轨迹更自然（不完全直线）
    const curve = t + Math.sin(t * Math.PI) * 0.05 * (Math.random() - 0.5);
    points.push({
      lat: addNoise(lerp(from.lat, to.lat, curve), noiseScale),
      lng: addNoise(lerp(from.lng, to.lng, curve), noiseScale),
      timestamp: startTime + i * 60000, // 每分钟一个点
      country,
    });
  }
  return points;
}

// 生成城市内的随机漫游点（模拟在城市里活动）
function generateCityWander(
  center: { lat: number; lng: number },
  country: string,
  startTime: number,
  days: number,
  pointsPerDay: number = 80
): TrackPoint[] {
  const points: TrackPoint[] = [];
  let curLat = center.lat;
  let curLng = center.lng;
  const totalPoints = days * pointsPerDay;

  for (let i = 0; i < totalPoints; i++) {
    curLat += (Math.random() - 0.5) * 0.008;
    curLng += (Math.random() - 0.5) * 0.008;
    points.push({
      lat: curLat,
      lng: curLng,
      timestamp: startTime + i * 1080000, // ~18分钟一个点
      country,
    });
  }
  return points;
}

// 城市之间的真实路线节点（经过的主要路径）
const routeSegments = [
  // 🇨🇳 中国出发
  { from: { lat: 31.23, lng: 121.47 }, to: { lat: 22.54, lng: 114.06 }, country: "中国", points: 200, noise: 0.01 },
  // 香港飞曼谷
  { from: { lat: 22.54, lng: 114.06 }, to: { lat: 13.75, lng: 100.52 }, country: "飞行", points: 80, noise: 0.3 },
  // 🇹🇭 泰国 - 曼谷
  { from: { lat: 13.75, lng: 100.52 }, to: { lat: 13.75, lng: 100.52 }, country: "泰国", points: 0 },
  // 曼谷 → 清迈（火车/大巴路线）
  { from: { lat: 13.75, lng: 100.52 }, to: { lat: 18.79, lng: 98.98 }, country: "泰国", points: 300, noise: 0.015 },
  // 清迈 → 普吉
  { from: { lat: 18.79, lng: 98.98 }, to: { lat: 7.88, lng: 98.39 }, country: "泰国", points: 200, noise: 0.012 },
  // 普吉飞河内
  { from: { lat: 7.88, lng: 98.39 }, to: { lat: 21.03, lng: 105.85 }, country: "飞行", points: 60, noise: 0.4 },
  // 🇻🇳 越南 - 河内 → 顺化 → 岘港 → 胡志明
  { from: { lat: 21.03, lng: 105.85 }, to: { lat: 16.46, lng: 107.6 }, country: "越南", points: 250, noise: 0.01 },
  { from: { lat: 16.46, lng: 107.6 }, to: { lat: 10.82, lng: 106.63 }, country: "越南", points: 300, noise: 0.01 },
  // 胡志明飞吉隆坡
  { from: { lat: 10.82, lng: 106.63 }, to: { lat: 3.14, lng: 101.69 }, country: "飞行", points: 50, noise: 0.3 },
  // 🇲🇾 马来西亚
  { from: { lat: 3.14, lng: 101.69 }, to: { lat: 5.41, lng: 100.33 }, country: "马来西亚", points: 150, noise: 0.01 },
  // 吉隆坡飞雅加达
  { from: { lat: 3.14, lng: 101.69 }, to: { lat: -6.21, lng: 106.85 }, country: "飞行", points: 50, noise: 0.3 },
  // 🇮🇩 印尼 - 雅加达 → 日惹 → 巴厘岛
  { from: { lat: -6.21, lng: 106.85 }, to: { lat: -7.79, lng: 110.37 }, country: "印尼", points: 200, noise: 0.012 },
  { from: { lat: -7.79, lng: 110.37 }, to: { lat: -8.65, lng: 115.22 }, country: "印尼", points: 200, noise: 0.012 },
  // 巴厘岛飞新加坡
  { from: { lat: -8.65, lng: 115.22 }, to: { lat: 1.35, lng: 103.82 }, country: "飞行", points: 50, noise: 0.3 },
  // 🇸🇬 新加坡
  { from: { lat: 1.35, lng: 103.82 }, to: { lat: 1.35, lng: 103.82 }, country: "新加坡", points: 0 },
  // 新加坡飞首尔
  { from: { lat: 1.35, lng: 103.82 }, to: { lat: 37.57, lng: 126.98 }, country: "飞行", points: 80, noise: 0.4 },
  // 🇰🇷 韩国 - 首尔 → 釜山 → 首尔
  { from: { lat: 37.57, lng: 126.98 }, to: { lat: 35.18, lng: 129.08 }, country: "韩国", points: 200, noise: 0.01 },
  { from: { lat: 35.18, lng: 129.08 }, to: { lat: 37.57, lng: 126.98 }, country: "韩国", points: 200, noise: 0.01 },
  // 首尔飞东京
  { from: { lat: 37.57, lng: 126.98 }, to: { lat: 35.68, lng: 139.69 }, country: "飞行", points: 50, noise: 0.3 },
  // 🇯🇵 日本 - 东京 → 京都 → 大阪 → 东京
  { from: { lat: 35.68, lng: 139.69 }, to: { lat: 35.01, lng: 135.77 }, country: "日本", points: 250, noise: 0.008 },
  { from: { lat: 35.01, lng: 135.77 }, to: { lat: 34.69, lng: 135.5 }, country: "日本", points: 100, noise: 0.008 },
  { from: { lat: 34.69, lng: 135.5 }, to: { lat: 35.68, lng: 139.69 }, country: "日本", points: 200, noise: 0.008 },
  // 东京飞里斯本（经转）
  { from: { lat: 35.68, lng: 139.69 }, to: { lat: 38.72, lng: -9.14 }, country: "飞行", points: 100, noise: 0.5 },
  // 🇵🇹 葡萄牙 - 里斯本 → 波尔图 → 里斯本
  { from: { lat: 38.72, lng: -9.14 }, to: { lat: 41.15, lng: -8.61 }, country: "葡萄牙", points: 200, noise: 0.01 },
  { from: { lat: 41.15, lng: -8.61 }, to: { lat: 38.72, lng: -9.14 }, country: "葡萄牙", points: 200, noise: 0.01 },
  // 里斯本坐火车去马德里
  { from: { lat: 38.72, lng: -9.14 }, to: { lat: 40.42, lng: -3.7 }, country: "西班牙", points: 250, noise: 0.012 },
  // 🇪🇸 西班牙 - 马德里 → 巴塞罗那
  { from: { lat: 40.42, lng: -3.7 }, to: { lat: 41.39, lng: 2.17 }, country: "西班牙", points: 200, noise: 0.01 },
  // 巴塞罗那飞柏林
  { from: { lat: 41.39, lng: 2.17 }, to: { lat: 52.52, lng: 13.41 }, country: "飞行", points: 50, noise: 0.3 },
  // 🇩🇪 德国
  { from: { lat: 52.52, lng: 13.41 }, to: { lat: 48.14, lng: 11.58 }, country: "德国", points: 200, noise: 0.01 },
  // 柏林飞回曼谷
  { from: { lat: 52.52, lng: 13.41 }, to: { lat: 13.75, lng: 100.52 }, country: "飞行", points: 100, noise: 0.5 },
  // 🇹🇭 回到泰国 - 清迈
  { from: { lat: 13.75, lng: 100.52 }, to: { lat: 18.79, lng: 98.98 }, country: "泰国", points: 200, noise: 0.012 },
  // 清迈飞首尔（现在住的地方）
  { from: { lat: 18.79, lng: 98.98 }, to: { lat: 37.55, lng: 126.97 }, country: "飞行", points: 70, noise: 0.4 },
];

// 城市停留点（在城市里会有多天活动轨迹）
const cityStays = [
  { lat: 31.23, lng: 121.47, country: "中国-上海", days: 5 },
  { lat: 22.54, lng: 114.06, country: "中国-深圳", days: 3 },
  { lat: 13.75, lng: 100.52, country: "泰国-曼谷", days: 7 },
  { lat: 18.79, lng: 98.98, country: "泰国-清迈", days: 30 },
  { lat: 7.88, lng: 98.39, country: "泰国-普吉", days: 5 },
  { lat: 21.03, lng: 105.85, country: "越南-河内", days: 5 },
  { lat: 16.46, lng: 107.6, country: "越南-顺化", days: 3 },
  { lat: 10.82, lng: 106.63, country: "越南-胡志明", days: 7 },
  { lat: 3.14, lng: 101.69, country: "马来西亚-吉隆坡", days: 7 },
  { lat: 5.41, lng: 100.33, country: "马来西亚-槟城", days: 5 },
  { lat: -6.21, lng: 106.85, country: "印尼-雅加达", days: 3 },
  { lat: -7.79, lng: 110.37, country: "印尼-日惹", days: 4 },
  { lat: -8.65, lng: 115.22, country: "印尼-巴厘岛", days: 20 },
  { lat: 1.35, lng: 103.82, country: "新加坡", days: 4 },
  { lat: 37.57, lng: 126.98, country: "韩国-首尔", days: 30 },
  { lat: 35.18, lng: 129.08, country: "韩国-釜山", days: 5 },
  { lat: 35.68, lng: 139.69, country: "日本-东京", days: 10 },
  { lat: 35.01, lng: 135.77, country: "日本-京都", days: 5 },
  { lat: 34.69, lng: 135.5, country: "日本-大阪", days: 5 },
  { lat: 38.72, lng: -9.14, country: "葡萄牙-里斯本", days: 20 },
  { lat: 41.15, lng: -8.61, country: "葡萄牙-波尔图", days: 7 },
  { lat: 40.42, lng: -3.7, country: "西班牙-马德里", days: 5 },
  { lat: 41.39, lng: 2.17, country: "西班牙-巴塞罗那", days: 10 },
  { lat: 52.52, lng: 13.41, country: "德国-柏林", days: 7 },
  { lat: 48.14, lng: 11.58, country: "德国-慕尼黑", days: 5 },
];

// 这个函数生成完整的轨迹数据
export function generateTravelRoute(): TrackPoint[] {
  const allPoints: TrackPoint[] = [];
  let currentTime = new Date("2022-01-15").getTime();

  // 1. 先生成城市内的活动轨迹
  for (const stay of cityStays) {
    const cityPoints = generateCityWander(
      { lat: stay.lat, lng: stay.lng },
      stay.country,
      currentTime,
      stay.days,
      80
    );
    allPoints.push(...cityPoints);
    currentTime += stay.days * 24 * 60 * 60 * 1000;
  }

  // 2. 再生成城市之间的移动轨迹
  for (const seg of routeSegments) {
    if (seg.points === 0) continue;
    const segPoints = interpolateSegment(
      seg.from,
      seg.to,
      seg.country,
      currentTime,
      seg.points,
      seg.noise
    );
    allPoints.push(...segPoints);
    currentTime += seg.points * 60000;
  }

  // 按时间排序
  allPoints.sort((a, b) => a.timestamp - b.timestamp);
  return allPoints;
}

// 旅行的国家/城市标记点（用于地图上的标注）
export const travelMarkers = [
  { lat: 31.23, lng: 121.47, label: "上海", emoji: "🇨🇳", visits: 2 },
  { lat: 22.54, lng: 114.06, label: "深圳", emoji: "🇨🇳", visits: 1 },
  { lat: 13.75, lng: 100.52, label: "曼谷", emoji: "🇹🇭", visits: 3 },
  { lat: 18.79, lng: 98.98, label: "清迈", emoji: "🇹🇭", visits: 5 },
  { lat: 7.88, lng: 98.39, label: "普吉", emoji: "🇹🇭", visits: 1 },
  { lat: 21.03, lng: 105.85, label: "河内", emoji: "🇻🇳", visits: 1 },
  { lat: 10.82, lng: 106.63, label: "胡志明", emoji: "🇻🇳", visits: 1 },
  { lat: 3.14, lng: 101.69, label: "吉隆坡", emoji: "🇲🇾", visits: 2 },
  { lat: 5.41, lng: 100.33, label: "槟城", emoji: "🇲🇾", visits: 1 },
  { lat: -8.65, lng: 115.22, label: "巴厘岛", emoji: "🇮🇩", visits: 2 },
  { lat: 1.35, lng: 103.82, label: "新加坡", emoji: "🇸🇬", visits: 1 },
  { lat: 37.57, lng: 126.98, label: "首尔", emoji: "🇰🇷", visits: 3 },
  { lat: 35.18, lng: 129.08, label: "釜山", emoji: "🇰🇷", visits: 1 },
  { lat: 35.68, lng: 139.69, label: "东京", emoji: "🇯🇵", visits: 2 },
  { lat: 35.01, lng: 135.77, label: "京都", emoji: "🇯🇵", visits: 1 },
  { lat: 34.69, lng: 135.5, label: "大阪", emoji: "🇯🇵", visits: 1 },
  { lat: 38.72, lng: -9.14, label: "里斯本", emoji: "🇵🇹", visits: 2 },
  { lat: 41.15, lng: -8.61, label: "波尔图", emoji: "🇵🇹", visits: 1 },
  { lat: 40.42, lng: -3.7, label: "马德里", emoji: "🇪🇸", visits: 1 },
  { lat: 41.39, lng: 2.17, label: "巴塞罗那", emoji: "🇪🇸", visits: 1 },
  { lat: 52.52, lng: 13.41, label: "柏林", emoji: "🇩🇪", visits: 1 },
  { lat: 48.14, lng: 11.58, label: "慕尼黑", emoji: "🇩🇪", visits: 1 },
];
