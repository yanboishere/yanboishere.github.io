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
const failed = [2,6,7,9,11,16,17,18];

for (const idx of failed) {
  const url = articleUrls[idx];
  const ext = url.includes("wx_fmt=png") ? "png" : "jpg";
  const filename = `img-${String(idx + 1).padStart(2, "0")}.${ext}`;
  const filepath = path.join(IMG_DIR, filename);

  if (fs.existsSync(filepath) && fs.statSync(filepath).size > 1000) {
    console.log(`Skip ${filename} (exists)`);
    continue;
  }

  const retryUrl = url.replace("https://mmbiz.qpic.cn/", "https://mmbiz.qpic.cn/sz_");
  console.log(`Retry ${filename}...`);
  try {
    execSync(
      `curl -sL -o '${filepath}' -H 'Referer: https://mp.weixin.qq.com/' -H 'User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' '${retryUrl}'`,
      { timeout: 30000 }
    );
    const stat = fs.statSync(filepath);
    if (stat.size > 1000) {
      console.log(`  SUCCESS (${stat.size} bytes)`);
    } else {
      console.log(`  FAILED (${stat.size} bytes), trying original...`);
      execSync(
        `curl -sL -o '${filepath}' -H 'Referer: https://mp.weixin.qq.com/' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' '${url}'`,
        { timeout: 30000 }
      );
      const stat2 = fs.statSync(filepath);
      if (stat2.size > 1000) {
        console.log(`  SUCCESS with original (${stat2.size} bytes)`);
      } else {
        console.log(`  STILL FAILED, removing`);
        fs.unlinkSync(filepath);
      }
    }
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
  }
}

const allFiles = fs.readdirSync(IMG_DIR).filter(f => f.startsWith("img-")).sort();
console.log(`\nTotal images: ${allFiles.length}`);
