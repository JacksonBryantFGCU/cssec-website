import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSSEC — FGCU Computer Science & Software Engineering Club",
  description:
    "The Computer Science & Software Engineering Club at Florida Gulf Coast University.",
};

// `ClerkProvider` is a Server Component here: it supplies auth context to the
// Clerk components that need it without turning any page into a client
// component. Public pages stay server-rendered.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `signInUrl` points Clerk's redirects at our own officer sign-in route
    // instead of Clerk's hosted account portal — no env vars needed.
    <ClerkProvider signInUrl="/sign-in">
      <html
        lang="en"
        className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
