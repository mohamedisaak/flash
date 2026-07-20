/**
 * TypeScript types mirroring the Django REST API's JSON shapes.
 *
 * These are hand-written to match the serializers in the backend. In a larger
 * team you'd generate them from the OpenAPI schema (/api/schema/); here they're
 * explicit so they double as documentation. See
 * teaching/14-typescript/02-typing-api-data.md.
 */

/** DRF's paginated list envelope: { count, next, previous, results }. */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthorMini {
  id: number;
  username: string;
  full_name: string;
  avatar: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  featured_image: string | null;
  parent: number | null;
  order: number;
  is_active: boolean;
  article_count: number;
  seo_title: string;
  meta_description: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

/** Lightweight article shape used in feeds/lists. */
export interface ArticleListItem {
  id: number;
  title: string;
  subtitle: string;
  slug: string;
  excerpt: string;
  author: AuthorMini;
  category: Category;
  featured_image: string | null;
  status: string;
  published_at: string | null;
  reading_time: number;
  views: number;
  is_breaking: boolean;
  is_featured: boolean;
}

/** Full article shape used on the article page. */
export interface Article extends ArticleListItem {
  content: string;
  tags: Tag[];
  image_caption: string;
  source: string;
  shares: number;
  reactions: number;
  seo_title: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;
  created_at: string;
  updated_at: string;
}
