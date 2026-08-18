"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 bg-accent rounded-full" />
            <h1 className="font-serif text-2xl text-ink">MMG Coach Studio</h1>
          </div>
          <p className="text-ink-3 text-sm">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-card border border-border rounded-[12px] p-8 shadow-card"
        >
          {error && (
            <div className="mb-4 p-3 bg-red/10 border border-red/20 rounded-sm text-red text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-medium text-ink-3 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors"
              placeholder="you@company.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-medium text-ink-3 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-ink text-white rounded-sm text-sm font-medium hover:bg-ink-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="mt-4 text-center text-sm text-ink-3">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-ink font-medium underline hover:no-underline">
              Sign up
            </Link>
          </p>
        </form>

        <p className="mt-6 text-center text-[11px] text-ink-3 leading-relaxed">
          &copy; 2026 The Motivated Mind Group Inc. | 480-219-2875 |
          support@themotivatedmindgroup.com | 260 S Arizona Ave, Chandler AZ 85225
        </p>
      </div>
    </div>
  );
}
