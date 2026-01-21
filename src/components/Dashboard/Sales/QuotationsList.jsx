import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";

function QuotationsList() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();

  const [quotations, setQuotations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  /* -------------------------
   * FETCH QUOTATIONS
   * ------------------------- */
  useEffect(() => {
    async function fetchQuotations() {
      try {
        setLoading(true);
        const res = await axiosAPI.get("/quotations");
        setQuotations(res.data?.quotations || []);
        setFiltered(res.data?.quotations || []);
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load quotations");
        setShowError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchQuotations();
  }, [axiosAPI]);

  /* -------------------------
   * SEARCH & FILTER
   * ------------------------- */
  useEffect(() => {
    let data = [...quotations];

    if (search) {
      data = data.filter(
        (q) =>
          q.quotationNumber?.toLowerCase().includes(search.toLowerCase()) ||
          q.customerName?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (statusFilter !== "ALL") {
      data = data.filter((q) => q.status === statusFilter);
    }

    setFiltered(data);
  }, [search, statusFilter, quotations]);

  /* -------------------------
   * STATUS BADGE
   * ------------------------- */
  const statusBadge = (status) => {
    const map = {
      Draft: { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
      Sent: { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" },
      Converted: { bg: "#dcfce7", color: "#166534", border: "#86efac" },
      Cancelled: { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
      Expired: { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
    };

    const colors = map[status] || {
      bg: "#f3f4f6",
      color: "#6b7280",
      border: "#d1d5db",
    };

    return (
      <span
        style={{
          background: colors.bg,
          color: colors.color,
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 600,
          border: `1px solid ${colors.border}`,
          display: "inline-block",
        }}
      >
        {status}
      </span>
    );
  };

  /* -------------------------
   * STATS SUMMARY
   * ------------------------- */
  const stats = [
    { label: "Total", count: quotations.length, color: "#003176" },
    {
      label: "Draft",
      count: quotations.filter((q) => q.status === "Draft").length,
      color: "#64748b",
    },
    {
      label: "Sent",
      count: quotations.filter((q) => q.status === "Sent").length,
      color: "#2563eb",
    },
    {
      label: "Converted",
      count: quotations.filter((q) => q.status === "Converted").length,
      color: "#16a34a",
    },
  ];

  /* -------------------------
   * RENDER
   * ------------------------- */
  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Quotations</h2>
          <p style={styles.subtitle}>
            Create, send, and convert quotations into sales orders
          </p>
        </div>

        <button
          style={styles.primaryBtn}
          onMouseEnter={(e) => (e.target.style.background = "#00245a")}
          onMouseLeave={(e) => (e.target.style.background = "#003176")}
          onClick={() => navigate("/sales/quotations/new")}
        >
          <span style={{ fontSize: "18px", marginRight: "6px" }}>+</span>
          Create Quotation
        </button>
      </div>

      {/* STATS CARDS */}
      {quotations.length > 0 && (
        <div style={styles.statsContainer}>
          {stats.map((stat) => (
            <div key={stat.label} style={styles.statCard}>
              <div style={{ ...styles.statCount, color: stat.color }}>
                {stat.count}
              </div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* FILTER BAR */}
      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <svg
            style={styles.searchIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            style={styles.search}
            placeholder="Search by quotation # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          style={styles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Converted">Converted</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      {/* CONTENT */}
      {filtered.length === 0 && !loading ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <h3 style={styles.emptyTitle}>No Quotations Found</h3>
          <p style={styles.emptyText}>
            {search || statusFilter !== "ALL"
              ? "Try adjusting your search or filters"
              : "Create your first quotation to get started"}
          </p>
          {!search && statusFilter === "ALL" && (
            <button
              style={styles.primaryBtn}
              onMouseEnter={(e) => (e.target.style.background = "#00245a")}
              onMouseLeave={(e) => (e.target.style.background = "#003176")}
              onClick={() => navigate("/sales/quotations/new")}
            >
              <span style={{ fontSize: "18px", marginRight: "6px" }}>+</span>
              Create Quotation
            </button>
          )}
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Quotation #</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Status</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr
                  key={q.id}
                  style={styles.tableRow}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f8fafc")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#fff")
                  }
                >
                  <td style={styles.td}>
                    <span style={styles.quotationNumber}>
                      {q.quotationNumber}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.customerName}>
                      {q.customerName || "—"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.date}>
                      {q.createdAt
                        ? new Date(q.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.amount}>
                      ₹{Number(q.totalAmount || 0).toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td style={styles.td}>{statusBadge(q.status)}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <div style={styles.actionsContainer}>
                      <button
                        style={styles.viewBtn}
                        onMouseEnter={(e) =>
                          (e.target.style.background = "#f1f5f9")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.background = "transparent")
                        }
                        onClick={() => navigate(`/sales/quotations/${q.id}`)}
                      >
                        View
                      </button>

                      {q.status === "Draft" && (
                        <button
                          style={styles.editBtn}
                          onMouseEnter={(e) =>
                            (e.target.style.background = "#dbeafe")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.background = "transparent")
                          }
                          onClick={() =>
                            navigate(`/sales/quotations/${q.id}?edit=true`)
                          }
                        >
                          Edit
                        </button>
                      )}

                      {q.status !== "Converted" && q.status !== "Cancelled" && (
                        <button
                          style={styles.convertBtn}
                          onMouseEnter={(e) =>
                            (e.target.style.background = "#15803d")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.background = "#16a34a")
                          }
                          onClick={() =>
                            navigate(`/sales/quotations/${q.id}?convert=true`)
                          }
                        >
                          Convert
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && <Loading />}
      {showError && (
        <ErrorModal
          isOpen
          message={error}
          onClose={() => setShowError(false)}
        />
      )}
    </div>
  );
}

/* -------------------------
 * STYLES
 * ------------------------- */
const styles = {
  page: {
    padding: "32px",
    background: "linear-gradient(to bottom, #f8fafc, #f1f5f9)",
    minHeight: "100vh",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: "6px 0 0 0",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: 400,
  },
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  statCount: {
    fontSize: "32px",
    fontWeight: 700,
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  filterBar: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
  },
  searchWrapper: {
    flex: 1,
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "18px",
    height: "18px",
    color: "#94a3b8",
    pointerEvents: "none",
  },
  search: {
    width: "100%",
    padding: "12px 12px 12px 40px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    background: "#fff",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
  },
  select: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 500,
    minWidth: "160px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  tableWrapper: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  th: {
    padding: "16px 20px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tableRow: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background-color 0.15s",
    cursor: "pointer",
  },
  td: {
    padding: "18px 20px",
    fontSize: "14px",
    color: "#334155",
  },
  quotationNumber: {
    fontWeight: 600,
    color: "#0f172a",
    fontSize: "14px",
  },
  customerName: {
    color: "#475569",
  },
  date: {
    color: "#64748b",
    fontSize: "13px",
  },
  amount: {
    fontWeight: 600,
    color: "#0f172a",
    fontSize: "15px",
  },
  actionsContainer: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
  },
  primaryBtn: {
    background: "#003176",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "10px",
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
    transition: "background 0.2s, transform 0.1s",
    boxShadow: "0 2px 4px rgba(0,49,118,0.2)",
    display: "flex",
    alignItems: "center",
  },
  viewBtn: {
    background: "transparent",
    border: "1px solid #e2e8f0",
    color: "#475569",
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "13px",
    transition: "all 0.2s",
  },
  editBtn: {
    background: "transparent",
    border: "1px solid #93c5fd",
    color: "#2563eb",
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "13px",
    transition: "all 0.2s",
  },
  convertBtn: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
    transition: "background 0.2s",
    boxShadow: "0 1px 2px rgba(22,163,74,0.3)",
  },
  emptyState: {
    background: "#fff",
    padding: "80px 40px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
    opacity: 0.6,
  },
  emptyTitle: {
    margin: "0 0 8px 0",
    fontSize: "20px",
    fontWeight: 600,
    color: "#0f172a",
  },
  emptyText: {
    margin: "0 0 24px 0",
    color: "#64748b",
    fontSize: "14px",
  },
};

export default QuotationsList;
