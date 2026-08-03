/**
 * Typed client for the AI-synthesis admin API (`/synthesis/…`).
 *
 * Staff-only, like the ingestion client. Synthesis turns one or more aggregated
 * items into a single ORIGINAL draft article with a Sources/citations block —
 * see the backend in `apps/synthesis/` and teaching/41-ai-synthesis/.
 */
import { apiRequest } from "./auth-api";
import type { Paginated } from "./types";

/** Whether synthesis is configured, and which model would run. */
export interface SynthesisStatus {
  enabled: boolean;
  provider: string; // "ollama" | "groq" | "disabled"
  model: string;
  reason?: string; // present when !enabled — why, and how to fix it
}

export type SynthesisJobStatus = "pending" | "running" | "success" | "error";

export interface SynthesisJob {
  id: number;
  status: SynthesisJobStatus;
  angle: string;
  category_slug: string;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  duration_ms: number;
  error: string;
  source_ids: number[];
  article: number | null;
  article_slug: string | null;
  article_title: string | null;
  created_at: string;
}

export const synthesisApi = {
  status: () => apiRequest<SynthesisStatus>("/synthesis/status/"),

  /** Synthesise one draft from the selected aggregated item ids (runs inline). */
  run: (body: { ids: number[]; angle?: string; category?: string }) =>
    apiRequest<SynthesisJob>("/synthesis/jobs/run/", { method: "POST", body }),

  jobs: () => apiRequest<Paginated<SynthesisJob>>("/synthesis/jobs/"),
};
