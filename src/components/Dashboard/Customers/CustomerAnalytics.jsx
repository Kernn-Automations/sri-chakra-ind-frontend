import React from "react";
import { useMediaQuery } from "react-responsive";

/* ---------- Helpers ---------- */
const num = (v) => Number(v ?? 0);
const money = (v) => `₹ ${num(v).toLocaleString()}`;

function CustomerSalesAnalytics({ data }) {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  if (!data) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", color: "#777" }}>
        Loading sales analytics...
      </div>
    );
  }

  const summary = data.summary || {};
  const analytics = data.analytics || {};
  const orders = data.orders || [];

  return (
    <div style={styles.container}>
      {/* ================= KPI CARDS ================= */}
      <div style={styles.kpiGrid}>
        <KpiCard
          title="Total Turnover"
          value={money(summary.totalTurnoverAmount)}
        />
        <KpiCard
          title="Total Paid"
          value={money(summary.totalPaidAmount)}
          green
        />
        <KpiCard
          title="Pending Amount"
          value={money(summary.totalPendingAmount)}
          red
        />
        <KpiCard title="Orders" value={num(summary.numberOfOrders)} />
        <KpiCard
          title="Total Quantity"
          value={num(summary.totalQuantityOrdered)}
        />
        <KpiCard
          title="Total Weight (KG)"
          value={num(summary.totalQuantityInKg).toFixed(2)}
        />
        <KpiCard
          title="Avg Order Value"
          value={money(summary.averageOrderValue)}
        />
        <KpiCard
          title="Avg KG / Order"
          value={num(summary.averageKgPerOrder).toFixed(2)}
        />
      </div>

      {/* ================= STATUS + TOP PRODUCTS ================= */}
      <div
        style={{ ...styles.row, flexDirection: isMobile ? "column" : "row" }}
      >
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Order Status Breakdown</h4>
          {Object.entries(analytics.orderStatusBreakdown || {}).map(
            ([status, count]) => (
              <div key={status} style={styles.statusRow}>
                <span>{status}</span>
                <span>{count}</span>
              </div>
            ),
          )}
        </div>

        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Top Products (by KG)</h4>
          {(analytics.topProductsByKg || []).map((p, i) => (
            <div key={i} style={styles.productRow}>
              <span>{p.productName}</span>
              <span>{num(p.totalKg).toFixed(2)} KG</span>
            </div>
          ))}
        </div>
      </div>

      {/* ================= ORDER HISTORY ================= */}
      <div style={styles.card}>
        <h4 style={styles.cardTitle}>Order History</h4>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                {[
                  "Order #",
                  "Date",
                  "Status",
                  "Total",
                  "Paid",
                  "Pending",
                  "Qty",
                  "KG",
                ].map((h) => (
                  <th key={h} style={styles.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={styles.td}>{o.orderNumber}</td>
                  <td style={styles.td}>
                    {new Date(o.orderDate).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>{o.orderStatus}</td>
                  <td style={styles.td}>{money(o.totalAmount)}</td>
                  <td style={{ ...styles.td, ...styles.greenText }}>
                    {money(o.paidAmount)}
                  </td>
                  <td style={{ ...styles.td, ...styles.redText }}>
                    {money(o.pendingAmount)}
                  </td>
                  <td style={styles.td}>{num(o.orderQuantity)}</td>
                  <td style={styles.td}>{num(o.orderQuantityKg).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CustomerSalesAnalytics;

/* ---------- KPI Card ---------- */
function KpiCard({ title, value, green, red }) {
  return (
    <div
      style={{
        ...styles.kpiCard,
        ...(green ? styles.greenBorder : {}),
        ...(red ? styles.redBorder : {}),
      }}
    >
      <div style={styles.kpiTitle}>{title}</div>
      <div style={styles.kpiValue}>{value}</div>
    </div>
  );
}

/* ---------- Styles ---------- */
const styles = {
  container: {
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "1rem",
  },

  kpiCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "1rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },

  kpiTitle: { fontSize: "0.85rem", color: "#777" },
  kpiValue: { fontSize: "1.4rem", fontWeight: "600", marginTop: "0.3rem" },

  greenBorder: { borderLeft: "5px solid #1abc9c" },
  redBorder: { borderLeft: "5px solid #e74c3c" },

  row: { display: "flex", gap: "1rem" },

  card: {
    flex: 1,
    background: "#fff",
    borderRadius: "12px",
    padding: "1rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },

  cardTitle: { marginBottom: "0.75rem" },

  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.4rem 0",
    borderBottom: "1px solid #f1f1f1",
  },
  productRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.4rem 0",
    borderBottom: "1px solid #f1f1f1",
  },

  tableWrapper: { overflowX: "auto" },

  table: { width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" },

  th: {
    padding: "0.6rem",
    borderBottom: "1px solid #eee",
    fontSize: "0.85rem",
    background: "#fafafa",
  },
  td: {
    padding: "0.6rem",
    textAlign: "center",
    borderBottom: "1px solid #eee",
    fontSize: "0.9rem",
  },

  greenText: { color: "#1abc9c", fontWeight: "600" },
  redText: { color: "#e74c3c", fontWeight: "600" },
};
