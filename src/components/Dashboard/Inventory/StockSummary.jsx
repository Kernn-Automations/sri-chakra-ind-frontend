import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";

function StockSummary({ navigate }) {
  const { axiosAPI } = useAuth();
  const today = new Date().toISOString().slice(0, 10);

  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unitMode, setUnitMode] = useState("display"); // display | base

  const closeModal = () => setIsModalOpen(false);

  /* ================= STYLES ================= */

  const styles = {
    pageContainer: {
      padding: "30px 20px",
      background: "#f6f8fc",
      minHeight: "100vh",
    },
    card: {
      background: "#fff",
      borderRadius: "16px",
      padding: "20px",
      boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
      marginBottom: "25px",
    },
    label: {
      fontWeight: 600,
      fontSize: "13px",
      marginBottom: "6px",
      display: "block",
    },
    input: {
      borderRadius: "10px",
      padding: "10px",
      border: "1px solid #dee2e6",
      width: "100%",
    },
    buttonPrimary: {
      background: "#2563eb",
      color: "#fff",
      border: "none",
      padding: "10px 16px",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: 600,
      width: "100%",
    },
    statGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginBottom: "25px",
    },
    statCard: {
      background: "#fff",
      padding: "18px",
      borderRadius: "14px",
      boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
    },
    tableContainer: {
      background: "#fff",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    th: {
      background: "#f1f5f9",
      padding: "12px",
      fontWeight: 600,
      textAlign: "left",
    },
    td: {
      padding: "12px",
      borderTop: "1px solid #f0f0f0",
    },
    toggleButton: {
      padding: "6px 12px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      cursor: "pointer",
      marginLeft: "10px",
      fontSize: "13px",
      background: "#f8fafc",
    },
  };

  /* ================= API ================= */

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await axiosAPI.get("/warehouses");
      setWarehouses(res.data.warehouses || []);
    } catch {
      setError("Failed to load warehouse list");
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
      const res = await axiosAPI.get(
        `/inventory/stock-summary?fromDate=${fromDate}&toDate=${toDate}${
          warehouseId ? `&warehouseId=${warehouseId}` : ""
        }`,
      );

      setStockData(res.data.data || []);
    } catch {
      setError("Failed to fetch stock summary.");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFromDate(today);
    setToDate(today);
    setWarehouseId("");
    setStockData([]);
  };

  /* ================= UNIT LOGIC ================= */

  const getValue = (item, field) => {
    if (unitMode === "base") return item[`${field}Kg`] || 0;
    return item[field] || 0;
  };

  const totals = stockData.reduce(
    (acc, item) => {
      acc.opening += getValue(item, "opening");
      acc.inward += getValue(item, "inward");
      acc.outward += getValue(item, "outward");
      acc.closing += getValue(item, "closing");
      return acc;
    },
    { opening: 0, inward: 0, outward: 0, closing: 0 },
  );

  const unitLabel =
    unitMode === "base" ? "kg" : stockData[0]?.displayUnit || "kg";

  return (
    <div style={styles.pageContainer}>
      <h3>
        Stock Summary
        <button
          style={styles.toggleButton}
          onClick={() => setUnitMode(unitMode === "base" ? "display" : "base")}
        >
          Switch to {unitMode === "base" ? "Display Unit" : "KG"}
        </button>
      </h3>

      {/* FILTERS */}
      <motion.div style={styles.card}>
        <div
          style={{
            display: "grid",
            gap: "16px",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          }}
        >
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
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "end" }}>
            <button style={styles.buttonPrimary} onClick={fetchStock}>
              Submit
            </button>
            <button
              style={{
                ...styles.buttonPrimary,
                background: "#e5e7eb",
                marginLeft: "8px",
              }}
              onClick={resetFilters}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* SUMMARY CARDS */}
      {stockData.length > 0 && (
        <div style={styles.statGrid}>
          {["opening", "inward", "outward", "closing"].map((key) => (
            <div key={key} style={styles.statCard}>
              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                {key.toUpperCase()}
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700 }}>
                {totals[key].toLocaleString()} {unitLabel}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE */}
      {loading ? (
        <Loading />
      ) : stockData.length > 0 ? (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Opening</th>
                <th style={styles.th}>Inward</th>
                <th style={styles.th}>Outward</th>
                <th style={styles.th}>Closing</th>
                <th style={styles.th}>Unit</th>
              </tr>
            </thead>
            <tbody>
              {stockData.map((item) => (
                <tr key={item.productId}>
                  <td style={styles.td}>{item.productName}</td>
                  <td style={styles.td}>
                    {getValue(item, "opening")} {unitLabel}
                  </td>
                  <td style={{ ...styles.td, color: "green" }}>
                    {getValue(item, "inward")} {unitLabel}
                  </td>
                  <td style={{ ...styles.td, color: "red" }}>
                    {getValue(item, "outward")} {unitLabel}
                  </td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>
                    {getValue(item, "closing")} {unitLabel}
                  </td>
                  <td style={styles.td}>
                    {unitMode === "base" ? "kg" : item.displayUnit || "kg"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: "60px", textAlign: "center", color: "#6b7280" }}>
          No Stock Data Found
        </div>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </div>
  );
}

export default StockSummary;
