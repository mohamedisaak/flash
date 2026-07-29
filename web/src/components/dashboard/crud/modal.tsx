"use client";

/** A simple centered modal dialog used by the admin CRUD forms. */
export function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="mt-10 w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-xl text-[var(--muted)] hover:text-brand"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
