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

  const tabs = [
    {
      label: "Telemetry",
      href: "/dashboard",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    },
    {
      label: "Fuel",
      href: "/nutrition",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      )
    },
    {
      label: "Fitness",
      href: "/log",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>
        </svg>
      )
    }

  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg/80 backdrop-blur-2xl border-t border-border/40 px-4 pb-6 pt-4 z-50">
      <div className="max-w-md mx-auto flex items-center justify-between px-4">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1.5 group transition-all flex-1",
                isActive ? "text-accent scale-110" : "text-muted hover:text-text"
              )}
            >
              <div className={cn(
                "p-2.5 rounded-2xl transition-all duration-300",
                isActive && "bg-accent/10 shadow-[0_0_20px_rgba(255,95,31,0.15)] ring-1 ring-accent/20"
              )}>
                <div className={cn(isActive && "drop-shadow-[0_0_8px_rgba(255,95,31,0.6)]")}>
                  {tab.icon}
                </div>
              </div>
              <span className={cn(
                "text-[9px] mono uppercase font-black tracking-[0.2em] italic",
                isActive ? "opacity-100" : "opacity-40"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
