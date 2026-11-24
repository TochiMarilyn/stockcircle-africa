"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkUser() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();

      if (!active) return;

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setEmail(data.user.email ?? "");

      const requestedType =
        data.user.user_metadata?.requested_account_type;

      setAccountType(
        requestedType === "supplier"
          ? "Supplier Applicant"
          : "Business Buyer"
      );

      setLoading(false);
    }

    checkUser();

    return () => {
      active = false;
    };
  }, [router]);

  async function signOut() {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="p-10 text-center">
        Checking your account...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-emerald-900 p-6 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold">
            StockCircle Africa
          </h1>

          <button
            onClick={signOut}
            className="rounded-lg bg-white px-4 py-2 text-emerald-900"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-6">
        <section className="rounded-2xl bg-emerald-800 p-8 text-white">
          <h2 className="text-3xl font-bold">
            Welcome to Your Dashboard
          </h2>

          <p className="mt-3">{email}</p>
          <p className="mt-2">
            Account: {accountType}
          </p>
        </section>

        <h3 className="mt-10 text-2xl font-bold">
          Your Business Tools
        </h3>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Link
            href="/"
            className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md"
          >
            <div className="text-3xl">🛍️</div>
            <h4 className="mt-3 text-lg font-bold">
              Browse Marketplace
            </h4>
            <p className="mt-2 text-slate-600">
              Explore wholesale products and suppliers.
            </p>
          </Link>

         <Link
  href="/orders"
  className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md"
>
  <div className="text-3xl">📦</div>

  <h4 className="mt-3 text-lg font-bold">
    My Orders
  </h4>

  <p className="mt-2 text-slate-600">
    View your wholesale orders and track their status.
  </p>
</Link>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="text-3xl">📊</div>
            <h4 className="mt-3 text-lg font-bold">
              Business Analytics
            </h4>
            <p className="mt-2 text-slate-600">
              Purchasing reports are coming soon.
            </p>
          </div>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Supplier selling tools will require separate
          verification and approval.
        </p>
      </div>
    </main>
  );
}