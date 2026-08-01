import Link from "next/link";
import { ArrowRight, Bot, Database, Zap, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const SLACK_OAUTH_URL = "https://slack.com/oauth/v2/authorize?client_id=11212471347943.11711872146599&scope=channels:history,groups:history,im:history,mpim:history,reactions:read,chat:write&redirect_uri=https://threadextract-uat.korrali.com/api/slack/oauth";

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
            <Link href="/tools" className="hidden sm:inline-flex rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              Free tools
            </Link>
            <Link href="/contact" className="hidden sm:inline-flex rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              Contact us
            </Link>
            <Link href={SLACK_OAUTH_URL} className="rounded-lg bg-gradient-to-b from-[#10b981] to-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90">
              Add to Slack
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative border-b border-border/40 bg-gradient-to-b from-transparent to-muted/10 overflow-hidden">
        {/* Dynamic Background Glow */}
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#10b981]/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-[20%] right-[-5%] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />
        
        <main className="max-w-6xl mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/40 border border-border/50 shadow-sm backdrop-blur-sm text-foreground font-medium text-sm mb-6">
            <ShieldCheck className="w-4 h-4 text-[#10b981]" />
            The AI-Powered Knowledge Bridge
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tight mb-8 leading-tight">
            Turn messy Slack threads <br className="hidden md:block" />
            into <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-[#3b82f6]">perfect Notion docs.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop losing tribal knowledge. React to any Slack thread with a 🧠 emoji, and our AI instantly extracts the problem and solution, pushing clean Markdown to your Knowledge Base.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href={SLACK_OAUTH_URL} 
              className="flex items-center gap-2 bg-gradient-to-r from-[#10b981] to-[#3b82f6] hover:opacity-90 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-md hover:-translate-y-1"
            >
              Connect Workspace <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-muted-foreground mt-4 sm:mt-0 sm:ml-4 font-medium">
              Takes 30 seconds. No credit card required.
            </p>
          </div>
        </main>
      </section>

      {/* Features Grid */}
      <section className="bg-zinc-50 border-t border-border/40 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 relative z-10">
          <div className="group p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground tracking-tight mb-2">Noise Filtering AI</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Our LLM strips out memes, pleasantries, and dead ends. You only get the actual solution saved to your docs.</p>
          </div>
          
          <div className="group p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-[#10b981] rounded-xl flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground tracking-tight mb-2">Notion Integration</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Seamlessly pushes perfectly formatted Markdown directly into your Notion database using native APIs.</p>
          </div>

          <div className="group p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground tracking-tight mb-2">Zero Behavior Change</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Don't force engineers to write docs. Just ask them to click an emoji when a problem is solved.</p>
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
          </div>
        </div>
      </footer>
    </div>
  );
}
