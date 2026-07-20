# What is Next.js?

**Topic:** Next.js · **Level:** Beginner

## 1. The idea in one sentence

> Next.js is a **React framework** that renders pages on the server for speed and
> SEO, handles routing from your folder structure, and gives you one toolchain
> for the whole website.

## 2. Why not plain React?

Plain React renders in the **browser**: the user downloads a blank page + a big
JS bundle, which then draws the content. That's bad for a news site because:

- **SEO:** search-engine crawlers and social scrapers may see an empty page.
- **Speed:** the reader waits for JS before seeing anything.

Next.js renders the HTML **on the server** first, so the reader (and Google) get
real content immediately, then React "hydrates" it for interactivity. For a
publisher whose traffic comes from search, this is essential.

## 3. What Next.js gives us

| Feature | What it does | Where we use it |
|---------|--------------|-----------------|
| App Router | file-based routing (`app/` folders = URLs) | all pages |
| Server Components | render on the server, zero client JS | most pages |
| Rendering strategies | SSR / SSG / ISR per route | [`04-rendering-strategies.md`](04-rendering-strategies.md) |
| Metadata API | per-page `<title>`/SEO tags | [`05-images-and-metadata.md`](05-images-and-metadata.md) |
| `next/image` | automatic image optimization | article cards |

## 4. In this project

The public website lives in [`web/`](../../web/). Its structure:

```text
web/src/
├── app/                 # routes (App Router)
│   ├── layout.tsx       # wraps every page
│   ├── page.tsx         # the home page  ("/")
│   ├── articles/[slug]/ # /articles/<slug>
│   ├── [category]/      # /<category>
│   └── search/          # /search
├── components/          # reusable UI
└── lib/                 # API client, types, helpers
```

It talks to the Django REST API from Phase 2 and renders the news.

## 5. Interview questions

- **Junior:** Why render on the server for a news site?
- **Mid:** What is "hydration"?
- **Senior:** When would a SPA (plain React) be a better fit than Next.js?

← [Next.js topic index](README.md)
