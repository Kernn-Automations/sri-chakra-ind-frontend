import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Auth";
import storeService from "../../../services/storeService";
import { isAdmin } from "../../../utils/roleUtils";
import Loading from "../../Loading";
import ErrorModal from "../../ErrorModal";
import CustomSearchDropdown from "../../../utils/CustomSearchDropDown";
import styles from "./StoreSalesOrders.module.css";
import homeStyles from "../../Dashboard/HomePage/HomePage.module.css";
import inventoryStyles from "../../Dashboard/Inventory/Inventory.module.css";
import xls from "../../../images/xls-png.png";
import pdf from "../../../images/pdf-png.png";
import { handleExportExcel } from "../../../utils/PDFndXLSGenerator";

function StoreSalesReports({ onBack }) {
  const { axiosAPI } = useAuth();
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storeId, setStoreId] = useState(null);
  const [responseData, setResponseData] = useState(null); // Store full response for summary totals
  const [customers, setCustomers] = useState([]);
  const [filteredSalesData, setFilteredSalesData] = useState([]);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);

  // Header Search Visibility States
  const [showSearch, setShowSearch] = useState({
    productName: false,
    stockIssuedTo: false,
    villageName: false,
    createdBy: false,
  });

  // Header Search Term States
  const [searchTerms, setSearchTerms] = useState({
    productName: "",
    stockIssuedTo: "",
    villageName: "",
    createdBy: "",
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

  const openPaymentPopup = (row) => {
    setSelectedSale(row);
    setShowPaymentPopup(true);
  };

  const closePaymentPopup = () => {
    setSelectedSale(null);
    setShowPaymentPopup(false);
  };

  const handleSearchChange = (key, value) => {
    setSearchTerms((prev) => ({ ...prev, [key]: value }));
  };

  const clearSearch = (key) => {
    setSearchTerms((prev) => ({ ...prev, [key]: "" }));
  };

  const sectionBox = {
    marginBottom: 16,
    padding: 12,
    background: "#f9fafb",
    borderRadius: 6,
    border: "1px solid #e5e7eb",
  };

  const sectionTitle = {
    fontWeight: 600,
    marginBottom: 8,
  };

  const invoiceCard = {
    padding: 10,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    marginBottom: 10,
  };

  const amountRow = {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 8,
    fontWeight: 600,
  };

  const proofThumb = {
    width: 70,
    height: 70,
    objectFit: "cover",
    cursor: "zoom-in",
    borderRadius: 6,
    border: "1px solid #ddd",
    marginTop: 8,
  };

  const backdropStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  };

  const modalWideStyle = {
    background: "#fff",
    width: "90vw",
    maxWidth: "1100px",
    maxHeight: "85vh",
    overflowY: "auto",
    borderRadius: "10px",
    padding: "20px",
    fontFamily: "Poppins",
  };

  const popupHeader = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const closeBtn = {
    border: "none",
    background: "transparent",
    fontSize: "18px",
    cursor: "pointer",
  };

  const infoGrid = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    fontSize: "13px",
  };

  const paymentCard = {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "12px",
  };

  const paymentRow = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "6px",
  };

  const badge = (method) => ({
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 600,
    background:
      method === "cash" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
    color: method === "cash" ? "#047857" : "#1d4ed8",
  });

  const mutedText = {
    fontSize: "12px",
    color: "#6b7280",
  };

  const proofImg = {
    width: "140px",
    borderRadius: "6px",
    cursor: "zoom-in",
    border: "1px solid #e5e7eb",
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
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    customerId: null,
    modeOfPayment: "",
  });

  useEffect(() => {
    // Get store ID from multiple sources (same as StoreSalesOrders)
    try {
      let id = null;

      // Try from selectedStore in localStorage
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        try {
          const store = JSON.parse(selectedStore);
          id = store.id;
        } catch (e) {
          console.error("Error parsing selectedStore:", e);
        }
      }

      // Fallback to currentStoreId
      if (!id) {
        const currentStoreId = localStorage.getItem("currentStoreId");
        id = currentStoreId ? parseInt(currentStoreId) : null;
      }

      // Fallback to user object
      if (!id) {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const user = userData.user || userData;
        id = user?.storeId || user?.store?.id;
      }

      if (id) {
        setStoreId(id);
      } else {
        setError("Store information missing. Please re-login to continue.");
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Unable to parse stored user data", err);
      setError("Unable to determine store information. Please re-login.");
      setIsModalOpen(true);
    }
  }, []);

  // Fetch customers when storeId is available
  useEffect(() => {
    if (storeId) {
      fetchCustomers();
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchSalesData();
    }
  }, [storeId, filters]);

  const fetchCustomers = async () => {
    if (!storeId) return;

    try {
      const response = await storeService.getStoreCustomers(storeId, {
        limit: 1000,
      });
      const customersData = response.data || response.customers || [];
      setCustomers(Array.isArray(customersData) ? customersData : []);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
    }
  };

  const fetchSalesData = async () => {
    if (!storeId) return;

    setLoading(true);
    setError(null);
    try {
      const params = {};

      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (filters.customerId) params.customerId = filters.customerId;
      if (filters.modeOfPayment) params.modeOfPayment = filters.modeOfPayment;
      console.log('SALE PARAMS:', params);
      params.limit = 1000; // Get all records for report

      // Check if user is admin to use admin endpoint
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const user = userData.user || userData;
      const isAdminUser = isAdmin(user);

      // Use the new sales reports endpoints
      const response = isAdminUser
        ? await storeService.getStoreSalesReportsAdmin(storeId, params)
        : await storeService.getStoreSalesReports(storeId, params);

      console.log("Sales Reports :", response);
      // Handle backend response format
      // New backend structure: response.data is an array with simplified fields
      const salesData = response.data || response.sales || response || [];

      console.log("Sales Reports - Backend response:", response);
      console.log("Sales Reports - Sales data array:", salesData);

      // Transform data to match table format
      // Backend now returns: { date, productName, customerName, villageName, phoneNumber, qty, amount, modeOfPayment }
      // May also have nested customer object: { customer: { villageName, mobile, farmerName } }
      const mappedData = [];

      if (Array.isArray(salesData)) {
        salesData.forEach((item, index) => {
          console.log(`Sales Reports - Processing item ${index}:`, item);
          console.log(
            `Sales Reports - Item ${index} villageName:`,
            item.villageName,
            "customer:",
            item.customer
          );
          // Map payment method to uppercase display format
          let paymentMethod = "";
          const method = (item.modeOfPayment || "").toUpperCase();
          if (method === "CASH") {
            paymentMethod = "CASH";
          } else if (method === "BANK") {
            paymentMethod = "BANK";
          } else if (
            method === "PHONE PAY" ||
            method === "PHONEPAY" ||
            method === "UPI"
          ) {
            paymentMethod = "PHONE PAY";
          } else if (method && method !== "") {
            paymentMethod = method;
          } else {
            paymentMethod = "NEED TO COLLECT";
          }

          // Handle village name - check multiple possible field names and formats
          let villageName = "";
          if (item.villageName) {
            villageName = item.villageName.trim();
            if (
              villageName === "" ||
              villageName === "-" ||
              villageName.toLowerCase() === "null"
            ) {
              villageName = "";
            }
          } else if (item.customer?.villageName) {
            villageName = item.customer.villageName.trim();
            if (
              villageName === "" ||
              villageName === "-" ||
              villageName.toLowerCase() === "null"
            ) {
              villageName = "";
            }
          }

          // Handle phone number - check multiple possible field names and formats
          let phoneNumber = "";
          if (item.phoneNumber) {
            phoneNumber = item.phoneNumber.trim();
            if (
              phoneNumber === "" ||
              phoneNumber === "-" ||
              phoneNumber.toLowerCase() === "null"
            ) {
              phoneNumber = "";
            }
          } else if (item.customer?.mobile) {
            phoneNumber = item.customer.mobile.trim();
            if (
              phoneNumber === "" ||
              phoneNumber === "-" ||
              phoneNumber.toLowerCase() === "null"
            ) {
              phoneNumber = "";
            }
          }

          mappedData.push({
            date: item.date || "",
            productName: item.productName || "N/A",
            stockIssuedTo:
              item.customerName ||
              item.customer?.farmerName ||
              item.customer?.name ||
              "Customer",
            villageName: villageName,
            phoneNumber: phoneNumber,
            utrNumber:
              item.utrNumber ||
              item.transactionNumber ||
              item.transactionId ||
              item.utr ||
              "-",
            quantity: parseFloat(item.qty || item.quantity || 0),
            amount: parseFloat(item.itemAmount || 0),
            freightCharges: parseFloat(item.freightCharges || 0),
            modeOfPayment: paymentMethod,
            createdBy:
              item.employeeName ||
              item.createdByEmployee?.name ||
              item.createdByUser?.name ||
              "-",
            // ✅ NEW (IMPORTANT)
            saleId: item.saleId,
            saleCode: item.saleCode,
            paymentDetails: item.paymentDetails || [], // <-- contains transactionNumber & proof
            invoiceDetails: item.invoiceDetails || [], // <-- array of invoices
            invoiceNumber:
              item.invoiceNumber || item.invoice?.invoiceNumber || "",
          });
        });
      }

      setSalesData(mappedData);
      setResponseData(response); // Store full response for summary totals
    } catch (err) {
      console.error("Error fetching sales data:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch sales data."
      );
      setIsModalOpen(true);
      setSalesData([]);
      setResponseData(null);
    } finally {
      setLoading(false);
    }
  };

  // Click outside functionality
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest("[data-search-header]")) {
        setShowSearch({
          productName: false,
          stockIssuedTo: false,
          villageName: false,
          createdBy: false,
        });
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  // ESC key functionality
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setShowSearch({
          productName: false,
          stockIssuedTo: false,
          villageName: false,
          createdBy: false,
        });
        setSearchTerms({
          productName: "",
          stockIssuedTo: "",
          villageName: "",
          createdBy: "",
        });
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  // Filtering Logic
  useEffect(() => {
    let filtered = salesData;
    if (searchTerms.productName) {
      filtered = filtered.filter((item) =>
        item.productName
          ?.toLowerCase()
          .includes(searchTerms.productName.toLowerCase())
      );
    }
    if (searchTerms.stockIssuedTo) {
      filtered = filtered.filter((item) =>
        item.stockIssuedTo
          ?.toLowerCase()
          .includes(searchTerms.stockIssuedTo.toLowerCase())
      );
    }
    if (searchTerms.villageName) {
      filtered = filtered.filter((item) =>
        item.villageName
          ?.toLowerCase()
          .includes(searchTerms.villageName.toLowerCase())
      );
    }
    if (searchTerms.createdBy) {
      filtered = filtered.filter((item) =>
        item.createdBy
          ?.toLowerCase()
          .includes(searchTerms.createdBy.toLowerCase())
      );
    }
    setFilteredSalesData(filtered);
  }, [salesData, searchTerms]);

  // Format date to DD-Mon-YY format
  // Handles both "DD-MM-YYYY" format from backend and ISO date strings
  const formatDate = (dateString) => {
    if (!dateString) return "";

    // Check if date is in "DD-MM-YYYY" format (from backend)
    const ddmmyyyyPattern = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = dateString.match(ddmmyyyyPattern);

    if (match) {
      // Already in DD-MM-YYYY format, convert to DD-Mon-YY
      const [, day, month, year] = match;
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthIndex = parseInt(month, 10) - 1;
      const monthName = months[monthIndex] || month;
      const yearShort = year.slice(-2);
      return `${day}-${monthName}-${yearShort}`;
    }

    // Try parsing as ISO date or other format
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return as-is if can't parse
      }
      const day = String(date.getDate()).padStart(2, "0");
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = months[date.getMonth()];
      const year = String(date.getFullYear()).slice(-2);
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateString; // Return as-is if parsing fails
    }
  };

  // Format amount with Indian number format
  const formatAmount = (amount) => {
    if (!amount) return "0";
    return parseFloat(amount).toLocaleString("en-IN");
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    fetchSalesData();
  };

  const handleCancel = () => {
    setFilters({
      fromDate: "",
      toDate: "",
      customerId: null,
      modeOfPayment: "",
    });
  };

  const closeModal = () => setIsModalOpen(false);

  // Export functionality
  const handleExport = async (type) => {
    if (!storeId) {
      setError("Store information missing. Please re-login to continue.");
      setIsModalOpen(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {};

      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (filters.customerId) params.customerId = filters.customerId;
      if (filters.modeOfPayment) params.modeOfPayment = filters.modeOfPayment;

      // Check if user is admin
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const user = userData.user || userData;
      const isAdminUser = isAdmin(user);

      // Build endpoint based on user role
      const endpoint = isAdminUser
        ? `/stores/admin/${storeId}/reports/sales/export/${type === "PDF" ? "pdf" : "excel"}`
        : `/stores/${storeId}/reports/sales/export/${type === "PDF" ? "pdf" : "excel"}`;

      console.log("Export endpoint:", endpoint);
      console.log("Export params:", params);

      // Build query string for params
      const queryParams = new URLSearchParams(params).toString();
      const fullEndpoint = `${endpoint}${queryParams ? `?${queryParams}` : ""}`;

      if (type === "XLS") {
        const columns = [
          "S.No",
          "Date",
          "Product Name",
          "Stock Issued To",
          "Village Name",
          "Phone Number",
          "Qty",
          "Amount",
          "Mode Of Payment",
          "Created By",
        ];

        const data = filteredSalesData.map((row, index) => [
          index + 1,
          formatDate(row.date),
          row.productName,
          row.stockIssuedTo,
          row.villageName || "-",
          row.phoneNumber || "-",
          row.quantity,
          row.amount,
          row.modeOfPayment,
          row.createdBy,
        ]);

        handleExportExcel(columns, data, "Store Sales Report");
        console.log("XLS export initiated locally");
        return;
      }

      // Use getpdf method which is configured for blob responses (works for both PDF and Excel)
      const response = await axiosAPI.getpdf(fullEndpoint);

      // Check if we got a valid response
      if (!response.data) {
        throw new Error("No data received from server");
      }

      // Check if it's a proper blob
      if (!(response.data instanceof Blob)) {
        console.error("Response is not a blob:", response.data);
        throw new Error("Invalid response format - expected blob");
      }

      // Check if blob has content
      if (response.data.size === 0) {
        throw new Error("Received empty file from server");
      }

      // Create download link
      const downloadUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = downloadUrl;
      const dateStr = new Date().toISOString().split("T")[0];
      link.download = `store-sales-report-${dateStr}.${type === "PDF" ? "pdf" : "xlsx"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log(`${type} download initiated successfully`);
    } catch (err) {
      console.error(`Error exporting ${type}:`, err);
      setError(
        err.response?.data?.message ||
          err.message ||
          `Failed to export ${type}. Please try again.`
      );
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <p className="path">
            <span onClick={() => navigate("/store/sales")}>Sales</span>{" "}
            <i className="bi bi-chevron-right"></i> Reports
          </p>
        </div>
      </div>

      {loading && <Loading />}

      <div className={`${homeStyles.orderStatusCard} ${styles.cardWrapper}`}>
        <div className={`row g-3 ${styles.filtersRow}`}>
          <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 formcontent">
            <label>From :</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => handleFilterChange("fromDate", e.target.value)}
            />
          </div>
          <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 formcontent">
            <label>To :</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => handleFilterChange("toDate", e.target.value)}
            />
          </div>

          <CustomSearchDropdown
            label="Customer"
            onSelect={(value) => handleFilterChange("customerId", value)}
            options={customers.map((customer) => ({
              value: customer.id,
              label:
                customer.farmerName ||
                customer.name ||
                customer.customerName ||
                `Customer ${customer.id}`,
            }))}
          />

          <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 formcontent">
            <label>Mode of Payment :</label>
            <select
              value={filters.modeOfPayment}
              onChange={(e) =>
                handleFilterChange("modeOfPayment", e.target.value)
              }
            >
              <option value="">All</option>
              <option value="CASH">CASH</option>
              <option value="BANK">BANK</option>
              <option value="BOTH">BOTH</option>
            </select>
          </div>
        </div>

        <div className={styles.buttonsRow}>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <button className="submitbtn" onClick={handleSubmit}>
              Submit
            </button>
            <button className="cancelbtn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>

        {/* Export buttons - only show when there's data */}
        {salesData.length > 0 && (
          <div className="row m-0 p-3 justify-content-around">
            <div className="col-lg-5">
              <button
                className={inventoryStyles.xls}
                onClick={() => handleExport("XLS")}
                disabled={loading}
              >
                <p>Export to </p>
                <img src={xls} alt="" />
              </button>
              <button
                className={inventoryStyles.xls}
                onClick={() => handleExport("PDF")}
                disabled={loading}
              >
                <p>Export to </p>
                <img src={pdf} alt="" />
              </button>
            </div>
          </div>
        )}

        <div className={`${styles.tableContainer} table-responsive`}>
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
                {renderSearchHeader(
                  "Product Name",
                  "productName",
                  "data-product-header"
                )}
                {renderSearchHeader(
                  "Stock Issued To",
                  "stockIssuedTo",
                  "data-customer-header"
                )}
                {renderSearchHeader(
                  "Village Name",
                  "villageName",
                  "data-village-header"
                )}
                <th
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Phone Number
                </th>
                <th
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  UTR Number
                </th>
                <th
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Amount
                </th>
                <th
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "13px",
                    textAlign: "right",
                  }}
                >
                  Other Amount
                </th>

                <th
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Mode Of Payment
                </th>
                <th>Transaction Number</th>
                {renderSearchHeader(
                  "Created By",
                  "createdBy",
                  "data-employee-header"
                )}
                <th
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Action
                </th>
              </tr>
              {(searchTerms.productName ||
                searchTerms.stockIssuedTo ||
                searchTerms.villageName ||
                searchTerms.createdBy) && (
                <tr>
                  <td
                    colSpan="12"
                    style={{
                      padding: "4px 12px",
                      fontSize: "12px",
                      borderRadius: "0",
                      backgroundColor: "#f8f9fa",
                      color: "#666",
                    }}
                  >
                    {filteredSalesData.length} records found
                  </td>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="10"
                    className="text-center"
                    style={{ padding: "20px" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredSalesData.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="text-center"
                    style={{ padding: "20px" }}
                  >
                    No sales data found
                  </td>
                </tr>
              ) : (
                filteredSalesData.map((row, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{formatDate(row.date)}</td>
                    <td>{row.productName}</td>
                    <td>{row.stockIssuedTo}</td>
                    <td>{row.villageName || "-"}</td>
                    <td>{row.phoneNumber || "-"}</td>
                    <td>{row.utrNumber || "-"}</td>
                    <td style={{ textAlign: "right" }}>{row.quantity}</td>
                    <td style={{ textAlign: "right" }}>
                      ₹{formatAmount(row.amount)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      ₹
                      {formatAmount(
                        (parseFloat(row.freightCharges) || 0) +
                          (parseFloat(row.fridgeAmount) || 0)
                      )}
                    </td>

                    <td>{row.modeOfPayment || "-"}</td>
                    <td style={{ fontSize: "12px" }}>
                      {row.paymentDetails?.length > 0
                        ? row.paymentDetails
                            .map((p) => p.transactionNumber)
                            .filter(Boolean)
                            .join(", ")
                        : "-"}
                    </td>

                    <td>{row.createdBy}</td>

                    <td style={{ textAlign: "center" }}>
                      <button
                        className="homebtn"
                        style={{ fontSize: "11px", padding: "4px 10px" }}
                        onClick={() => openPaymentPopup(row)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {salesData.length > 0 && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              fontFamily: "Poppins",
            }}
          >
            <div>
              <strong>Total Records: </strong>
              {filteredSalesData.length}
            </div>
            <div>
              <strong>Total Quantity: </strong>
              {filteredSalesData.reduce(
                (sum, row) => sum + (parseFloat(row.quantity) || 0),
                0
              )}
              bags
            </div>
            <div>
              <strong>Total Tonns: </strong>
              {(
                filteredSalesData.reduce(
                  (sum, row) => sum + (parseFloat(row.quantity) || 0),
                  0
                ) / 20
              ).toFixed(2)}
              tns
            </div>
            <div>
              <strong>Sub Total Amount: </strong>₹
              {formatAmount(
                filteredSalesData.reduce(
                  (sum, row) => sum + (parseFloat(row.amount) || 0),
                  0
                ) -
                  filteredSalesData.reduce(
                    (sum, row) =>
                      sum +
                      (parseFloat(row.freightCharges) || 0) +
                      (parseFloat(row.fridgeAmount) || 0),
                    0
                  )
              )}
            </div>
            <div>
              <strong>Total Freight Amount: </strong>₹
              {formatAmount(
                filteredSalesData.reduce(
                  (sum, row) =>
                    sum +
                    (parseFloat(row.freightCharges) || 0) +
                    (parseFloat(row.fridgeAmount) || 0),
                  0
                )
              )}
            </div>
            <div>
              <strong>Total Amount: </strong>₹
              {formatAmount(
                filteredSalesData.reduce(
                  (sum, row) => sum + (parseFloat(row.amount) || 0),
                  0
                )
              )}
            </div>
          </div>
        )}
      </div>

      {showPaymentPopup && selectedSale && (
        <div style={backdropStyle}>
          <div style={modalWideStyle}>
            {/* HEADER */}
            <div style={popupHeader}>
              <h5>Sale • Invoice • Payment Details</h5>
              <button onClick={closePaymentPopup} style={closeBtn}>
                ✕
              </button>
            </div>

            {/* SALE DETAILS */}
            <div style={sectionBox}>
              <h6 style={sectionTitle}>Sale Details</h6>
              <div style={infoGrid}>
                <div>
                  <strong>Sale Code:</strong> {selectedSale.saleCode}
                </div>
                <div>
                  <strong>Date:</strong> {formatDate(selectedSale.date)}
                </div>
                <div>
                  <strong>Customer:</strong>{" "}
                  {selectedSale.customerName || selectedSale.stockIssuedTo}
                </div>
                <div>
                  <strong>Mode:</strong> {selectedSale.modeOfPayment}
                </div>
                <div>
                  <strong>Freight Charges:</strong> ₹
                  {Number(selectedSale.freightCharges || 0).toLocaleString(
                    "en-IN"
                  )}
                </div>
              </div>
            </div>

            {/* INVOICE DETAILS */}
            <div style={sectionBox}>
              <h6 style={sectionTitle}>Invoice Details</h6>
              {console.log("selectedSale", selectedSale)}
              {selectedSale.invoiceDetails?.length > 0 ? (
                selectedSale.invoiceDetails.map((inv, i) => (
                  <div key={i} style={invoiceCard}>
                    <div>
                      <strong>Invoice No:</strong> {inv.invoiceNumber}
                    </div>
                    <div>
                      <strong>Date:</strong> {formatDate(inv.invoiceDate)}
                    </div>
                    <div>
                      <strong>Type:</strong> {inv.type}
                    </div>
                    <div>
                      <strong>Status:</strong> {inv.paymentStatus}
                    </div>

                    <div style={amountRow}>
                      <span>
                        Subtotal: ₹
                        {Number(inv.totalAmount || 0).toLocaleString("en-IN")}
                      </span>
                      <span>
                        Tax: ₹
                        {Number(inv.taxAmount || 0).toLocaleString("en-IN")}
                      </span>
                      <strong>
                        Total: ₹
                        {Number(inv.grandTotal || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                ))
              ) : (
                <div style={mutedText}>No invoice available</div>
              )}
            </div>

            {/* PAYMENT DETAILS */}
            <div style={sectionBox}>
              <h6 style={sectionTitle}>Payment Details</h6>

              {selectedSale.paymentDetails?.length > 0 ? (
                selectedSale.paymentDetails.map((p, i) => {
                  const imgSrc = p.paymentProof
                    ? p.paymentProof.startsWith("data:image")
                      ? p.paymentProof
                      : `data:image/jpeg;base64,${p.paymentProof}`
                    : null;

                  return (
                    <div key={i} style={paymentCard}>
                      <div style={paymentRow}>
                        <span style={badge(p.method)}>
                          {(p.method || "").toUpperCase()}
                        </span>
                        <strong>
                          ₹{Number(p.amount || 0).toLocaleString("en-IN")}
                        </strong>
                      </div>

                      {p.transactionNumber && (
                        <div style={mutedText}>
                          Txn No: {p.transactionNumber}
                        </div>
                      )}

                      {p.transactionDate && (
                        <div style={mutedText}>
                          Date: {formatDate(p.transactionDate)}
                        </div>
                      )}

                      {imgSrc && (
                        <img
                          src={imgSrc}
                          alt="Payment Proof"
                          style={proofThumb}
                          onClick={() => setZoomImage(imgSrc)}
                        />
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={mutedText}>No payment records</div>
              )}
            </div>
          </div>
        </div>
      )}

      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            cursor: "zoom-out",
          }}
        >
          <img
            src={zoomImage}
            alt="Zoomed Payment Proof"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 8,
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </div>
  );
}

export default StoreSalesReports;
