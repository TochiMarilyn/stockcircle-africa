"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Application = {
  business_name: string;
  business_city: string;
  product_category: string;
  status: "pending" | "approved" | "rejected";
};

export default function SupplierStatusPage() {
  const router = useRouter();

  const [application, setApplication] =
    useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadApplication() {
      try {
        const supabase = createClient();

        const { data: auth, error: authError } =
          await supabase.auth.getUser();

        if (!active) return;

        if (authError || !auth.user) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("supplier_applications")
          .select(
            "business_name,business_city,product_category,status"
          )
          .eq("user_id", auth.user.id)
          .maybeSingle();

        if (!active) return;

        if (error) {
          setErrorMessage(error.message);
        } else {
          setApplication(data);
        }
      } catch {
        if (active) {
          setErrorMessage("Unable to load your application.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadApplication();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="p-10 text-center">
        Loading your supplier application...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-emerald-50 px-4 py-12 text-slate-900">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-center text-3xl font-bold text-emerald-900">
          StockCircle Africa
        </h1>

        <h2 className="mt-3 text-center text-xl font-semibold">
          Supplier Application Status
        </h2>

        {errorMessage ? (
          <p className="mt-6 text-center text-red-700">
            {errorMessage}
          </p>
        ) : !application ? (
          <div className="mt-8 text-center">
            <p>You have not submitted an application.</p>
            <Link
              href="/supplier/apply"
              className="mt-4 inline-block text-emerald-800 underline"
            >
              Apply as a Supplier
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <p>
              <strong>Business:</strong>{" "}
              {application.business_name}
            </p>

            <p>
              <strong>City:</strong>{" "}
              {application.business_city}
            </p>

            <p>
              <strong>Category:</strong>{" "}
              {application.product_category}
            </p>

            <div className="rounded-xl bg-slate-50 p-5 text-center">
              <p className="font-semibold">
                Application Status
              </p>

              <p
                className={`mt-3 text-2xl font-bold ${
                  application.status === "approved"
                    ? "text-emerald-700"
                    : application.status === "rejected"
                    ? "text-red-700"
                    : "text-amber-700"
                }`}
              >
                {application.status.toUpperCase()}
              </p>

              <p className="mt-3 text-sm text-slate-600">
                {application.status === "approved"
                  ? "Your supplier application has been approved."
                  : application.status === "rejected"
                  ? "Your supplier application was not approved."
                  : "Your application is awaiting review."}
              </p>
            </div>

            {application.status === "approved" && (
              <p className="text-center text-sm text-slate-600">
                Product management tools are being developed.
              </p>
            )}
          </div>
        )}

        <Link
          href="/dashboard"
          className="mt-8 block rounded-lg bg-emerald-800 p-3 text-center font-semibold text-white"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}