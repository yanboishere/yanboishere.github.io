import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, "..", "content", "blog");
const IMG_DIR = path.join(__dirname, "..", "public", "blog-images", "uzbekistan");

if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

const html = fs.readFileSync("/tmp/wechat_article.html", "utf-8");

const imgUrls = [];
const imgRegex = /data-src="(https:\/\/mmbiz\.qpic\.cn\/[^"]+?)"/g;
let m;
const seen = new Set();
while ((m = imgRegex.exec(html)) !== null) {
  let url = m[1].replace(/\\x26amp;amp;/g, "&").replace(/\\x26/g, "&");
  if (!seen.has(url)) {
    seen.add(url);
    imgUrls.push(url);
  }
}

console.log(`Found ${imgUrls.length} unique images`);

const SKIP = new Set([imgUrls[0]]);

const articleImages = imgUrls.filter((u) => !SKIP.has(u));
console.log(`Article images to download: ${articleImages.length}`);

const imageMap = {};
for (let i = 0; i < articleImages.length; i++) {
  const url = articleImages[i];
  const ext = url.includes("wx_fmt=png") ? "png" : "jpg";
  const filename = `img-${String(i + 1).padStart(2, "0")}.${ext}`;
  const filepath = path.join(IMG_DIR, filename);
  if (!fs.existsSync(filepath) || fs.statSync(filepath).size < 1000) {
    console.log(`Downloading ${i + 1}/${articleImages.length}: ${filename}`);
    try {
      execSync(
        `curl -sL -o '${filepath}' -H 'Referer: https://mp.weixin.qq.com/' -H 'User-Agent: Mozilla/5.0' '${url}'`,
        { timeout: 30000 }
      );
    } catch (e) {
      console.log(`  ERROR downloading ${filename}`);
    }
  } else {
    console.log(`Skipping ${filename} (exists)`);
  }
  imageMap[i] = `/blog-images/uzbekistan/${filename}`;
}

fs.writeFileSync(
  path.join(__dirname, "..", "wechat-image-map.json"),
  JSON.stringify(imageMap, null, 2)
);
console.log("\nImage map saved to wechat-image-map.json");
console.log(`Total: ${Object.keys(imageMap).length} images`);
