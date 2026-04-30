import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import AuthixLogo from "@/components/AuthixLogo";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how" },
    { label: "Commands", href: "#commands" },
    { label: "Premium", href: "#premium" },
  ];

  return (
    <header
      data-testid="navbar"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#050505]/80 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between h-16">
        <Link to="/" data-testid="navbar-logo-link">
          <AuthixLogo size={32} showText />
        </Link>

        <nav className="hidden md:flex items-center gap-10 mono text-sm">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-zinc-300 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/docs"
            data-testid="nav-link-docs"
            className="text-zinc-300 hover:text-white transition-colors"
          >
            Docs
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="#cta"
            data-testid="navbar-add-to-discord"
            className="authix-glow-btn mono text-sm font-bold px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#007AFF] to-[#00E5FF] text-black transition-all"
          >
            Add to Discord
          </a>
        </div>

        <button
          data-testid="navbar-mobile-toggle"
          className="md:hidden text-white p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div
          data-testid="navbar-mobile-menu"
          className="md:hidden border-t border-white/10 bg-[#050505]/95 backdrop-blur-xl"
        >
          <div className="px-6 py-5 flex flex-col gap-4 mono text-sm">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-zinc-300 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <Link to="/docs" onClick={() => setOpen(false)} className="text-zinc-300">
              Docs
            </Link>
            <a
              href="#cta"
              onClick={() => setOpen(false)}
              className="authix-glow-btn mono text-sm font-bold px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#007AFF] to-[#00E5FF] text-black text-center"
            >
              Add to Discord
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
