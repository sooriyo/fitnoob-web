"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      // login handles the redirection to /log
    } catch (err: any) {
      setError(err.message || "Failed to login. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-black uppercase syne tracking-tight italic">Welcome Back</h1>
        <p className="text-muted text-sm mono">Log in to your performance dashboard.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs mono p-3 rounded text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Authenticating..." : "Login →"}
        </button>
      </form>

      <div className="text-center text-xs mono text-muted">
        Don't have an account?{" "}
        <Link href="/onboarding" className="text-accent hover:underline">
          Register here
        </Link>
      </div>
    </div>
  );
}
