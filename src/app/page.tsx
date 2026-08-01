import Link from "next/link";
import { ArrowRight, Bot, Database, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">ThreadExtract</span>
          </div>
          <div>
            <Link 
              href="/api/slack/oauth" 
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-full font-medium transition-all text-sm"
            >
              Add to Slack
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-6 border border-blue-100">
          <Zap className="w-4 h-4" />
          The AI-Powered Knowledge Bridge
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
          Turn messy Slack threads <br className="hidden md:block" />
          into <span className="text-blue-600">perfect Notion docs.</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Stop losing tribal knowledge. React to any Slack thread with a 🧠 emoji, and our AI instantly extracts the problem and solution, pushing clean Markdown to your Knowledge Base.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/api/slack/oauth" 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-blue-200 hover:-translate-y-1"
          >
            Connect Workspace <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-slate-500 mt-4 sm:mt-0 sm:ml-4">
            Takes 30 seconds. No credit card required.
          </p>
        </div>
      </main>

      {/* Features Grid */}
      <section className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Noise Filtering AI</h3>
            <p className="text-slate-600">Our LLM strips out memes, pleasantries, and dead ends. You only get the actual solution saved to your docs.</p>
          </div>
          
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Notion Integration</h3>
            <p className="text-slate-600">Seamlessly pushes perfectly formatted Markdown directly into your Notion database using native APIs.</p>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Zero Behavior Change</h3>
            <p className="text-slate-600">Don't force engineers to write docs. Just ask them to click an emoji when a problem is solved.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
