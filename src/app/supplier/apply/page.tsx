"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SupplierApplyPage() {
  const [businessName, setBusinessName] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [category, setCategory] = useState("Haircare");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setMessage(
          "Please log in before applying as a supplier."
        );
        return;
      }

      const { error } = await supabase
        .from("supplier_applications")
        .insert({
          user_id: user.id,
          business_name: businessName.trim(),
          business_city: businessCity.trim(),
          product_category: category,
          phone: phone.trim() || null,
        });

      if (error) {
        if (error.code === "23505") {
          setMessage(
            "You have already submitted an application."
          );
        } else {
          setMessage("Application failed: " + error.message);
        }
        return;
      }

      setSuccess(true);
      setMessage(
        "Your supplier application has been submitted successfully!"
      );
    } catch (error) {
      console.error("Supplier application error:", error);
      setMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-emerald-50 px-4 py-12 text-slate-900">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-center text-3xl font-bold text-emerald-900">
          StockCircle Africa
        </h1>

        <h2 className="mt-3 text-center text-xl font-semibold">
          Supplier Application
        </h2>

        <p className="mt-3 text-center text-slate-600">
          Apply to become a wholesale supplier
          on StockCircle Africa.
        </p>

        {!success && (
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="businessName"
                className="block font-medium"
              >
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                required
                maxLength={150}
                value={businessName}
                onChange={(e) =>
                  setBusinessName(e.target.value)
                }
                placeholder="Enter business name"
                className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              />
            </div>

            <div>
              <label
                htmlFor="businessCity"
                className="block font-medium"
              >
                Business City
              </label>
              <input
                id="businessCity"
                type="text"
                required
                maxLength={100}
                value={businessCity}
                onChange={(e) =>
                  setBusinessCity(e.target.value)
                }
                placeholder="e.g. Accra"
                className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="block font-medium"
              >
                Product Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3"
              >
                <option value="Haircare">Haircare</option>
                <option value="Cosmetics">Cosmetics</option>
                <option value="Nail Supplies">Nail Supplies</option>
                <option value="Barber Supplies">Barber Supplies</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block font-medium"
              >
                Business Phone (Optional)
              </label>
              <input
                id="phone"
                type="tel"
                maxLength={30}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="Enter business contact number"
                className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-800 p-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading
                ? "Submitting..."
                : "Submit Application"}
            </button>
          </form>
        )}

        {message && (
          <p
            role="status"
            className={`mt-6 text-center font-medium ${
              success
                ? "text-emerald-700"
                : "text-amber-700"
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-6 flex justify-center gap-6 text-sm">
          <Link
            href="/login"
            className="text-emerald-800 underline"
          >
            Login
          </Link>
          <Link
            href="/dashboard"
            className="text-emerald-800 underline"
          >
            Dashboard
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Applications are reviewed before suppliers
          receive permission to sell products.
        </p>
      </div>
    </main>
  );
}