"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function TabBar() {
  const pathname = usePathname();
  const { profile, user } = useAuth();

  // Hide on onboarding
  if (pathname.includes("/onboarding") || !user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-xl border-t border-border px-8 pb-8 pt-4 z-50">
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        <Link
          href="/log"
          className={cn(
            "flex flex-col items-center gap-1 group",
            pathname === "/log" ? "text-accent" : "text-muted hover:text-text"
          )}
        >
          <div className="p-2 rounded-xl transition-colors group-active:scale-95">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <span className="text-[10px] mono uppercase font-bold tracking-widest">Log</span>
        </Link>

        {/* Center Weight Display */}
        {profile?.start_weight && (
          <div className="absolute left-1/2 -translate-x-1/2 -top-1">
            <div className="bg-surface2 border border-border px-3 py-1 rounded-full shadow-lg">
              <span className="text-xs mono font-bold text-accent2">
                {profile.start_weight}
                <span className="text-[8px] ml-0.5 opacity-60">KG</span>
              </span>
            </div>
          </div>
        )}

        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center gap-1 group",
            pathname === "/dashboard" ? "text-accent" : "text-muted hover:text-text"
          )}
        >
          <div className="p-2 rounded-xl transition-colors group-active:scale-95">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <span className="text-[10px] mono uppercase font-bold tracking-widest">Dash</span>
        </Link>
      </div>
    </nav>
  );
}
