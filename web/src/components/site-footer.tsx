/**
 * Dark 4-column footer (NewsPortal style): About, Useful Links, Contact,
 * Newsletter — with social icons.
 */
import Link from "next/link";
import { NewsletterForm } from "./public/newsletter-form";
import { SocialIcons } from "./public/socials";

function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 border-b border-white/20 pb-2 text-lg font-bold text-white">{children}</h3>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-10 bg-[var(--footer-bg)] text-[var(--footer-fg)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <ColHeading>About Us</ColHeading>
          <p className="text-sm leading-relaxed">
            Flash News is a demo news platform built as a full-stack learning project —
            covering the backend API, SEO, the website, and the mobile app.
          </p>
        </div>

        <div>
          <ColHeading>Useful Links</ColHeading>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white">→ Home</Link></li>
            <li><Link href="/about" className="hover:text-white">→ Terms and Conditions</Link></li>
            <li><Link href="/about" className="hover:text-white">→ Privacy Policy</Link></li>
            <li><Link href="/about" className="hover:text-white">→ Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <ColHeading>Contact</ColHeading>
          <ul className="space-y-2 text-sm">
            <li>📍 34 Antiger Lane, PK Lane, USA</li>
            <li>✉️ contact@flashnews.dev</li>
            <li>📞 122-222-1212</li>
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
