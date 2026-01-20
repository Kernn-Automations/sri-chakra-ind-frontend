import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
// import { isStoreEmployee } from "../../../utils/roleUtils"; // Unused
import ErrorModal from "@/components/ErrorModal";
import SuccessModal from "@/components/SuccessModal";
import Loading from "@/components/Loading";
import storeService from "../../../services/storeService";
import homeStyles from "../../Dashboard/HomePage/HomePage.module.css";
import salesStyles from "../../Dashboard/Sales/Sales.module.css";
import orderStyles from "./StoreSalesOrders.module.css";
import { handleExportPDF, handleExportExcel } from "@/utils/PDFndXLSGenerator";
import xls from "../../../images/xls-png.png";
import pdf from "../../../images/pdf-png.png";

export default function StoreBankReceipts() {
  const navigate = useNavigate();
  const { user, axiosAPI } = useAuth();
  const actualUser = user?.user || user || {};
  const inferredStoreId = actualUser?.storeId || actualUser?.store?.id || null;
  // const isEmployee = isStoreEmployee(actualUser); // Unused

  const [storeId, setStoreId] = useState(inferredStoreId);
  const [bankBalance, setBankBalance] = useState(0);
  const [storeName, setStoreName] = useState("");

  // Filter state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  // Separate applied filters to control when filtering happens (on Submit)
  const [appliedFilters, setAppliedFilters] = useState({ from: "", to: "" });

  const [loading, setLoading] = useState(false);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const [receipts, setReceipts] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Header Search States
  const [showSearch, setShowSearch] = useState({
    type: false,
    description: false,
    reference: false,
  });

  const [searchTerms, setSearchTerms] = useState({
    type: "",
    description: "",
    reference: "",
  });

  const toggleSearch = (key) => {
    setShowSearch((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = k === key ? !prev[k] : false;
      });
      return next;
    });
  };

  const handleSearchChange = (key, value) => {
    setSearchTerms((prev) => ({ ...prev, [key]: value }));
  };

  const clearSearch = (key) => {
    setSearchTerms((prev) => ({ ...prev, [key]: "" }));
  };

  const renderSearchHeader = (label, searchKey, dataAttr) => {
    const isSearching = showSearch[searchKey];
    const searchTerm = searchTerms[searchKey];

    return (
      <th
        onClick={() => toggleSearch(searchKey)}
        style={{
          cursor: "pointer",
          position: "relative",
          fontFamily: "Poppins",
          fontWeight: 600,
          fontSize: "13px",
        }}
        data-search-header="true"
        {...{ [dataAttr]: true }}
      >
        {isSearching ? (
          <div
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              placeholder={`Search ${label}...`}
              value={searchTerm}
              onChange={(e) => handleSearchChange(searchKey, e.target.value)}
              style={{
                flex: 1,
                padding: "2px 6px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "12px",
                minWidth: "120px",
                height: "28px",
                color: "#000",
                backgroundColor: "#fff",
              }}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearSearch(searchKey);
                }}
                style={{
                  padding: "4px 8px",
                  border: "1px solid #dc3545",
                  borderRadius: "4px",
                  background: "#dc3545",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                  minWidth: "24px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <>{label}</>
        )}
      </th>
    );
  };

  useEffect(() => {
    if (!storeId) {
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const user = userData.user || userData;
        let id = user?.storeId || user?.store?.id;

        if (!id) {
          const selectedStore = localStorage.getItem("selectedStore");
          if (selectedStore) {
            const store = JSON.parse(selectedStore);
            id = store.id;
          }
        }

        if (!id) {
          const currentStoreId = localStorage.getItem("currentStoreId");
          id = currentStoreId ? parseInt(currentStoreId) : null;
        }

        if (id) {
          setStoreId(id);
        }
      } catch (err) {
        console.error("Unable to parse stored user data", err);
        setError("Unable to determine store information. Please re-login.");
        setIsErrorModalOpen(true);
      }
    }
  }, [storeId]);

  // Fetch store bank balance
  const fetchStoreBankBalance = useCallback(async () => {
    if (!storeId) return;
    try {
      const res = await axiosAPI.get(`/stores/${storeId}/bank-balance`);
      console.log(res);
      const responseData = res.data || res;

      if (responseData.success) {
        setBankBalance(
          responseData.data?.availableBalance || responseData.data?.balance || 0
        );
        if (responseData.data?.storeName) {
          setStoreName(responseData.data.storeName);
        }
      }
    } catch (err) {
      console.error("Failed to fetch store bank balance", err);
    }
  }, [storeId, axiosAPI]);

  // Fetch bank receipts
  const fetchBankReceipts = useCallback(async () => {
    if (!storeId) return;
    setReceiptsLoading(true);
    try {
      const res = await axiosAPI.get(`/stores/${storeId}/bank-receipts`);
      const receiptsData = res.data?.data || res.data || res;
      const receiptsList = Array.isArray(receiptsData)
        ? receiptsData
        : receiptsData.receipts || receiptsData.data || [];
      console.log(res);
      setReceipts(receiptsList);
    } catch (err) {
      console.error("Failed to fetch bank receipts", err);
    } finally {
      setReceiptsLoading(false);
    }
  }, [storeId, axiosAPI]);

  // Fetch bank sales
  const fetchBankSales = useCallback(async () => {
    if (!storeId) return;
    try {
      // Fetching 100 most recent sales
      const res = await storeService.getStoreSales(storeId, { limit: 100 });
      if (res && res.success) {
        const allSales = res.data?.sales || res.data || [];
        // Filter for bank related payments
        const bankSales = allSales.filter((sale) => {
          const pm = (sale.paymentMethod || "").toLowerCase();
          return (
            pm === "bank" || pm === "both" || pm === "online" || pm === "upi"
          );
        });
        setSales(bankSales);
      }
    } catch (err) {
      console.error("Failed to fetch store sales", err);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchStoreBankBalance();
      fetchBankReceipts();
      fetchBankSales();
    }
  }, [storeId, fetchStoreBankBalance, fetchBankReceipts, fetchBankSales]);

  // Click outside functionality
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close header search if clicked outside
      if (!event.target.closest("[data-search-header]")) {
        setShowSearch({
          type: false,
          description: false,
          reference: false,
        });
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, []);

  // ESC key functionality
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setShowSearch({
          type: false,
          description: false,
          reference: false,
        });
        setSearchTerms({
          type: "",
          description: "",
          reference: "",
        });
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  // Handle image view
  const handleViewImage = (imageUrl) => {
    if (imageUrl) {
      setSelectedImage(imageUrl);
      setShowImageModal(true);
    }
  };

  const closeErrorModal = () => setIsErrorModalOpen(false);

  // Helper formats
  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const options = { day: "2-digit", month: "2-digit", year: "numeric" };
      if (includeTime) {
        options.hour = "2-digit";
        options.minute = "2-digit";
      }
      return date.toLocaleDateString("en-IN", options);
    } catch {
      return dateString;
    }
  };

  // Merge, sort, and filter transactions
  const getUnifiedTransactions = () => {
    const receiptItems = receipts.map((r) => ({
      id: `receipt-${r.id}`,
      originalId: r.id,
      date: r.createdAt || r.date || r.receiptDate,
      type: "Receipt (Deposit)",
      description: r.notes || "Bank Deposit",
      amount: parseFloat(r.amount || 0),
      isCredit: true,
      reference: r.utrNumber,
      proof: r.depositSlip || r.depositSlipUrl || r.image,
      raw: r,
    }));

    const saleItems = sales.map((s) => {
      let amount = 0;
      const pm = (s.paymentMethod || "").toLowerCase();
      if (pm === "both") {
        amount = parseFloat(s.bankAmount || 0);
      } else {
        amount = parseFloat(s.finalAmount || s.totalAmount || 0);
      }

      return {
        id: `sale-${s.id}`,
        originalId: s.id,
        date: s.createdAt || s.date,
        type: "Sale",
        description: `Order #${s.orderId || s.id}`,
        amount: amount,
        isCredit: true,
        reference: s.paymentMode || s.paymentMethod,
        proof: null,
        raw: s,
      };
    });

    let combined = [...receiptItems, ...saleItems].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    // Apply Column Header Search Filters
    if (searchTerms.type) {
      combined = combined.filter((item) =>
        item.type.toLowerCase().includes(searchTerms.type.toLowerCase())
      );
    }
    if (searchTerms.description) {
      combined = combined.filter((item) =>
        item.description
          .toLowerCase()
          .includes(searchTerms.description.toLowerCase())
      );
    }
    if (searchTerms.reference) {
      combined = combined.filter((item) =>
        (item.reference || "")
          .toLowerCase()
          .includes(searchTerms.reference.toLowerCase())
      );
    }

    // Apply Filters based on appliedFilters state
    if (appliedFilters.from) {
      const from = new Date(appliedFilters.from);
      from.setHours(0, 0, 0, 0);
      combined = combined.filter((item) => new Date(item.date) >= from);
    }
    if (appliedFilters.to) {
      const to = new Date(appliedFilters.to);
      to.setHours(23, 59, 59, 999);
      combined = combined.filter((item) => new Date(item.date) <= to);
    }

    return combined;
  };

  const transactions = getUnifiedTransactions();

  const handleFilterSubmit = () => {
    setAppliedFilters({ from: fromDate, to: toDate });
  };

  const handleFilterCancel = () => {
    setFromDate("");
    setToDate("");
    setAppliedFilters({ from: "", to: "" });
  };

  // Export Logic
  const onExport = (type) => {
    const arr = [];
    let x = 1;
    const columns = [
      "S.No",
      "Date",
      "Type",
      "Description",
      "Reference / UTR",
      "Amount",
    ];

    if (transactions && transactions.length > 0) {
      transactions.forEach((item) => {
        arr.push({
          "S.No": x++,
          Date: formatDate(item.date, true),
          Type: item.type,
          Description: item.description,
          "Reference / UTR": item.reference || "-",
          Amount: Number(item.amount || 0).toFixed(2),
        });
      });

      if (type === "PDF") handleExportPDF(columns, arr, "Bank_Transactions");
      else if (type === "XLS")
        handleExportExcel(columns, arr, "BankTransactions");
    } else {
      setError("Table is Empty");
      setIsErrorModalOpen(true);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div className={orderStyles.pageHeader}>
        <div>
          <h2>Bank Transactions</h2>
          <p className="path">
            <span
              onClick={() => navigate("/store/sales")}
              style={{ cursor: "pointer" }}
            >
              Sales
            </span>{" "}
            <i className="bi bi-chevron-right"></i> Bank Receipts
          </p>
        </div>
      </div>

      {!storeId && (
        <div
          className={homeStyles.orderStatusCard}
          style={{ marginBottom: "24px" }}
        >
          <p style={{ margin: 0, fontFamily: "Poppins" }}>
            Store details are missing. Please re-login to continue.
          </p>
        </div>
      )}

      {storeId && (
        <>
          {/* Store Bank Balance Display */}
          <div
            className={homeStyles.orderStatusCard}
            style={{ marginBottom: "24px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <h4
                  style={{
                    margin: 0,
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "20px",
                    color: "var(--primary-color)",
                  }}
                >
                  Store Bank Balance
                </h4>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontFamily: "Poppins",
                    color: "#6b7280",
                  }}
                >
                  {storeName || "Current Store"} (Estimated from Bank Payments)
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "Poppins",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#059669",
                  }}
                >
                  {formatCurrency(bankBalance)}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`${homeStyles.orderStatusCard} ${orderStyles.cardWrapper}`}
          >
            {/* Filters */}
            <div className={`row g-3 ${orderStyles.filtersRow}`}>
              <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 formcontent">
                <label>From :</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 formcontent">
                <label>To :</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className={orderStyles.buttonsRow}>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <button className="submitbtn" onClick={handleFilterSubmit}>
                  Submit
                </button>
                <button className="cancelbtn" onClick={handleFilterCancel}>
                  Cancel
                </button>
              </div>
            </div>

            {/* Export Section */}
            <div className={orderStyles.exportSection}>
              <div className={orderStyles.exportButtons}>
                <button
                  className={salesStyles.xls}
                  onClick={() => onExport("XLS")}
                >
                  <p>Export to </p>
                  <img src={xls} alt="Export to Excel" />
                </button>
                <button
                  className={salesStyles.xls}
                  onClick={() => onExport("PDF")}
                >
                  <p>Export to </p>
                  <img src={pdf} alt="Export to PDF" />
                </button>
              </div>
            </div>

            {/* Unified Transactions Table */}
            <div className={`${orderStyles.tableContainer} table-responsive`}>
              {receiptsLoading || loading ? (
                <div className="text-center" style={{ padding: "20px" }}>
                  <Loading />
                </div>
              ) : transactions.length === 0 ? (
                <div
                  className="text-center"
                  style={{ padding: "40px", color: "#666" }}
                >
                  No bank transactions found for the selected period
                </div>
              ) : (
                <table className="table table-hover table-bordered borderedtable">
                  <thead>
                    <tr>
                      <th
                        style={{
                          fontFamily: "Poppins",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        S.No
                      </th>
                      <th
                        style={{
                          fontFamily: "Poppins",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        Date
                      </th>
                      {renderSearchHeader("Type", "type", "data-type-header")}
                      {renderSearchHeader(
                        "Description",
                        "description",
                        "data-desc-header"
                      )}
                      {renderSearchHeader(
                        "Reference / UTR",
                        "reference",
                        "data-ref-header"
                      )}
                      <th
                        className="text-end"
                        style={{
                          fontFamily: "Poppins",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        Amount (₹)
                      </th>
                      <th
                        style={{
                          fontFamily: "Poppins",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        Proof
                      </th>
                    </tr>
                    {(searchTerms.type ||
                      searchTerms.description ||
                      searchTerms.reference) && (
                      <tr>
                        <td
                          colSpan="7"
                          style={{
                            padding: "4px 12px",
                            fontSize: "12px",
                            borderRadius: "0",
                            backgroundColor: "#f8f9fa",
                            color: "#666",
                          }}
                        >
                          {transactions.length} records found
                        </td>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {transactions.map((tx, index) => (
                      <tr key={tx.id}>
                        <td>{index + 1}</td>
                        <td>{formatDate(tx.date, true)}</td>
                        <td>
                          <span
                            className={`${orderStyles.statusBadge} ${
                              tx.type.includes("Sale")
                                ? orderStyles.pending
                                : orderStyles.completed
                            }`}
                            style={{
                              backgroundColor: tx.type.includes("Sale")
                                ? "#e0f2fe"
                                : "#dcfce7",
                              color: tx.type.includes("Sale")
                                ? "#0369a1"
                                : "#15803d",
                              borderColor: tx.type.includes("Sale")
                                ? "#bae6fd"
                                : "#bbf7d0",
                              minWidth: "auto",
                            }}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td>{tx.description}</td>
                        <td style={{ fontFamily: "monospace" }}>
                          {tx.reference || "-"}
                        </td>
                        <td
                          className="text-end"
                          style={{ fontWeight: 600, color: "#059669" }}
                        >
                          {Number(tx.amount || 0).toFixed(2)}
                        </td>
                        <td>
                          {tx.proof ? (
                            <button
                              className="submitbtn"
                              style={{
                                padding: "2px 8px",
                                fontSize: "12px",
                                minWidth: "auto",
                              }}
                              onClick={() => handleViewImage(tx.proof)}
                              title="View Document"
                            >
                              <i className="bi bi-eye"></i> View
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light" style={{ fontWeight: "bold" }}>
                    <tr>
                      <td colSpan="5" className="text-end">
                        Total
                      </td>
                      <td className="text-end" style={{ color: "#059669" }}>
                        {formatCurrency(
                          transactions.reduce(
                            (sum, item) => sum + (Number(item.amount) || 0),
                            0
                          )
                        )}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Image View Modal (Reused) */}
      {showImageModal && selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000,
            padding: 0,
          }}
          onClick={() => {
            setShowImageModal(false);
            setSelectedImage(null);
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100vw",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              background: "#000",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                padding: "20px",
                zIndex: 10001,
                background:
                  "linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent)",
              }}
            >
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedImage(null);
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  fontSize: "28px",
                  color: "#fff",
                  cursor: "pointer",
                  padding: 0,
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  transition: "all 0.3s ease",
                  backdropFilter: "blur(10px)",
                }}
                title="Close"
              >
                ×
              </button>
            </div>
            <div
              style={{
                width: "100%",
                height: "100%",
                padding: 0,
                overflow: "auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <img
                src={selectedImage}
                alt="Receipt Slip"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
                onError={(e) => {
                  e.target.src = "";
                  e.target.alt = "Failed to load image";
                }}
              />
            </div>
          </div>
        </div>
      )}

      {loading && <Loading />}
      <ErrorModal
        isOpen={isErrorModalOpen}
        message={error}
        onClose={closeErrorModal}
      />
      {/* SuccessModal removed as creation is removed */}
    </div>
  );
}
