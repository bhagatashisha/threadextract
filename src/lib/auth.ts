import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import { makeSendVerificationRequest } from "@/lib/auth-email";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Allow linking a Google sign-in to an existing account first seen via
      // the Resend magic link (and vice-versa). Safe because both providers
      // verify the email address — Google via OAuth, Resend via the
      // magic-link round-trip.
      allowDangerousEmailAccountLinking: true,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "ThreadExtract <hello@korrali.com>",
      sendVerificationRequest: makeSendVerificationRequest({
        brand: "ThreadExtract",
        supportEmail: "hello@korrali.com",
        companyLine: "ThreadExtract · part of Korrali",
      }),
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
