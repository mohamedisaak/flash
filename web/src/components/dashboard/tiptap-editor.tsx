"use client";

/**
 * Rich-text editor built on Tiptap.
 *
 * Tiptap is a headless editor: it manages the document and gives us commands, but
 * we build the toolbar and styling ourselves. It outputs HTML, which we store in
 * the article's `content` field (and render on the public article page).
 *
 * Beyond text formatting it supports **inline images** (uploaded via the media
 * endpoint) and **video embeds** (YouTube/Vimeo). Both are defined as small
 * custom nodes so we don't pull in extra Tiptap packages; the image is a plain
 * `<img>` and the video a `<iframe class="video-embed">` whose hosts are
 * allow-listed by the frontend CSP (`frame-src`).
 *
 * `immediatelyRender: false` avoids a hydration mismatch: the editor renders only
 * after mount (it's browser-only). See teaching/12-nextjs/07-dashboard-and-forms.md.
 */
import { EditorContent, mergeAttributes, Node, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRef, useState } from "react";
import { authApi } from "@/lib/auth-api";
import { cn } from "@/lib/utils";

// --- Custom nodes -----------------------------------------------------------
// A block image. StarterKit has no image node, so there's no conflict.
const ImageBlock = Node.create({
  name: "imageBlock",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ src: { default: null }, alt: { default: "" } }),
  parseHTML: () => [{ tag: "img[src]" }],
  renderHTML: ({ HTMLAttributes }) => ["img", mergeAttributes(HTMLAttributes, { loading: "lazy" })],
});

// A responsive video embed (YouTube/Vimeo). Rendered as an <iframe> the public
// article page styles to 16:9; the CSP only permits the video hosts below.
const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ src: { default: null } }),
  parseHTML: () => [{ tag: "iframe[src]" }],
  renderHTML: ({ HTMLAttributes }) => [
    "iframe",
    mergeAttributes(HTMLAttributes, {
      class: "video-embed",
      frameborder: "0",
      allowfullscreen: "true",
      allow:
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
    }),
  ],
});

/** Convert a YouTube/Vimeo watch URL to an embeddable player URL (or null). */
function toEmbedUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = u.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean)[0];
    return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }
  // Already an embed URL on an allowed host.
  if (host === "player.vimeo.com") return raw;
  if (
    (host === "youtube.com" || host === "youtube-nocookie.com") &&
    u.pathname.includes("/embed/")
  ) {
    return raw;
  }
  return null;
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded px-2 py-1 text-sm font-medium hover:bg-gray-100 disabled:opacity-50",
        active && "bg-gray-200",
      )}
    >
      {children}
    </button>
  );
}

export function TiptapEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, ImageBlock, VideoEmbed],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "article-body min-h-[240px] px-3 py-2 outline-none" },
    },
  });

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-picked later
    if (!file || !editor) return;
    setUploading(true);
    try {
      const { url } = await authApi.uploadImage(file);
      editor
        .chain()
        .focus()
        .insertContent({ type: "imageBlock", attrs: { src: url, alt: file.name } })
        .run();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleVideo() {
    if (!editor) return;
    const raw = window.prompt("Paste a YouTube or Vimeo link:");
    if (!raw) return;
    const src = toEmbedUrl(raw.trim());
    if (!src) {
      alert("Unrecognised link. Paste a YouTube or Vimeo video URL.");
      return;
    }
    editor.chain().focus().insertContent({ type: "videoEmbed", attrs: { src } }).run();
  }

  if (!editor) return <div className="h-[300px] rounded-md border border-[var(--border)]" />;

  return (
    <div className="rounded-md border border-[var(--border)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border)] p-1">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>i</em>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-[var(--border)]" />

        <ToolbarButton disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? "Uploading…" : "🖼 Image"}
        </ToolbarButton>
        <ToolbarButton onClick={handleVideo}>🎬 Video</ToolbarButton>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImagePick}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
