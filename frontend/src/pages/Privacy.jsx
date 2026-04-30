import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const sections = [
  {
    title: "1. Who we are",
    body: (
      <>
        <p>
          Authix (&quot;we&quot;, &quot;us&quot;, or &quot;the bot&quot;) is a
          Discord application that provides captcha-based verification and role
          management for Discord servers. This Privacy Policy explains what data
          we process when a server owner installs Authix and when a member
          interacts with it.
        </p>
      </>
    ),
  },
  {
    title: "2. Information we process",
    body: (
      <>
        <p>We only store the minimum data required to operate the service:</p>
        <ul>
          <li>
            <strong>Guild (server) ID</strong> — to scope configuration per server.
          </li>
          <li>
            <strong>Role IDs</strong> — the verified role, optional unverified
            role, and roles allowed to manage Authix.
          </li>
          <li>
            <strong>Embed customization fields</strong> (Premium) — title, body,
            footer text, and image URL you set via <code>/customization</code>.
          </li>
          <li>
            <strong>Aggregate counters</strong> — number of servers Authix is in
            and the total number of successful verifications. These are not tied
            to individual users.
          </li>
        </ul>
        <p>
          We <strong>do not</strong> store Discord message contents, direct
          messages, email addresses, IP addresses, or payment information. All
          Premium billing is handled by Discord through its Monetization program;
          Authix only receives the entitlement signal.
        </p>
      </>
    ),
  },
  {
    title: "3. Captcha codes",
    body: (
      <>
        <p>
          Captcha codes are generated on demand, kept in memory for the duration
          of a single verification attempt, and are never written to our
          database. Once you solve the code (or it expires), it is discarded.
        </p>
      </>
    ),
  },
  {
    title: "4. How we use data",
    body: (
      <>
        <ul>
          <li>Operate the verification flow and assign/remove roles.</li>
          <li>
            Respect your per-server configuration across bot restarts and
            updates.
          </li>
          <li>Display anonymous usage counters (e.g. on our landing page).</li>
          <li>Diagnose and fix bugs using minimal, anonymized logs.</li>
        </ul>
        <p>
          We do not sell, rent, or share your data with third parties for
          advertising or profiling.
        </p>
      </>
    ),
  },
  {
    title: "5. Data retention & deletion",
    body: (
      <>
        <p>
          Per-guild configuration is kept for as long as Authix is a member of
          your server. When the bot is removed from a guild, its configuration
          may be retained for up to 30 days to allow accidental re-adds, after
          which it is permanently deleted.
        </p>
        <p>
          You can request immediate deletion of your server&apos;s data at any
          time by contacting us at <strong>support@authix.app</strong> from an
          account that owns or administers the server.
        </p>
      </>
    ),
  },
  {
    title: "6. Security",
    body: (
      <>
        <p>
          Data is stored in an access-controlled database. Communication with
          Discord&apos;s API uses TLS. Access to production is limited to the
          Authix maintainers on a least-privilege basis. No system is perfectly
          secure, but we design Authix to collect as little as possible so there
          is little to breach.
        </p>
      </>
    ),
  },
  {
    title: "7. Children",
    body: (
      <>
        <p>
          Authix is intended for use in servers whose members meet Discord&apos;s
          own minimum age requirements. We do not knowingly process data from
          anyone below those requirements.
        </p>
      </>
    ),
  },
  {
    title: "8. Changes to this policy",
    body: (
      <>
        <p>
          We may update this Privacy Policy from time to time. Material changes
          will be announced in our support channel and reflected by the updated
          date below. Continued use of Authix after a change constitutes
          acceptance of the new policy.
        </p>
      </>
    ),
  },
  {
    title: "9. Contact",
    body: (
      <>
        <p>
          Questions, deletion requests, or security reports:{" "}
          <strong>windsbyj@gmail.com</strong>.
        </p>
      </>
    ),
  },
];

export default function Privacy() {
  return (
    <div data-testid="privacy-page" className="bg-[#050505] text-white min-h-screen">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="mono text-xs uppercase tracking-[0.25em] text-[#00E5FF] mb-4">
            Legal
          </div>
          <h1 className="chivo text-4xl sm:text-5xl font-black tracking-tighter mb-3">
            Privacy Policy
          </h1>
          <div className="mono text-sm text-zinc-500 mb-12">
            Last updated: April 30, 2026
          </div>

          <div className="space-y-8">
            {sections.map((s, i) => (
              <section
                key={s.title}
                data-testid={`privacy-section-${i + 1}`}
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
