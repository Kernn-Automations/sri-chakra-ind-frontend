import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/Auth";
import { GST_STATES, findStateCodeByName } from "@/constants/gstStates";

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background:
      "linear-gradient(135deg, #fff7ed 0%, #eff6ff 45%, #f0fdf4 100%)",
  },
  card: {
    background: "rgba(255,255,255,0.95)",
    border: "1px solid #dbeafe",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "28px",
    fontWeight: 700,
  },
  subtitle: {
    marginTop: "8px",
    color: "#475569",
    fontSize: "14px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginTop: "18px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    color: "#475569",
    fontWeight: 600,
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "18px",
  },
  button: {
    border: "none",
    borderRadius: "14px",
    padding: "14px 20px",
    fontWeight: 700,
    cursor: "pointer",
  },
  primary: {
    background: "linear-gradient(135deg, #ea580c, #2563eb)",
    color: "#fff",
  },
  secondary: {
    background: "#fff",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
  },
};

function BillingSetup({ navigate }) {
  const { axiosAPI } = useAuth();
  const selectedDivisionId = localStorage.getItem("currentDivisionId");
  const [divisions, setDivisions] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    divisionId: selectedDivisionId && selectedDivisionId !== "1" ? selectedDivisionId : "",
    legalName: "",
    displayName: "",
    addressLine1: "",
    addressLine2: "",
    area: "",
    city: "",
    district: "",
    state: "",
    stateCode: "",
    pincode: "",
    country: "India",
    gstinNumber: "",
    panNumber: "",
    cinNumber: "",
    contactPhone: "",
    contactEmail: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
    branchName: "",
    ifscCode: "",
    invoicePrefix: "INV",
    quotationPrefix: "QT",
    salesOrderPrefix: "SO",
    defaultDocumentType: "tax_invoice",
    defaultTransportMode: "Road",
    defaultSupplyType: "B2B",
    notesFooter: "",
    declarationText: "",
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await axiosAPI.get("/billing-profiles/bootstrap");
        setDivisions(res.data?.divisions || []);
        setProfiles(res.data?.profiles || []);
      } catch (error) {
        alert(error?.response?.data?.message || "Failed to load billing setup");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [axiosAPI]);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => String(profile.divisionId) === String(form.divisionId)),
    [profiles, form.divisionId],
  );

  useEffect(() => {
    if (!selectedProfile) return;

    setForm((prev) => ({
      ...prev,
      divisionId: String(selectedProfile.divisionId),
      legalName: selectedProfile.legalName || "",
      displayName: selectedProfile.displayName || "",
      addressLine1: selectedProfile.addressLine1 || "",
      addressLine2: selectedProfile.addressLine2 || "",
      area: selectedProfile.area || "",
      city: selectedProfile.city || "",
      district: selectedProfile.district || "",
      state: selectedProfile.state || "",
      stateCode: selectedProfile.stateCode || "",
      pincode: selectedProfile.pincode || "",
      country: selectedProfile.country || "India",
      gstinNumber: selectedProfile.gstinNumber || "",
      panNumber: selectedProfile.panNumber || "",
      cinNumber: selectedProfile.cinNumber || "",
      contactPhone: selectedProfile.contactPhone || "",
      contactEmail: selectedProfile.contactEmail || "",
      bankAccountName: selectedProfile.bankAccountName || "",
      bankAccountNumber: selectedProfile.bankAccountNumber || "",
      bankName: selectedProfile.bankName || "",
      branchName: selectedProfile.branchName || "",
      ifscCode: selectedProfile.ifscCode || "",
      invoicePrefix: selectedProfile.invoicePrefix || "INV",
      quotationPrefix: selectedProfile.quotationPrefix || "QT",
      salesOrderPrefix: selectedProfile.salesOrderPrefix || "SO",
      defaultDocumentType:
        selectedProfile.defaultDocumentType === "e_invoice"
          ? "tax_invoice"
          : selectedProfile.defaultDocumentType || "tax_invoice",
      defaultTransportMode: selectedProfile.defaultTransportMode || "Road",
      defaultSupplyType: selectedProfile.defaultSupplyType || "B2B",
      notesFooter: selectedProfile.notesFooter || "",
      declarationText: selectedProfile.declarationText || "",
    }));
  }, [selectedProfile]);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleStateChange = (value) => {
    setForm((prev) => ({
      ...prev,
      state: value,
      stateCode: findStateCodeByName(value),
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await axiosAPI.post("/billing-profiles", {
        ...form,
        divisionId: Number(form.divisionId),
      });
      alert("Billing profile saved successfully");
      navigate("/invoices");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to save billing profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Billing Setup</h1>
        <p style={styles.subtitle}>
          Configure each company/division with legal billing identity, GST data,
          bank details, and document defaults.
        </p>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Division / Company</label>
            <select
              style={styles.input}
              value={form.divisionId}
              onChange={(e) => updateField("divisionId", e.target.value)}
            >
              <option value="">Select division</option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Legal Name</label>
            <input style={styles.input} value={form.legalName} onChange={(e) => updateField("legalName", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Display Name</label>
            <input style={styles.input} value={form.displayName} onChange={(e) => updateField("displayName", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>GSTIN</label>
            <input style={styles.input} value={form.gstinNumber} onChange={(e) => updateField("gstinNumber", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>PAN</label>
            <input style={styles.input} value={form.panNumber} onChange={(e) => updateField("panNumber", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>CIN</label>
            <input style={styles.input} value={form.cinNumber} onChange={(e) => updateField("cinNumber", e.target.value)} />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Address Line 1</label>
            <input style={styles.input} value={form.addressLine1} onChange={(e) => updateField("addressLine1", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Address Line 2</label>
            <input style={styles.input} value={form.addressLine2} onChange={(e) => updateField("addressLine2", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Area</label>
            <input style={styles.input} value={form.area} onChange={(e) => updateField("area", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>City</label>
            <input style={styles.input} value={form.city} onChange={(e) => updateField("city", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>District</label>
            <input style={styles.input} value={form.district} onChange={(e) => updateField("district", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>State</label>
            <select style={styles.input} value={form.state} onChange={(e) => handleStateChange(e.target.value)}>
              <option value="">Select state</option>
              {GST_STATES.map((state) => (
                <option key={state.code} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>State Code</label>
            <input style={{ ...styles.input, background: "#f8fafc" }} value={form.stateCode} readOnly />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Pincode</label>
            <input style={styles.input} value={form.pincode} onChange={(e) => updateField("pincode", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Contact Phone</label>
            <input style={styles.input} value={form.contactPhone} onChange={(e) => updateField("contactPhone", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Contact Email</label>
            <input style={styles.input} value={form.contactEmail} onChange={(e) => updateField("contactEmail", e.target.value)} />
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={{ ...styles.title, fontSize: "22px" }}>Bank And Document Defaults</h2>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Bank Account Name</label>
            <input style={styles.input} value={form.bankAccountName} onChange={(e) => updateField("bankAccountName", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Bank Account Number</label>
            <input style={styles.input} value={form.bankAccountNumber} onChange={(e) => updateField("bankAccountNumber", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Bank Name</label>
            <input style={styles.input} value={form.bankName} onChange={(e) => updateField("bankName", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Branch Name</label>
            <input style={styles.input} value={form.branchName} onChange={(e) => updateField("branchName", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>IFSC Code</label>
            <input style={styles.input} value={form.ifscCode} onChange={(e) => updateField("ifscCode", e.target.value)} />
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Invoice Prefix</label>
            <input style={styles.input} value={form.invoicePrefix} onChange={(e) => updateField("invoicePrefix", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Quotation Prefix</label>
            <input style={styles.input} value={form.quotationPrefix} onChange={(e) => updateField("quotationPrefix", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Sales Order Prefix</label>
            <input style={styles.input} value={form.salesOrderPrefix} onChange={(e) => updateField("salesOrderPrefix", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Default Document Type</label>
            <select style={styles.input} value={form.defaultDocumentType} onChange={(e) => updateField("defaultDocumentType", e.target.value)}>
              <option value="tax_invoice">Tax Invoice</option>
              <option value="bill_of_supply">Bill Of Supply</option>
              <option value="proforma_invoice">Proforma Invoice</option>
              <option value="delivery_challan">Delivery Challan</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Default Transport Mode</label>
            <input style={styles.input} value={form.defaultTransportMode} onChange={(e) => updateField("defaultTransportMode", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Default Supply Type</label>
            <input style={styles.input} value={form.defaultSupplyType} onChange={(e) => updateField("defaultSupplyType", e.target.value)} />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Footer Notes</label>
            <textarea style={styles.input} value={form.notesFooter} onChange={(e) => updateField("notesFooter", e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Declaration Text</label>
            <textarea style={styles.input} value={form.declarationText} onChange={(e) => updateField("declarationText", e.target.value)} />
          </div>
        </div>

        <div style={styles.footer}>
          <button style={{ ...styles.button, ...styles.secondary }} onClick={() => navigate("/invoices")}>
            Back
          </button>
          <button style={{ ...styles.button, ...styles.primary }} onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Billing Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BillingSetup;
