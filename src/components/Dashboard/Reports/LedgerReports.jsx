import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import customerLedgerService from "@/services/customerLedgerService";
import pdf from "../../../images/pdf-png.png";
import styles from "../Sales/Sales.module.css";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";

/* ===========================
   HELPERS
=========================== */
const formatAmount = (val) =>
  Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatBalance = (amount, type = "Dr") =>
  `${formatAmount(amount)} ${type}`;

const formatAddress = (location = "") =>
  location
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && p.toLowerCase() !== "null")
    .join(", ");

function LedgerReports({ navigate }) {
  const { axiosAPI } = useAuth();

  /* ===========================
     STATE
  =========================== */
  const [customers, setCustomers] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customer, setCustomer] = useState("");
  const [reportType, setReportType] = useState("custom");
  const [financialYear, setFinancialYear] = useState("");

  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);

  const [ledgerRows, setLedgerRows] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [openingBalanceType, setOpeningBalanceType] = useState("Dr");
  const [closingBalance, setClosingBalance] = useState(0);
  const [closingBalanceType, setClosingBalanceType] = useState("Dr");
  const [summary, setSummary] = useState(null);

  const [showReport, setShowReport] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  const closeModal = () => setIsModalOpen(false);

  /* ===========================
     FETCH CUSTOMERS
  =========================== */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const result = await customerLedgerService.getCustomers(axiosAPI);
        if (result.success) {
          setCustomers(result.data || []);
        } else {
          throw new Error(result.message);
        }
      } catch {
        setError("Failed to fetch customers");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ===========================
     SUBMIT
  =========================== */
  const handleSubmit = async () => {
    if (!customer) {
      setError("Please select a customer");
      setIsModalOpen(true);
      return;
    }

    if (reportType === "custom" && (!fromDate || !toDate)) {
      setError("Please select From and To dates");
      setIsModalOpen(true);
      return;
    }

    if (reportType === "financial-year" && !financialYear) {
      setError("Please select a financial year");
      setIsModalOpen(true);
      return;
    }

    setLoading(true);
    setShowReport(true);
    setInfoMessage("");

    try {
      const selected = customers.find((c) => String(c.id) === String(customer));
      if (!selected) throw new Error("Customer not found");

      const period =
        reportType === "financial-year" ? financialYear : { fromDate, toDate };

      const res = await customerLedgerService.fetchCustomerLedger(
        axiosAPI,
        selected.customer_id || selected.id,
        reportType,
        period,
      );

      if (!res.success) throw new Error(res.message);

      const data = res.data;

      /* -----------------------
         CUSTOMER
      ------------------------ */
      if (data.customer) {
        setSelectedCustomerDetails({
          ...data.customer,
          address: formatAddress(data.customer.location || ""),
        });
      }

      /* -----------------------
         BALANCES
      ------------------------ */
      setOpeningBalance(
        data.openingBalance ?? data.summary?.openingBalance ?? 0,
      );
      setOpeningBalanceType("Dr");

      setClosingBalance(
        data.closingBalance ?? data.summary?.closingBalance ?? 0,
      );
      setClosingBalanceType(data.summary?.closingBalanceType || "Dr");

      setSummary(data.summary || null);

      /* -----------------------
         TRANSACTIONS
      ------------------------ */
      const txns = data.transactions || [];

      const formattedRows = txns
        .filter(
          (t) => !(t.particulars === "Opening Balance" && txns.length === 1),
        )
        .map((t) => ({
          date: t.date || "",
          particulars: t.particulars,
          vchType: t.vchType || "",
          vchNo: t.vchNo || "",
          debit: t.debit ? formatAmount(t.debit) : "",
          credit: t.credit ? formatAmount(t.credit) : "",
          balance: formatBalance(t.balance, t.balanceType || "Dr"),
        }));

      setLedgerRows(formattedRows);

      if (formattedRows.length === 0) {
        setInfoMessage("No transactions for selected period");
      }
    } catch (err) {
      setError(err.message || "Failed to load ledger");
      setIsModalOpen(true);
      setLedgerRows([]);
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     FINAL LEDGER (WITH OB/CB)
  =========================== */
  const finalLedgerRows = useMemo(() => {
    const rows = [];

    rows.push({
      isOpening: true,
      date: ledgerRows[0]?.date || "",
      particulars: "Opening Balance",
      balance: formatBalance(openingBalance, openingBalanceType),
    });

    ledgerRows.forEach((r) => rows.push(r));

    rows.push({
      isClosing: true,
      date: ledgerRows[ledgerRows.length - 1]?.date || "",
      particulars: "Closing Balance",
      balance: formatBalance(closingBalance, closingBalanceType),
    });

    return rows;
  }, [ledgerRows, openingBalance, closingBalance]);

  /* ===========================
     PDF DOWNLOAD
  =========================== */
  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      const period =
        reportType === "financial-year" ? financialYear : { fromDate, toDate };

      const res = await customerLedgerService.downloadPDF(
        axiosAPI,
        selectedCustomerDetails.customer_id || selectedCustomerDetails.id,
        reportType,
        period,
      );

      if (!res.success) throw new Error(res.message);

      const url = URL.createObjectURL(res.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download PDF");
      setIsModalOpen(true);
    } finally {
      setDownloadingPDF(false);
    }
  };

  /* ===========================
     RENDER
  =========================== */
  return (
    <div style={containerStyle}>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .erp-breadcrumb {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 500;
        }

        .erp-breadcrumb span {
          color: #2563eb;
          cursor: pointer;
          transition: color 0.15s;
        }

        .erp-breadcrumb span:hover {
          color: #1d4ed8;
        }

        .erp-page-title {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 24px;
        }

        .erp-filter-panel {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .erp-filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .erp-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .erp-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          letter-spacing: 0.01em;
        }

        .erp-input,
        .erp-select {
          padding: 9px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          color: #111827;
          background: #ffffff;
          transition: all 0.15s;
          outline: none;
        }

        .erp-input:focus,
        .erp-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .erp-input:disabled,
        .erp-select:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }

        .erp-btn-group {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .erp-btn {
          padding: 9px 24px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          outline: none;
          background: #ffffff;
          color: #374151;
        }

        .erp-btn-primary {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }

        .erp-btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
          border-color: #1d4ed8;
        }

        .erp-btn-secondary {
          background: #ffffff;
          color: #374151;
          border-color: #d1d5db;
        }

        .erp-btn-secondary:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .erp-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .erp-customer-header {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 20px 24px;
          margin-bottom: 20px;
        }

        .erp-customer-name {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 8px;
        }

        .erp-customer-info {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.6;
        }

        .erp-customer-info-row {
          margin: 4px 0;
        }

        .erp-report-container {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }

        .erp-table-wrapper {
          overflow-x: auto;
        }

        .erp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .erp-table thead {
          background: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
        }

        .erp-table thead th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .erp-table thead th.text-right {
          text-align: right;
        }

        .erp-table tbody tr {
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.1s;
        }

        .erp-table tbody tr:hover:not(.row-opening):not(.row-closing) {
          background: #f9fafb;
        }

        .erp-table tbody td {
          padding: 11px 16px;
          color: #111827;
          vertical-align: middle;
        }

        .erp-table tbody td.text-right {
          text-align: right;
        }

        .row-opening {
          background: #eff6ff;
          border-top: 2px solid #3b82f6;
          border-bottom: 2px solid #3b82f6;
        }

        .row-opening td {
          font-weight: 600;
          color: #1e40af;
        }

        .row-closing {
          background: #f0fdf4;
          border-top: 2px solid #10b981;
          border-bottom: 2px solid #10b981;
        }

        .row-closing td {
          font-weight: 600;
          color: #065f46;
        }

        .amount-debit {
          color: #dc2626;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        .amount-credit {
          color: #059669;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        .amount-balance {
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        .erp-summary-panel {
          border-top: 2px solid #e5e7eb;
          padding: 20px 24px;
          background: #fafafa;
        }

        .erp-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          max-width: 600px;
          margin-left: auto;
        }

        .erp-summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
        }

        .erp-summary-label {
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
        }

        .erp-summary-value {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          font-variant-numeric: tabular-nums;
        }

        .erp-summary-total {
          border-top: 2px solid #d1d5db;
          padding-top: 12px;
          margin-top: 8px;
        }

        .erp-summary-total .erp-summary-value {
          font-size: 15px;
          color: #065f46;
        }

        .erp-toolbar {
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fafafa;
        }

        .erp-toolbar-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .erp-alert {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-left: 4px solid #f59e0b;
          color: #92400e;
          padding: 12px 16px;
          border-radius: 4px;
          font-size: 13px;
          margin: 16px 0;
        }

        @media (max-width: 768px) {
          .erp-filter-grid {
            grid-template-columns: 1fr;
          }

          .erp-summary-grid {
            grid-template-columns: 1fr;
          }

          .erp-table {
            font-size: 12px;
          }

          .erp-table thead th,
          .erp-table tbody td {
            padding: 8px 10px;
          }
        }

        @media print {
          .erp-filter-panel,
          .erp-toolbar,
          .erp-btn-group {
            display: none;
          }

          .erp-report-container {
            border: none;
          }
        }
      `}</style>

      <div className="erp-breadcrumb">
        <span onClick={() => navigate("/reports")}>Reports</span> › Customer
        Ledger
      </div>

      <h1 className="erp-page-title">Customer Ledger Report</h1>

      {/* FILTERS */}
      <div className="erp-filter-panel">
        <div className="erp-filter-grid">
          <div className="erp-form-group">
            <label className="erp-label">Report Type</label>
            <select
              className="erp-select"
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setFromDate("");
                setToDate("");
                setFinancialYear("");
              }}
            >
              <option value="custom">Custom Period</option>
              <option value="financial-year">Financial Year</option>
            </select>
          </div>

          {reportType === "custom" ? (
            <>
              <div className="erp-form-group">
                <label className="erp-label">From Date</label>
                <input
                  className="erp-input"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="erp-form-group">
                <label className="erp-label">To Date</label>
                <input
                  className="erp-input"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="erp-form-group">
              <label className="erp-label">Financial Year</label>
              <select
                className="erp-select"
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
              >
                <option value="">Select Year</option>
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
              </select>
            </div>
          )}

          <div className="erp-form-group">
            <CustomSearchDropdown
              label="Customer"
              onSelect={setCustomer}
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
        </div>

        <div className="erp-btn-group">
          <button
            className="erp-btn erp-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>

      {/* CUSTOMER HEADER */}
      {showReport && selectedCustomerDetails && (
        <div className="erp-customer-header">
          <div className="erp-customer-name">
            {selectedCustomerDetails.firmName || selectedCustomerDetails.name}
          </div>
          <div className="erp-customer-info">
            <div className="erp-customer-info-row">
              {selectedCustomerDetails.name}
            </div>
            {selectedCustomerDetails.address && (
              <div className="erp-customer-info-row">
                {selectedCustomerDetails.address}
              </div>
            )}
            <div className="erp-customer-info-row">
              Mobile: {selectedCustomerDetails.mobile}
            </div>
          </div>
        </div>
      )}

      {/* INFO MESSAGE */}
      {infoMessage && <div className="erp-alert">{infoMessage}</div>}

      {/* LEDGER TABLE */}
      {showReport && ledgerRows.length > 0 && (
        <div className="erp-report-container">
          <div className="erp-toolbar">
            <span className="erp-toolbar-title">Transaction Details</span>
            <button
              className="erp-btn erp-btn-secondary"
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <img src={pdf} alt="PDF" style={{ width: 16, height: 16 }} />
              {downloadingPDF ? "Downloading..." : "Export PDF"}
            </button>
          </div>

          <div className="erp-table-wrapper">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Particulars</th>
                  <th className="text-right">Debit (₹)</th>
                  <th className="text-right">Credit (₹)</th>
                  <th className="text-right">Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {finalLedgerRows.map((r, i) => (
                  <tr
                    key={i}
                    className={
                      r.isOpening
                        ? "row-opening"
                        : r.isClosing
                          ? "row-closing"
                          : ""
                    }
                  >
                    <td style={{ whiteSpace: "nowrap" }}>{r.date}</td>
                    <td>{r.particulars}</td>
                    <td
                      className={`text-right ${r.debit ? "amount-debit" : ""}`}
                    >
                      {r.debit || "—"}
                    </td>
                    <td
                      className={`text-right ${r.credit ? "amount-credit" : ""}`}
                    >
                      {r.credit || "—"}
                    </td>
                    <td className="text-right amount-balance">{r.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SUMMARY */}
          {summary && (
            <div className="erp-summary-panel">
              <div className="erp-summary-grid">
                <div>
                  <div className="erp-summary-item">
                    <span className="erp-summary-label">Total Debit:</span>
                    <span className="erp-summary-value amount-debit">
                      ₹ {formatAmount(summary.totalDebits)}
                    </span>
                  </div>
                  <div className="erp-summary-item">
                    <span className="erp-summary-label">Total Credit:</span>
                    <span className="erp-summary-value amount-credit">
                      ₹ {formatAmount(summary.totalCredits)}
                    </span>
                  </div>
                  <div className="erp-summary-item erp-summary-total">
                    <span className="erp-summary-label">Closing Balance:</span>
                    <span className="erp-summary-value">
                      ₹ {formatAmount(closingBalance)} {closingBalanceType}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {(loading || downloadingPDF) && <Loading />}
      {error && (
        <ErrorModal show={isModalOpen} onHide={closeModal} message={error} />
      )}
    </div>
  );
}

const containerStyle = {
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "24px",
  background: "#f9fafb",
  minHeight: "100vh",
};

export default LedgerReports;
