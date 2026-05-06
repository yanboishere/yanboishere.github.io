import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "content", "blog");
const OUTPUT_DIR = path.join(__dirname, "..", "public");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "blog-posts.json");

if (!fs.existsSync(CONTENT_DIR)) {
  console.log("No content/blog directory found, skipping blog build.");
  process.exit(0);
}

const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

const posts = files.map((filename) => {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf-8");
  const { data, content } = matter(raw);

  const slug = filename.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
  const html = marked(content);

  return {
    slug,
    title: data.title || slug,
    date: data.date || "",
    excerpt: data.excerpt || "",
    tags: data.tags || [],
    mood: data.mood || "",
    location: data.location || "",
    content: content,
    html: html,
  };
});

posts.sort((a, b) => (b.date > a.date ? 1 : -1));

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2), "utf-8");
console.log(`✅ Built ${posts.length} blog posts → ${OUTPUT_FILE}`);
