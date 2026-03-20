import type { Metadata, Viewport } from "next";
import { Syne, Space_Mono } from "next/font/google";
import "@/styles/globals.css";
import TabBar from "@/components/layout/TabBar";
import Header from "@/components/layout/Header";
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
          {/*
            max-w-md   → mobile  (≤640px)   ~448px  — full width feel on phones
            sm:max-w-2xl → small tablet      ~672px
            md:max-w-4xl → tablet landscape  ~896px
            lg:max-w-6xl → desktop           ~1152px
            xl:max-w-7xl → wide desktop      ~1280px
            px scales up at each breakpoint so content never feels glued to edges
          */}
          <main className="
            w-full mx-auto
            max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl
            px-4 sm:px-6 md:px-8 lg:px-10
            pt-4 sm:pt-6 md:pt-8
          ">
            <Header />
            {children}
          </main>
          <TabBar />
        </AuthProvider>
      </body>
    </html>
  );
}