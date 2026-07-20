"use client";

/**
 * Rich-text editor built on Tiptap.
 *
 * Tiptap is a headless editor: it manages the document and gives us commands, but
 * we build the toolbar and styling ourselves. It outputs HTML, which we store in
 * the article's `content` field (and render on the public article page).
 *
 * `immediatelyRender: false` avoids a hydration mismatch: the editor renders only
 * after mount (it's browser-only). See teaching/12-nextjs/07-dashboard-and-forms.md.
 */
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-2 py-1 text-sm font-medium hover:bg-gray-100",
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
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "article-body min-h-[240px] px-3 py-2 outline-none" },
    },
  });

  if (!editor) return <div className="h-[300px] rounded-md border border-[var(--border)]" />;

  return (
    <div className="rounded-md border border-[var(--border)]">
      <div className="flex flex-wrap gap-1 border-b border-[var(--border)] p-1">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>i</em>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • List
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          Quote
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
