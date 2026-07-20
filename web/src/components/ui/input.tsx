import { cn } from "@/lib/utils";

/** A styled text input that forwards a ref (needed by react-hook-form). */
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
