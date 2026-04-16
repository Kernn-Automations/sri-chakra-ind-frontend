import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/Auth";
import { GST_STATES } from "@/constants/gstStates";

const styles = {
  page: {
    minHeight: "100vh",
    padding: "28px",
    background:
      "radial-gradient(circle at top left, #fff4e8 0%, #edf6ff 38%, #f7faff 100%)",
  },
  card: {
    background: "rgba(255,255,255,0.97)",
    border: "1px solid #dbe7f5",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.07)",
    marginBottom: "18px",
  },
  title: { margin: 0, fontSize: "34px", lineHeight: 1.05, fontWeight: 800, color: "#0f172a" },
  subtitle: { margin: "10px 0 0", fontSize: "14px", color: "#4b5563", lineHeight: 1.7 },
  sectionTitle: { margin: 0, fontSize: "24px", fontWeight: 800, color: "#0f172a" },
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginTop: "18px",
  },
  wideRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: "16px",
  },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: {
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    color: "#475569",
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },
  textarea: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
    minHeight: "110px",
    background: "#fff",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginTop: "18px",
  },
  statCard: {
    borderRadius: "20px",
    padding: "16px",
    background: "linear-gradient(135deg, #fffaf2, #eff6ff)",
    border: "1px solid #dbe7f5",
  },
  statLabel: { fontSize: "12px", color: "#64748b", marginBottom: "6px", fontWeight: 700 },
  statValue: { fontSize: "24px", fontWeight: 800, color: "#0f172a" },
  helper: { fontSize: "12px", color: "#64748b", lineHeight: 1.6, marginTop: "6px" },
  badgeRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "8px 12px",
    background: "#e8f3ff",
    color: "#0f4c81",
    fontSize: "12px",
    fontWeight: 800,
  },
  warningBadge: {
    background: "#fff1f2",
    color: "#b42318",
  },
  successBadge: {
    background: "#ecfdf3",
    color: "#027a48",
  },
  notePanel: {
    borderRadius: "20px",
    border: "1px solid #dbe7f5",
    background: "linear-gradient(135deg, #f8fbff, #fff9f4)",
    padding: "18px",
  },
  noteTitle: { fontSize: "14px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" },
  noteText: { fontSize: "13px", lineHeight: 1.7, color: "#475569" },
  tableWrap: { overflowX: "auto", marginTop: "16px" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#eef6ff",
    color: "#334155",
    fontWeight: 800,
    borderBottom: "1px solid #dbe7f5",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #edf2f7",
    color: "#0f172a",
    verticalAlign: "top",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "22px",
  },
  button: {
    border: "none",
    borderRadius: "16px",
    padding: "14px 22px",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#fff",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #f97316, #2563eb)",
    color: "#fff",
  },
  summaryCard: {
    borderRadius: "20px",
    padding: "18px",
    border: "1px solid #dbe7f5",
    background: "#fff",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #edf2f7",
    fontSize: "14px",
    color: "#0f172a",
  },
};

const emptyParty = {
  name: "",
  contactPerson: "",
  mobile: "",
  gstin: "",
  addressLine1: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
};

const parsePositiveInteger = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const formatDocumentLabel = (value = "") =>
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const DOCUMENT_OPTIONS = [
  { value: "tax_invoice", label: "Tax Invoice" },
  { value: "bill_of_supply", label: "Bill Of Supply" },
  { value: "proforma_invoice", label: "Proforma Invoice" },
  { value: "delivery_challan", label: "Delivery Challan" },
];

const DOCUMENT_RULES = {
  tax_invoice: {
    invoiceType: "tax_invoice",
    taxApplicable: true,
    requiresBuyerGstin: false,
    requiresDispatch: true,
    requiresTransport: true,
    requiresCompliance: false,
  },
  e_invoice: {
    invoiceType: "tax_invoice",
    taxApplicable: true,
    requiresBuyerGstin: true,
    requiresDispatch: true,
    requiresTransport: true,
    requiresCompliance: true,
  },
  bill_of_supply: {
    invoiceType: "bill_of_supply",
    taxApplicable: false,
    requiresBuyerGstin: false,
    requiresDispatch: false,
    requiresTransport: false,
    requiresCompliance: false,
  },
  proforma_invoice: {
    invoiceType: "tax_invoice",
    taxApplicable: true,
    requiresBuyerGstin: false,
    requiresDispatch: false,
    requiresTransport: false,
    requiresCompliance: false,
  },
  delivery_challan: {
    invoiceType: "tax_invoice",
    taxApplicable: false,
    requiresBuyerGstin: false,
    requiresDispatch: true,
    requiresTransport: true,
    requiresCompliance: false,
  },
};

