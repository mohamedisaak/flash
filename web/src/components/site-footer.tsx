/**
 * Dark 4-column footer (NewsPortal style): About, Useful Links, Contact,
 * Newsletter — with social icons.
 */
import Link from "next/link";
import { api } from "@/lib/api";
import { NewsletterForm } from "./public/newsletter-form";
import { SocialIcons } from "./public/socials";

function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 border-b border-white/20 pb-2 text-lg font-bold text-white">{children}</h3>
  );
}

export async function SiteFooter() {
  const settings = await api.getSiteSettings();
  const about =
    settings?.about_us ||
    "Flash News is a demo news platform built as a full-stack learning project.";
  const email = settings?.contact_email || "contact@flashnews.dev";
  const phone = settings?.contact_phone;
  const address = settings?.contact_address;

  return (
    <footer className="mt-10 bg-[var(--footer-bg)] text-[var(--footer-fg)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <ColHeading>About Us</ColHeading>
          <p className="whitespace-pre-line text-sm leading-relaxed">{about}</p>
        </div>

        <div>
          <ColHeading>Useful Links</ColHeading>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-white">
                → Home
              </Link>
            </li>
            <li>
              <Link href="/pages/about" className="hover:text-white">
                → About
              </Link>
            </li>
            <li>
              <Link href="/pages/terms" className="hover:text-white">
                → Terms and Conditions
              </Link>
            </li>
            <li>
              <Link href="/pages/privacy" className="hover:text-white">
                → Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white">
                → FAQ
              </Link>
            </li>
            <li>
              <Link href="/pages/contact" className="hover:text-white">
                → Contact Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <ColHeading>Contact</ColHeading>
          <ul className="space-y-2 text-sm">
            {address && <li>📍 {address}</li>}
            <li>✉️ {email}</li>
            {phone && <li>📞 {phone}</li>}
          </ul>
          <SocialIcons className="mt-4" />
        </div>

        <div>
          <ColHeading>Newsletter</ColHeading>
          <p className="mb-3 text-sm">Get the latest news and great items — subscribe here:</p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs">
        © {new Date().getFullYear()} Flash News. All Rights Reserved.
      </div>
    </footer>
  );
}
