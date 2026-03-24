import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";
import { AppProviders } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vibe Staking on Arc",
  description:
    "Stake VIBE on Arc Testnet — high-energy Web3 dashboard for First Sons Academy.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
        <Toaster
          richColors
          closeButton
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                "border border-cyan-500/30 bg-[#151525] text-white shadow-[0_0_30px_rgba(0,255,255,0.15)]",
            },
          }}
        />
      </body>
    </html>
  );
}
