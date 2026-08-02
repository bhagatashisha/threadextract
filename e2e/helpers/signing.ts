import crypto from "crypto";

/** Mirrors src/lib/slack-verify.ts's signature scheme, for constructing valid (or deliberately invalid) test requests. */
export function signSlackBody(body: string, secret: string, timestamp: string = String(Math.floor(Date.now() / 1000))) {
  const basestring = `v0:${timestamp}:${body}`;
  const signature = "v0=" + crypto.createHmac("sha256", secret).update(basestring, "utf8").digest("hex");
  return { signature, timestamp };
}

/** Mirrors Stripe's webhook signing scheme (see stripe.webhooks.constructEvent), for posting synthetic signed events. */
export function signStripeBody(body: string, secret: string, timestamp: number = Math.floor(Date.now() / 1000)) {
  const signedPayload = `${timestamp}.${body}`;
  const signature = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  return `t=${timestamp},v1=${signature}`;
}
