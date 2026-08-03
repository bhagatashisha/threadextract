import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot, Database, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { DemoAnimation } from "@/components/demo-animation";
import { FREE_PLAN, PRO_PLAN } from "@/lib/pricing";

// This page embeds a short-lived signed OAuth state token in the "Add to
// Slack" link — it must be generated per-request, not baked into a
// statically prerendered page at build time (which would expire ~10 minutes
// after every deploy and break the install link for everyone until the next
// build).
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-blue-100">
      {/* Navigation */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50 shadow-sm shadow-black/[0.03]">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <span className="inline-grid h-8 w-8 place-items-center rounded-md bg-gradient-to-b from-[#10b981] to-[#3b82f6] text-sm font-bold text-white">K</span>
            <span className="text-base">Korrali ThreadExtract</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/contact" className="hidden sm:inline-flex rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              Contact us
            </Link>
            <Link href="/login" className="rounded-lg bg-gradient-to-b from-[#10b981] to-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero & Features Section */}
      <section className="relative border-b border-border/40 bg-gradient-to-b from-transparent to-muted/10 overflow-hidden">
        {/* Dynamic Background Glow */}
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#10b981]/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-[20%] right-[-5%] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />
        
        <main className="max-w-6xl mx-auto px-4 pt-4 pb-8 md:pt-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-start">
            
            {/* Left: Headline & Description */}
            <div className="text-left lg:pt-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight mb-4 leading-tight">
                Turn messy Slack threads into <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-[#3b82f6]">perfect Notion docs.</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-4 max-w-xl leading-relaxed">
                Stop losing tribal knowledge. React to any Slack thread with a 🧠 emoji, and our AI instantly extracts the problem and solution, pushing clean Markdown to your Knowledge Base.
              </p>
            </div>

            {/* Right: Vertical Feature Cards */}
            <div className="flex flex-col gap-3">
              <div className="group p-4 bg-card rounded-xl border border-border shadow-sm flex gap-4 items-start">
                <div className="shrink-0 w-10 h-10 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground tracking-tight mb-1">Noise Filtering AI</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Our LLM strips out memes and pleasantries. You only get the actual solution saved to your docs.</p>
                </div>
              </div>
              
              <div className="group p-4 bg-card rounded-xl border border-border shadow-sm flex gap-4 items-start">
                <div className="shrink-0 w-10 h-10 bg-emerald-50 border border-emerald-100 text-[#10b981] rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground tracking-tight mb-1">Notion Integration</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Seamlessly pushes perfectly formatted Markdown directly into your Notion database using native APIs.</p>
                </div>
              </div>

              <div className="group p-4 bg-card rounded-xl border border-border shadow-sm flex gap-4 items-start">
                <div className="shrink-0 w-10 h-10 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground tracking-tight mb-1">Zero Behavior Change</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Don&apos;t force engineers to write docs. Just ask them to click an emoji when a problem is solved.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Animated Demo */}
          <div className="relative w-full h-[320px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[650px] flex justify-center mt-10 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-card to-background shadow-sm">
            <div className="absolute left-1/2 top-4 lg:top-8 -translate-x-1/2 w-[1024px] origin-top transform scale-[0.45] sm:scale-[0.55] md:scale-[0.7] lg:scale-[0.8] xl:scale-[0.9]">
              <DemoAnimation />
            </div>
          </div>
        </main>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-border/40 bg-muted/10 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium text-xs border border-blue-200 shadow-sm">
              Keep your existing Notion setup. No migrating to a new clunky wiki.
            </span>
          </div>
          <h2 className="text-3xl font-bold text-center text-foreground mb-2">Simple, workspace-wide pricing</h2>
          <p className="text-center text-muted-foreground mb-10">Other tools charge $15/seat. We charge a flat rate for your whole workspace.</p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-bold text-foreground mb-1">{FREE_PLAN.label}</h3>
              <p className="text-sm text-muted-foreground mb-4">{FREE_PLAN.tagline}</p>
              <p className="text-3xl font-extrabold text-foreground mb-4">{FREE_PLAN.price}</p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                {FREE_PLAN.features.map((f) => (
                  <li key={f}>&bull; {f}</li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block text-center rounded-lg bg-gradient-to-r from-[#10b981] to-[#3b82f6] hover:opacity-90 text-white px-4 py-2 text-sm font-semibold transition-colors"
              >
                Start free trial
              </Link>
            </div>
            <div className="rounded-2xl border-2 border-[#10b981]/40 bg-card p-6 relative">
              <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-b from-[#10b981] to-[#3b82f6] px-3 py-1 text-xs font-semibold text-white">
                Most popular
              </span>
              <h3 className="text-lg font-bold text-foreground mb-1">{PRO_PLAN.label}</h3>
              <p className="text-sm text-muted-foreground mb-4">{PRO_PLAN.tagline}</p>
              <p className="text-3xl font-extrabold text-foreground mb-1">{PRO_PLAN.monthlyPrice}</p>
              <p className="text-xs text-muted-foreground mb-4">
                or {PRO_PLAN.annualPrice} ({PRO_PLAN.annualPerMonth})
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                {PRO_PLAN.features.map((f) => (
                  <li key={f}>&bull; {f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <span className="inline-grid h-7 w-7 place-items-center rounded-md bg-gradient-to-b from-[#10b981] to-[#3b82f6] text-xs font-bold text-white shadow-sm">K</span>
            <span className="font-semibold text-foreground">Korrali ThreadExtract</span>
            <span className="text-xs">· part of <a href="https://korrali.com" className="hover:text-foreground transition-colors">Korrali</a></span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <a href="https://trust.korrali.com" className="hover:text-foreground transition-colors">Korrali Trust</a>
            <a href="https://revenue.korrali.com" className="hover:text-foreground transition-colors">Korrali Revenue</a>
            <a href="https://data.korrali.com" className="hover:text-foreground transition-colors">Korrali Data</a>
            <a href="https://web.korrali.com" className="hover:text-foreground transition-colors">Korrali Web</a>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms &amp; Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
