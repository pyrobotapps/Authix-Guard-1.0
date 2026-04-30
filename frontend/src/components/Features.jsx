import {
  ShieldCheck,
  UserCheck,
  UserMinus,
  Crown,
  KeyRound,
  Zap,
} from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "Captcha Verification",
    body:
      "Letter-based codes delivered via Discord's native modal. No third-party redirects, no leaky OAuth — just a clean in-server challenge.",
    size: "lg:col-span-2",
    accent: true,
  },
  {
    icon: UserCheck,
    title: "Role Assignment",
    body: "Grant the verified role the instant the captcha is solved.",
  },
  {
    icon: UserMinus,
    title: "Role Removal",
    body: "Optionally strip the unverified role so access flips in a single action.",
  },
  {
    icon: KeyRound,
    title: "Admin Hierarchy",
    body:
      "Whitelist which roles can configure Authix with `/config admin` — keep command surface tight.",
  },
  {
    icon: Crown,
    title: "Premium Customization",
    body:
      "Upgrade via Discord Monetization to rebrand the embed — title, body, footer, image.",
    premium: true,
  },
  {
    icon: Zap,
    title: "Zero-ops",
    body:
      "Persistent Verify buttons, automatic recovery, per-guild config. Set it up once and move on.",
    size: "lg:col-span-2",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      data-testid="features-section"
      className="relative py-24 sm:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <SectionHeader
          overline="Capabilities"
          title="Everything you need at the entry gate."
          body="Opinionated defaults, precise controls. Authix is the security layer your community already expected."
        />

        <div
          data-testid="features-grid"
          className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {items.map((it, i) => (
            <FeatureCard key={i} {...it} />
          ))}
        </div>
      </div>
    </section>
  );
}

export const SectionHeader = ({ overline, title, body }) => (
  <div className="max-w-3xl">
    {overline && (
      <div className="mono text-xs uppercase tracking-[0.25em] text-[#00E5FF] mb-5">
        {overline}
      </div>
    )}
    <h2 className="chivo text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter leading-[1.05]">
      {title}
    </h2>
    {body && (
      <p className="mono mt-5 text-zinc-400 text-base leading-relaxed max-w-2xl">
        {body}
      </p>
    )}
  </div>
);

const FeatureCard = ({ icon: Icon, title, body, size = "", accent, premium }) => {
  const testid = `feature-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div
      data-testid={testid}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
      }}
      className={`authix-card p-8 ${size}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            accent
              ? "bg-gradient-to-br from-[#007AFF]/25 to-[#00E5FF]/25 border border-[#00D2FF]/30"
              : "bg-white/5 border border-white/10"
          }`}
        >
          <Icon size={22} className="text-[#00E5FF]" />
        </div>
        {premium && (
          <span
            data-testid="premium-badge"
            className="mono text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border border-[#00D2FF]/40 text-[#00E5FF] bg-[#00D2FF]/5"
          >
            Premium
          </span>
        )}
      </div>
      <h3 className="chivo text-xl font-bold text-white mb-2">{title}</h3>
      <p className="mono text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
};
