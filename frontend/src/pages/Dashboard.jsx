import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost, apiDelete } from "../api.js";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    retailPrice: ""
  });

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await apiGet("/api/products");
      setProducts(data);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setErr("");

    const retailPrice = Number(form.retailPrice);
    if (!form.name.trim() || !form.category.trim() || Number.isNaN(retailPrice)) {
      setErr("Please provide name, category, and a valid retail price.");
      return;
    }

    try {
      await apiPost("/api/products", {
        name: form.name.trim(),
        category: form.category.trim(),
        retailPrice
      });
      setForm({ name: "", category: "", retailPrice: "" });
      await load();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function onDelete(id) {
    if (!confirm("Delete this product?")) return;
    try {
      await apiDelete(`/api/products/${id}`);
      await load();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>Add Product</h2>
        <form onSubmit={onCreate} className="form">
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="RTX 5080 Founders Edition"
            />
          </label>

          <label>
            Category
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="GPU / Console / Sneakers"
            />
          </label>

          <label>
            Retail Price (USD)
            <input
              value={form.retailPrice}
              onChange={(e) => setForm((f) => ({ ...f, retailPrice: e.target.value }))}
              placeholder="699.99"
            />
          </label>

          <button className="btn" type="submit">Create</button>

          {err ? <p className="error">{err}</p> : null}
        </form>
      </section>

      <section className="card">
        <h2>Tracked Products</h2>
        {loading ? (
          <p className="subtle">Loading…</p>
        ) : products.length === 0 ? (
          <p className="subtle">No products yet. Add your first one.</p>
        ) : (
          <ul className="list">
            {products.map((p) => (
              <li key={p.id} className="row">
                <div className="rowMain">
                  <Link className="rowTitle" to={`/products/${p.id}`}>
                    {p.name}
                  </Link>
                  <div className="subtle">
                    {p.category} • Retail ${p.retailPrice.toFixed(2)} • {p.pricePointsCount} price points
                  </div>
                </div>
                <button className="btn ghost" onClick={() => onDelete(p.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
