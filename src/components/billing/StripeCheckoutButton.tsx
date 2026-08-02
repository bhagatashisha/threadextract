"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startCheckoutAction } from "@/lib/actions/checkout";
import type { BillingInterval } from "@/lib/stripe";

interface Props {
  interval?: BillingInterval;
  variant?: "default" | "outline";
  className?: string;
  children: React.ReactNode;
}

export function StripeCheckoutButton({ interval = "monthly", variant = "default", className, children }: Props) {
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    await startCheckoutAction(formData);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="interval" value={interval} />
      <Button type="submit" variant={variant} className={cn("w-full", className)} disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting…
          </>
        ) : (
          children
        )}
      </Button>
    </form>
  );
}
