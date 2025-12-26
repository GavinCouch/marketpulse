import express from "express";
import cors from "cors";
import db, { initDb } from "./db.js";
import { productCreateSchema, productUpdateSchema, pricePointCreateSchema } from "./validators.js";
import { computeOpportunityScore, computeVolatilityPct } from "./scoring.js";

initDb();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5174;

// Health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Helpers
const dollarsToCents = (d) => Math.round(d * 100);
const centsToDollars = (c) => Math.round(c) / 100;

// PRODUCTS

app.get("/api/products", (req, res) => {
  const rows = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM price_points pp WHERE pp.product_id = p.id) AS price_points_count
    FROM products p
    ORDER BY p.created_at DESC
  `).all();

  const mapped = rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    retailPrice: centsToDollars(r.retail_price_cents),
    source: r.source,
    createdAt: r.created_at,
    pricePointsCount: r.price_points_count
  }));

  res.json(mapped);
});

app.post("/api/products", (req, res) => {
  const parsed = productCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { name, category, retailPrice, source } = parsed.data;
  const stmt = db.prepare(`
    INSERT INTO products (name, category, retail_price_cents, source)
    VALUES (?, ?, ?, ?)
  `);

  const info = stmt.run(name, category, dollarsToCents(retailPrice), source ?? "manual");
  const created = db.prepare(`SELECT * FROM products WHERE id = ?`).get(info.lastInsertRowid);

  res.status(201).json({
    id: created.id,
    name: created.name,
    category: created.category,
    retailPrice: centsToDollars(created.retail_price_cents),
    source: created.source,
    createdAt: created.created_at
  });
});

app.get("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const points = db.prepare(`
    SELECT * FROM price_points
    WHERE product_id = ?
    ORDER BY recorded_at DESC
    LIMIT 200
  `).all(id);

  const prices = points.map((p) => p.price_cents);
  const volatilityPct = computeVolatilityPct(prices);
  const recentResale = points[0]?.price_cents ?? null;
  const score = computeOpportunityScore({
    retailPriceCents: product.retail_price_cents,
    recentResaleCents: recentResale,
    volatilityPct
  });

  res.json({
    id: product.id,
    name: product.name,
    category: product.category,
    retailPrice: centsToDollars(product.retail_price_cents),
    source: product.source,
    createdAt: product.created_at,
    analytics: {
      recentResalePrice: recentResale ? centsToDollars(recentResale) : null,
      volatilityPct: Math.round(volatilityPct * 10) / 10,
      opportunityScore: score
    },
    pricePoints: points.map((pp) => ({
      id: pp.id,
      price: centsToDollars(pp.price_cents),
      condition: pp.condition,
      platform: pp.platform,
      recordedAt: pp.recorded_at
    }))
  });
});

app.patch("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
  if (!existing) return res.status(404).json({ error: "Product not found" });

  const parsed = productUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const next = {
    name: parsed.data.name ?? existing.name,
    category: parsed.data.category ?? existing.category,
    retail_price_cents:
      parsed.data.retailPrice !== undefined ? dollarsToCents(parsed.data.retailPrice) : existing.retail_price_cents,
    source: parsed.data.source ?? existing.source
  };

  db.prepare(`
    UPDATE products
    SET name = ?, category = ?, retail_price_cents = ?, source = ?
    WHERE id = ?
  `).run(next.name, next.category, next.retail_price_cents, next.source, id);

  const updated = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
  res.json({
    id: updated.id,
    name: updated.name,
    category: updated.category,
    retailPrice: centsToDollars(updated.retail_price_cents),
    source: updated.source,
    createdAt: updated.created_at
  });
});

app.delete("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare(`DELETE FROM products WHERE id = ?`).run(id);
  if (info.changes === 0) return res.status(404).json({ error: "Product not found" });
  res.status(204).send();
});

// PRICE POINTS

app.post("/api/products/:id/price-points", (req, res) => {
  const productId = Number(req.params.id);
  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const parsed = pricePointCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { price, condition, platform, recordedAt } = parsed.data;

  const stmt = db.prepare(`
    INSERT INTO price_points (product_id, price_cents, condition, platform, recorded_at)
    VALUES (?, ?, ?, ?, COALESCE(?, datetime('now')))
  `);

  const info = stmt.run(
    productId,
    dollarsToCents(price),
    condition ?? "new",
    platform ?? "unknown",
    recordedAt ?? null
  );

  const created = db.prepare(`SELECT * FROM price_points WHERE id = ?`).get(info.lastInsertRowid);
  res.status(201).json({
    id: created.id,
    productId: created.product_id,
    price: centsToDollars(created.price_cents),
    condition: created.condition,
    platform: created.platform,
    recordedAt: created.recorded_at
  });
});

app.listen(PORT, () => {
  console.log(`MarketPulse backend running on http://localhost:${PORT}`);
});
