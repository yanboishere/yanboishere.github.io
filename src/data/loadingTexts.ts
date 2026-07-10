export const LOADING_TEXTS = [
  "稍候片刻，月出文自明。",
  "风过空庭，字句正徐来。",
  "纸白微明，未成篇章。",
  "夜退星沉，此页初醒。",
  "墨痕未定，片语已生春。",
  "云开一隙，文章将至。",
  "万籁俱寂，万字将成。",
  "且听风定，再看句成。",
  "背包正翻，风景将至。",
  "地图上，又画了一条线。",
] as const;

export function getRandomLoadingText(): string {
  return LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)];
}