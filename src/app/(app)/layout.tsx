import Link from "next/link";
import { auth } from "@/lib/auth";
import { signOutAction } from "@/lib/actions/auth";
import { UserMenu } from "@/components/user-menu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-border/40 bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <span className="inline-grid h-8 w-8 place-items-center rounded-md bg-gradient-to-b from-[#10b981] to-[#3b82f6] text-sm font-bold text-white">
              K
            </span>
            <span className="text-base">ThreadExtract</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-foreground hover:underline">
              Dashboard
            </Link>
            <Link href="/settings" className="text-foreground hover:underline">
              Settings
            </Link>
            <Link href="/billing" className="text-foreground hover:underline">
              Billing
            </Link>
            {session?.user?.email && (
              <UserMenu email={session.user.email} signOutAction={signOutAction} />
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
