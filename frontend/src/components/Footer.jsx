import AuthixLogo from "@/components/AuthixLogo";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer data-testid="footer" className="border-t border-white/5 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2">
            <AuthixLogo size={32} showText />
            <p className="mono text-sm text-zinc-500 mt-4 max-w-xs leading-relaxed">
              The Discord verification and security layer for modern communities.
            </p>
          </div>

          <FooterCol
            title="Product"
            links={[
              { label: "Features", href: "/#features" },
              { label: "How it works", href: "/#how" },
              { label: "Commands", href: "/#commands" },
              { label: "Premium", href: "/#premium" },
            ]}
          />
          <FooterCol
            title="Resources"
            links={[
              { label: "Docs", to: "/docs" },
              { label: "Support", href: "/#cta" },
              { label: "Discord", href: "https://discord.com" },
            ]}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t border-white/5">
          <span className="mono text-xs uppercase tracking-[0.2em] text-zinc-600">
            © {new Date().getFullYear()} Authix · All rights reserved
          </span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              to="/privacy"
              data-testid="footer-link-privacy"
              className="mono text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              data-testid="footer-link-terms"
              className="mono text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
            >
              Terms
            </Link>
            <span className="mono text-xs uppercase tracking-[0.2em] text-zinc-600">
              Built for Discord · Powered by humans
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const FooterCol = ({ title, links }) => (
  <div>
    <div className="mono text-xs uppercase tracking-[0.25em] text-zinc-400 mb-4">
      {title}
    </div>
    <ul className="space-y-3">
      {links.map((l) => (
        <li key={l.label}>
          {l.to ? (
            <Link to={l.to} className="mono text-sm text-zinc-400 hover:text-white">
              {l.label}
            </Link>
          ) : (
            <a
              href={l.href}
              className="mono text-sm text-zinc-400 hover:text-white"
              data-testid={`footer-link-${l.label.toLowerCase()}`}
            >
              {l.label}
            </a>
          )}
        </li>
      ))}
    </ul>
  </div>
);
