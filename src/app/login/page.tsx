"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        setMessage(error.message);
      } else {
        setLoggedIn(true);
        setMessage("Login successful!");
      }
    } catch {
      setMessage("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
      return;
    }

    setLoggedIn(false);
    setPassword("");
    setMessage("You have signed out.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-center text-3xl font-bold text-emerald-900">
          StockCircle Africa
        </h1>

        {loggedIn ? (
          <div className="mt-8 text-center">
            <h2 className="text-xl font-semibold text-emerald-800">
              Welcome to StockCircle!
            </h2>
            <p className="mt-3 text-slate-600">
              You are signed in as {email}.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 block rounded-lg bg-emerald-800 p-3 text-white"
            >
              Visit Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="mt-4 text-emerald-800 underline"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-center text-slate-600">
              Sign in to your business account
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="block font-medium">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 p-3"
                />
              </div>

              <div>
                <label htmlFor="password" className="block font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 p-3"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-800 p-3 font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Signing In..." : "Login"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm">
              Don't have an account?{" "}
              <Link href="/register" className="font-bold text-emerald-800">
                Register
              </Link>
            </p>
          </>
        )}

        {message && (
          <p role="status" className="mt-5 text-center text-sm">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}