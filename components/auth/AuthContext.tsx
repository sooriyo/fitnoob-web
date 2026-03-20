"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { account, PROFILE_COL, databases, DB_ID, Query, client } from "@/lib/appwrite";
import { Models } from "appwrite";
import { Profile } from "@/lib/types";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserAndProfile = async () => {
    try {
      const u = await account.get();
      setUser(u);

      // Fetch Profile
      const pResult = await databases.listDocuments(DB_ID, PROFILE_COL, [
        Query.equal("user_id", u.$id),
      ]);

      if (pResult.total > 0) {
        setProfile(pResult.documents[0] as unknown as Profile);
      }
    } catch (e) {
      setUser(null);
      setProfile(null);
      // Only redirect to onboarding if not already there or at root
      if (pathname !== "/onboarding" && pathname !== "/login" && pathname !== "/") {
        router.push("/onboarding");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Ping Appwrite server to verify setup (only if method exists)
    // @ts-ignore
    if (typeof client.ping === 'function') {
      // @ts-ignore
      client.ping().catch((err: any) => console.log('Ping failed:', err));
    }
    fetchUserAndProfile();
  }, [pathname]);

  const login = async (email: string, pass: string) => {
    try {
      await account.createEmailPasswordSession(email, pass);
    } catch (err: any) {
      if (err.code !== 401 && err.code !== 409) {
        throw err;
      }
      // If error is 'session already active', just proceed
    }
    await fetchUserAndProfile();
    router.push("/log");
  };

  const logout = async () => {
    await account.deleteSession("current");
    setUser(null);
    setProfile(null);
    router.push("/onboarding");
  };

  const refreshProfile = async () => {
    if (!user) return;
    const pResult = await databases.listDocuments(DB_ID, PROFILE_COL, [
      Query.equal("user_id", user.$id),
    ]);
    if (pResult.total > 0) {
      setProfile(pResult.documents[0] as unknown as Profile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
