import React, { useEffect, useState } from "react";
import { useAuth } from "@/Auth";
import { useDivision } from "@/components/context/DivisionContext";

function CurrentStock({ navigate }) {
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();

  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(10);

  /* ================= STYLES ================= */

  const styles = {
    page: {
      padding: "30px",
      background: "linear-gradient(135deg,#eef2ff,#f8fafc)",
      minHeight: "100vh",
      fontFamily: "Inter, sans-serif",
    },

    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px",
    },

    title: {
      fontSize: "28px",
      fontWeight: 700,
      color: "#111827",
    },

    searchBox: {
      padding: "10px 14px",
      borderRadius: "10px",
      border: "1px solid #e5e7eb",
      width: "280px",
      outline: "none",
      transition: "0.2s ease",
    },

    cardGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "20px",
      marginBottom: "30px",
    },

    statCard: {
      padding: "20px",
      borderRadius: "16px",
      color: "#fff",
      boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    },

    filterBar: {
      display: "flex",
      gap: "20px",
      marginBottom: "20px",
      alignItems: "center",
    },

    select: {
      padding: "10px",
      borderRadius: "10px",
      border: "1px solid #e5e7eb",
      background: "#fff",
      minWidth: "180px",
    },

    tableWrapper: {
      background: "#fff",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 15px 40px rgba(0,0,0,0.05)",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
    },

    th: {
      padding: "14px",
      textAlign: "left",
      fontSize: "14px",
      fontWeight: 600,
      background: "#f9fafb",
      borderBottom: "1px solid #e5e7eb",
    },

    td: {
      padding: "14px",
      borderBottom: "1px solid #f3f4f6",
      fontSize: "14px",
    },

    badge: {
      padding: "5px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#fff",
      textTransform: "capitalize",
    },

    loadingOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(255,255,255,0.7)",
      backdropFilter: "blur(4px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 999,
    },

    spinner: {
      width: "60px",
      height: "60px",
      border: "6px solid #e5e7eb",
      borderTop: "6px solid #6366f1",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
  };

  /* ================= FETCH STOCK ================= */

  useEffect(() => {
    if (selectedDivision?.id || showAllDivisions) {
      fetchCurrentStock();
    }
  }, [selectedDivision?.id, showAllDivisions]);

  const fetchCurrentStock = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};

      if (showAllDivisions) params.showAllDivisions = true;
      else if (selectedDivision?.id) params.divisionId = selectedDivision.id;

      const res = await axiosAPI.get("/inventory/current-stock", {
        params,
      });

      const data = res.data.inventory || [];

      setInventory(data);
      setFilteredInventory(data);
      setSummary(res.data.summary || null);
      setWarehouses(res.data.filters?.warehouses || []);
    } catch (err) {
      setError("Failed to load stock");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FRONTEND FILTERING ================= */

  useEffect(() => {
    let data = [...inventory];

    if (selectedWarehouse) {
      data = data.filter(
        (item) => item.warehouse?.id === Number(selectedWarehouse),
      );
    }

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (item) =>
          item.product?.name?.toLowerCase().includes(lower) ||
          item.product?.SKU?.toLowerCase().includes(lower),
      );
    }

    setFilteredInventory(data);
  }, [selectedWarehouse, search, inventory]);

  /* ================= BADGE COLORS ================= */

  const getStatusBadge = (status) => {
    const base = { ...styles.badge };
    if (status === "low") return { ...base, background: "#f59e0b" };
    if (status === "critical") return { ...base, background: "#ef4444" };
    if (status === "out_of_stock") return { ...base, background: "#b91c1c" };
    return { ...base, background: "#10b981" };
  };

  return (
    <div style={styles.page}>
      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner}></div>
        </div>
      )}

      {error && <div>{error}</div>}

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.title}>Current Stock</div>

        <input
          type="text"
          placeholder="Search product or SKU..."
          style={styles.searchBox}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* SUMMARY CARDS */}
      {summary && (
        <div style={styles.cardGrid}>
          <div
            style={{
              ...styles.statCard,
              background: "linear-gradient(135deg,#6366f1,#4f46e5)",
            }}
          >
            <div>Total Products</div>
            <h2>
              {new Set(filteredInventory.map((item) => item.productId)).size}
            </h2>
          </div>

          <div
            style={{
              ...styles.statCard,
              background: "linear-gradient(135deg,#10b981,#059669)",
            }}
          >
            <div>Total Quantity (kg)</div>
            <h2>{summary.currentStockQuantityKg}</h2>
          </div>

          <div
            style={{
              ...styles.statCard,
              background: "linear-gradient(135deg,#f59e0b,#d97706)",
            }}
          >
            <div>Low Stock</div>
            <h2>
              {filteredInventory.filter((i) => i.stockStatus === "low").length}
            </h2>
          </div>

          <div
            style={{
              ...styles.statCard,
              background: "linear-gradient(135deg,#ef4444,#dc2626)",
            }}
          >
            <div>Critical</div>
            <h2>
              {
                filteredInventory.filter((i) => i.stockStatus === "critical")
                  .length
              }
            </h2>
          </div>

          <div
            style={{
              ...styles.statCard,
              background: "linear-gradient(135deg,#06b6d4,#0891b2)",
            }}
          >
            <div>Total Value</div>
            <h2>
              ₹
              {filteredInventory
                .reduce((sum, i) => sum + Number(i.stockValue || 0), 0)
                .toLocaleString()}
            </h2>
          </div>
        </div>
      )}

      {/* FILTER BAR */}
      <div style={styles.filterBar}>
        <select
          style={styles.select}
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
        >
          <option value="">All Warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        <select
          style={styles.select}
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value))}
        >
          <option value={10}>10 Rows</option>
          <option value={20}>20 Rows</option>
          <option value={50}>50 Rows</option>
          <option value={100}>100 Rows</option>
        </select>
      </div>

      {/* TABLE */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>SKU</th>
              <th style={styles.th}>Warehouse</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}>Unit</th>
              <th style={styles.th}>Value</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  style={{ textAlign: "center", padding: "30px" }}
                >
                  No stock found
                </td>
              </tr>
            ) : (
              filteredInventory.slice(0, limit).map((item, index) => (
                <tr key={item.id}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>{item.product?.name}</td>
                  <td style={styles.td}>{item.product?.SKU}</td>
                  <td style={styles.td}>{item.warehouse?.name}</td>
                  <td style={styles.td}>{item.stockQuantity}</td>
                  <td style={styles.td}>{item.product?.unit}</td>
                  <td style={styles.td}>
                    ₹{Number(item.stockValue || 0).toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    <span style={getStatusBadge(item.stockStatus)}>
                      {item.stockStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CurrentStock;
