import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px 20px",
    background:
      "radial-gradient(circle at top, rgba(18,181,203,0.15), transparent 26%), linear-gradient(180deg, #072540 0%, #0f4c81 35%, #f6fbff 35%, #eef6ff 100%)",
  },
  shell: {
    maxWidth: "980px",
    margin: "0 auto",
  },
  hero: {
    background: "linear-gradient(135deg, #0b3356, #0f4c81 60%, #12b5cb)",
    borderRadius: "28px",
    padding: "28px",
    color: "#fff",
    boxShadow: "0 22px 50px rgba(7, 37, 64, 0.24)",
    marginBottom: "18px",
  },
  title: { margin: 0, fontSize: "30px", fontWeight: 800 },
  subtitle: { marginTop: "10px", opacity: 0.92, lineHeight: 1.7 },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "8px 12px",
    background: "rgba(255,255,255,0.14)",
    fontWeight: 800,
    fontSize: "12px",
    marginTop: "16px",
  },
  card: {
    background: "rgba(255,255,255,0.97)",
    borderRadius: "24px",
    border: "1px solid #d9e7f7",
    boxShadow: "0 18px 40px rgba(15, 76, 129, 0.08)",
    padding: "22px",
    marginBottom: "16px",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" },
  label: { fontSize: "12px", fontWeight: 800, color: "#5e7494", textTransform: "uppercase", letterSpacing: "0.04em" },
  value: { marginTop: "6px", fontSize: "15px", color: "#102542", lineHeight: 1.6 },
  verified: { color: "#0b8f5b", fontWeight: 800, fontSize: "24px" },
  muted: { color: "#5e7494", lineHeight: 1.7 },
};

function PublicDocumentVerifier() {
  const { verificationKey } = useParams();
  const [searchParams] = useSearchParams();
  const [verification, setVerification] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function verifyDocument() {
      if (!verificationKey || verificationKey === "manual") {
        setVerification({
          status: "server_summary_unavailable",
          documentType: searchParams.get("type") || "",
          invoiceNumber: searchParams.get("number") || "",
          invoiceDate: searchParams.get("issuedOn") || "",
          grandTotal: searchParams.get("amount") || "",
          buyerName: searchParams.get("party") || "",
          billingCompany: searchParams.get("company") || "",
          authenticityMessage:
            "This QR carries document summary for traceability. Server-side verification was not attached to this document record.",
        });
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/public-documents/verify/${verificationKey}`,
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Document could not be verified");
        }
        setVerification(data.verification);
      } catch (fetchError) {
        setError(fetchError.message || "Document could not be verified");
      } finally {
        setLoading(false);
      }
    }

    verifyDocument();
  }, [searchParams, verificationKey]);

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Kernn Document Verifier</h1>
          <p style={styles.subtitle}>
            This public page confirms whether the scanned document matches a server-side record generated from Kernn Automations billing software.
          </p>
          <div style={styles.badge}>Read-only authenticity check</div>
        </div>

        <div style={styles.card}>
          {loading && <div style={styles.muted}>Verifying document...</div>}
          {!loading && error && <div style={{ ...styles.verified, color: "#c2410c" }}>{error}</div>}
          {!loading && verification && (
            <>
              <div style={styles.verified}>
                {verification.status === "verified" ? "Verified Document" : "Document Summary"}
              </div>
              <p style={{ ...styles.muted, marginTop: "8px" }}>
                {verification.authenticityMessage}
              </p>
              <div style={{ ...styles.grid, marginTop: "18px" }}>
                <div>
                  <div style={styles.label}>Document Type</div>
                  <div style={styles.value}>{String(verification.documentType || "-").replaceAll("_", " ")}</div>
                </div>
                <div>
                  <div style={styles.label}>Document Number</div>
                  <div style={styles.value}>{verification.invoiceNumber || "-"}</div>
                </div>
                <div>
                  <div style={styles.label}>Document Date</div>
                  <div style={styles.value}>
                    {verification.invoiceDate
                      ? String(verification.invoiceDate).slice(0, 10)
                      : "-"}
                  </div>
                </div>
                <div>
                  <div style={styles.label}>Billing Company</div>
                  <div style={styles.value}>{verification.billingCompany || "-"}</div>
                </div>
                <div>
                  <div style={styles.label}>Buyer / Party</div>
                  <div style={styles.value}>{verification.buyerName || "-"}</div>
                </div>
                <div>
                  <div style={styles.label}>Grand Total</div>
                  <div style={styles.value}>
                    {verification.grandTotal ? `Rs. ${Number(verification.grandTotal).toFixed(2)}` : "-"}
                  </div>
                </div>
              </div>
              {verification.lastEditedAt && (
                <p style={{ ...styles.muted, marginTop: "16px" }}>
                  Last server-side edit recorded on {String(verification.lastEditedAt).replace("T", " ").slice(0, 19)}.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicDocumentVerifier;
