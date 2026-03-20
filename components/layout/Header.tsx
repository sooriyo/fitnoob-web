"use client";

import React from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { clsx } from "clsx";
import Link from "next/link";

export default function Header() {
  const { user, profile, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="flex items-center justify-between py-6 mb-8 border-b border-border/50">
      <div className="flex flex-col">
        <Link href="/" className="syne font-black uppercase text-xl leading-none italic group">
          FIT<span className="text-accent group-hover:tracking-widest transition-all">NOOB</span>
        </Link>
        <span className="text-[9px] mono text-muted uppercase tracking-widest mt-1">Performance Protocol v1.0</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end mr-2">
          <span className="text-xs font-bold mono">{profile?.name || user.name}</span>
          <span className="text-[8px] mono text-muted uppercase">{user.email}</span>
        </div>
        
        <button 
          onClick={logout}
          className="btn btn-outline py-2 px-3 text-[10px] mono uppercase flex items-center gap-2 border-red/20 text-muted hover:text-red hover:bg-red/10"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout
        </button>
      </div>
    </header>
  );
}
