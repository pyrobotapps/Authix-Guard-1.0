import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import AuthixLogo from "@/components/AuthixLogo";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const onHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // On arrival to "/" with a hash (e.g. /#features), scroll to it.
  useEffect(() => {
    if (onHome && location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
      }
    }
  }, [onHome, location.hash, location.pathname]);

  const goToSection = (e, hash) => {
    // When on home, do smooth in-page scroll. Off-home, route back to "/" with the hash.
    if (onHome) {
      e.preventDefault();
      const el = document.getElementById(hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      setOpen(false);
    } else {
      e.preventDefault();
      setOpen(false);
      navigate(`/${hash}`);
    }
  };

  const links = [
    { label: "Features", hash: "#features" },
    { label: "How it works", hash: "#how" },
    { label: "Commands", hash: "#commands" },
    { label: "Premium", hash: "#premium" },
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
              key={l.hash}
              href={`/${l.hash}`}
              onClick={(e) => goToSection(e, l.hash)}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-zinc-300 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/docs"
            data-testid="nav-link-docs"
            className={`transition-colors ${
              location.pathname === "/docs"
                ? "text-[#00E5FF]"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            Docs
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="/#cta"
            onClick={(e) => goToSection(e, "#cta")}
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
                key={l.hash}
                href={`/${l.hash}`}
                onClick={(e) => goToSection(e, l.hash)}
                className="text-zinc-300 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <Link to="/docs" onClick={() => setOpen(false)} className="text-zinc-300">
              Docs
            </Link>
            <a
              href="/#cta"
              onClick={(e) => goToSection(e, "#cta")}
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
