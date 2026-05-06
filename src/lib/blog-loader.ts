import { blogPosts as fallbackPosts, BlogPost } from "@/data/blog";

export type { BlogPost };

let cachedPosts: BlogPost[] | null = null;

export async function loadBlogPosts(): Promise<BlogPost[]> {
  if (cachedPosts) return cachedPosts;

  try {
    const res = await fetch("/blog-posts.json");
    if (!res.ok) throw new Error("no blog-posts.json");
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      cachedPosts = data;
      return data;
    }
  } catch {
    // fall through
  }

  cachedPosts = fallbackPosts;
  return fallbackPosts;
}

export function getBlogPostsSync(): BlogPost[] {
  return cachedPosts || fallbackPosts;
}
