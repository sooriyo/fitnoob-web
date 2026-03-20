import type { Metadata, Viewport } from "next";
import { Syne, Space_Mono } from "next/font/google";
import "@/styles/globals.css";
import TabBar from "@/components/layout/TabBar";
import { AuthProvider } from "@/components/auth/AuthContext";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Fat Burn Tracker",
  description: "Performance-oriented calorie and weight tracking for aggressive cutting phases.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${syne.variable} ${spaceMono.variable} antialiased bg-bg text-text min-h-screen pb-24`}
      >
        <AuthProvider>
          <main className="max-w-md mx-auto px-4 pt-4">
            {children}
          </main>
          <TabBar />
        </AuthProvider>
      </body>
    </html>
  );
}
