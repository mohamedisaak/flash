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

export interface Video {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  hls_playlist: string;
  duration_seconds: number;
  category: Category;
  published_at: string | null;
  views: number;
}

export interface GalleryImage {
  id: number;
  image: string;
  caption: string;
  credit: string;
  order: number;
}

export interface PhotoGallery {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: Category;
  images: GalleryImage[];
  published_at: string | null;
  created_at: string;
}

export interface SiteSettings {
  site_name: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  about_us: string;
  logo: string | null;
  favicon: string | null;
  theme_color_1: string;
  theme_color_2: string;
  google_analytics_id: string;
  date_status: boolean;
  email_status: boolean;
  news_ticker_status: boolean;
  news_ticker_total: number;
}

export interface StaticPage {
  id: number;
  key: string;
  key_display: string;
  title: string;
  content: string;
  is_active: boolean;
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  order: number;
  is_active: boolean;
}

export type AdPlacement = "header" | "sidebar" | "in_content" | "mobile" | "popup";

export type AdEffect = "none" | "pulse" | "glow" | "blink";
export type OverlayPosition = "top" | "center" | "bottom";

export type ImageFit = "contain" | "cover";

export interface Advertisement {
  id: number;
  name: string;
  placement: AdPlacement;
  image: string | null;
  html: string;
  target_url: string;
  left_text: string;
  right_text: string;
  overlay_text: string;
  overlay_position: OverlayPosition;
  image_fit: ImageFit;
  effect: AdEffect;
  is_active: boolean;
}
