import React from "react";
import { Link, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";

export default function App() {
  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>MarketPulse</h1>
          <p className="subtle">Resale analytics & price history (no automation).</p>
        </div>
        <nav className="nav">
          <Link to="/">Dashboard</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products/:id" element={<ProductDetail />} />
      </Routes>

      <footer className="footer subtle">
        Built for market tracking and analytics — purchasing decisions are manual.
      </footer>
    </div>
  );
}
