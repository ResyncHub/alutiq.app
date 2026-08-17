import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Alutiq",
  description: "System operacyjny serwisu okienno-drzwiowego i automatyki.",
  applicationName: "Alutiq",
  appleWebApp: {
    // iOS ignoruje manifest.webmanifest przy „Dodaj do ekranu głównego" —
    // te znaczniki są jedynym sposobem na tryb pełnoekranowy (bez paska Safari).
    capable: true,
    statusBarStyle: "default",
    title: "Alutiq",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0d12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
