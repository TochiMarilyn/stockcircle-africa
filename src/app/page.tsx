"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock_quantity: number;
  minimum_order_quantity: number;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("marketplace_products")
          .select(
            "id,name,description,category,price,stock_quantity,minimum_order_quantity"
          )
          .order("created_at", { ascending: false });

        if (!active) return;

        if (error) {
          setErrorMessage(error.message);
        } else {
          setProducts(data ?? []);
        }
      } catch {
        if (active) {
          setErrorMessage("Unable to load products.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  function addToCart(product: Product) {
    setCart((previous) => {
      const current = previous[product.id] || 0;

      const next =
        current === 0
          ? product.minimum_order_quantity
          : current + 1;

      if (next > product.stock_quantity) {
        return previous;
      }

      return {
        ...previous,
        [product.id]: next,
      };
    });
  }

  function decreaseQuantity(product: Product) {
    setCart((previous) => {
      const updated = { ...previous };
      const current = updated[product.id] || 0;

      if (current <= product.minimum_order_quantity) {
        delete updated[product.id];
      } else {
        updated[product.id] = current - 1;
      }

      return updated;
    });
  }

  const filteredProducts = products.filter((product) =>
    (
      product.name +
      " " +
      product.category +
      " " +
      (product.description || "")
    )
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const cartItems = products.filter(
    (product) => (cart[product.id] || 0) > 0
  );

  const basketCount = Object.values(cart).reduce(
    (total, quantity) => total + quantity,
    0
  );

  const totalPrice = cartItems.reduce(
    (total, product) =>
      total + Number(product.price) * cart[product.id],
    0
  );

  function formatPrice(amount: number) {
    return amount.toLocaleString("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function productIcon(category: string) {
    const name = category.toLowerCase();

    if (name.includes("hair")) return "🧴";
    if (name.includes("nail")) return "💅";
    if (name.includes("barber")) return "✂️";
    if (name.includes("cosmetic")) return "💄";

    return "📦";
  }
  async function placeOrder() {
  if (placingOrder || cartItems.length === 0) return;

  setPlacingOrder(true);
  setOrderMessage("");

  try {
    const supabase = createClient();

    // Check that the customer is logged in
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setOrderMessage(
        "Please log in before placing an order."
      );
      return;
    }

    // Prepare products and quantities
    const items = cartItems.map((product) => ({
      product_id: product.id,
      quantity: cart[product.id],
    }));

    // Submit the order to Supabase
    const { data, error } = await supabase.rpc(
      "submit_wholesale_order",
      { p_items: items }
    );

    if (error) {
      setOrderMessage(
        "Order failed: " + error.message
      );
      return;
    }

    const orderCount = Array.isArray(data?.order_ids)
      ? data.order_ids.length
      : 0;

    // Clear basket after successful submission
    setCart({});

    setOrderMessage(
      `Order submitted successfully! ${orderCount} ` +
      `supplier order(s) created. No payment has been taken.`
    );
  } catch (error) {
    console.error("Order error:", error);
    setOrderMessage(
      "Unable to submit your order. Please try again."
    );
  } finally {
    setPlacingOrder(false);
  }
}

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-emerald-900 px-6 py-5 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold">
            StockCircle Africa
          </Link>

          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/login" className="hover:underline">
              Login
            </Link>

            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>

            <button
              onClick={() => setShowCart((value) => !value)}
              className="rounded-lg bg-white px-4 py-2 font-semibold text-emerald-900"
            >
              🛒 Basket ({basketCount})
            </button>
          </nav>
        </div>
      </header>

      <section className="bg-emerald-800 px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Stock Your Business Smarter
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg">
          Find wholesale products from approved suppliers.
          Compare prices and simplify business restocking.
        </p>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products or categories..."
          className="mt-8 w-full max-w-xl rounded-xl bg-white p-4 text-slate-900"
        />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-bold">
          Explore Wholesale Products
        </h2>

        <p className="mt-2 text-slate-600">
          Discover products available from approved suppliers.
        </p>

        {loading && (
          <p className="mt-8">Loading wholesale products...</p>
        )}

        {errorMessage && (
          <p className="mt-8 text-red-700" role="alert">
            {errorMessage}
          </p>
        )}

        {!loading && !errorMessage && (
          <>
            <p className="mt-5 text-sm text-slate-500">
              {filteredProducts.length} products found
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const quantity = cart[product.id] || 0;

                return (
                  <article
                    key={product.id}
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >
                    <div className="rounded-xl bg-emerald-50 p-10 text-center text-5xl">
                      {productIcon(product.category)}
                    </div>

                    <p className="mt-5 text-sm font-medium text-emerald-700">
                      {product.category}
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="mt-2 text-sm text-slate-600">
                        {product.description}
                      </p>
                    )}

                    <p className="mt-4 text-2xl font-bold text-emerald-800">
                      GH₵ {formatPrice(Number(product.price))}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      Available: {product.stock_quantity}
                    </p>

                    <p className="text-sm text-slate-600">
                      Minimum order:{" "}
                      {product.minimum_order_quantity}
                    </p>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={
                        quantity >= product.stock_quantity
                      }
                      className="mt-5 w-full rounded-lg bg-emerald-800 p-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {quantity >= product.stock_quantity
                        ? "Stock Limit Reached"
                        : "Add to Basket"}
                    </button>
                  </article>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <p className="mt-8 text-slate-600">
                No matching products found.
              </p>
            )}
          </>
        )}
      </section>

      {showCart && (
        <section className="mx-auto mb-12 max-w-4xl px-6">
          <div className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold">
              Your Shopping Basket
            </h2>

            {cartItems.length === 0 ? (
              <p className="mt-5">Your basket is empty.</p>
            ) : (
              <>
                {cartItems.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-wrap items-center justify-between gap-4 border-b py-5"
                  >
                    <div>
                      <h3 className="font-semibold">
                        {product.name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        GH₵{" "}
                        {formatPrice(Number(product.price))}{" "}
                        each
                      </p>

                      <p className="text-xs text-slate-500">
                        Minimum:{" "}
                        {product.minimum_order_quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          decreaseQuantity(product)
                        }
                        className="rounded-lg bg-slate-200 px-3 py-2"
                      >
                        −
                      </button>

                      <span className="font-semibold">
                        {cart[product.id]}
                      </span>

                      <button
                        onClick={() => addToCart(product)}
                        disabled={
                          cart[product.id] >=
                          product.stock_quantity
                        }
                        className="rounded-lg bg-slate-200 px-3 py-2 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <p className="font-bold">
                      GH₵{" "}
                      {formatPrice(
                        Number(product.price) *
                          cart[product.id]
                      )}
                    </p>
                  </div>
                ))}

                <div className="mt-6 flex justify-between text-xl font-bold">
                  <span>Subtotal</span>
                  <span>GH₵ {formatPrice(totalPrice)}</span>
                </div>

              <button
  onClick={placeOrder}
  disabled={placingOrder}
  className="mt-6 w-full rounded-lg bg-emerald-800 p-4 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
>
  {placingOrder
    ? "Submitting Order..."
    : "Place Order Request"}
</button>

<p className="mt-3 text-sm text-slate-500">
  This submits a wholesale order request.
  No payment is collected and stock is not
  yet reserved.
</p>
              </>
            )}
            {orderMessage && (
  <p
    role="status"
    className="mt-5 rounded-lg bg-emerald-50 p-4 text-emerald-900"
  >
    {orderMessage}
  </p>
)}
          </div>
        </section>
      )}

      <footer className="bg-slate-900 p-6 text-center text-white">
        <p>
          © StockCircle Africa | Wholesale Made Simple
        </p>
      </footer>
    </main>
  );
}