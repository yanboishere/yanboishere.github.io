import fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.join(__dirname, "..", "public", "blog-images", "uzbekistan");
const html = fs.readFileSync("/tmp/wechat_article.html", "utf-8");

const dataSrcUrls = [];
const regex = /data-src="(https:\/\/mmbiz\.qpic\.cn\/[^"]+?)"/g;
let m;
const seen = new Set();
while ((m = regex.exec(html)) !== null) {
  let url = m[1].replace(/\\x26amp;amp;/g, "&").replace(/\\x26/g, "&");
  if (!seen.has(url)) {
    seen.add(url);
    dataSrcUrls.push(url);
  }
}

const articleUrls = dataSrcUrls.slice(1);
const missing = [
  { idx: 1, name: "img-02.jpg" },
  { idx: 5, name: "img-06.jpg" },
  { idx: 8, name: "img-09.jpg" },
  { idx: 10, name: "img-11.jpg" },
  { idx: 15, name: "img-16.jpg" },
];

for (const { idx, name } of missing) {
  const url = articleUrls[idx];
  if (!url) { console.log(`No URL for ${name}`); continue; }
  
  const filepath = path.join(IMG_DIR, name);
  const tryUrl = url.includes("/sz_") ? url : url.replace("mmbiz.qpic.cn/", "mmbiz.qpic.cn/sz_");
  
  console.log(`Retry ${name}...`);
  console.log(`  URL: ${tryUrl.substring(0, 80)}...`);
  
  try {
    execSync(
      `curl -sL -o '${filepath}' -H 'Referer: https://mp.weixin.qq.com/' -H 'User-Agent: Mozilla/5.0 (Linux; Android 14)' --connect-timeout 10 --max-time 30 '${tryUrl}'`,
      { timeout: 35000 }
    );
    const stat = fs.statSync(filepath);
    if (stat.size > 1000) {
      console.log(`  SUCCESS (${stat.size} bytes)`);
    } else {
      console.log(`  FAILED (${stat.size} bytes)`);
      fs.unlinkSync(filepath);
    }
  } catch (e) {
    console.log(`  ERROR`);
    try { fs.unlinkSync(filepath); } catch {}
  }
}
