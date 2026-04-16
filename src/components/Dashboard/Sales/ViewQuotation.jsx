import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";

const STATUS_OPTIONS = ["Draft", "Sent", "Accepted", "Rejected", "Cancelled"];
const FOLLOWUP_MODES = ["Call", "WhatsApp", "Visit", "Email", "Dealer Follow-up", "Customer Callback"];

const money = (v) =>
  `Rs. ${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateOnly = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");
const dateTime = (v) => (v ? new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-");
const toLocalInput = (v) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function ViewQuotation() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [busy, setBusy] = useState({ status: false, download: false, convert: false, followup: false, edit: false });
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [followupForm, setFollowupForm] = useState({
    followupDate: toLocalInput(new Date()),
    followupMode: "Call",
    customerRemarks: "",
    internalNote: "",
  });

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        const res = await axiosAPI.get(`/quotations/${id}`);
        const fetchedQuotation = res.data?.quotation;
        setQuotation(fetchedQuotation);
        setEditMode(new URLSearchParams(location.search).get("edit") === "true");
        setEditForm({
          validTill: fetchedQuotation?.validTill ? new Date(fetchedQuotation.validTill).toISOString().slice(0, 10) : "",
          notes: fetchedQuotation?.notes || "",
          customerName: fetchedQuotation?.customerName || "",
          customerMobile: fetchedQuotation?.customerMobile || "",
          customerEmail: fetchedQuotation?.customerEmail || "",
          prospectCompany: fetchedQuotation?.prospectCompany || "",
          items: (fetchedQuotation?.items || []).map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            unit: item.unit,
            quantity: String(item.quantity || 0),
            unitPrice: String(item.unitPrice || 0),
            rmtFactor: item.rmtFactor ? String(item.rmtFactor) : "",
            rmtUnit: item.rmtUnit || "mm",
            priceOverrideReason: item.priceOverrideReason || "",
          })),
        });
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load quotation");
        setShowError(true);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [axiosAPI, id, location.search]);

  const followups = useMemo(
    () => [...(quotation?.followUpHistory || [])].sort((a, b) => new Date(b.followupDate) - new Date(a.followupDate)),
    [quotation],
  );

  const setBusyFlag = (key, value) => setBusy((prev) => ({ ...prev, [key]: value }));

  async function updateStatus(status) {
    try {
      setBusyFlag("status", true);
      const res = await axiosAPI.patch(`/quotations/${id}/status`, { status });
      setQuotation(res.data?.quotation);
      alert(`Quotation moved to ${status}.`);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update quotation status");
      setShowError(true);
    } finally {
      setBusyFlag("status", false);
    }
  }

  async function addFollowup() {
    if (!followupForm.internalNote.trim()) {
      setError("Internal note is required before saving a follow-up.");
      setShowError(true);
      return;
    }
    try {
      setBusyFlag("followup", true);
      const res = await axiosAPI.post(`/quotations/${id}/followups`, followupForm);
      setQuotation(res.data?.quotation);
      setFollowupForm({
        followupDate: toLocalInput(new Date()),
        followupMode: "Call",
        customerRemarks: "",
        internalNote: "",
      });
      alert("Follow-up added successfully.");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to add quotation follow-up");
      setShowError(true);
    } finally {
      setBusyFlag("followup", false);
    }
  }

  async function downloadQuotation() {
    try {
      setBusyFlag("download", true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/quotations/${id}/download`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Failed to download quotation PDF");
      setShowError(true);
    } finally {
      setBusyFlag("download", false);
    }
  }

  async function convertToSalesOrder() {
    try {
      setBusyFlag("convert", true);
      const res = await axiosAPI.post(`/quotations/${id}/convert`);
      const orderNumber = res.data?.salesOrder?.orderNumber;
      const createdFromQuotation = res.data?.customer?.createdFromQuotation;
      const profileNeedsCompletion = res.data?.customer?.profileNeedsCompletion;
      const parts = [
        orderNumber ? `Quotation converted to sales order ${orderNumber}.` : "Quotation converted to sales order.",
      ];
      if (createdFromQuotation) parts.push("A new customer was created from the quotation data.");
      if (profileNeedsCompletion) parts.push("Complete GSTIN, address, and state details before invoicing.");
      alert(parts.join(" "));
      navigate("/sales/orders");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to convert quotation");
      setShowError(true);
    } finally {
      setBusyFlag("convert", false);
    }
  }

  async function saveQuotationEdits() {
    if (!editForm) return;
    if (!editForm.items.length) {
      setError("At least one quotation item is required.");
      setShowError(true);
      return;
    }

    try {
      setBusyFlag("edit", true);
      const payload = {
        customerId: quotation.customerId || null,
        prospect: quotation.customerId
          ? null
          : {
              name: editForm.customerName,
              mobile: editForm.customerMobile,
              email: editForm.customerEmail,
              company: editForm.prospectCompany,
            },
        validTill: editForm.validTill || null,
        notes: editForm.notes,
        items: editForm.items.map((item) => ({
          productId: item.productId,
          unit: item.unit,
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
          rmtFactor: item.unit === "rmt" ? Number(item.rmtFactor || 0) : null,
          rmtUnit: item.unit === "rmt" ? item.rmtUnit : null,
          priceOverrideReason: item.priceOverrideReason || null,
        })),
      };

      const res = await axiosAPI.put(`/quotations/${id}`, payload);
      setQuotation(res.data?.quotation);
      setEditMode(false);
      alert("Quotation updated successfully.");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update quotation");
      setShowError(true);
    } finally {
      setBusyFlag("edit", false);
    }
  }

  if (loading || !quotation) return <Loading />;

  const locked = quotation.status === "Converted";
  const totalQty = quotation.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate("/sales/quotations")}>Back to Quotations</button>

      <section style={styles.hero}>
        <div style={styles.rowBetween}>
          <div>
            <h1 style={styles.title}>Quotation {quotation.quotationNumber}</h1>
            <p style={styles.subtle}>Created on {dateOnly(quotation.createdAt)}</p>
          </div>
          <span style={styles.badge(quotation.status)}>{quotation.status}</span>
        </div>
        <div style={styles.infoBox}>
          <strong>Workflow:</strong> move quotation through status, add follow-up notes after each call or visit, then convert it to sales order. If this is a new customer, the system creates one from the quotation data and the team can finish invoice-required details before billing.
        </div>
        <div style={styles.buttonRow}>
          <button style={styles.secondaryBtn} onClick={downloadQuotation} disabled={busy.download}>{busy.download ? "Downloading..." : "Download PDF"}</button>
          {!locked ? <button style={styles.secondaryBtn} onClick={() => setEditMode((prev) => !prev)}>{editMode ? "Close Edit" : "Edit Quotation"}</button> : null}
          {!locked ? <button style={styles.primaryBtn} onClick={convertToSalesOrder} disabled={busy.convert}>{busy.convert ? "Converting..." : "Convert To Sales Order"}</button> : null}
        </div>
        <div style={styles.chipRow}>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              style={styles.statusChip(quotation.status === status)}
              onClick={() => updateStatus(status)}
              disabled={locked || busy.status || quotation.status === status}
            >
              {status}
            </button>
          ))}
        </div>
      </section>

      <div style={styles.grid}>
        <div style={styles.col}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Quotation Items</h2>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Product</th>
                    <th style={styles.th}>Unit</th>
                    <th style={styles.thRight}>Qty</th>
                    <th style={styles.thRight}>Unit Price</th>
                    <th style={styles.thRight}>Base</th>
                    <th style={styles.thRight}>Tax</th>
                    <th style={styles.thRight}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr key={item.id}>
                      <td style={styles.td}>
                        <div style={styles.productName}>{index + 1}. {item.productName}</div>
                        <div style={styles.meta}>{item.productSKU || "No SKU"}{item.priceOverrideReason ? ` | ${item.priceOverrideReason}` : ""}</div>
                      </td>
                      <td style={styles.td}>{item.unit}</td>
                      <td style={styles.tdRight}>{Number(item.quantity || 0).toLocaleString("en-IN")}</td>
                      <td style={styles.tdRight}>{money(item.unitPrice)}</td>
                      <td style={styles.tdRight}>{money(item.baseAmount)}</td>
                      <td style={styles.tdRight}>{money(item.taxAmount)}</td>
                      <td style={styles.tdRightStrong}>{money(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={styles.totalBar}>
              <span>Total Amount</span>
              <strong>{money(quotation.totalAmount)}</strong>
            </div>
          </section>

          {editMode && editForm ? (
            <section style={styles.card}>
              <h2 style={styles.cardTitle}>Edit Quotation</h2>
              <p style={styles.subtle}>Update validity, notes, and negotiated item values. Every save is stored in edit history.</p>
              <div style={styles.formGrid}>
                {!quotation.customerId ? (
                  <>
                    <label style={styles.label}>Customer Name<input style={styles.input} value={editForm.customerName} onChange={(e) => setEditForm((prev) => ({ ...prev, customerName: e.target.value }))} /></label>
                    <label style={styles.label}>Mobile<input style={styles.input} value={editForm.customerMobile} onChange={(e) => setEditForm((prev) => ({ ...prev, customerMobile: e.target.value }))} /></label>
                    <label style={styles.label}>Email<input style={styles.input} value={editForm.customerEmail} onChange={(e) => setEditForm((prev) => ({ ...prev, customerEmail: e.target.value }))} /></label>
                    <label style={styles.label}>Company / Firm<input style={styles.input} value={editForm.prospectCompany} onChange={(e) => setEditForm((prev) => ({ ...prev, prospectCompany: e.target.value }))} /></label>
                  </>
                ) : null}
                <label style={styles.label}>Valid Till<input type="date" style={styles.input} value={editForm.validTill} onChange={(e) => setEditForm((prev) => ({ ...prev, validTill: e.target.value }))} /></label>
                <label style={styles.labelWide}>Notes<textarea rows={3} style={styles.textarea} value={editForm.notes} onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))} /></label>
              </div>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Product</th>
                      <th style={styles.th}>Unit</th>
                      <th style={styles.thRight}>Qty</th>
                      <th style={styles.thRight}>Unit Price</th>
                      <th style={styles.th}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editForm.items.map((item, index) => (
                      <tr key={item.id || `${item.productId}-${index}`}>
                        <td style={styles.td}>{item.productName}</td>
                        <td style={styles.td}>{item.unit}</td>
                        <td style={styles.tdRight}><input style={styles.inlineInput} value={item.quantity} onChange={(e) => setEditForm((prev) => ({ ...prev, items: prev.items.map((row, idx) => idx === index ? { ...row, quantity: e.target.value } : row) }))} /></td>
                        <td style={styles.tdRight}><input style={styles.inlineInput} value={item.unitPrice} onChange={(e) => setEditForm((prev) => ({ ...prev, items: prev.items.map((row, idx) => idx === index ? { ...row, unitPrice: e.target.value } : row) }))} /></td>
                        <td style={styles.td}><input style={styles.inlineInputLeft} value={item.priceOverrideReason} placeholder="Optional negotiation note" onChange={(e) => setEditForm((prev) => ({ ...prev, items: prev.items.map((row, idx) => idx === index ? { ...row, priceOverrideReason: e.target.value } : row) }))} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={styles.buttonRowEnd}>
                <button style={styles.secondaryBtn} onClick={() => setEditMode(false)}>Cancel</button>
                <button style={styles.primaryBtn} onClick={saveQuotationEdits} disabled={busy.edit}>{busy.edit ? "Saving Changes..." : "Save Changes"}</button>
              </div>
            </section>
          ) : null}

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Follow-Up History</h2>
            <p style={styles.subtle}>Capture every follow-up date, mode, internal note, and customer remark.</p>
            <div style={styles.formGrid}>
              <label style={styles.label}>Follow-Up Date And Time<input type="datetime-local" style={styles.input} value={followupForm.followupDate} onChange={(e) => setFollowupForm((p) => ({ ...p, followupDate: e.target.value }))} /></label>
              <label style={styles.label}>Follow-Up Mode<select style={styles.input} value={followupForm.followupMode} onChange={(e) => setFollowupForm((p) => ({ ...p, followupMode: e.target.value }))}>{FOLLOWUP_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}</select></label>
              <label style={styles.labelWide}>Internal Note<textarea rows={3} style={styles.textarea} value={followupForm.internalNote} onChange={(e) => setFollowupForm((p) => ({ ...p, internalNote: e.target.value }))} /></label>
              <label style={styles.labelWide}>Customer Remarks<textarea rows={3} style={styles.textarea} value={followupForm.customerRemarks} onChange={(e) => setFollowupForm((p) => ({ ...p, customerRemarks: e.target.value }))} /></label>
            </div>
            <div style={styles.buttonRowEnd}>
              <button style={styles.primaryBtn} onClick={addFollowup} disabled={busy.followup}>{busy.followup ? "Saving Follow-Up..." : "Add Follow-Up"}</button>
            </div>
            <div style={styles.timeline}>
              {followups.length ? followups.map((entry) => (
                <div key={entry.id} style={styles.timelineItem}>
                  <div style={styles.timelineTop}>
                    <strong>{entry.followupMode}</strong>
                    <span style={styles.meta}>{dateTime(entry.followupDate)}</span>
                  </div>
                  <div style={styles.timelineText}>{entry.internalNote}</div>
                  {entry.customerRemarks ? <div style={styles.meta}>Customer: {entry.customerRemarks}</div> : null}
                  <div style={styles.meta}>Added by {entry.createdBy?.name || "Unknown User"} on {dateTime(entry.createdAt)}</div>
                </div>
              )) : <div style={styles.emptyBox}>No follow-ups recorded yet.</div>}
            </div>
          </section>

          {quotation.notes ? <section style={styles.card}><h2 style={styles.cardTitle}>Additional Notes</h2><p style={styles.notes}>{quotation.notes}</p></section> : null}

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Edit History</h2>
            <div style={styles.timeline}>
              {(quotation.editHistory || []).length ? (
                [...(quotation.editHistory || [])].reverse().map((entry) => (
                  <div key={entry.id} style={styles.timelineItem}>
                    <div style={styles.timelineTop}>
                      <strong>{String(entry.action || "quotation_updated").replaceAll("_", " ")}</strong>
                      <span style={styles.meta}>{dateTime(entry.changedAt)}</span>
                    </div>
                    {entry.note ? <div style={styles.timelineText}>{entry.note}</div> : null}
                    {entry.after?.status ? <div style={styles.meta}>New status: {entry.after.status}</div> : null}
                    {entry.after?.internalNote ? <div style={styles.meta}>Follow-up: {entry.after.internalNote}</div> : null}
                    <div style={styles.meta}>Updated by {entry.changedBy?.name || "Unknown User"}</div>
                  </div>
                ))
              ) : (
                <div style={styles.emptyBox}>No quotation edits recorded yet.</div>
              )}
            </div>
          </section>
        </div>

        <div style={styles.sideCol}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Customer Details</h2>
            <div style={styles.infoList}>
              <div><span style={styles.infoLabel}>Customer Name</span><div style={styles.infoValue}>{quotation.customerName || "-"}</div></div>
              <div><span style={styles.infoLabel}>Company / Firm</span><div style={styles.infoValue}>{quotation.prospectCompany || "-"}</div></div>
              <div><span style={styles.infoLabel}>Mobile</span><div style={styles.infoValue}>{quotation.customerMobile || "-"}</div></div>
              <div><span style={styles.infoLabel}>Email</span><div style={styles.infoValue}>{quotation.customerEmail || "-"}</div></div>
              <div><span style={styles.infoLabel}>Valid Till</span><div style={styles.infoValue}>{dateOnly(quotation.validTill)}</div></div>
            </div>
          </section>

          <section style={styles.summaryCard}>
            <h2 style={{ ...styles.cardTitle, color: "#fff" }}>Summary</h2>
            <div style={styles.summaryRow}><span>Total Items</span><strong>{quotation.items.length}</strong></div>
            <div style={styles.summaryRow}><span>Total Quantity</span><strong>{Number(totalQty).toLocaleString("en-IN")}</strong></div>
            <div style={styles.summaryRow}><span>Tax Amount</span><strong>{money(quotation.taxAmount)}</strong></div>
            <div style={styles.summaryDivider} />
            <div style={styles.summaryRow}><span>Grand Total</span><strong style={styles.grandTotal}>{money(quotation.totalAmount)}</strong></div>
            {quotation.convertedSalesOrderId ? (
              <div style={styles.summaryNote}>Linked Sales Order #{quotation.convertedSalesOrderId}</div>
            ) : (
              <div style={styles.summaryNote}>After conversion, complete GSTIN, address, and state in the sales workflow before invoicing.</div>
            )}
          </section>
        </div>
      </div>

      {showError ? <ErrorModal isOpen message={error} onClose={() => setShowError(false)} /> : null}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", padding: 32, background: "linear-gradient(180deg, #f7f9fc 0%, #eef4ff 100%)" },
  backBtn: { marginBottom: 20, border: "none", background: "transparent", color: "#334155", fontWeight: 700, cursor: "pointer" },
  hero: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24, boxShadow: "0 12px 30px rgba(15,23,42,0.06)", marginBottom: 24 },
  rowBetween: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 30, color: "#0f172a" },
  subtle: { margin: "6px 0 0 0", fontSize: 14, color: "#64748b", lineHeight: 1.5 },
  badge: (status) => ({ padding: "10px 16px", borderRadius: 999, fontSize: 12, fontWeight: 800, textTransform: "uppercase", background: status === "Accepted" ? "#dcfce7" : status === "Rejected" ? "#fee2e2" : status === "Sent" ? "#dbeafe" : status === "Converted" ? "#d1fae5" : "#f8fafc", color: status === "Accepted" ? "#166534" : status === "Rejected" ? "#991b1b" : status === "Sent" ? "#1d4ed8" : status === "Converted" ? "#047857" : "#475569", border: "1px solid #cbd5e1" }),
  infoBox: { marginTop: 18, padding: 16, borderRadius: 14, background: "linear-gradient(135deg, #fff7ed 0%, #eff6ff 100%)", border: "1px solid #fde68a", color: "#475569", lineHeight: 1.6, fontSize: 14 },
  buttonRow: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 },
  buttonRowEnd: { display: "flex", justifyContent: "flex-end", marginTop: 16 },
  primaryBtn: { border: "none", borderRadius: 12, padding: "12px 18px", background: "linear-gradient(135deg, #f97316 0%, #2563eb 100%)", color: "#fff", fontWeight: 700, cursor: "pointer" },
  secondaryBtn: { border: "1px solid #cbd5e1", borderRadius: 12, padding: "12px 18px", background: "#fff", color: "#334155", fontWeight: 700, cursor: "pointer" },
  chipRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18, paddingTop: 18, borderTop: "1px solid #e2e8f0" },
  statusChip: (active) => ({ borderRadius: 999, padding: "10px 14px", border: `1px solid ${active ? "#2563eb" : "#cbd5e1"}`, background: active ? "#eff6ff" : "#fff", color: active ? "#1d4ed8" : "#475569", fontWeight: 700, cursor: "pointer" }),
  grid: { display: "grid", gridTemplateColumns: "minmax(0, 1.9fr) minmax(320px, 1fr)", gap: 24 },
  col: { display: "flex", flexDirection: "column", gap: 24 },
  sideCol: { display: "flex", flexDirection: "column", gap: 24 },
  card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24, boxShadow: "0 12px 28px rgba(15,23,42,0.05)" },
  cardTitle: { margin: 0, fontSize: 20, color: "#0f172a" },
  tableWrap: { overflowX: "auto", marginTop: 16 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 12, textTransform: "uppercase", color: "#64748b", padding: "12px 10px", borderBottom: "1px solid #e2e8f0" },
  thRight: { textAlign: "right", fontSize: 12, textTransform: "uppercase", color: "#64748b", padding: "12px 10px", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "14px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 14, color: "#334155", verticalAlign: "top" },
  tdRight: { padding: "14px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 14, color: "#334155", textAlign: "right" },
  tdRightStrong: { padding: "14px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 14, color: "#0f172a", textAlign: "right", fontWeight: 700 },
  productName: { fontWeight: 700, color: "#0f172a" },
  meta: { marginTop: 4, fontSize: 12, color: "#64748b", lineHeight: 1.5 },
  totalBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0", fontSize: 18, color: "#0f172a" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, marginTop: 16 },
  label: { display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "#64748b", fontWeight: 800, textTransform: "uppercase" },
  labelWide: { display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "#64748b", fontWeight: 800, textTransform: "uppercase", gridColumn: "1 / -1" },
  input: { minHeight: 46, borderRadius: 12, border: "1px solid #cbd5e1", padding: "0 12px", fontSize: 14, color: "#0f172a", background: "#fff" },
  inlineInput: { minHeight: 40, width: 110, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 10px", fontSize: 14, color: "#0f172a", background: "#fff", textAlign: "right" },
  inlineInputLeft: { minHeight: 40, width: "100%", borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 10px", fontSize: 14, color: "#0f172a", background: "#fff", textAlign: "left" },
  textarea: { borderRadius: 12, border: "1px solid #cbd5e1", padding: 12, fontSize: 14, color: "#0f172a", fontFamily: "inherit", resize: "vertical" },
  timeline: { display: "flex", flexDirection: "column", gap: 14, marginTop: 18 },
  timelineItem: { border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, background: "#fbfdff" },
  timelineTop: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  timelineText: { marginTop: 10, color: "#1e293b", lineHeight: 1.6 },
  emptyBox: { border: "1px dashed #cbd5e1", borderRadius: 14, padding: 16, color: "#64748b", background: "#f8fafc" },
  notes: { margin: "16px 0 0 0", whiteSpace: "pre-wrap", color: "#334155", lineHeight: 1.7 },
  infoList: { display: "flex", flexDirection: "column", gap: 18, marginTop: 16 },
  infoLabel: { display: "block", fontSize: 12, textTransform: "uppercase", color: "#64748b", fontWeight: 800, marginBottom: 6 },
  infoValue: { fontSize: 15, fontWeight: 700, color: "#0f172a" },
  summaryCard: { background: "linear-gradient(135deg, #0f2f6b 0%, #0f7ca8 100%)", color: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 18px 40px rgba(15,47,107,0.28)" },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 },
  summaryDivider: { height: 1, background: "rgba(255,255,255,0.18)", marginTop: 16 },
  grandTotal: { fontSize: 24, color: "#fff7ed" },
  summaryNote: { marginTop: 18, border: "1px solid rgba(255,255,255,0.18)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,0.12)", lineHeight: 1.6, fontSize: 13 },
};

export default ViewQuotation;
