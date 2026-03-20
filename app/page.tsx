"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/onboarding");
    } else if (profile?.onboarding_done) {
      router.push("/log");
    } else {
      router.push("/onboarding");
    }
  }, [user, profile, loading, router]);

  return <div className="flex items-center justify-center min-h-[50vh] text-muted mono text-xs animate-pulse">Initializing engine...</div>;
}
