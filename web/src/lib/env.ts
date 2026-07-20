/**
 * Centralized, typed access to environment variables.
 *
 * Reading `process.env` in one place (with sensible defaults) means the rest of
 * the app never worries about missing/renamed vars. See
 * teaching/12-nextjs/02-config-and-data-fetching.md.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  backendOrigin: process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://localhost:8000",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};
