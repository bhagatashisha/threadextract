import Link from "next/link";

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border/40 bg-background">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <span className="inline-grid h-8 w-8 place-items-center rounded-md bg-gradient-to-b from-[#10b981] to-[#3b82f6] text-sm font-bold text-white">
              K
            </span>
            <span className="text-base">Korrali ThreadExtract</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a magic link to your email address. Click the link to sign in.
          </p>
          <p className="text-xs text-muted-foreground">
            Didn&apos;t get it? Check your spam folder or{" "}
            <Link href="/login" className="underline hover:text-foreground">
              try again
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
