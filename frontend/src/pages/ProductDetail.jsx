import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet, apiPost } from "../api.js";

export default function ProductDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [priceForm, setPriceForm] = useState({
    price: "",
    condition: "new",
    platform: "unknown"
  });

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const d = await apiGet(`/api/products/${id}`);
      setData(d);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const margin = useMemo(() => {
    if (!data?.analytics?.recentResalePrice) return null;
    return data.analytics.recentResalePrice - data.retailPrice;
  }, [data]);

  async function addPricePoint(e) {
    e.preventDefault();
    setErr("");
    const price = Number(priceForm.price);
    if (Number.isNaN(price)) {
      setErr("Enter a valid price.");
      return;
    }
    try {
      await apiPost(`/api/products/${id}/price-points`, {
        price,
        condition: priceForm.condition,
        platform: priceForm.platform
      });
      setPriceForm({ price: "", condition: "new", platform: "unknown" });
      await load();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  if (loading) return <p className="subtle">Loading…</p>;
  if (err) return <p className="error">{err}</p>;
  if (!data) return <p className="subtle">Not found.</p>;

  return (
    <div className="stack">
      <div className="card">
        <div className="topRow">
          <div>
            <Link className="subtle" to="/">← Back</Link>
            <h2 style={{ marginTop: 8 }}>{data.name}</h2>
            <p className="subtle">{data.category} • Retail ${data.retailPrice.toFixed(2)}</p>
          </div>

          <div className="scoreBox">
            <div className="score">{data.analytics.opportunityScore}</div>
            <div className="subtle">Opportunity Score</div>
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <div className="subtle">Recent Resale</div>
            <div className="big">
              {data.analytics.recentResalePrice ? `$${data.analytics.recentResalePrice.toFixed(2)}` : "—"}
            </div>
          </div>
          <div className="stat">
            <div className="subtle">Estimated Margin</div>
            <div className="big">
              {margin === null ? "—" : `${margin >= 0 ? "+" : ""}$${margin.toFixed(2)}`}
            </div>
          </div>
          <div className="stat">
            <div className="subtle">Volatility</div>
            <div className="big">{data.analytics.volatilityPct.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="grid">
        <section className="card">
          <h3>Add Price Point</h3>
          <form className="form" onSubmit={addPricePoint}>
            <label>
              Price (USD)
              <input
                value={priceForm.price}
                onChange={(e) => setPriceForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="899.99"
              />
            </label>

            <label>
              Condition
              <select
                value={priceForm.condition}
                onChange={(e) => setPriceForm((f) => ({ ...f, condition: e.target.value }))}
              >
                <option value="new">new</option>
                <option value="used">used</option>
              </select>
            </label>

            <label>
              Platform
              <input
                value={priceForm.platform}
                onChange={(e) => setPriceForm((f) => ({ ...f, platform: e.target.value }))}
                placeholder="StockX / eBay / FB Marketplace"
              />
            </label>

            <button className="btn" type="submit">Add</button>
            {err ? <p className="error">{err}</p> : null}
          </form>
        </section>

        <section className="card">
          <h3>Price History</h3>
          {data.pricePoints.length === 0 ? (
            <p className="subtle">No price points yet.</p>
          ) : (
            <ul className="list">
              {data.pricePoints.map((pp) => (
                <li key={pp.id} className="row">
                  <div className="rowMain">
                    <div className="rowTitle">${pp.price.toFixed(2)}</div>
                    <div className="subtle">
                      {pp.condition} • {pp.platform} • {pp.recordedAt}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