function CreateBillingInvoice({ navigate }) {
  const { axiosAPI } = useAuth();
  const storedDivisionId = localStorage.getItem("currentDivisionId");
  const selectedDivisionId = parsePositiveInteger(storedDivisionId);

  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [draftMeta, setDraftMeta] = useState(null);
  const [form, setForm] = useState({
    salesOrderId: "",
    billingProfileId: "",
    invoiceType: "tax_invoice",
    documentType: "tax_invoice",
    invoiceDate: new Date().toISOString().slice(0, 10),
    placeOfSupply: "",
    buyer: { ...emptyParty },
    consignee: { ...emptyParty },
    dispatch: {
      dispatchFrom: "",
      dispatchTo: "",
      supplyType: "B2B",
      gatePassNo: "",
      contractNo: "",
      removalTime: "",
      driverName: "",
      dispatchReference: "",
    },
    transportDetails: {
      mode: "Road",
      vehicleNumber: "",
      lrNumber: "",
      lrDate: "",
      transporterName: "",
      transporterId: "",
      eWayBillNumber: "",
      eWayBillDate: "",
    },
    chargesSummary: {
      freightAmount: 0,
      loadingAmount: 0,
      otherAmount: 0,
      discountAmount: 0,
      rebateAmount: 0,
      grossWeight: 0,
      tareWeight: 0,
      netWeight: 0,
    },
    complianceDetails: {
      irnNumber: "",
      ackNumber: "",
      ackDate: "",
      reverseChargeApplicable: false,
    },
    documentStatus: "Draft",
    notesFooter: "",
    internalRemarks: "",
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const divisionParam =
          selectedDivisionId && selectedDivisionId !== 1
            ? `?divisionId=${selectedDivisionId}`
            : "";
        const res = await axiosAPI.get(`/invoice/billing/bootstrap${divisionParam}`);
        setProfiles(res.data?.profiles || []);
        setSalesOrders(res.data?.salesOrders || []);
      } catch (error) {
        alert(error?.response?.data?.message || "Failed to load billing invoice setup");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [axiosAPI, selectedDivisionId]);

  const selectedOrder = useMemo(
    () => salesOrders.find((order) => String(order.id) === String(form.salesOrderId)),
    [salesOrders, form.salesOrderId],
  );

  const selectedProfile = useMemo(
    () => profiles.find((profile) => String(profile.id) === String(form.billingProfileId)),
    [profiles, form.billingProfileId],
  );

  const existingDocuments = useMemo(
    () =>
      (selectedOrder?.invoices || []).map(
        (invoice) => invoice.documentDetail?.documentType || invoice.type,
      ),
    [selectedOrder],
  );

  const availableDocumentOptions = useMemo(() => {
    const blocked = new Set(selectedOrder?.blockedDocumentTypes || existingDocuments);
    return DOCUMENT_OPTIONS.filter((option) => !blocked.has(option.value));
  }, [existingDocuments, selectedOrder?.blockedDocumentTypes]);

  const activeDocumentRule = useMemo(
    () => DOCUMENT_RULES[form.documentType] || DOCUMENT_RULES.tax_invoice,
    [form.documentType],
  );

  useEffect(() => {
    if (!availableDocumentOptions.length) return;
    const isCurrentStillAllowed = availableDocumentOptions.some(
      (option) => option.value === form.documentType,
    );
    if (isCurrentStillAllowed) return;

    const preferredDefault =
      selectedProfile?.defaultDocumentType &&
      availableDocumentOptions.some(
        (option) => option.value === selectedProfile.defaultDocumentType,
      )
        ? selectedProfile.defaultDocumentType
        : availableDocumentOptions[0].value;

    setForm((prev) => ({
      ...prev,
      documentType: preferredDefault,
      invoiceType: (DOCUMENT_RULES[preferredDefault] || DOCUMENT_RULES.tax_invoice).invoiceType,
    }));
  }, [availableDocumentOptions, form.documentType, selectedProfile?.defaultDocumentType]);

  useEffect(() => {
    if (!selectedOrder) return;
    const buyer = {
      name: selectedOrder.customer?.firmName || selectedOrder.customer?.name || "",
      contactPerson: selectedOrder.customer?.name || "",
      mobile: selectedOrder.customer?.mobile || "",
      gstin: selectedOrder.customer?.gstin || "",
      addressLine1: "",
      city: selectedOrder.customer?.city || "",
      district: selectedOrder.customer?.district || "",
      state: selectedOrder.customer?.state || "",
      pincode: selectedOrder.customer?.pincode || "",
    };

    setForm((prev) => ({
      ...prev,
      buyer,
      consignee: {
        ...buyer,
        name: prev.consignee.name || buyer.name,
        contactPerson: prev.consignee.contactPerson || buyer.contactPerson,
      },
      placeOfSupply: buyer.state || prev.placeOfSupply || "",
      dispatch: {
        ...prev.dispatch,
        dispatchFrom: selectedOrder.warehouse?.name || prev.dispatch.dispatchFrom || "",
        dispatchTo: buyer.city || prev.dispatch.dispatchTo || "",
      },
      transportDetails: {
        ...prev.transportDetails,
        vehicleNumber: prev.transportDetails.vehicleNumber || selectedOrder.truckNumber || "",
      },
    }));
  }, [selectedOrder]);

  useEffect(() => {
    if (!selectedProfile) return;
    setForm((prev) => ({
      ...prev,
      dispatch: {
        ...prev.dispatch,
        supplyType: prev.dispatch.supplyType || selectedProfile.defaultSupplyType || "B2B",
      },
      transportDetails: {
        ...prev.transportDetails,
        mode: prev.transportDetails.mode || selectedProfile.defaultTransportMode || "Road",
      },
      notesFooter: prev.notesFooter || selectedProfile.notesFooter || "",
    }));
  }, [selectedProfile]);

  useEffect(() => {
    const salesOrderId = parsePositiveInteger(form.salesOrderId);
    const billingProfileId = parsePositiveInteger(form.billingProfileId);

    if (!salesOrderId || !billingProfileId || !form.documentType) {
      setDraftMeta(null);
      return;
    }

    let ignore = false;

    async function loadDraft() {
      try {
        setDraftLoading(true);
        const params = new URLSearchParams({
          salesOrderId: String(salesOrderId),
          billingProfileId: String(billingProfileId),
          documentType: form.documentType,
          invoiceDate: form.invoiceDate,
          placeOfSupply: form.placeOfSupply,
          buyerState: form.buyer.state,
          buyerGstin: form.buyer.gstin,
        });
        const res = await axiosAPI.get(`/invoice/billing/draft?${params.toString()}`);
        if (ignore) return;

        const draft = res.data?.draft;
        setDraftMeta(draft || null);
        if (!draft) return;

        setForm((prev) => ({
          ...prev,
          invoiceType:
            draft.taxRuleMeta?.recommendedInvoiceType || activeDocumentRule.invoiceType,
          placeOfSupply: draft.placeOfSupply || prev.placeOfSupply || "",
          buyer: {
            ...prev.buyer,
            name: draft.buyer?.name || prev.buyer.name || "",
            contactPerson: draft.buyer?.contactPerson || prev.buyer.contactPerson || "",
            mobile: draft.buyer?.mobile || prev.buyer.mobile || "",
            gstin: draft.buyer?.gstin || prev.buyer.gstin || "",
            city: draft.buyer?.address?.city || prev.buyer.city || "",
            district: draft.buyer?.address?.district || prev.buyer.district || "",
            state: draft.buyer?.address?.state || prev.buyer.state || "",
            pincode: draft.buyer?.address?.pincode || prev.buyer.pincode || "",
          },
          consignee: {
            ...prev.consignee,
            name: draft.consignee?.name || prev.consignee.name || "",
            contactPerson:
              draft.consignee?.contactPerson || prev.consignee.contactPerson || "",
            mobile: draft.consignee?.mobile || prev.consignee.mobile || "",
            gstin: draft.consignee?.gstin || prev.consignee.gstin || "",
            city: draft.consignee?.address?.city || prev.consignee.city || "",
            district: draft.consignee?.address?.district || prev.consignee.district || "",
            state: draft.consignee?.address?.state || prev.consignee.state || "",
            pincode: draft.consignee?.address?.pincode || prev.consignee.pincode || "",
          },
          dispatch: {
            ...prev.dispatch,
            dispatchFrom: draft.dispatchFrom || prev.dispatch.dispatchFrom || "",
            dispatchTo: draft.dispatchTo || prev.dispatch.dispatchTo || "",
            supplyType: draft.supplyType || prev.dispatch.supplyType || "B2B",
            gatePassNo: draft.gatePassNo || prev.dispatch.gatePassNo || "",
            contractNo: draft.contractNo || prev.dispatch.contractNo || "",
            removalTime: prev.dispatch.removalTime || draft.removalTime || "",
            dispatchReference:
              draft.dispatchReference || prev.dispatch.dispatchReference || "",
          },
          transportDetails: {
            ...prev.transportDetails,
            mode: draft.transportMode || prev.transportDetails.mode || "Road",
          },
          chargesSummary: {
            ...prev.chargesSummary,
            grossWeight:
              prev.chargesSummary.grossWeight ||
              Number(draft.taxSummary?.totalWeight || 0),
            netWeight:
              prev.chargesSummary.netWeight ||
              Number(draft.taxSummary?.totalWeight || 0),
          },
          complianceDetails: {
            ...prev.complianceDetails,
            reverseChargeApplicable:
              draft.taxRuleMeta?.documentType === "bill_of_supply"
                ? false
                : prev.complianceDetails.reverseChargeApplicable,
          },
        }));
      } catch (error) {
        if (!ignore) setDraftMeta(null);
      } finally {
        if (!ignore) setDraftLoading(false);
      }
    }

    loadDraft();
    return () => {
      ignore = true;
    };
  }, [
    axiosAPI,
    activeDocumentRule.invoiceType,
    form.billingProfileId,
    form.documentType,
    form.invoiceDate,
    form.placeOfSupply,
    form.salesOrderId,
    form.buyer.gstin,
    form.buyer.state,
  ]);

  useEffect(() => {
    const gross = Number(form.chargesSummary.grossWeight || 0);
    const tare = Number(form.chargesSummary.tareWeight || 0);
    const autoNet = Math.max(gross - tare, 0);
    setForm((prev) => {
      const currentNet = Number(prev.chargesSummary.netWeight || 0);
      if (Math.abs(currentNet - autoNet) < 0.001) return prev;
      return {
        ...prev,
        chargesSummary: {
          ...prev.chargesSummary,
          netWeight: Number(autoNet.toFixed(3)),
        },
      };
    });
  }, [form.chargesSummary.grossWeight, form.chargesSummary.tareWeight]);

  const formattedRemovalTime = useMemo(() => {
    if (!form.dispatch.removalTime?.includes(":")) return "";
    const [rawHour, minute] = form.dispatch.removalTime.split(":");
    let hour = Number(rawHour);
    const suffix = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${String(hour).padStart(2, "0")}:${minute} ${suffix}`;
  }, [form.dispatch.removalTime]);

  const taxContext = useMemo(() => {
    const meta = draftMeta?.taxRuleMeta || {};
    const sellerState = meta.sellerState || selectedProfile?.state || "";
    const buyerState = meta.buyerState || form.buyer.state || "";
    const placeOfSupply = meta.placeOfSupply || form.placeOfSupply || "";
    const taxMode = draftMeta?.taxSummary?.taxMode || meta.taxMode || "unknown";
    return {
      sellerState,
      buyerState,
      placeOfSupply,
      buyerGstin: form.buyer.gstin || meta.buyerGstin || "",
      taxMode,
      taxLabel:
        taxMode === "inter_state"
          ? "IGST"
          : taxMode === "intra_state"
            ? "CGST + SGST"
            : "Pending Review",
      documentGuidance:
        meta.guidance?.document ||
        "Choose the document carefully. Tax and transport requirements change with the document type.",
      taxGuidance:
        meta.guidance?.tax ||
        "GST mode depends on seller state, buyer state, and place of supply.",
      gstinGuidance:
        meta.guidance?.gstin ||
        "Buyer GSTIN helps determine GST compliance and e-invoice readiness.",
      eInvoiceGuidance:
        meta.guidance?.eInvoice ||
        "Official e-invoice signed QR needs IRP response after submission.",
    };
  }, [draftMeta, form.buyer.gstin, form.buyer.state, form.placeOfSupply, selectedProfile?.state]);

  const itemSummary = useMemo(() => draftMeta?.itemSummary || [], [draftMeta]);
  const taxRows = useMemo(() => draftMeta?.taxSummary?.rows || [], [draftMeta]);

  const chargeTotals = useMemo(
    () =>
      Number(form.chargesSummary.freightAmount || 0) +
      Number(form.chargesSummary.loadingAmount || 0) +
      Number(form.chargesSummary.otherAmount || 0) -
      Number(form.chargesSummary.discountAmount || 0) -
      Number(form.chargesSummary.rebateAmount || 0),
    [form.chargesSummary],
  );

  const taxableValue = Number(draftMeta?.taxSummary?.taxableAmount || 0);
  const taxPreview = activeDocumentRule.taxApplicable
    ? Number(draftMeta?.taxSummary?.taxAmount || 0)
    : 0;
  const grandTotalPreview = Number((taxableValue + taxPreview + chargeTotals).toFixed(2));
  const totalWeight = Number(
    form.chargesSummary.netWeight || draftMeta?.taxSummary?.totalWeight || 0,
  );

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateNested = (group, field, value) =>
    setForm((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value,
      },
    }));

  const handlePartyStateChange = (group, value) => {
    updateNested(group, "state", value);
    if (group === "buyer" && !form.placeOfSupply) {
      updateField("placeOfSupply", value);
    }
  };

  const handleSubmit = async (documentStatus = "Finalized") => {
    const salesOrderId = parsePositiveInteger(form.salesOrderId);
    const billingProfileId = parsePositiveInteger(form.billingProfileId);

    if (!salesOrderId || !billingProfileId) {
      alert("Select both sales order and billing profile.");
      return;
    }

    if (existingDocuments.includes(form.documentType)) {
      alert("This document type already exists for this sales order.");
      return;
    }

    if (activeDocumentRule.requiresBuyerGstin && !form.buyer.gstin.trim()) {
      alert("Buyer GSTIN is required for this document type.");
      return;
    }

    if (
      activeDocumentRule.requiresDispatch &&
      (!form.dispatch.dispatchFrom.trim() || !form.dispatch.dispatchTo.trim())
    ) {
      alert("Dispatch from and dispatch to are required.");
      return;
    }

    try {
      setLoading(true);
      setForm((prev) => ({ ...prev, documentStatus }));
      await axiosAPI.post("/invoice/billing", {
        ...form,
        documentStatus,
        salesOrderId,
        billingProfileId,
      });
      alert(
        documentStatus === "Draft"
          ? "Billing document saved as draft"
          : "Billing document issued successfully",
      );
      navigate("/invoices");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to create billing document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Billing Document</h1>
        <p style={styles.subtitle}>
          Choose the document first, let the system explain the GST basis, then review
          item values, weight, and tax before posting. This screen is shaped around
          billing staff, not just raw fields. E-invoice is prepared later from the
          finalized tax invoice so the commercial invoice number stays the same for GST filing.
        </p>

        <div style={styles.badgeRow}>
          <span style={styles.badge}>
            Voucher: {formatDocumentLabel(activeDocumentRule.invoiceType)}
          </span>
          <span
            style={{
              ...styles.badge,
              ...(taxContext.taxLabel === "IGST"
                ? styles.warningBadge
                : taxContext.taxLabel === "CGST + SGST"
                  ? styles.successBadge
                  : {}),
            }}
          >
            GST Mode: {taxContext.taxLabel}
          </span>
          {draftLoading && <span style={styles.badge}>Refreshing draft...</span>}
        </div>

        <div style={styles.statGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Next Document Number</div>
            <div style={styles.statValue}>
              {draftMeta?.invoiceNumberPreview || "Select order and billing company"}
            </div>
            <div style={styles.helper}>Auto-generated from the billing profile prefix.</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Document Use</div>
            <div style={{ ...styles.statValue, fontSize: "20px" }}>
              {formatDocumentLabel(form.documentType)}
            </div>
            <div style={styles.helper}>{taxContext.documentGuidance}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Taxable Value</div>
            <div style={styles.statValue}>{money(taxableValue)}</div>
            <div style={styles.helper}>Tax is computed on taxable value only. No GST-on-GST.</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Grand Total Preview</div>
            <div style={styles.statValue}>{money(grandTotalPreview)}</div>
            <div style={styles.helper}>Taxable value + tax + charges - discount/rebate.</div>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Sales Order</label>
            <select
              style={styles.input}
              value={form.salesOrderId}
              onChange={(e) => updateField("salesOrderId", e.target.value)}
            >
              <option value="">Select sales order</option>
              {salesOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.customer?.firmName || order.customer?.name}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Billing Profile</label>
            <select
              style={styles.input}
              value={form.billingProfileId}
              onChange={(e) => updateField("billingProfileId", e.target.value)}
            >
              <option value="">Select billing profile</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.legalName}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Document Type</label>
            <select
              style={styles.input}
              value={form.documentType}
              onChange={(e) => updateField("documentType", e.target.value)}
            >
              {availableDocumentOptions.length === 0 ? (
                <option value="">No document type available</option>
              ) : (
                availableDocumentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              )}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Voucher Type</label>
            <input
              style={{ ...styles.input, background: "#f8fafc", fontWeight: 800 }}
              value={formatDocumentLabel(form.invoiceType)}
              readOnly
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Invoice Date</label>
            <input
              style={styles.input}
              type="date"
              value={form.invoiceDate}
              onChange={(e) => updateField("invoiceDate", e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Place Of Supply</label>
            <select style={styles.input} value={form.placeOfSupply} onChange={(e) => updateField("placeOfSupply", e.target.value)}>
              <option value="">Select state</option>
              {GST_STATES.map((state) => (
                <option key={state.code} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {existingDocuments.length > 0 && (
          <div style={styles.badgeRow}>
            {existingDocuments.map((documentType) => (
              <span key={documentType} style={{ ...styles.badge, ...styles.warningBadge }}>
                Already created: {formatDocumentLabel(documentType)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Tax Decision And Legal Basis</h2>
        <div style={styles.wideRow}>
          <div style={styles.notePanel}>
            <div style={styles.noteTitle}>How GST Was Decided</div>
            <div style={styles.noteText}>{taxContext.taxGuidance}</div>
            <div style={{ ...styles.noteText, marginTop: "10px" }}>
              Seller state: <strong>{taxContext.sellerState || "Not set"}</strong>
            </div>
            <div style={styles.noteText}>
              Buyer state: <strong>{taxContext.buyerState || "Not set"}</strong>
            </div>
            <div style={styles.noteText}>
              Place of supply: <strong>{taxContext.placeOfSupply || "Not set"}</strong>
            </div>
            <div style={styles.noteText}>
              Buyer GSTIN: <strong>{taxContext.buyerGstin || "Not available"}</strong>
            </div>
          </div>
          <div style={styles.notePanel}>
            <div style={styles.noteTitle}>Document Guidance</div>
            <div style={styles.noteText}>{taxContext.documentGuidance}</div>
            <div style={{ ...styles.noteText, marginTop: "10px" }}>
              {taxContext.gstinGuidance}
            </div>
            <div style={{ ...styles.noteText, marginTop: "10px" }}>
              After issuing a finalized tax invoice, open that invoice and use
              `Prepare E-Invoice` on the same invoice number whenever IRN compliance is needed.
            </div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Buyer, Consignee, And Tax Identity</h2>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Buyer Name</label>
            <input style={styles.input} value={form.buyer.name} onChange={(e) => updateNested("buyer", "name", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Buyer Mobile</label>
            <input style={styles.input} value={form.buyer.mobile} onChange={(e) => updateNested("buyer", "mobile", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Buyer GSTIN {activeDocumentRule.requiresBuyerGstin ? "*" : ""}</label>
            <input style={styles.input} value={form.buyer.gstin} onChange={(e) => updateNested("buyer", "gstin", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Buyer State</label>
            <select style={styles.input} value={form.buyer.state} onChange={(e) => handlePartyStateChange("buyer", e.target.value)}>
              <option value="">Select state</option>
              {GST_STATES.map((state) => (
                <option key={state.code} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Buyer City</label>
            <input style={styles.input} value={form.buyer.city} onChange={(e) => updateNested("buyer", "city", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Buyer Pincode</label>
            <input style={styles.input} value={form.buyer.pincode} onChange={(e) => updateNested("buyer", "pincode", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Consignee Name</label>
            <input style={styles.input} value={form.consignee.name} onChange={(e) => updateNested("consignee", "name", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Consignee Mobile</label>
            <input style={styles.input} value={form.consignee.mobile} onChange={(e) => updateNested("consignee", "mobile", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Consignee GSTIN</label>
            <input style={styles.input} value={form.consignee.gstin} onChange={(e) => updateNested("consignee", "gstin", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Consignee State</label>
            <select style={styles.input} value={form.consignee.state} onChange={(e) => handlePartyStateChange("consignee", e.target.value)}>
              <option value="">Select state</option>
              {GST_STATES.map((state) => (
                <option key={state.code} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {(activeDocumentRule.requiresDispatch ||
        activeDocumentRule.requiresTransport ||
        activeDocumentRule.requiresCompliance) && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Dispatch, Transport, And Compliance</h2>
          <div style={styles.row}>
            {activeDocumentRule.requiresDispatch && (
              <>
                <div style={styles.field}>
                  <label style={styles.label}>Dispatch From</label>
                  <input style={styles.input} value={form.dispatch.dispatchFrom} onChange={(e) => updateNested("dispatch", "dispatchFrom", e.target.value)} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Dispatch To</label>
                  <input style={styles.input} value={form.dispatch.dispatchTo} onChange={(e) => updateNested("dispatch", "dispatchTo", e.target.value)} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Gate Pass</label>
                  <input style={styles.input} value={form.dispatch.gatePassNo} onChange={(e) => updateNested("dispatch", "gatePassNo", e.target.value)} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Contract / Sales Order Ref</label>
                  <input style={styles.input} value={form.dispatch.contractNo} onChange={(e) => updateNested("dispatch", "contractNo", e.target.value)} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Removal Time</label>
                  <input style={styles.input} type="time" value={form.dispatch.removalTime} onChange={(e) => updateNested("dispatch", "removalTime", e.target.value)} />
                  <div style={styles.helper}>{formattedRemovalTime || "Choose time"}</div>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Dispatch Reference</label>
                  <input style={styles.input} value={form.dispatch.dispatchReference} onChange={(e) => updateNested("dispatch", "dispatchReference", e.target.value)} />
                </div>
              </>
            )}

            {activeDocumentRule.requiresTransport && (
              <>
                <div style={styles.field}>
                  <label style={styles.label}>Truck Number</label>
                  <input style={styles.input} value={form.transportDetails.vehicleNumber} onChange={(e) => updateNested("transportDetails", "vehicleNumber", e.target.value)} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>LR Number</label>
                  <input style={styles.input} value={form.transportDetails.lrNumber} onChange={(e) => updateNested("transportDetails", "lrNumber", e.target.value)} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>LR Date</label>
                  <input style={styles.input} type="date" value={form.transportDetails.lrDate} onChange={(e) => updateNested("transportDetails", "lrDate", e.target.value)} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Transporter Name</label>
                  <input style={styles.input} value={form.transportDetails.transporterName} onChange={(e) => updateNested("transportDetails", "transporterName", e.target.value)} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Transporter ID</label>
                  <input style={styles.input} value={form.transportDetails.transporterId} onChange={(e) => updateNested("transportDetails", "transporterId", e.target.value)} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>E-Way Bill Number</label>
                  <input style={styles.input} value={form.transportDetails.eWayBillNumber} onChange={(e) => updateNested("transportDetails", "eWayBillNumber", e.target.value)} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>E-Way Bill Date</label>
                  <input style={styles.input} type="date" value={form.transportDetails.eWayBillDate} onChange={(e) => updateNested("transportDetails", "eWayBillDate", e.target.value)} />
                </div>
              </>
            )}

            {activeDocumentRule.requiresCompliance && (
              <>
                <div style={styles.field}>
                  <label style={styles.label}>IRN Number</label>
                  <input style={styles.input} value={form.complianceDetails.irnNumber} onChange={(e) => updateNested("complianceDetails", "irnNumber", e.target.value)} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Acknowledgement Number</label>
                  <input style={styles.input} value={form.complianceDetails.ackNumber} onChange={(e) => updateNested("complianceDetails", "ackNumber", e.target.value)} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Acknowledgement Date</label>
                  <input style={styles.input} type="date" value={form.complianceDetails.ackDate} onChange={(e) => updateNested("complianceDetails", "ackDate", e.target.value)} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Charges, Weight, And Notes</h2>
        <div style={styles.row}>
          <div style={styles.field}><label style={styles.label}>Freight</label><input style={styles.input} type="number" value={form.chargesSummary.freightAmount} onChange={(e) => updateNested("chargesSummary", "freightAmount", Number(e.target.value))} /></div>
          <div style={styles.field}><label style={styles.label}>Loading</label><input style={styles.input} type="number" value={form.chargesSummary.loadingAmount} onChange={(e) => updateNested("chargesSummary", "loadingAmount", Number(e.target.value))} /></div>
          <div style={styles.field}><label style={styles.label}>Other Charges</label><input style={styles.input} type="number" value={form.chargesSummary.otherAmount} onChange={(e) => updateNested("chargesSummary", "otherAmount", Number(e.target.value))} /></div>
          <div style={styles.field}><label style={styles.label}>Discount</label><input style={styles.input} type="number" value={form.chargesSummary.discountAmount} onChange={(e) => updateNested("chargesSummary", "discountAmount", Number(e.target.value))} /></div>
          <div style={styles.field}><label style={styles.label}>Rebate</label><input style={styles.input} type="number" value={form.chargesSummary.rebateAmount} onChange={(e) => updateNested("chargesSummary", "rebateAmount", Number(e.target.value))} /></div>
          <div style={styles.field}><label style={styles.label}>Gross Weight</label><input style={styles.input} type="number" value={form.chargesSummary.grossWeight} onChange={(e) => updateNested("chargesSummary", "grossWeight", Number(e.target.value))} /></div>
          <div style={styles.field}><label style={styles.label}>Tare Weight</label><input style={styles.input} type="number" value={form.chargesSummary.tareWeight} onChange={(e) => updateNested("chargesSummary", "tareWeight", Number(e.target.value))} /></div>
          <div style={styles.field}><label style={styles.label}>Net Weight</label><input style={styles.input} type="number" value={form.chargesSummary.netWeight} onChange={(e) => updateNested("chargesSummary", "netWeight", Number(e.target.value))} /></div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Footer Notes</label>
            <textarea style={styles.textarea} value={form.notesFooter} onChange={(e) => updateField("notesFooter", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Internal Remarks</label>
            <textarea style={styles.textarea} value={form.internalRemarks} onChange={(e) => updateField("internalRemarks", e.target.value)} />
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Products, Taxes, And Final Summary</h2>
        <div style={styles.helper}>
          Review this section before posting. It shows the line value, tax split, calculated
          weight, and whether IGST or CGST/SGST is being used.
        </div>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Batch</th>
                <th style={styles.th}>UOM</th>
                <th style={styles.th}>Gross Wt</th>
                <th style={styles.th}>Ex-Mill</th>
                <th style={styles.th}>Rebate</th>
                <th style={styles.th}>Freight</th>
                <th style={styles.th}>Taxable</th>
                <th style={styles.th}>CGST</th>
                <th style={styles.th}>SGST</th>
                <th style={styles.th}>IGST</th>
              </tr>
            </thead>
            <tbody>
              {itemSummary.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan={11}>
                    Select a sales order and billing profile to see the item summary.
                  </td>
                </tr>
              ) : (
                itemSummary.map((item, index) => (
                  <tr key={`${item.productId || index}-${index}`}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 800 }}>{item.materialDescription || item.productName || "-"}</div>
                      <div style={{ color: "#64748b", fontSize: "12px" }}>
                        {item.sku || "-"} | HSN {item.hsnCode || "-"} | Qty {Number(item.quantity || 0).toFixed(2)}
                      </div>
                    </td>
                    <td style={styles.td}>{item.batchCode || item.sku || "-"}</td>
                    <td style={styles.td}>{item.commercialUom || item.unit || "-"}</td>
                    <td style={styles.td}>{Number(item.netWeightMt || item.calculatedWeight || 0).toFixed(3)} MT</td>
                    <td style={styles.td}>{money(item.exMillRate || item.unitPrice)}</td>
                    <td style={styles.td}>{money(item.rebatePerUnit || 0)}</td>
                    <td style={styles.td}>{money(item.addFreightAmount || 0)}</td>
                    <td style={styles.td}>{money(item.taxableValue || item.taxableAmount || item.baseAmount)}</td>
                    <td style={styles.td}>{money(item.cgstAmount || item.cgst)}</td>
                    <td style={styles.td}>{money(item.sgstAmount || item.sgst)}</td>
                    <td style={styles.td}>{money(item.igstAmount || item.igst)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {taxRows.length > 0 && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>HSN</th>
                  <th style={styles.th}>Taxable</th>
                  <th style={styles.th}>CGST</th>
                  <th style={styles.th}>SGST</th>
                  <th style={styles.th}>IGST</th>
                  <th style={styles.th}>Total Tax</th>
                </tr>
              </thead>
              <tbody>
                {taxRows.map((row, index) => (
                  <tr key={`${row.hsnCode}-${index}`}>
                    <td style={styles.td}>{row.hsnCode}</td>
                    <td style={styles.td}>{money(row.taxableAmount)}</td>
                    <td style={styles.td}>{money(row.cgst)}</td>
                    <td style={styles.td}>{money(row.sgst)}</td>
                    <td style={styles.td}>{money(row.igst)}</td>
                    <td style={styles.td}>{money(row.totalTax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={styles.row}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryRow}>
              <span>Unit / Taxable Total</span>
              <strong>{money(taxableValue)}</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Total GST Added</span>
              <strong>{money(taxPreview)}</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Other Charges Net</span>
              <strong>{money(chargeTotals)}</strong>
            </div>
            <div style={{ ...styles.summaryRow, borderBottom: "none", fontSize: "16px" }}>
              <span>Grand Total</span>
              <strong>{money(grandTotalPreview)}</strong>
            </div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryRow}>
              <span>GST Decision</span>
              <strong>{taxContext.taxLabel}</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Buyer GSTIN Basis</span>
              <strong>{taxContext.buyerGstin || "Not Available"}</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Net Weight</span>
              <strong>{Number(totalWeight || 0).toFixed(3)}</strong>
            </div>
            <div style={{ ...styles.summaryRow, borderBottom: "none", fontSize: "13px" }}>
              <span>E-Invoice QR Status</span>
              <strong>
                {draftMeta?.eInvoiceMeta?.status
                  ? formatDocumentLabel(draftMeta.eInvoiceMeta.status)
                  : "Not Applicable"}
              </strong>
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button style={{ ...styles.button, ...styles.secondaryButton }} onClick={() => navigate("/invoices")}>
            Back
          </button>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={() => handleSubmit("Draft")}
              disabled={loading || !availableDocumentOptions.length}
            >
              {loading && form.documentStatus === "Draft" ? "Saving..." : "Save Draft"}
            </button>
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={() => handleSubmit("Finalized")}
              disabled={loading || !availableDocumentOptions.length}
            >
              {loading ? "Issuing..." : "Issue Final Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateBillingInvoice;
