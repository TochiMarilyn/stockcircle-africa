"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<
    "buyer" | "supplier"
  >("buyer");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            requested_account_type: accountType,
          },
        },
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Registration submitted. Please check your email for a confirmation link if required."
        );
      }
    } catch (error) {
  console.error("Registration error:", error);
  setMessage(
    "Registration failed. Check the browser console for details."
  );
} finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-center text-3xl font-bold text-emerald-900">
          StockCircle Africa
        </h1>

        <p className="mt-2 text-center text-slate-600">
          Create your business account
        </p>

        <form onSubmit={handleRegister} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="accountType"
              className="block font-medium text-slate-800"
            >
              Account Type
            </label>

            <select
              id="accountType"
              value={accountType}
              onChange={(e) =>
                setAccountType(
                  e.target.value as "buyer" | "supplier"
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900"
            >
              <option value="buyer">Business Buyer</option>
              <option value="supplier">Wholesale Supplier</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block font-medium text-slate-800"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="business@example.com"
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-medium text-slate-800"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-800 p-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {message && (
          <p role="status" className="mt-5 text-center text-sm text-slate-700">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Supplier accounts will require verification
          before selling products.
        </p>

        <a
          href="/"
          className="mt-5 block text-center font-medium text-emerald-800"
        >
          Back to Marketplace
        </a>
      </div>
    </main>
  );
}