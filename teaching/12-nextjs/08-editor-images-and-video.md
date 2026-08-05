# Rich media in the article editor (images & video)

The Tiptap editor stores article bodies as HTML. Beyond text formatting it
supports **inline images** (uploaded to the server) and **video embeds**
(YouTube/Vimeo). This lesson shows how each is wired end-to-end and the two
security gates involved.

## Inline images: upload → URL → `<img>`

An image can't live inside the HTML string, so we upload the file and insert a
reference:

1. **Backend upload endpoint** — `POST /api/v1/media/uploads/`
   (`apps/media/views.py`). Staff-only, validates type + size, saves to media
   storage (local disk or S3), returns `{ "url": "…absolute…" }`.
2. **Editor button** — the 🖼 button opens a file picker; on select it calls
   `authApi.uploadImage(file)` and inserts an `imageBlock` node
   (`<img src=…>`) at the cursor (`tiptap-editor.tsx`).
3. **Storage/serving** — the URL points at `/media/…`, already served by the
   backend (or a CDN when `USE_S3` is on).

## Video: embed, don't upload

We embed YouTube/Vimeo rather than host video files (a 1 GB disk fills fast and
your small instance can't stream well). The 🎬 button:

1. Prompts for a link and normalises it to a player URL
   (`youtu.be/ID` → `youtube.com/embed/ID`, `vimeo.com/ID` →
   `player.vimeo.com/video/ID`).
2. Inserts a `videoEmbed` node — an `<iframe class="video-embed">`.
3. The public page styles that iframe to a responsive 16:9 box (`globals.css`).

Both `imageBlock` and `videoEmbed` are **small custom Tiptap nodes** (a dozen
lines each) rather than extra npm packages — `Node.create({...})` with a
`parseHTML`/`renderHTML` pair so the HTML round-trips through save/edit.

## The two security gates

Editor output is rendered on the public site with `dangerouslySetInnerHTML`, so
untrusted markup would be dangerous. Two layers keep it safe:

1. **What can be inserted** — the editor only ever inserts `<img>` (from *our*
   upload endpoint) and iframes whose URL we normalised to a known video host.
2. **What the browser will load** — the frontend **CSP** is the real
   enforcement. `img-src` allows `https:`, and `frame-src` allow-lists exactly
   the video hosts (`youtube.com`, `youtube-nocookie.com`, `player.vimeo.com`).
   An iframe pointing anywhere else simply won't render, even if it reached the
   HTML. This is defence-in-depth: the client-side allow-list *plus* the
   server-enforced CSP.

## Featured image (multipart)

The lead image isn't in the body — it's the `Article.featured_image` field. The
form sends the whole article as **multipart form data** when a file is chosen
(`articleFormData` in `auth-api.ts`); DRF's default `MultiPartParser` accepts it
and the `ArticleDetailSerializer` writes `featured_image`. When no file is
picked, the form sends plain JSON as before.

## Exercises

1. **Beginner** — Paste a `vimeo.com/76979871` link via the 🎬 button. What
   exact `src` ends up in the stored HTML, and which function produced it?
2. **Intermediate** — Someone pastes `<iframe src="https://evil.example">` into
   the raw HTML. Trace why it won't play on the public page even though it's in
   `article.content`.
3. **Advanced** — Uploads currently allow 8 MB JP/PNG/WEBP/GIF. Outline adding
   server-side re-encoding to WebP + a max dimension on upload, and where in
   `ImageUploadView` it would slot in (hint: `apps/media/models.py` already has a
   rendition pipeline).

<details><summary>Solutions</summary>

1. `https://player.vimeo.com/video/76979871`, produced by `toEmbedUrl`.
2. `frame-src` in the CSP (`next.config.ts`) doesn't include `evil.example`, so
   the browser blocks the frame regardless of the HTML. 3. Read the upload into
   Pillow, resize to a max width, re-save as WebP to a `BytesIO`, then
   `default_storage.save` that — between the size check and the `save` call.
</details>
