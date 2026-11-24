"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type OrderItem = {
  id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type Order = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
};

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("orders")
          .select(`
            id,
            status,
            total_amount,
            created_at,
            order_items (
              id,
              quantity,
              unit_price,
              line_total
            )
          `)
          .eq("buyer_id", user.id)
          .order("created_at", { ascending: false });

        if (!active) return;

        if (error) {
          setErrorMessage(error.message);
        } else {
          setOrders((data ?? []) as Order[]);
        }
      } catch {
        if (active) {
          setErrorMessage("Unable to load your orders.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, [router]);

  function formatPrice(amount: number) {
    return Number(amount).toLocaleString("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function statusColor(status: string) {
    if (status === "completed")
      return "bg-green-100 text-green-800";

    if (status === "accepted")
      return "bg-blue-100 text-blue-800";

    if (status === "rejected" || status === "cancelled")
      return "bg-red-100 text-red-800";

    return "bg-amber-100 text-amber-800";
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-emerald-900 p-6 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold">
            StockCircle Africa
          </h1>

          <Link href="/dashboard" className="underline">
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-10">
        <h2 className="text-3xl font-bold">
          My Wholesale Orders
        </h2>

        <p className="mt-2 text-slate-600">
          View your order history and track order status.
        </p>

        {loading && (
          <p className="mt-8">Loading your orders...</p>
        )}

        {errorMessage && (
          <p className="mt-8 text-red-700" role="alert">
            {errorMessage}
          </p>
        )}

        {!loading && !errorMessage && orders.length === 0 && (
          <div className="mt-8 rounded-xl bg-white p-8 text-center shadow-sm">
            <p>You have not placed any orders yet.</p>

            <Link
              href="/"
              className="mt-5 inline-block rounded-lg bg-emerald-800 px-5 py-3 text-white"
            >
              Browse Marketplace
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">
                    Order #{order.id.slice(0, 8)}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(order.created_at).toLocaleString("en-GH")}
                  </p>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${statusColor(order.status)}`}
                >
                  {order.status.toUpperCase()}
                </span>
              </div>

              <div className="mt-5 border-t pt-4">
                <h4 className="font-semibold">
                  Ordered Items
                </h4>

                {order.order_items.map((item, index) => (
                  <div
                    key={item.id}
                    className="mt-3 flex flex-wrap justify-between gap-3 text-sm"
                  >
                    <div>
                      <p>Item {index + 1}</p>
                      <p className="text-slate-500">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-slate-500">
                        Unit price: GH₵{" "}
                        {formatPrice(item.unit_price)}
                      </p>
                    </div>

                    <p className="font-semibold">
                      GH₵ {formatPrice(item.line_total)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-between border-t pt-4 text-xl font-bold">
                <span>Order Total</span>
                <span className="text-emerald-800">
                  GH₵ {formatPrice(order.total_amount)}
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Order request only. Payment has not been
                collected through StockCircle.
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}