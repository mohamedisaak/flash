/**
 * API JSON shapes — mirror the Django REST serializers (same as the web app's
 * types). Kept hand-written so they double as documentation. See
 * teaching/22-mobile-architecture/.
 */
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
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

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

export interface Article extends ArticleListItem {
  content: string;
  tags: Tag[];
  image_caption: string;
  source: string;
  shares: number;
  reactions: number;
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
