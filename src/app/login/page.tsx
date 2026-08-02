import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";

  if (session?.user) redirect(redirectTo);

  async function handleGoogleSignIn() {
    "use server";
    await signIn("google", { redirectTo });
  }

  async function handleEmailSignIn(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    await signIn("resend", { email, redirectTo });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border/40 bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <span className="inline-grid h-8 w-8 place-items-center rounded-md bg-gradient-to-b from-[#10b981] to-[#3b82f6] text-sm font-bold text-white">
              K
            </span>
            <span className="text-base">Korrali ThreadExtract</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="absolute top-[20%] left-[30%] h-[400px] w-[400px] rounded-full bg-[#10b981]/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-[40%] right-[30%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">
          <Card className="relative overflow-hidden border border-border shadow-lg rounded-2xl">
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-2xl font-bold tracking-tight">Welcome</CardTitle>
              <CardDescription className="mt-2 text-sm">
                Continue with Google or a magic link. No password required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <form action={handleGoogleSignIn}>
                <SubmitButton variant="outline" className="w-full" loadingLabel="Redirecting…">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </SubmitButton>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <form action={handleEmailSignIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                  />
                </div>
                <SubmitButton className="w-full" loadingLabel="Sending link…">
                  Send magic link
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
