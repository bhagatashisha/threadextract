import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Korrali ThreadExtract",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <span className="inline-grid h-8 w-8 place-items-center rounded-md bg-gradient-to-b from-[#10b981] to-[#3b82f6] text-sm font-bold text-white">K</span>
            <span className="text-base">Korrali ThreadExtract</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: August 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-foreground">

          <section>
            <h2>Overview</h2>
            <p>
              Korrali ThreadExtract (&quot;ThreadExtract&quot;, &quot;we&quot;, &quot;us&quot;) is a Slack app, built and
              operated by Korrali, that turns a Slack thread into a Notion page when a workspace member
              reacts to it with 🧠. This policy explains what data we collect to provide that service, how
              we use it, and who we share it with.
            </p>
          </section>

          <section>
            <h2>Information We Collect</h2>
            <ul>
              <li><strong>Account information</strong> — your name and email address, from Google sign-in or from a magic-link email you enter yourself.</li>
              <li><strong>Slack workspace data</strong> — your Slack team ID and an access token, generated when your workspace installs the app. The token is encrypted at rest and is only used to read reacted-to threads and post confirmation messages.</li>
              <li><strong>Thread content</strong> — when someone reacts to a Slack message with 🧠, we fetch that thread&apos;s messages via the Slack API to generate a summary. We do not read messages outside of triggered threads.</li>
              <li><strong>Notion data</strong> — an access token for the Notion workspace you connect, used solely to create pages in the database you choose.</li>
              <li><strong>Billing information</strong> — handled directly by Stripe. We never see or store your card number; we retain only your subscription status and plan tier.</li>
              <li><strong>Usage data</strong> — basic application logs (timestamps, error traces) used for debugging and reliability.</li>
            </ul>
          </section>

          <section>
            <h2>How We Use Your Information</h2>
            <ul>
              <li>To fetch the Slack thread you reacted to and generate an AI summary.</li>
              <li>To publish that summary as a page in your connected Notion database.</li>
              <li>To manage your account, subscription, and billing.</li>
              <li>To operate, secure, and improve the service, and to communicate service-related updates.</li>
            </ul>
          </section>

          <section>
            <h2>Automated Secret Redaction</h2>
            <p>
              Because ThreadExtract&apos;s purpose is pulling raw Slack conversations — including ones where
              someone pasted a credential while debugging — we run a best-effort pattern-matching filter over
              thread text (catching things like API keys, private keys, JWTs, and card-number-shaped digit
              runs) before it is sent to any AI provider. This filter is pattern-based, not exhaustive: it
              catches well-known secret formats, not every possible sensitive string. Please avoid pasting
              sensitive credentials into Slack threads you intend to summarize.
            </p>
          </section>

          <section>
            <h2>Third-Party Service Providers</h2>
            <p>We share the minimum data necessary with the following processors to operate the service:</p>
            <ul>
              <li><strong>Slack</strong> — thread content is read via Slack&apos;s API under the permissions you grant at install.</li>
              <li><strong>Google Gemini</strong> (primary) and <strong>Groq</strong> (fallback) — redacted thread text is sent to generate the AI summary.</li>
              <li><strong>Notion</strong> — the generated summary is written to your connected database via Notion&apos;s API.</li>
              <li><strong>Stripe</strong> — processes subscription payments; card data is handled entirely by Stripe.</li>
              <li><strong>Resend</strong> — delivers magic-link sign-in emails.</li>
              <li><strong>Google</strong> — provides optional OAuth sign-in.</li>
            </ul>
          </section>

          <section>
            <h2>Data Retention</h2>
            <p>
              We retain workspace and account data for as long as your account is active. Uninstalling
              ThreadExtract from Slack revokes our access token; you may request deletion of any remaining
              account data at any time (see Contact below).
            </p>
          </section>

          <section>
            <h2>Data Security</h2>
            <p>
              Slack and Notion access tokens are encrypted at rest. Access to production data is restricted
              to those operating the service. No method of transmission or storage is 100% secure, but we
              take reasonable measures to protect your data.
            </p>
          </section>

          <section>
            <h2>Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data by contacting us.
              Uninstalling the Slack or Notion integration at any time stops further data collection through
              that channel.
            </p>
          </section>

          <section>
            <h2>Children&apos;s Privacy</h2>
            <p>ThreadExtract is a workplace productivity tool not directed at, or knowingly used by, children under 16.</p>
          </section>

          <section>
            <h2>Changes to This Policy</h2>
            <p>We may update this policy from time to time. Material changes will be reflected by updating the &quot;Last updated&quot; date above.</p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>Questions about this policy? Email <a href="mailto:hello@korrali.com" className="text-foreground underline">hello@korrali.com</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
