import { cn } from "@/lib/utils";

/**
 * A small label chip (e.g. category, "BREAKING"). shadcn-style: a plain component
 * you own and can edit, styled with Tailwind + `cn`.
 * See teaching/16-shadcn/01-what-is-shadcn.md.
 */
export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "brand";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "brand" ? "bg-brand text-white" : "bg-gray-100 text-gray-700",
        className,
      )}
    >
      {children}
    </span>
  );
}
