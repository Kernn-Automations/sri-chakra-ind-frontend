import React, { useState } from "react";

const formatINR = (value = 0) =>
  Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const parseINRInput = (value) => {
  if (!value) return "";
  return value.replace(/,/g, "");
};

const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "amount") {
    const rawValue = parseINRInput(value);

    if (rawValue === "" || /^[0-9]*\.?[0-9]*$/.test(rawValue)) {
      setPaymentForm((prev) => ({
        ...prev,
        amount: rawValue,
      }));
    }
    return;
  }

  setPaymentForm((prev) => ({ ...prev, [name]: value }));
};

/* =========================================================
   INLINE STYLES (NO CSS MODULE DEPENDENCY)
   ========================================================= */
const styles = {
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 16,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 20,
  },
  summaryBox: {
    background: "#f8f9fb",
    padding: 12,
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    color: "#666",
  },
  value: {
    fontSize: 16,
    fontWeight: 600,
    marginTop: 4,
  },
  green: { color: "#2e7d32" },
  red: { color: "#c62828" },

  primaryBtn: {
    marginTop: 10,
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    background: "#1976d2",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 500,
  },

  form: {
    marginTop: 20,
    padding: 16,
    border: "1px solid #e0e0e0",
    borderRadius: 10,
    background: "#fafafa",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: 8,
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  textarea: {
    padding: 8,
    borderRadius: 6,
    border: "1px solid #ccc",
    resize: "vertical",
  },
  submitBtn: {
    marginTop: 10,
    padding: "10px",
    borderRadius: 8,
    border: "none",
    background: "#2e7d32",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },

  historyTitle: {
    marginTop: 30,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: 600,
  },
  paymentRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr",
    padding: "10px 0",
    borderBottom: "1px solid #eee",
    alignItems: "center",
  },
  badge: {
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    width: "fit-content",
  },
  approved: { background: "#e8f5e9", color: "#2e7d32" },
  rejected: { background: "#ffebee", color: "#c62828" },
  processing: { background: "#fff8e1", color: "#f9a825" },
  completed: { background: "#e3f2fd", color: "#1565c0" },
};

/* =========================================================
   COMPONENT
   ========================================================= */
const PaymentsSection = ({
  order,
  axiosAPI,
  setError,
  setIsModalOpen,
  onPaymentSubmitted,
}) => {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    transactionDate: new Date().toISOString().split("T")[0],
    paymentMode: "",
    amount: "",
    transactionStatus: "Processing",
    reference: "",
    remark: "",
    paymentProof: null,
  });

  /* ================= CALCULATIONS ================= */

  const totalOrderAmount = Number(order?.grandTotal || 0);

  const paidAmount = (order.paymentRequests || [])
    .filter(
      (p) => p.status === "Approved" || p.transactionStatus === "Completed",
    )
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const pendingAmount = Math.max(totalOrderAmount - paidAmount, 0);

  /* ================= HANDLERS ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) setPaymentForm((p) => ({ ...p, paymentProof: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const fd = new FormData();
      fd.append(
        "payments",
        JSON.stringify([
          {
            transactionDate: paymentForm.transactionDate,
            paymentMode: paymentForm.paymentMode,
            amount: Number(paymentForm.amount),
            transactionStatus:
              paymentForm.paymentMode === "bank"
                ? paymentForm.transactionStatus
                : "Completed",
            transactionReference:
              paymentForm.paymentMode === "bank" ? paymentForm.reference : null,
            transactionRemark: paymentForm.remark,
          },
        ]),
      );

      if (paymentForm.paymentProof) {
        fd.append("paymentProofs[0]", paymentForm.paymentProof);
      }

      const res = await axiosAPI.post(
        `/sales-orders/${order.orderNumber}/payment`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      setShowAddPayment(false);
      onPaymentSubmitted?.(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed");
      setIsModalOpen(true);
    } finally {
      setSubmitLoading(false);
    }
  };

  const badge = (p) => {
    if (p.status === "Approved")
      return (
        <span style={{ ...styles.badge, ...styles.approved }}>Approved</span>
      );
    if (p.status === "Rejected")
      return (
        <span style={{ ...styles.badge, ...styles.rejected }}>Rejected</span>
      );
    if (p.transactionStatus === "Completed")
      return (
        <span style={{ ...styles.badge, ...styles.completed }}>Completed</span>
      );
    return (
      <span style={{ ...styles.badge, ...styles.processing }}>Processing</span>
    );
  };

  /* ================= UI ================= */

  return (
    <div style={styles.card}>
      <h6 style={styles.title}>Payments</h6>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryBox}>
          <div style={styles.label}>Total Order</div>
          <div style={styles.value}>₹{formatINR(totalOrderAmount)}</div>
        </div>
        <div style={styles.summaryBox}>
          <div style={styles.label}>Paid</div>
          <div style={{ ...styles.value, ...styles.green }}>
            ₹{formatINR(paidAmount)}
          </div>
        </div>
        <div style={styles.summaryBox}>
          <div style={styles.label}>Pending</div>
          <div style={{ ...styles.value, ...styles.red }}>
            ₹{formatINR(pendingAmount)}
          </div>
        </div>
      </div>

      {pendingAmount > 0 && (
        <button
          style={styles.primaryBtn}
          onClick={() => setShowAddPayment(!showAddPayment)}
        >
          {showAddPayment ? "Cancel" : "+ Add Payment"}
        </button>
      )}

      {showAddPayment && (
        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label>Date</label>
              <input
                type="date"
                name="transactionDate"
                value={paymentForm.transactionDate}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label>Mode</label>
              <select
                name="paymentMode"
                value={paymentForm.paymentMode}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">Select</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label>Amount</label>
              <input
                type="number"
                name="amount"
                value={paymentForm.amount}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            {paymentForm.paymentMode === "bank" && (
              <div style={styles.field}>
                <label>Status</label>
                <select
                  name="transactionStatus"
                  value={paymentForm.transactionStatus}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            )}
          </div>

          {paymentForm.paymentMode === "bank" && (
            <div style={styles.field}>
              <label>UTR / Reference</label>
              <input
                type="text"
                name="reference"
                value={paymentForm.reference}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.field}>
            <label>Remark</label>
            <textarea
              name="remark"
              value={paymentForm.remark}
              onChange={handleChange}
              style={styles.textarea}
            />
          </div>

          <div style={styles.field}>
            <label>Proof</label>
            <input type="file" onChange={handleFile} />
          </div>

          <button style={styles.submitBtn} disabled={submitLoading}>
            {submitLoading ? "Submitting..." : "Submit Payment"}
          </button>
        </form>
      )}

      <div style={styles.historyTitle}>Payment History</div>

      {(order.paymentRequests || []).map((p) => (
        <div key={p.id} style={styles.paymentRow}>
          <div>
            <strong>₹{formatINR(p.amount)}</strong>
            <div>{p.paymentMode}</div>
          </div>
          {badge(p)}
          <div>{new Date(p.transactionDate).toLocaleDateString("en-IN")}</div>
        </div>
      ))}
    </div>
  );
};

export default PaymentsSection;
