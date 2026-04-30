import AuthixLogo from "@/components/AuthixLogo";
import { ShieldCheck } from "lucide-react";

export default function CTA() {
  return (
    <section
      data-testid="cta-section"
      className="relative py-24 sm:py-32 border-t border-white/5"
    >
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        <div
          className="authix-card p-10 sm:p-16 text-center relative overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(0,210,255,0.15), transparent 60%), #0F0F12",
          }}
        >
          <div className="flex justify-center mb-6">
            <AuthixLogo size={64} />
          </div>
          <h2 className="chivo text-4xl sm:text-5xl font-black tracking-tighter mb-4">
            Ready to seal the gate?
          </h2>
          <p className="mono text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Install Authix, configure a verified role, post the panel. You&apos;re done.
          </p>
          <a
            href="https://discord.com/oauth2/authorize"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="final-cta-button"
            className="authix-glow-btn inline-flex items-center gap-2 mono font-bold text-black px-7 py-3.5 rounded-lg bg-gradient-to-r from-[#007AFF] to-[#00E5FF] transition-all"
          >
            <ShieldCheck size={18} /> Add Authix to Discord
          </a>
        </div>
      </div>
    </section>
  );
}
