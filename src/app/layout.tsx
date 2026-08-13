import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { JetBrains_Mono, Newsreader, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The four families from the approved design, loaded exactly as the reference
 * specifies them — no substitutions were needed, all four are on Google Fonts.
 *
 *   sans    interface and body copy
 *   display headings and the club wordmark
 *   serif   editorial moments only (standfirsts, archive headings)
 *   mono    metadata only — dates, counts, tags, kinds, shortcuts
 */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "CSSEC — Computer Science & Software Engineering Club at FGCU",
    template: "%s — CSSEC",
  },
  description:
    "The Computer Science & Software Engineering Club at Florida Gulf Coast University. Weekly workshops, mentored software projects, and a permanent archive of everything we have taught.",
  openGraph: {
    type: "website",
    siteName: "CSSEC",
    locale: "en_US",
  },
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
        className={cn(
          "h-full antialiased font-sans",
          jakarta.variable,
          spaceGrotesk.variable,
          newsreader.variable,
          jetbrainsMono.variable,
        )}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
