/**
 * Renders an advertisement for a given placement slot.
 *
 * It fetches the active ads for the slot from the API (`/ads/?placement=…`) and
 * shows the first one. Two layouts:
 *
 * - **Banner** (header / in-content, when a `height` is given): if
 *   `left_text`/`right_text` are set, the image sits centered at a fixed height
 *   with its natural width and the side text fills the space on either side (so
 *   a small landscape creative doesn't leave blank gaps). Otherwise the image
 *   fills the banner and an optional `overlay_text` caption is drawn on top.
 * - **Default** (sidebar, etc.): the image shown whole, with an optional
 *   `overlay_text` caption on top.
 *
 * Side text and overlay text are mutually exclusive: side text wins when both
 * are set, so overlay text only shows when no side text is configured. The
 * `image_fit` field chooses `object-contain` (whole image) or `object-cover`
 * (fill the slot, may crop). An optional attention effect animates the whole ad.
 *
 * When no ad is configured we fall back to a neutral placeholder so the layout
 * stays stable. See teaching/12-nextjs/07-dashboard-and-forms.md.
 */
import { api } from "@/lib/api";
import { env } from "@/lib/env";
import { mediaUrl } from "@/lib/utils";
import type { AdPlacement, Advertisement } from "@/lib/types";
import { AdImpression, AdLink } from "./ad-tracking";
import { AdSenseUnit } from "./adsense-unit";

function Placeholder({ label, className }: { label: string; className: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded bg-gray-200 font-semibold text-gray-400 ${className}`}
    >
      {label}
    </div>
  );
}

function SideText({ text, align }: { text: string; align: "start" | "end" }) {
  if (!text) return <div className="flex-1" />;
  return (
    <div
      className={`flex min-w-0 flex-1 items-center ${align === "end" ? "justify-end text-right" : "justify-start text-left"}`}
    >
      <span className="px-2 text-sm font-extrabold uppercase leading-tight text-[var(--foreground)] sm:text-lg">
        {text}
      </span>
    </div>
  );
}

function OverlayCaption({
  text,
  position,
}: {
  text: string;
  position: Advertisement["overlay_position"];
}) {
  if (!text) return null;
  const pos =
    position === "top" ? "top-0" : position === "center" ? "top-1/2 -translate-y-1/2" : "bottom-0";
  return (
    <div className={`pointer-events-none absolute inset-x-0 ${pos} flex justify-center p-3`}>
      <span className="rounded-md bg-black/65 px-3 py-1.5 text-center text-base font-extrabold uppercase tracking-wide text-white shadow-lg">
        {text}
      </span>
    </div>
  );
}

function Linked({ ad, children }: { ad: Advertisement; children: React.ReactNode }) {
  return ad.target_url ? (
    <AdLink id={ad.id} href={ad.target_url} ariaLabel={ad.name}>
      {children}
    </AdLink>
  ) : (
    <>{children}</>
  );
}

export async function Ad({
  placement,
  className = "",
  placeholderClassName = "h-40",
  imageClassName = "max-h-40 w-auto",
  height,
  label = "Advertisement",
}: {
  placement: AdPlacement;
  /** Outer spacing for the slot (e.g. "my-6"). */
  className?: string;
  /** Height for the empty-state placeholder (e.g. "h-24", "h-72"). */
  placeholderClassName?: string;
  /** Image sizing for the default (non-banner) layout, e.g. "w-full". */
  imageClassName?: string;
  /** A fixed height (e.g. "h-24") switches on the banner layout with side text. */
  height?: string;
  label?: string;
}) {
  const ads = await api.listAds(placement);
  const ad = ads[0];

  // No house ad for this slot. Order of preference:
  //  1) A configured AdSense unit for this placement → fill the slot with it.
  //  2) Auto Ads on (but no unit id here) → render nothing, so this space is
  //     free for Google's Auto Ads / the page to flow — no placeholder box.
  //  3) Otherwise → the neutral placeholder, so the layout stays stable.
  if (!ad) {
    const adsenseSlot = env.adsense.client ? env.adsense.slots[placement] : "";
    if (adsenseSlot) {
      return (
        <div className={className}>
          <AdSenseUnit slot={adsenseSlot} label={label} />
        </div>
      );
    }
    if (env.adsense.client && env.adsense.autoAds) return null;
    return <Placeholder label={label} className={`${placeholderClassName} ${className}`} />;
  }

  const img = mediaUrl(ad.image, env.backendOrigin);
  const effectClass =
    ad.effect === "pulse"
      ? "ad-pulse"
      : ad.effect === "glow"
        ? "ad-glow"
        : ad.effect === "blink"
          ? "ad-blink"
          : "";
  const fitClass = ad.image_fit === "cover" ? "object-cover" : "object-contain";
  const hasSideText = Boolean(ad.left_text || ad.right_text);

  // --- Banner layout (fixed height) ---
  if (img && height) {
    // With side text: image centered at its natural width, text fills the sides.
    if (hasSideText) {
      return (
        <Linked ad={ad}>
          <AdImpression id={ad.id} />
          <div className={`flex ${height} items-stretch gap-3 rounded ${effectClass} ${className}`}>
            <SideText text={ad.left_text} align="end" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={ad.name}
              loading="lazy"
              decoding="async"
              className={`h-full w-auto max-w-full rounded ${fitClass}`}
            />
            <SideText text={ad.right_text} align="start" />
          </div>
        </Linked>
      );
    }
    // No side text: image fills the banner, with an optional overlay caption.
    return (
      <Linked ad={ad}>
        <div className={`relative ${height} overflow-hidden rounded ${effectClass} ${className}`}>
          <AdImpression id={ad.id} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={ad.name}
            loading="lazy"
            decoding="async"
            className={`h-full w-full rounded ${fitClass}`}
          />
          <OverlayCaption text={ad.overlay_text} position={ad.overlay_position} />
        </div>
      </Linked>
    );
  }

  // --- Default layout: whole image, optional overlay caption ---
  if (img) {
    return (
      <Linked ad={ad}>
        <div className={`relative rounded ${effectClass} ${className}`}>
          <AdImpression id={ad.id} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={ad.name}
            loading="lazy"
            decoding="async"
            className={`mx-auto block max-w-full rounded ${fitClass} ${imageClassName}`}
          />
          <OverlayCaption text={ad.overlay_text} position={ad.overlay_position} />
        </div>
      </Linked>
    );
  }

  // HTML/script ad tag (e.g. an ad-network snippet) when there's no image.
  if (ad.html) {
    return (
      <>
        <AdImpression id={ad.id} />
        <div
          className={`overflow-hidden rounded ${effectClass} ${className}`}
          dangerouslySetInnerHTML={{ __html: ad.html }}
        />
      </>
    );
  }

  return <Placeholder label={label} className={`${placeholderClassName} ${className}`} />;
}
