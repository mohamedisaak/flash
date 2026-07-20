import { cn } from "@/lib/utils";

/** A simple surface container. Children compose freely inside. */
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-[var(--border)] overflow-hidden", className)}>
      {children}
    </div>
  );
}
