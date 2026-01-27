import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";

/* -------------------------
 * VIEW QUOTATION
 * ------------------------- */
function ViewQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();

  /* -------------------------
   * STATE
   * ------------------------- */
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [downloading, setDownloading] = useState(false);

  /* -------------------------
   * FETCH QUOTATION
   * ------------------------- */
  useEffect(() => {
    async function fetchQuotation() {
      try {
        setLoading(true);
        const res = await axiosAPI.get(`/quotations/${id}`);
        console.log(res);
        setQuotation(res.data?.quotation);
      } catch {
        setError("Failed to load quotation");
        setShowError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchQuotation();
  }, [axiosAPI, id]);

  /* -------------------------
   * STATUS UPDATE
   * ------------------------- */
  async function updateStatus(status) {
    try {
      setUpdatingStatus(true);
      const res = await axiosAPI.patch(`/quotations/${id}/status`, { status });
      setQuotation(res.data?.quotation);
    } catch {
      setError("Failed to update quotation status");
      setShowError(true);
    } finally {
      setUpdatingStatus(false);
    }
  }

  /* -------------------------
   * DOWNLOAD
   * ------------------------- */
  async function downloadQuotation() {
    if (downloading) return; // extra safety
    try {
      setDownloading(true);
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/quotations/${id}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to download quotation");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error("❌ Quotation download failed:", error);
      alert("Failed to download quotation PDF");
    } finally {
      setDownloading(false);
    }
  }

  /* -------------------------
   * CONVERT
   * ------------------------- */
  function convertToSalesOrder() {
    navigate(`/sales-orders/create?quotationId=${id}`);
  }

  if (loading || !quotation) return <Loading />;

  /* -------------------------
   * RENDER
   * ------------------------- */
  return (
    <div style={styles.page}>
      {/* BACK BUTTON */}
      <button
        style={styles.backBtn}
        onClick={() => navigate("/sales/quotations")}
      >
        ← Back to Quotations
      </button>

      {/* HEADER CARD */}
      <div style={styles.headerCard}>
        <div style={styles.headerTop}>
          <div style={styles.headerLeft}>
            <div style={styles.iconBox}>
              <svg
                style={styles.icon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h1 style={styles.title}>
                Quotation #{quotation.quotationNumber}
              </h1>
              <p style={styles.subtitle}>
                Created on{" "}
                {new Date(quotation.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <span style={styles.statusBadge(quotation.status)}>
            {quotation.status}
          </span>
        </div>

        {/* ACTION BUTTONS */}
        <div style={styles.actionBar}>
          <button
            style={{
              ...styles.downloadBtn,
              opacity: downloading ? 0.7 : 1,
              cursor: downloading ? "not-allowed" : "pointer",
            }}
            onClick={downloadQuotation}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <span style={styles.spinner}></span>
                Downloading...
              </>
            ) : (
              <>
                <svg
                  style={styles.btnIcon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download PDF
              </>
            )}
          </button>

          {quotation.status === "Accepted" && (
            <button style={styles.convertBtn} onClick={convertToSalesOrder}>
              Convert to Sales Order →
            </button>
          )}
        </div>
      </div>

      <div style={styles.grid}>
        {/* LEFT COLUMN */}
        <div style={styles.leftColumn}>
          {/* ITEMS CARD */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Quotation Items</h2>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Product</th>
                    <th style={styles.th}>Unit</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Qty</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>
                      Unit Price
                    </th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Base</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Tax</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, idx) => (
                    <tr key={item.id} style={styles.tableRow}>
                      <td style={styles.td}>
                        <div style={styles.productCell}>
                          <div style={styles.productBadge}>{idx + 1}</div>
                          <div>
                            <div style={styles.productName}>
                              {item.productName}
                            </div>

                            {item.unit === "rmt" && item.rmtFactor && (
                              <div style={styles.rmtInfo}>
                                Width:{" "}
                                {Number(item.rmtFactor).toLocaleString("en-IN")}{" "}
                                {item.rmtUnit}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>{item.unit}</td>
                      <td
                        style={{
                          ...styles.td,
                          textAlign: "right",
                          fontWeight: 600,
                        }}
                      >
                        {item.unit === "rmt"
                          ? `${Number(item.quantity).toLocaleString("en-IN")} pcs`
                          : Number(item.quantity).toLocaleString("en-IN")}
                      </td>

                      <td style={{ ...styles.td, textAlign: "right" }}>
                        {item.unit === "rmt" ? (
                          <div style={{ textAlign: "right" }}>
                            <div>
                              ₹{Number(item.unitPrice).toLocaleString("en-IN")}
                            </div>
                            <div style={styles.rmtSubText}>per rmt</div>
                          </div>
                        ) : (
                          <>₹{Number(item.unitPrice).toLocaleString("en-IN")}</>
                        )}
                      </td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        <div>
                          ₹{Number(item.baseAmount).toLocaleString("en-IN")}
                        </div>

                        {item.unit === "rmt" && (
                          <div style={styles.rmtSubText}>
                            {Number(item.unitPrice).toLocaleString("en-IN")} ×{" "}
                            {Number(item.quantity).toLocaleString("en-IN")} ×{" "}
                            {Number(item.rmtFactor).toLocaleString("en-IN")}
                          </div>
                        )}
                      </td>

                      <td style={{ ...styles.td, textAlign: "right" }}>
                        ₹{Number(item.taxAmount).toLocaleString("en-IN")}
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          textAlign: "right",
                          fontWeight: 700,
                        }}
                      >
                        ₹{Number(item.totalAmount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTAL */}
            <div style={styles.totalBar}>
              <span style={styles.totalLabel}>Total Amount</span>
              <span style={styles.totalAmount}>
                ₹{Number(quotation.totalAmount).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* NOTES CARD */}
          {quotation.notes && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Additional Notes</h2>
              <p style={styles.notes}>{quotation.notes}</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={styles.rightColumn}>
          {/* CUSTOMER CARD */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Customer Details</h2>
            </div>

            <div style={styles.customerInfo}>
              <div style={styles.infoRow}>
                <label style={styles.label}>Name</label>
                <p style={styles.value}>{quotation.customerName}</p>
              </div>

              <div style={styles.infoRow}>
                <label style={styles.label}>Mobile</label>
                <p style={styles.value}>{quotation.customerMobile}</p>
              </div>

              <div style={styles.infoRow}>
                <label style={styles.label}>Email</label>
                <p style={styles.value}>{quotation.customerEmail || "—"}</p>
              </div>
            </div>
          </div>

          {/* SUMMARY CARD */}
          <div style={styles.summaryCard}>
            <div style={styles.summaryHeader}>
              <h2 style={styles.summaryTitle}>Summary</h2>
            </div>

            <div style={styles.summaryContent}>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Total Items</span>
                <span style={styles.summaryValue}>
                  {quotation.items.length}
                </span>
              </div>

              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Total Quantity</span>
                <span style={styles.summaryValue}>
                  {quotation.items.reduce(
                    (sum, item) => sum + Number(item.quantity),
                    0,
                  )}
                </span>
              </div>

              <div style={styles.summaryDivider}></div>

              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Grand Total</span>
                <span style={styles.summaryTotal}>
                  ₹{Number(quotation.totalAmount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #e8edf2 100%)",
    padding: "32px",
  },

  backBtn: {
    background: "transparent",
    border: "none",
    color: "#475569",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 24,
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "color 0.2s",
  },

  headerCard: {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    padding: 32,
    marginBottom: 24,
    border: "1px solid #e2e8f0",
  },

  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 16,
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },

  iconBox: {
    width: 56,
    height: 56,
    background: "linear-gradient(135deg, #003176 0%, #0052cc 100%)",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,49,118,0.2)",
  },

  icon: {
    width: 28,
    height: 28,
    color: "#fff",
  },

  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: "#0f172a",
  },

  subtitle: {
    margin: "4px 0 0 0",
    color: "#64748b",
    fontSize: 14,
  },

  statusBadge: (status) => ({
    padding: "8px 20px",
    borderRadius: 24,
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "2px solid",
    background:
      status === "Accepted"
        ? "#dcfce7"
        : status === "Rejected"
          ? "#fee2e2"
          : status === "Sent"
            ? "#dbeafe"
            : status === "Expired"
              ? "#fed7aa"
              : "#f1f5f9",
    color:
      status === "Accepted"
        ? "#166534"
        : status === "Rejected"
          ? "#991b1b"
          : status === "Sent"
            ? "#1e40af"
            : status === "Expired"
              ? "#c2410c"
              : "#475569",
    borderColor:
      status === "Accepted"
        ? "#86efac"
        : status === "Rejected"
          ? "#fca5a5"
          : status === "Sent"
            ? "#93c5fd"
            : status === "Expired"
              ? "#fdba74"
              : "#cbd5e1",
  }),

  actionBar: {
    display: "flex",
    gap: 12,
    paddingTop: 24,
    borderTop: "1px solid #f1f5f9",
    flexWrap: "wrap",
  },

  downloadBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    background: "#fff",
    border: "2px solid #cbd5e1",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  convertBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    background: "linear-gradient(135deg, #003176 0%, #0052cc 100%)",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,49,118,0.3)",
    transition: "all 0.2s",
  },

  btnIcon: {
    width: 18,
    height: 18,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 24,
  },

  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    gridColumn: "1 / -1",
  },

  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },

  card: {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },

  cardHeader: {
    padding: "20px 24px",
    background: "linear-gradient(to right, #f8fafc 0%, #fff 100%)",
    borderBottom: "1px solid #e2e8f0",
  },

  cardTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  tableHeaderRow: {
    background: "#f8fafc",
    borderBottom: "2px solid #e2e8f0",
  },

  th: {
    padding: "16px 24px",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  tableRow: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.2s",
  },

  td: {
    padding: "16px 24px",
    color: "#475569",
    fontSize: 14,
  },

  productCell: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  productBadge: {
    width: 32,
    height: 32,
    background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    color: "#1e40af",
  },

  productName: {
    fontWeight: 600,
    color: "#0f172a",
  },

  totalBar: {
    padding: "20px 24px",
    background: "linear-gradient(to right, #dbeafe 0%, #f1f5f9 100%)",
    borderTop: "2px solid #3b82f6",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: 700,
    color: "#475569",
  },

  totalAmount: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1e40af",
  },

  notes: {
    padding: 24,
    color: "#475569",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    margin: 0,
  },

  customerInfo: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  infoRow: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  label: {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    margin: 0,
  },

  value: {
    fontSize: 16,
    fontWeight: 600,
    color: "#0f172a",
    margin: 0,
  },

  summaryCard: {
    background: "linear-gradient(135deg, #003176 0%, #0052cc 100%)",
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(0,49,118,0.3)",
    overflow: "hidden",
  },

  summaryHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
  },

  summaryTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
  },

  summaryContent: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },

  rmtInfo: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },

  rmtSubText: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },

  spinner: {
    width: 16,
    height: 16,
    border: "2px solid #cbd5e1",
    borderTop: "2px solid #475569",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  summaryValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#fff",
  },

  summaryDivider: {
    height: 1,
    background: "rgba(255,255,255,0.2)",
    margin: "8px 0",
  },

  summaryTotal: {
    fontSize: 24,
    fontWeight: 700,
    color: "#fff",
  },
};

// Media query for larger screens
if (window.innerWidth >= 1024) {
  styles.grid.gridTemplateColumns = "2fr 1fr";
  styles.leftColumn.gridColumn = "1";
  styles.rightColumn.gridColumn = "2";
}

export default ViewQuotation;
