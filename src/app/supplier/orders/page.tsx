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
  products: {
    name: string;
  } | null;
};

type SupplierOrder = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
};

export default function SupplierOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewingOrderId, setReviewingOrderId] =
  useState<string | null>(null);

const [actionMessage, setActionMessage] = useState("");
const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const supabase = createClient();

        const { data: auth, error: authError } =
          await supabase.auth.getUser();

        if (!active) return;

        if (authError || !auth.user) {
          router.replace("/login");
          return;
        }

        const supplierId = auth.user.id;

        // Verify that the supplier is approved
        const { data: application, error: appError } =
          await supabase
            .from("supplier_applications")
            .select("status")
            .eq("user_id", supplierId)
            .maybeSingle();

        if (!active) return;

        if (appError) {
          setMessage(appError.message);
          return;
        }

        if (application?.status !== "approved") {
          setMessage(
            "Your supplier account is not approved."
          );
          return;
        }

        setApproved(true);

        // Load orders belonging to this supplier
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
              line_total,
              products (
                name
              )
            )
          `)
          .eq("supplier_id", supplierId)
          .order("created_at", { ascending: false });

        if (!active) return;

        if (error) {
          setMessage(error.message);
        } else {
  const formattedOrders: SupplierOrder[] = (data ?? []).map(
    (order) => ({
      id: order.id,
      status: order.status,
      total_amount: Number(order.total_amount),
      created_at: order.created_at,
      order_items: (order.order_items ?? []).map((item) => {
        const rawProduct = item.products;

        const product = Array.isArray(rawProduct)
          ? rawProduct[0] ?? null
          : rawProduct;

        return {
          id: item.id,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          line_total: Number(item.line_total),
          products: product
            ? { name: product.name }
            : null,
        };
      }),
    })
  );

  setOrders(formattedOrders);
}
      } catch {
        if (active) {
          setMessage("Unable to load supplier orders.");
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
  async function reviewOrder(
  orderId: string,
  decision: "accept" | "reject"
) {
  if (reviewingOrderId) return;

  const confirmed = window.confirm(
    decision === "accept"
      ? "Accept this order and deduct the ordered stock?"
      : "Are you sure you want to reject this order?"
  );

  if (!confirmed) return;

  setReviewingOrderId(orderId);
  setActionMessage("");
  setActionError("");

  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "review_supplier_order",
      {
        p_order_id: orderId,
        p_decision: decision,
      }
    );

    if (error) {
      setActionError(
        "Unable to review order: " + error.message
      );
      return;
    }

    const newStatus = data?.status;

    if (
      newStatus !== "accepted" &&
      newStatus !== "rejected"
    ) {
      setActionError(
        "Unexpected response. Check the order in Supabase."
      );
      return;
    }

    setOrders((previous) =>
      previous.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus }
          : order
      )
    );

    setActionMessage(
      `Order #${orderId.slice(0, 8)} ${newStatus} successfully!`
    );
  } catch (error) {
    console.error("Order review error:", error);

    setActionError(
      "Something went wrong. Check Supabase before retrying."
    );
  } finally {
    setReviewingOrderId(null);
  }
}

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

    if (
      status === "rejected" ||
      status === "cancelled"
    )
      return "bg-red-100 text-red-800";

    return "bg-amber-100 text-amber-800";
  }

  if (loading) {
    return (
      <main className="p-10 text-center">
        Loading supplier orders...
      </main>
    );
  }

  if (!approved) {
    return (
      <main className="min-h-screen bg-emerald-50 p-10 text-center">
        <h1 className="text-2xl font-bold">
          Supplier Orders
        </h1>

        <p className="mt-5">{message}</p>

        <Link
          href="/supplier/status"
          className="mt-5 inline-block text-emerald-800 underline"
        >
          Check Supplier Status
        </Link>
      </main>
    );
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
          Incoming Wholesale Orders
        </h2>

        <p className="mt-2 text-slate-600">
          View wholesale order requests from buyers.
        </p>

        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Orders
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-800">
            {orders.length}
          </p>
        </div>

        {message && (
          <p role="alert" className="mt-6 text-red-700">
            {message}
          </p>
        )}
        {actionMessage && (
  <p
    role="status"
    className="mt-6 rounded-lg bg-emerald-50 p-4 text-emerald-800"
  >
    {actionMessage}
  </p>
)}

{actionError && (
  <p
    role="alert"
    className="mt-6 rounded-lg bg-red-50 p-4 text-red-700"
  >
    {actionError}
  </p>
)}

        {orders.length === 0 && !message && (
          <p className="mt-8 text-slate-600">
            No customer orders received yet.
          </p>
        )}

        <div className="mt-8 space-y-6">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">
                    Order #{order.id.slice(0, 8)}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(
                      order.created_at
                    ).toLocaleString("en-GH")}
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
                  Products Ordered
                </h4>

                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="mt-4 flex flex-wrap justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium">
                        {item.products?.name ??
                          "Product"}
                      </p>

                      <p className="text-sm text-slate-500">
                        Quantity: {item.quantity}
                      </p>

                      <p className="text-sm text-slate-500">
                        Unit Price: GH₵{" "}
                        {formatPrice(item.unit_price)}
                      </p>
                    </div>

                    <p className="font-bold">
                      GH₵ {formatPrice(item.line_total)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between border-t pt-4 text-xl font-bold">
                <span>Order Total</span>

                <span className="text-emerald-800">
                  GH₵{" "}
                  {formatPrice(order.total_amount)}
                </span>
              </div>
              {order.status === "pending" && (
  <div className="mt-6 flex flex-wrap gap-4">
    <button
      onClick={() => reviewOrder(order.id, "accept")}
      disabled={reviewingOrderId !== null}
      className="rounded-lg bg-emerald-800 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
    >
      {reviewingOrderId === order.id
        ? "Processing..."
        : "Accept Order"}
    </button>

    <button
      onClick={() => reviewOrder(order.id, "reject")}
      disabled={reviewingOrderId !== null}
      className="rounded-lg bg-red-700 px-6 py-3 font-semibold text-white hover:bg-red-600 disabled:opacity-50"
    >
      Reject Order
    </button>
  </div>
)}

              <p className="mt-4 text-sm text-slate-500">
                This is an order request.
                Payment and stock reservation
                are not yet implemented.
              </p>
            </article>
          ))}
        </div>

        <Link
          href="/supplier/products"
          className="mt-10 inline-block text-emerald-800 underline"
        >
          Manage Products
        </Link>
      </section>
    </main>
  );
}