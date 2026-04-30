import { useState } from "react";
import { SectionHeader } from "@/components/Features";
import { ShieldCheck, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";
import CaptchaImage from "@/components/CaptchaImage";

const steps = [
  {
    step: "01",
    title: "User lands",
    body: "A new member joins and sees the verification panel in the gated channel.",
  },
  {
    step: "02",
    title: "Click Verify",
    body: "Authix generates a unique distorted captcha image — letters and numbers, bot-hostile by design.",
  },
  {
    step: "03",
    title: "Solve captcha",
    body: "User reads the characters from the image and types them into a Discord modal.",
  },
  {
    step: "04",
    title: "Access granted",
    body: "Verified role is applied instantly. Unverified role removed if configured.",
  },
];

const DEMO_CODE = "A7KP5N";

export default function HowItWorks() {
  const [verified, setVerified] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState(DEMO_CODE);
  const [input, setInput] = useState("");
  const [err, setErr] = useState("");

  const newCode = () => {
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let c = "";
    for (let i = 0; i < 6; i++)
      c += alphabet[Math.floor(Math.random() * alphabet.length)];
    setCode(c);
    setInput("");
    setErr("");
  };

  const openModal = () => {
    newCode();
    setShowModal(true);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (input.trim().toUpperCase() === code) {
      setVerified(true);
      setShowModal(false);
      setErr("");
    } else {
      setErr("That code doesn't match. Try again.");
    }
  };

  return (
    <section
      id="how"
      data-testid="how-section"
      className="relative py-24 sm:py-32 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <SectionHeader
          overline="The flow"
          title="Four steps from stranger to verified."
          body="A friction-free entry challenge your community will thank you for."
        />

        <div className="mt-16 grid lg:grid-cols-2 gap-12 items-start">
          {/* Steps list */}
          <ol className="space-y-6">
            {steps.map((s) => (
              <li
                key={s.step}
                data-testid={`step-${s.step}`}
                className="authix-card p-6 flex gap-5 items-start"
              >
                <div className="mono text-[#00E5FF] font-bold text-sm tracking-widest">
                  {s.step}
                </div>
                <div>
                  <h4 className="chivo text-lg font-bold mb-1">{s.title}</h4>
                  <p className="mono text-sm text-zinc-400 leading-relaxed">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Discord UI mockup */}
          <div
            data-testid="discord-mockup"
            className="authix-card p-0 overflow-hidden lg:sticky lg:top-24"
          >
            {/* Mock channel header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-[#0B0B0E]">
              <span className="text-zinc-500 mono text-sm">#</span>
              <span className="mono text-sm text-zinc-300">verification</span>
            </div>

            {/* Embed */}
            <div className="p-5 bg-[#0A0A0D]">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#00E5FF] flex items-center justify-center text-black font-black chivo text-sm">
                  A
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="chivo text-white font-bold text-sm">Authix</span>
                    <span className="mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#5865F2]/20 text-[#9DA8F5]">
                      BOT
                    </span>
                    <span className="mono text-xs text-zinc-500">Today at 12:00</span>
                  </div>
                  <div className="mt-2 relative border-l-4 border-[#00E5FF] bg-[#141418] rounded-r-md p-4 authix-scanline overflow-hidden">
                    <div className="chivo text-white font-bold mb-1">
                      Server Verification
                    </div>
                    <div className="mono text-sm text-zinc-300 leading-relaxed">
                      Click the button below and solve the captcha to gain access to this
                      server.
                    </div>
                    <div className="mono text-xs text-zinc-500 mt-3">Powered by Authix</div>
                  </div>
                  <div className="mt-2">
                    {verified ? (
                      <div
                        data-testid="mockup-verified"
                        className="inline-flex items-center gap-2 mono text-sm font-bold px-4 py-2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      >
                        <CheckCircle2 size={16} /> Verified — @Member role granted
                      </div>
                    ) : (
                      <button
                        data-testid="mockup-verify-button"
                        onClick={openModal}
                        className="mono text-sm font-bold px-4 py-2 rounded-md bg-[#5865F2] hover:bg-[#4752C4] text-white flex items-center gap-2 transition-colors"
                      >
                        <ShieldCheck size={16} /> Verify
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Captcha Modal mock */}
      {showModal && (
        <div
          data-testid="mockup-modal"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <form
            onSubmit={onSubmit}
            onClick={(e) => e.stopPropagation()}
            className="authix-card max-w-md w-full p-7"
          >
            <div className="mono text-xs uppercase tracking-[0.2em] text-[#00E5FF] mb-2">
              Discord · Captcha
            </div>
            <h3 className="chivo text-2xl font-black mb-1">Server Verification</h3>
            <p className="mono text-sm text-zinc-400 mb-6">
              Read the characters from the image and type them below.
            </p>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="mono text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Captcha image
                </div>
                <button
                  type="button"
                  data-testid="mockup-captcha-refresh"
                  onClick={newCode}
                  className="mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 hover:text-[#00E5FF] flex items-center gap-1 transition-colors"
                  aria-label="Generate new captcha"
                >
                  <RefreshCw size={11} /> New code
                </button>
              </div>
              <div data-testid="mockup-captcha-image">
                <CaptchaImage code={code} height={120} />
              </div>
            </div>

            <label className="mono text-xs uppercase tracking-[0.2em] text-zinc-400">
              Type what you see
            </label>
            <input
              autoFocus
              data-testid="mockup-captcha-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setErr("");
              }}
              maxLength={8}
              className="mt-2 w-full mono text-lg tracking-widest uppercase bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#00D2FF]/60 focus:ring-2 focus:ring-[#00E5FF]/30"
            />
            {err && (
              <div
                data-testid="mockup-captcha-error"
                className="mono text-xs text-red-400 mt-2"
              >
                {err}
              </div>
            )}

            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="mono text-sm font-bold px-4 py-2 rounded-md bg-white/5 text-white border border-white/10 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="mockup-submit-captcha"
                className="mono text-sm font-bold px-5 py-2 rounded-md bg-gradient-to-r from-[#007AFF] to-[#00E5FF] text-black flex items-center gap-2 authix-glow-btn"
              >
                Submit <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
