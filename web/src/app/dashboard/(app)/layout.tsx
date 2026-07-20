/**
 * Gated area layout. Everything under the `(app)` route group is wrapped by the
 * DashboardShell, which enforces authentication. The `(app)` folder is a route
 * group: it groups files without adding a URL segment, so pages here are at
 * /dashboard, /dashboard/articles, etc. The login page sits outside this group,
 * so it isn't gated (no redirect loop).
 */
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
