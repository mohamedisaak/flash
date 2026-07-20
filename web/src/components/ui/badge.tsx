import { cn } from "@/lib/utils";

/**
 * A small label chip. shadcn-style: a plain component you own.
 * See teaching/16-shadcn/01-what-is-shadcn.md.
 */
export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "brand" | "accent";
  className?: string;
}) {
  const styles = {
    default: "bg-gray-100 text-gray-700",
    brand: "bg-brand text-white",
    accent: "bg-accent text-white", // green category chip (NewsPortal style)
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2.5 py-0.5 text-xs font-semibold",
        styles,
        className,
      )}
    >
      {children}
    </span>
  );
}
