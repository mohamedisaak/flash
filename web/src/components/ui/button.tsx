import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
};

/**
 * A styled button. `...props` spreads native button attributes (onClick, type,
 * disabled), so it behaves exactly like a `<button>` plus our styling.
 * See teaching/13-react/03-props-and-composition.md.
 */
export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
        variant === "primary"
          ? "bg-brand text-white hover:bg-brand-dark"
          : "border border-[var(--border)] hover:bg-gray-50",
        className,
      )}
      {...props}
    />
  );
}
