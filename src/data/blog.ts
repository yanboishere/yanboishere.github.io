export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
  mood?: string;
  location?: string;
}

export const blogPosts: BlogPost[] = [];

