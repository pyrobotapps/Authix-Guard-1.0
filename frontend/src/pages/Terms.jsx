import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const sections = [
  {
    title: "1. Agreement",
    body: (
      <>
        <p>
          By inviting Authix (&quot;the Service&quot;) to your Discord server or
          interacting with it as a member, you agree to these Terms of Service.
          If you do not agree, remove the bot from your server and discontinue
          use.
        </p>
      </>
    ),
  },
  {
    title: "2. The Service",
    body: (
      <>
        <p>
          Authix provides captcha-based verification, role assignment, admin
          permission controls, and Premium embed customization for Discord
          servers. Features may evolve; we will make a reasonable effort to keep
          documentation current.
        </p>
      </>
    ),
  },
  {
    title: "3. Acceptable use",
    body: (
      <>
        <p>You agree <strong>not</strong> to use Authix to:</p>
        <ul>
          <li>
            Circumvent Discord&apos;s Terms of Service, Community Guidelines, or
            Developer Policy.
          </li>
          <li>
            Operate a server whose primary purpose is illegal activity, hate,
            harassment, or the sexual exploitation of minors.
          </li>
          <li>
            Abuse the bot&apos;s APIs (spamming commands, automated scraping of
            Discord data, reverse engineering for malicious purposes).
          </li>
          <li>
            Set embed text, images, or customization values that violate law or
            Discord&apos;s policies.
          </li>
        </ul>
        <p>
          We reserve the right to refuse service, remove the bot, or block
          access for any server or operator that violates these rules.
        </p>
      </>
    ),
  },
  {
    title: "4. Premium & Discord Monetization",
    body: (
      <>
        <p>
          Authix Premium is sold through Discord&apos;s Monetization program.
          Billing, refunds, and subscription management are handled entirely by
          Discord according to Discord&apos;s own terms. We only receive an
          entitlement signal from Discord that unlocks Premium features in your
          server; we do not store or process payment information.
        </p>
        <p>
          If a Premium entitlement ends (cancellation, payment failure,
          chargeback), Premium features immediately revert to their Free
          defaults. Your non-Premium configuration is preserved.
        </p>
      </>
    ),
  },
  {
    title: "5. Availability",
    body: (
      <>
        <p>
          The Service is provided on an &quot;as is&quot; and &quot;as
          available&quot; basis. We aim for high uptime but make no guarantee
          that the Service will be uninterrupted, error-free, or that any
          particular Discord feature will continue to work if Discord changes
          its platform.
        </p>
      </>
    ),
  },
  {
    title: "6. Your responsibilities",
    body: (
      <>
        <p>
          You are responsible for configuring Authix correctly in your server
          (assigning the bot sufficient role hierarchy, choosing safe role
          targets, writing embed text that suits your community). You are also
          responsible for communicating your server&apos;s own rules and any use
          of Authix to your members.
        </p>
      </>
    ),
  },
  {
    title: "7. Intellectual property",
    body: (
      <>
        <p>
          The Authix name, logo, website, and bot code are owned by us. You
          receive a limited, non-exclusive right to use the Service while these
          Terms are in effect. You may not copy, re-sell, or pass off the
          Service as your own.
        </p>
      </>
    ),
  },
  {
    title: "8. Termination",
    body: (
      <>
        <p>
          You can terminate this agreement at any time by removing Authix from
          your server. We may terminate or suspend access at any time, with or
          without notice, if we reasonably believe you have breached these
          Terms, endangered other users, or created legal risk. Data-deletion
          rights in our Privacy Policy survive termination.
        </p>
      </>
    ),
  },
  {
    title: "9. Disclaimer & limitation of liability",
    body: (
      <>
        <p>
          To the fullest extent permitted by law, Authix and its maintainers are
          not liable for any indirect, incidental, consequential, or punitive
          damages, loss of data, loss of revenue, or loss of goodwill arising
          from your use of the Service. Our total aggregate liability for any
          claim relating to the Service is limited to the fees you paid us in
          the twelve months preceding the claim (which, for non-Premium use,
          equals zero).
        </p>
      </>
    ),
  },
  {
    title: "10. Changes to these terms",
    body: (
      <>
        <p>
          We may update these Terms from time to time. Material changes will be
          announced in our support channel and reflected by the updated date
          below. Continued use of Authix after a change constitutes acceptance
          of the new Terms.
        </p>
      </>
    ),
  },
  {
    title: "11. Contact",
    body: (
      <>
        <p>
          Questions about these Terms: <strong>support@authix.app</strong>.
        </p>
      </>
    ),
  },
];

export default function Terms() {
  return (
    <div data-testid="terms-page" className="bg-[#050505] text-white min-h-screen">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="mono text-xs uppercase tracking-[0.25em] text-[#00E5FF] mb-4">
            Legal
          </div>
          <h1 className="chivo text-4xl sm:text-5xl font-black tracking-tighter mb-3">
            Terms of Service
          </h1>
          <div className="mono text-sm text-zinc-500 mb-12">
            Last updated: April 30, 2026
          </div>

          <div className="space-y-8">
            {sections.map((s, i) => (
              <section
                key={s.title}
                data-testid={`terms-section-${i + 1}`}
                className="authix-card p-7"
              >
                <h2 className="chivo text-xl font-bold mb-3">{s.title}</h2>
                <div className="mono text-sm text-zinc-300 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_code]:text-[#00E5FF] [&_strong]:text-white">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
