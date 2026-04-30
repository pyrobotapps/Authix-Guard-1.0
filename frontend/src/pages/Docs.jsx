import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Terminal, ShieldCheck } from "lucide-react";

const setupSteps = [
  {
    title: "1. Invite Authix",
    body:
      "Invite the bot with 'Manage Roles' and 'Send Messages' permissions. Authix needs these to assign roles and post the verification panel.",
    code: null,
  },
  {
    title: "2. Pick your verified role",
    body:
      "Create or choose an existing role you want members to have once verified. Make sure Authix's role sits ABOVE it in Server Settings → Roles.",
    code: "/config role verified_role:@Verified",
  },
  {
    title: "3. (Optional) Remove an unverified role",
    body:
      "If you gate your server by giving new members an @Unverified role, Authix can remove it automatically upon verification.",
    code: "/config role verified_role:@Verified unverified_role:@Unverified",
  },
  {
    title: "4. Delegate admin permissions",
    body:
      "Allow your moderator roles to manage Authix settings without granting server-level admin.",
    code: "/config admin role:@Moderators action:add",
  },
  {
    title: "5. Post the verification panel",
    body:
      "Go to the channel where new members should verify and run the panel command.",
    code: "/config panel",
  },
  {
    title: "6. (Premium) Customize the embed",
    body:
      "Upgrade to Premium via Discord Monetization, then customize the verification embed.",
    code:
      "/customization title:\"Welcome\" body:\"Click Verify to enter.\" footer:\"Your Server\"",
  },
];

export default function Docs() {
  return (
    <div data-testid="docs-page" className="bg-[#050505] text-white min-h-screen">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="mono text-xs uppercase tracking-[0.25em] text-[#00E5FF] mb-4">
            Documentation
          </div>
          <h1 className="chivo text-4xl sm:text-5xl font-black tracking-tighter mb-5">
            Set up Authix in five minutes.
          </h1>
          <p className="mono text-zinc-400 leading-relaxed mb-12">
            Everything you need to lock the gate. Commands are slash commands inside
            Discord — you never leave the app.
          </p>

          <div className="authix-card p-8 mb-10 flex items-center gap-4">
            <ShieldCheck size={28} className="text-[#00E5FF]" />
            <div>
              <div className="chivo font-bold">Tip</div>
              <div className="mono text-sm text-zinc-400">
                Authix&apos;s bot role must be positioned <em>above</em> any role it needs
                to assign or remove in Server Settings → Roles.
              </div>
            </div>
          </div>

          <ol className="space-y-6">
            {setupSteps.map((s) => (
              <li
                key={s.title}
                data-testid={`docs-step-${s.title.split(".")[0]}`}
                className="authix-card p-7"
              >
                <h3 className="chivo text-xl font-bold mb-2">{s.title}</h3>
                <p className="mono text-sm text-zinc-400 leading-relaxed">{s.body}</p>
                {s.code && (
                  <div className="mt-4 rounded-lg bg-black/60 border border-white/10 px-4 py-3 flex items-start gap-3">
                    <Terminal size={14} className="text-[#00E5FF] mt-1 shrink-0" />
                    <code className="mono text-sm text-[#00E5FF] break-all">
                      {s.code}
                    </code>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </main>
      <Footer />
    </div>
  );
}
