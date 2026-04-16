import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";

const qty = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

const today = new Date().toISOString().slice(0, 10);

function StockSummary() {
  const { axiosAPI } = useAuth();

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [productId, setProductId] = useState("");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unitMode, setUnitMode] = useState("display");

  const closeModal = () => setIsModalOpen(false);

  const styles = {
    pageContainer: {
      padding: "30px 20px 50px",
      background:
        "linear-gradient(180deg, #f8fbff 0%, #eef4ff 60%, #f8fafc 100%)",
      minHeight: "100vh",
    },
    pageTitle: {
      margin: 0,
      fontSize: "30px",
      fontWeight: 800,
      color: "#0f172a",
    },
    pageSubTitle: {
      margin: "8px 0 0 0",
      color: "#64748b",
      maxWidth: "980px",
      lineHeight: 1.7,
    },
    card: {
      background: "#fff",
      borderRadius: "18px",
      padding: "22px",
      boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
      marginBottom: "22px",
      border: "1px solid #e2e8f0",
    },
    guidanceBox: {
      marginTop: "18px",
      borderRadius: "18px",
      padding: "20px",
      background: "linear-gradient(135deg, #fff7ed 0%, #eff6ff 100%)",
      border: "1px solid #fed7aa",
      color: "#334155",
      lineHeight: 1.7,
    },
    sectionTitle: {
      margin: 0,
      fontSize: "22px",
      fontWeight: 800,
      color: "#0f172a",
    },
    label: {
      fontWeight: 700,
      fontSize: "12px",
      marginBottom: "8px",
      display: "block",
      textTransform: "uppercase",
      color: "#64748b",
      letterSpacing: "0.05em",
    },
    input: {
      borderRadius: "12px",
      padding: "12px 14px",
      border: "1px solid #cbd5e1",
      width: "100%",
      background: "#fff",
      color: "#0f172a",
      fontSize: "14px",
    },
    buttonPrimary: {
      background: "linear-gradient(135deg, #f97316 0%, #2563eb 100%)",
      color: "#fff",
      border: "none",
      padding: "12px 18px",
      borderRadius: "12px",
      cursor: "pointer",
      fontWeight: 700,
      minWidth: "150px",
    },
    buttonSecondary: {
      background: "#fff",
      color: "#334155",
      border: "1px solid #cbd5e1",
      padding: "12px 18px",
      borderRadius: "12px",
      cursor: "pointer",
      fontWeight: 700,
    },
    statGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
      gap: "16px",
      marginBottom: "24px",
    },
    statCard: {
      background: "#fff",
      padding: "18px",
      borderRadius: "16px",
      boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
      border: "1px solid #e2e8f0",
    },
    statLabel: {
      fontSize: "12px",
      fontWeight: 800,
      textTransform: "uppercase",
      color: "#64748b",
      letterSpacing: "0.05em",
      marginBottom: "8px",
    },
    statValue: {
      fontSize: "24px",
      fontWeight: 800,
      color: "#0f172a",
    },
    statMeta: {
      marginTop: "8px",
      fontSize: "13px",
      color: "#64748b",
    },
    tableContainer: {
      background: "#fff",
      borderRadius: "18px",
      overflow: "hidden",
      boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
      border: "1px solid #e2e8f0",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    th: {
      background: "#f8fafc",
      padding: "14px 12px",
      fontWeight: 800,
      textAlign: "left",
      color: "#475569",
      fontSize: "12px",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    },
    td: {
      padding: "14px 12px",
      borderTop: "1px solid #f1f5f9",
      verticalAlign: "top",
      color: "#334155",
      fontSize: "14px",
    },
    numberCell: {
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
    },
    productCell: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    productName: {
      fontWeight: 700,
      color: "#0f172a",
    },
    productMeta: {
      color: "#64748b",
      fontSize: "12px",
    },
    badgeGood: {
      display: "inline-flex",
      alignItems: "center",
      padding: "6px 10px",
      borderRadius: "999px",
      background: "#dcfce7",
      color: "#166534",
      fontWeight: 700,
      fontSize: "12px",
    },
    badgeWarn: {
      display: "inline-flex",
      alignItems: "center",
      padding: "6px 10px",
      borderRadius: "999px",
      background: "#fee2e2",
      color: "#991b1b",
      fontWeight: 700,
      fontSize: "12px",
    },
    toggleButton: {
      padding: "8px 14px",
      borderRadius: "10px",
      border: "1px solid #cbd5e1",
      cursor: "pointer",
      fontSize: "13px",
      background: "#fff",
      color: "#334155",
      fontWeight: 700,
    },
    formGrid: {
      display: "grid",
      gap: "16px",
      gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
    },
    toolbar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "18px",
    },
    helperText: {
      marginTop: "8px",
      color: "#64748b",
      fontSize: "13px",
      lineHeight: 1.6,
    },
    emptyState: {
      padding: "60px",
      textAlign: "center",
      color: "#64748b",
      background: "#fff",
      borderRadius: "18px",
      border: "1px dashed #cbd5e1",
    },
  };

  useEffect(() => {
    fetchBootstrap();
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      fetchStock();
    }
  }, [fromDate, toDate, warehouseId, productId]);

  const fetchBootstrap = async () => {
    try {
      const [warehouseRes, productRes] = await Promise.all([
        axiosAPI.get("/warehouses"),
        axiosAPI.get("/products?limit=500"),
      ]);

      setWarehouses(warehouseRes.data?.warehouses || []);
      setProducts(productRes.data?.products || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to load warehouse and product masters.",
      );
      setIsModalOpen(true);
    }
  };

  const fetchStock = async () => {
    if (!fromDate || !toDate) {
      setError("Please select both dates.");
      setIsModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        fromDate,
        toDate,
      });
      if (warehouseId) params.set("warehouseId", warehouseId);

      const res = await axiosAPI.get(`/inventory/stock-summary?${params.toString()}`);
      const rows = res.data?.data || [];
      setStockData(
        productId ? rows.filter((row) => String(row.productId) === String(productId)) : rows,
      );
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to fetch stock summary."
      );
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFromDate(today);
    setToDate(today);
    setWarehouseId("");
    setProductId("");
    setStockData([]);
  };

  const getValue = (item, field) => {
    if (unitMode === "base") return Number(item?.[`${field}Kg`] || 0);
    return Number(item?.[field] || 0);
  };

  const summaryTotals = useMemo(
    () =>
      stockData.reduce(
        (acc, item) => {
          acc.openingKg += Number(item.openingKg || 0);
          acc.inwardKg += Number(item.inwardKg || 0);
          acc.outwardKg += Number(item.outwardKg || 0);
          acc.closingKg += Number(item.closingKg || 0);
          return acc;
        },
        {
          openingKg: 0,
          inwardKg: 0,
          outwardKg: 0,
          closingKg: 0,
        },
      ),
    [stockData],
  );

  return (
    <div style={styles.pageContainer}>
      <h2 style={styles.pageTitle}>Stock Summary</h2>
      <p style={styles.pageSubTitle}>
        This screen is kept simple for daily billing and inventory work. It
        shows opening stock, stock in, stock out, and closing stock based on
        the inventory transactions already recorded in the software.
      </p>

      <div style={styles.guidanceBox}>
        <strong>How to use this:</strong> add stock when material comes in,
        create sales and invoices when material goes out, and this summary will
        show the running stock position. For mixed steel items, totals are shown
        in kg on top and each row is also shown in the product selling/display
        unit.
      </div>

      <motion.div style={styles.card}>
        <div style={styles.toolbar}>
          <h3 style={styles.sectionTitle}>Filters</h3>
          <button
            style={styles.toggleButton}
            onClick={() => setUnitMode(unitMode === "base" ? "display" : "base")}
          >
            Show {unitMode === "base" ? "selling/display unit" : "kg/base unit"}
          </button>
        </div>

        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Warehouse</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              style={styles.input}
            >
              <option value="">All Warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              style={styles.input}
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} {product.SKU ? `- ${product.SKU}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "end", gap: 10 }}>
            <button style={styles.buttonPrimary} onClick={fetchStock}>
              Refresh Summary
            </button>
            <button style={styles.buttonSecondary} onClick={resetFilters}>
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div style={styles.helperText}>
          Totals are shown in KG at the top because different steel products can
          be sold in sheet, coil, rmt, ton, or other units.
        </div>
      </motion.div>

      {stockData.length > 0 && (
        <div style={styles.statGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Opening Stock</div>
            <div style={styles.statValue}>{qty(summaryTotals.openingKg)} kg</div>
            <div style={styles.statMeta}>Stock available before selected period</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Stock In</div>
            <div style={styles.statValue}>{qty(summaryTotals.inwardKg)} kg</div>
            <div style={styles.statMeta}>Material received in the selected period</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Stock Out</div>
            <div style={styles.statValue}>{qty(summaryTotals.outwardKg)} kg</div>
            <div style={styles.statMeta}>Material sold or issued in the selected period</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Closing Stock</div>
            <div style={styles.statValue}>{qty(summaryTotals.closingKg)} kg</div>
            <div style={styles.statMeta}>Opening + inward - outward</div>
          </div>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : stockData.length > 0 ? (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={{ ...styles.th, ...styles.numberCell }}>Opening</th>
                <th style={{ ...styles.th, ...styles.numberCell }}>Stock In</th>
                <th style={{ ...styles.th, ...styles.numberCell }}>Stock Out</th>
                <th style={{ ...styles.th, ...styles.numberCell }}>Closing</th>
              </tr>
            </thead>
            <tbody>
              {stockData.map((item) => {
                const unitLabel = unitMode === "base" ? "kg" : item.displayUnit || "kg";

                return (
                  <tr key={item.productId}>
                    <td style={styles.td}>
                      <div style={styles.productCell}>
                        <span style={styles.productName}>{item.productName}</span>
                        <span style={styles.productMeta}>
                          Display unit: {item.displayUnit || "kg"} | Base unit: kg
                        </span>
                      </div>
                    </td>
                    <td style={{ ...styles.td, ...styles.numberCell }}>
                      {qty(getValue(item, "opening"))} {unitLabel}
                    </td>
                    <td style={{ ...styles.td, ...styles.numberCell, color: "#166534" }}>
                      {qty(getValue(item, "inward"))} {unitLabel}
                    </td>
                    <td style={{ ...styles.td, ...styles.numberCell, color: "#991b1b" }}>
                      {qty(getValue(item, "outward"))} {unitLabel}
                    </td>
                    <td style={{ ...styles.td, ...styles.numberCell, fontWeight: 700 }}>
                      {qty(getValue(item, "closing"))} {unitLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.emptyState}>No stock data found for the selected filters.</div>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </div>
  );
}

export default StockSummary;
