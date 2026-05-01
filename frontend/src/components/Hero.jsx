import { useEffect, useState } from "react";
import axios from "axios";
import { ShieldCheck, Sparkles } from "lucide-react";
import AuthixLogo from "@/components/AuthixLogo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Hero() {
  const [stats, setStats] = useState({
    servers_protected: 0,
    users_verified: 0,
    uptime_percent: 99.98,
  });

  useEffect(() => {
    axios
      .get(`${API}/stats`)
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  return (
    <section
      data-testid="hero-section"
      className="relative overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-32"
    >
      <div className="absolute inset-0 authix-radial" />
      <div className="absolute inset-0 authix-grid-bg opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505]" />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col items-start gap-8">
          <div
            data-testid="hero-badge"
            className="inline-flex items-center gap-2 mono text-xs uppercase tracking-[0.2em] text-[#00E5FF] border border-[#00D2FF]/30 bg-[#00D2FF]/5 rounded-full px-4 py-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] authix-pulse" />
            Discord verification, re-engineered
          </div>

          <h1
            data-testid="hero-title"
            className="chivo text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tighter max-w-4xl"
          >
            Stop bots at the door.
            <br />
            <span className="authix-glow-text text-[#00E5FF]">Verify humans,</span>
            <br />
            grant access instantly.
          </h1>

          <p
            data-testid="hero-subtitle"
            className="max-w-2xl text-zinc-400 text-base sm:text-lg leading-relaxed mono"
          >
            Authix secures your Discord server with image-based captcha verification
            (letters + numbers), role-scoped access control, and premium embed
            customization — all wired into Discord&apos;s native monetization.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <a
              id="cta"
              href="https://discord.com/oauth2/authorize?client_id=1499517686160556192&permissions=8&integration_type=0&scope=bot"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="hero-add-to-discord"
              className="authix-glow-btn mono font-bold text-black px-7 py-3.5 rounded-lg bg-gradient-to-r from-[#007AFF] to-[#00E5FF] flex items-center justify-center gap-2 transition-all"
            >
              <ShieldCheck size={18} />
              Add Authix to Discord
            </a>
            <a
              href="#how"
              data-testid="hero-see-how"
              className="mono font-bold text-white px-7 py-3.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles size={18} />
              See how it works
            </a>
          </div>

          <div
            data-testid="hero-stats"
            className="mt-12 grid grid-cols-3 gap-6 sm:gap-12 border-t border-white/10 pt-8 w-full max-w-2xl"
          >
            <Stat
              value={stats.servers_protected || 0}
              label="Servers protected"
              suffix="+"
              testid="stat-servers"
            />
            <Stat
              value={stats.users_verified || 0}
              label="Humans verified"
              suffix="+"
              testid="stat-users"
            />
            <Stat
              value={stats.uptime_percent}
              label="Uptime %"
              decimals={2}
              testid="stat-uptime"
            />
          </div>
        </div>

        <div className="hidden lg:block absolute right-12 top-32 authix-float">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00D2FF]/20 blur-3xl rounded-full" />
            <div className="relative">
              <AuthixLogo size={220} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const Stat = ({ value, label, suffix = "", decimals = 0, testid }) => (
  <div data-testid={testid}>
    <div className="chivo text-3xl sm:text-4xl font-black text-white tracking-tight">
      {Number(value).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </div>
    <div className="mono text-xs uppercase tracking-[0.2em] text-zinc-500 mt-2">
      {label}
    </div>
  </div>
);
