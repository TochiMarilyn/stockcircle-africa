"use client";

import { useEffect, useState, type FormEvent } from "react";
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

export default function SupplierProductsPage() {
  const [userId, setUserId] = useState("");
  const [approved, setApproved] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Haircare");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minimumOrder, setMinimumOrder] = useState("1");

  useEffect(() => {
    let active = true;

    async function loadSupplier() {
      const supabase = createClient();

      try {
        const { data: auth, error: authError } =
          await supabase.auth.getUser();

        if (!active) return;

        if (authError || !auth.user) {
          setMessage("Please log in to manage products.");
          return;
        }

        const currentUserId = auth.user.id;
        setUserId(currentUserId);

        const { data: application, error: appError } =
          await supabase
            .from("supplier_applications")
            .select("status")
            .eq("user_id", currentUserId)
            .maybeSingle();

        if (!active) return;

        if (appError) {
          setMessage(appError.message);
          return;
        }

        if (application?.status !== "approved") {
          setMessage(
            "Your supplier account is not yet approved."
          );
          return;
        }

        setApproved(true);

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("supplier_id", currentUserId)
          .order("created_at", { ascending: false });

        if (!active) return;

        if (error) {
          setMessage(error.message);
        } else {
          setProducts(data ?? []);
        }
      } catch {
        if (active) {
          setMessage("Unable to load supplier information.");
        }
      } finally {
        if (active) setChecking(false);
      }
    }

    loadSupplier();

    return () => {
      active = false;
    };
  }, []);

  async function addProduct(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!approved || !userId) return;

    const productPrice = Number(price);
    const stock = Number(quantity);
    const minOrder = Number(minimumOrder);

    if (
      !Number.isFinite(productPrice) ||
      productPrice <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isInteger(minOrder) ||
      minOrder < 1
    ) {
      setMessage("Please enter valid product values.");
      return;
    }

    if (minOrder > stock) {
      setMessage(
        "Minimum order cannot exceed available stock."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .insert({
          supplier_id: userId,
          name: name.trim(),
          description: description.trim() || null,
          category,
          price: productPrice,
          stock_quantity: stock,
          minimum_order_quantity: minOrder,
        })
        .select(
          "id,name,description,category,price,stock_quantity,minimum_order_quantity"
        )
        .single();

      if (error) {
        setMessage("Error: " + error.message);
        return;
      }

      setProducts((previous) => [data, ...previous]);

      setName("");
      setDescription("");
      setPrice("");
      setQuantity("");
      setMinimumOrder("1");

      setMessage("Product added successfully!");
    } catch {
      setMessage("Unable to save product. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="p-10 text-center">
        Checking supplier approval...
      </main>
    );
  }

  if (!approved) {
    return (
      <main className="min-h-screen bg-emerald-50 p-10 text-center text-slate-900">
        <h1 className="text-2xl font-bold">
          Supplier Product Management
        </h1>
        <p className="mt-5">{message}</p>

        <Link
          href="/supplier/status"
          className="mt-6 inline-block text-emerald-800 underline"
        >
          Check Supplier Status
        </Link>

        <div className="mt-4">
          <Link href="/login" className="text-emerald-800 underline">
            Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-emerald-900 p-6 text-white">
        <h1 className="mx-auto max-w-5xl text-2xl font-bold">
          StockCircle Africa
        </h1>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="text-3xl font-bold">
          Supplier Product Management
        </h2>

        <p className="mt-2 text-slate-600">
          Add wholesale products and manage your listings.
        </p>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold">
            Add New Product
          </h3>

          <form
            onSubmit={addProduct}
            className="mt-6 grid gap-5 sm:grid-cols-2"
          >
            <div>
              <label className="block font-medium">
                Product Name
              </label>
              <input
                required
                maxLength={150}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
                placeholder="Hair Shampoo Pack"
              />
            </div>

            <div>
              <label className="block font-medium">
                Product Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-lg border bg-white p-3"
              >
                <option>Haircare</option>
                <option>Cosmetics</option>
                <option>Nail Supplies</option>
                <option>Barber Supplies</option>
                <option>Other</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                className="mt-2 w-full rounded-lg border p-3"
                placeholder="Describe the product..."
              />
            </div>

            <div>
              <label className="block font-medium">
                Price (GH₵)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="block font-medium">
                Available Stock
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="block font-medium">
                Minimum Order Quantity
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={minimumOrder}
                onChange={(e) =>
                  setMinimumOrder(e.target.value)
                }
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-800 p-3 font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Saving..." : "Add Product"}
              </button>
            </div>
          </form>

          {message && (
            <p role="status" className="mt-5 text-emerald-800">
              {message}
            </p>
          )}
        </div>

        <section className="mt-10">
          <h3 className="text-2xl font-bold">
            My Products ({products.length})
          </h3>

          {products.length === 0 ? (
            <p className="mt-4 text-slate-600">
              No products added yet.
            </p>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <h4 className="text-lg font-bold">
                    {product.name}
                  </h4>
                  <p className="mt-2 text-sm text-slate-500">
                    {product.category}
                  </p>
                  <p className="mt-2">
                    {product.description}
                  </p>
                  <p className="mt-3 text-xl font-bold text-emerald-800">
                    GH₵ {Number(product.price).toFixed(2)}
                  </p>
                  <p className="mt-2 text-sm">
                    Stock: {product.stock_quantity}
                  </p>
                  <p className="text-sm">
                    Minimum order:{" "}
                    {product.minimum_order_quantity}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <Link
          href="/dashboard"
          className="mt-10 inline-block text-emerald-800 underline"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}