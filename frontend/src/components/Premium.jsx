import { Crown, Check, Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/Features";

export default function Premium() {
  return (
    <section
      id="premium"
      data-testid="premium-section"
      className="relative py-24 sm:py-32 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <SectionHeader
          overline="Premium"
          title="Make it yours."
          body="Upgrade inside Discord. Custom embed, custom branding, full control. Billing handled by Discord Monetization."
        />

        <div className="mt-14 grid md:grid-cols-2 gap-6">
          {/* Free */}
          <div data-testid="plan-free" className="authix-card p-8">
            <div className="mono text-xs uppercase tracking-[0.2em] text-zinc-500 mb-4">
              Free forever
            </div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="chivo text-5xl font-black">$0</span>
              <span className="mono text-sm text-zinc-500">/ server</span>
            </div>
            <ul className="space-y-3 mono text-sm text-zinc-300">
              {[
                "Image-based captcha (letters + numbers)",
                "Verified & unverified role management",
                "`/config admin` role hierarchy",
                "Persistent verification panel",
                "Unlimited members",
              ].map((f) => (
                <li key={f} className="flex gap-3 items-start">
                  <Check size={16} className="text-[#00E5FF] mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium */}
          <div
            data-testid="plan-premium"
            className="authix-card p-8 relative border-[#00D2FF]/30"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,122,255,0.10), rgba(0,229,255,0.05) 40%, rgba(15,15,18,0.8))",
            }}
          >
            <div className="absolute top-5 right-5 mono text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border border-[#00D2FF]/40 text-[#00E5FF] bg-[#00D2FF]/10 inline-flex items-center gap-1">
              <Crown size={10} /> Discord Monetization
            </div>
            <div className="mono text-xs uppercase tracking-[0.2em] text-[#00E5FF] mb-4">
              Premium
            </div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="chivo text-5xl font-black authix-glow-text text-[#00E5FF]">
                Pro
              </span>
              <span className="mono text-sm text-zinc-400">via Discord</span>
            </div>
            <ul className="space-y-3 mono text-sm text-zinc-200">
              {[
                "Everything in Free",
                "Custom embed title, body & footer",
                "Custom embed image / banner URL",
                "Real-time raid alerts + auto-mitigation",
                "Priority captcha generation",
                "Premium badge on your verification panel",
              ].map((f) => (
                <li key={f} className="flex gap-3 items-start">
                  <Sparkles size={16} className="text-[#00E5FF] mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="#cta"
              data-testid="premium-cta"
              className="authix-glow-btn mt-8 inline-flex w-full items-center justify-center gap-2 mono font-bold text-black px-6 py-3 rounded-lg bg-gradient-to-r from-[#007AFF] to-[#00E5FF] transition-all"
            >
              <Crown size={16} /> Upgrade in Discord
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
