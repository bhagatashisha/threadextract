import Link from "next/link";
import { MapPin, Mail, Building2 } from "lucide-react";

export const metadata = {
  title: "Contact Us — Korrali ThreadExtract",
};

export default function ContactPage() {
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

      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Contact Us</h1>
        <p className="text-lg text-muted-foreground mb-12">
          We are an incorporated software company based in the United States. We&apos;d love to hear from you.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4 p-8 rounded-2xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-b from-[#10b981] to-[#3b82f6] text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">Korrali LLC</h2>
            </div>
            <div className="flex items-start gap-3 text-muted-foreground">
              <MapPin className="h-5 w-5 shrink-0 text-[#10b981]/70 mt-0.5" />
              <address className="not-italic">
                30 N Gould St, Ste N<br />
                Sheridan, WY 82801<br />
                United States
              </address>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-8 rounded-2xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-b from-[#10b981] to-[#3b82f6] text-white">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">Support</h2>
            </div>
            <p className="text-muted-foreground">
              For support, feedback, or business inquiries, please email us directly:
            </p>
            <div className="flex items-center gap-3">
              <a
                href="mailto:hello@korrali.com"
                className="text-lg font-medium text-foreground hover:text-[#10b981] transition-colors"
              >
                hello@korrali.com
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
