import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Table } from "react-bootstrap";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import storeService from "../../../services/storeService";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import inventoryStyles from "../../Dashboard/Inventory/Inventory.module.css";
import { handleExportPDF, handleExportExcel } from "@/utils/PDFndXLSGenerator";
import xls from "../../../images/xls-png.png";
import pdf from "../../../images/pdf-png.png";

function StoreStockSummary() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [tempFrom, setTempFrom] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [tempTo, setTempTo] = useState(new Date().toISOString().slice(0, 10));
  const [dateRange, setDateRange] = useState("custom");
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [summaryTotals, setSummaryTotals] = useState(null);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("summary"); // "summary", "stats", "audit", "opening-closing"
  const [auditTrail, setAuditTrail] = useState([]);
  const [openingClosing, setOpeningClosing] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [productSalesDetails, setProductSalesDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [storeId, setStoreId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Invoice Details Modal States
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [zoomImage, setZoomImage] = useState(null);

  // Filtered data states
  const [filteredStockData, setFilteredStockData] = useState([]);
  const [filteredStatsByStore, setFilteredStatsByStore] = useState([]);
  const [filteredAuditTrail, setFilteredAuditTrail] = useState([]);
  const [filteredOpeningClosing, setFilteredOpeningClosing] = useState([]);

  const [showPrices, setShowPrices] = useState(false);

  const openInvoicePopup = (orderIdOrTransferNum, invoices = []) => {
    // Find by orderId (for sales) or transferNumber (for transfers)
    const invoice = invoices.find(
      (inv) =>
        inv.saleCode === orderIdOrTransferNum ||
        inv.transferNumber === orderIdOrTransferNum ||
        inv.saleId === orderIdOrTransferNum ||
        inv.transferId === orderIdOrTransferNum,
    );

    if (invoice) {
      setSelectedInvoice(invoice);
      setShowInvoicePopup(true);
    } else {
      console.error("Invoice details not found for:", orderIdOrTransferNum);
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "-";
    return new Date(isoDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderBase64Image = (base64) => {
    if (!base64) return null;

    // If backend sends raw base64 (no prefix)
    const src = base64.startsWith("data:")
      ? base64
      : `data:image/jpeg;base64,${base64}`;

    return (
      <img
        src={src}
        alt="Payment Proof"
        style={{
          maxWidth: "120px",
          maxHeight: "120px",
          borderRadius: 6,
          border: "1px solid #e5e7eb",
        }}
      />
    );
  };

  const getBase64Src = (b64) =>
    b64?.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`;

  const imgSrc = (b64) =>
    b64?.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`;

  const bodyStyle = {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: 20,
    overflow: "hidden",
  };

  const columnScroll = {
    overflowY: "auto",
    paddingRight: 6,
  };

  const sectionTitle = {
    fontWeight: 600,
    marginBottom: 8,
  };

  const divider = {
    borderTop: "1px solid #e5e7eb",
    margin: "14px 0",
  };

  const paymentCard = {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  };

  const proofThumb = {
    width: 120,
    borderRadius: 8,
    cursor: "zoom-in",
    border: "1px solid #e5e7eb",
    marginTop: 6,
  };

  const totalBox = {
    background: "#f9fafb",
    padding: 14,
    borderRadius: 10,
    textAlign: "right",
    fontWeight: 700,
  };

  const closeBtn = {
    marginTop: 14,
    padding: "10px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  };

  /* Image Zoom */
  const zoomBackdrop = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  };

  const zoomImage1 = {
    maxWidth: "90vw",
    maxHeight: "90vh",
    borderRadius: 12,
  };
  const zoomImageStyle = {
    maxWidth: "90vw",
    maxHeight: "90vh",
    objectFit: "contain",
    borderRadius: 12,
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  };

  // Search Visibility states
  const [showSearch, setShowSearch] = useState({
    summaryProduct: false,
    summarySku: false,
    statsStore: false,
    statsCode: false,
    auditProduct: false,
    auditSku: false,
    auditType: false,
    auditRef: false,
    ocProduct: false,
    ocSku: false,
  });

  // Search Term states
  const [searchTerms, setSearchTerms] = useState({
    summaryProduct: "",
    summarySku: "",
    statsStore: "",
    statsCode: "",
    auditProduct: "",
    auditSku: "",
    auditType: "",
    auditRef: "",
    ocProduct: "",
    ocSku: "",
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

  // ESC key functionality
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setShowSearch({
          summaryProduct: false,
          summarySku: false,
          statsStore: false,
          statsCode: false,
          auditProduct: false,
          auditSku: false,
          auditType: false,
          auditRef: false,
          ocProduct: false,
          ocSku: false,
        });
        setSearchTerms({
          summaryProduct: "",
          summarySku: "",
          statsStore: "",
          statsCode: "",
          auditProduct: "",
          auditSku: "",
          auditType: "",
          auditRef: "",
          ocProduct: "",
          ocSku: "",
        });
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  // Click outside functionality
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest("[data-search-header]")) {
        setShowSearch({
          summaryProduct: false,
          summarySku: false,
          statsStore: false,
          statsCode: false,
          auditProduct: false,
          auditSku: false,
          auditType: false,
          auditRef: false,
          ocProduct: false,
          ocSku: false,
        });
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  // Filtering Logic for each tab
  useEffect(() => {
    let filtered = stockData;
    if (searchTerms.summaryProduct) {
      filtered = filtered.filter((item) =>
        item.productName
          ?.toLowerCase()
          .includes(searchTerms.summaryProduct.toLowerCase()),
      );
    }
    if (searchTerms.summarySku) {
      filtered = filtered.filter((item) =>
        item.productSKU
          ?.toLowerCase()
          .includes(searchTerms.summarySku.toLowerCase()),
      );
    }
    setFilteredStockData(filtered);
  }, [stockData, searchTerms.summaryProduct, searchTerms.summarySku]);

  useEffect(() => {
    let filtered = stats?.stockByStore || [];
    if (searchTerms.statsStore) {
      filtered = filtered.filter((store) =>
        store.storeName
          ?.toLowerCase()
          .includes(searchTerms.statsStore.toLowerCase()),
      );
    }
    if (searchTerms.statsCode) {
      filtered = filtered.filter((store) =>
        store.storeCode
          ?.toLowerCase()
          .includes(searchTerms.statsCode.toLowerCase()),
      );
    }
    setFilteredStatsByStore(filtered);
  }, [stats, searchTerms.statsStore, searchTerms.statsCode]);

  useEffect(() => {
    let filtered = auditTrail;
    if (searchTerms.auditProduct) {
      filtered = filtered.filter((item) =>
        item.productName
          ?.toLowerCase()
          .includes(searchTerms.auditProduct.toLowerCase()),
      );
    }
    if (searchTerms.auditSku) {
      filtered = filtered.filter((item) =>
        item.productSKU
          ?.toLowerCase()
          .includes(searchTerms.auditSku.toLowerCase()),
      );
    }
    if (searchTerms.auditType) {
      filtered = filtered.filter((item) =>
        item.transactionType
          ?.toLowerCase()
          .includes(searchTerms.auditType.toLowerCase()),
      );
    }
    if (searchTerms.auditRef) {
      filtered = filtered.filter((item) =>
        (item.referenceType + ": " + item.referenceId)
          ?.toLowerCase()
          .includes(searchTerms.auditRef.toLowerCase()),
      );
    }
    setFilteredAuditTrail(filtered);
  }, [
    auditTrail,
    searchTerms.auditProduct,
    searchTerms.auditSku,
    searchTerms.auditType,
    searchTerms.auditRef,
  ]);

  useEffect(() => {
    let filtered = openingClosing?.summaries || [];
    if (searchTerms.ocProduct) {
      filtered = filtered.filter((item) =>
        item.product?.name
          ?.toLowerCase()
          .includes(searchTerms.ocProduct.toLowerCase()),
      );
    }
    if (searchTerms.ocSku) {
      filtered = filtered.filter((item) =>
        (item.product?.SKU || item.product?.sku)
          ?.toLowerCase()
          .includes(searchTerms.ocSku.toLowerCase()),
      );
    }
    setFilteredOpeningClosing(filtered);
  }, [openingClosing, searchTerms.ocProduct, searchTerms.ocSku]);

  const handleRowClick = async (rowId, productId) => {
    const isExpanded = expandedRowId === rowId;
    setExpandedRowId(isExpanded ? null : rowId);

    // Already fetched → just toggle
    if (productSalesDetails[rowId]) return;

    if (!isExpanded && productId) {
      setLoadingDetails((prev) => ({ ...prev, [rowId]: true }));

      try {
        const params = {
          storeId,
          productId,
          fromDate: from,
          toDate: to,
        };

        const res = await storeService.getStoreStockProductSales(params);
        console.log("📦 Product Sales API:", res);

        if (res.success && res.data) {
          setProductSalesDetails((prev) => ({
            ...prev,
            [rowId]: {
              salesDetails: res.data.salesDetails || [],
              invoices: res.data.invoices || [],
            },
          }));
        }
      } catch (err) {
        console.error("❌ Error fetching product sales details:", err);
      } finally {
        setLoadingDetails((prev) => ({ ...prev, [rowId]: false }));
      }
    }
  };

  const closeModal = () => setIsModalOpen(false);

  const handleInvoiceClick = async (invoiceId, orderId) => {
    if (!invoiceId && !orderId) return;

    setSelectedInvoiceData(null);
    setShowInvoiceModal(true);
    setLoadingInvoice(true);

    try {
      // Mocking backend call for now as requested
      // In real implementation: const res = await storeService.getInvoiceDetails(invoiceId || orderId);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockData = {
        invoiceNumber: invoiceId || `INV-${orderId}`,
        date: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
        customerName: "Customer Name", // Will be updated when real data is available
        items: [
          { productName: "Product 1", quantity: 2, price: 500, total: 1000 },
          { productName: "Product 2", quantity: 1, price: 1500, total: 1500 },
        ],
        subtotal: 2500,
        tax: 0,
        discount: 0,
        total: 2500,
      };

      setSelectedInvoiceData(mockData);
    } catch (err) {
      console.error("Error fetching invoice details:", err);
    } finally {
      setLoadingInvoice(false);
    }
  };

  useEffect(() => {
    // Get store ID from multiple sources
    try {
      let id = null;

      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        try {
          const store = JSON.parse(selectedStore);
          id = store.id;
        } catch (e) {
          console.error("Error parsing selectedStore:", e);
        }
      }

      if (!id) {
        const currentStoreId = localStorage.getItem("currentStoreId");
        id = currentStoreId ? parseInt(currentStoreId) : null;
      }

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

  const fetchStock = async (dates) => {
    const fromDate = dates?.fromDate || from;
    const toDate = dates?.toDate || to;

    if (!fromDate || !toDate || !storeId) {
      if (!storeId) {
        setError("Store information missing. Please re-login to continue.");
      } else {
        setError("Please select both From and To dates.");
      }
      setIsModalOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = {
        fromDate,
        toDate,
        storeId: storeId,
        page,
        limit,
      };

      const res = await storeService.getStoreStockSummary(params);
      console.log(res);
      const summaryData = res.data || res.summary || res || [];
      const paginationData = res.pagination || {};

      // Extract totals if available (assuming response structure { data: [], pagination: {}, totals: {} })
      setSummaryTotals(res.totals || res.aggregate || null);

      // Map API response to match table structure
      const mappedData = Array.isArray(summaryData)
        ? summaryData.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product?.name || item.productName || "-",
            productSKU: item.product?.SKU || item.product?.sku || "-",
            date: item.date,
            stockIn: item.stockIn || 0,
            inwardStock: item.inwardStock || 0,
            opening: item.openingStock || 0,
            closing: item.closingStock || 0,
            outwardStock: item.outwardStock || 0,
            stockOut: item.stockOut || 0,
            inwardPrice: item.inwardStockPrice || 0,
            outwardPrice: item.outwardStockPrice || 0,
            stockInPrice: item.stockInPrice || 0,
            stockOutPrice: item.stockOutPrice || 0,
            unit: item.unit || item.product?.unit || "kg",
            productType:
              item.productType || item.product?.productType || "packed",
            store: item.store,
            product: item.product,
            division: item.division,
          }))
        : [];

      setStockData(mappedData);
      setTotal(paginationData.total || mappedData.length);
      setTotalPages(
        paginationData.totalPages ||
          Math.ceil((paginationData.total || mappedData.length) / limit) ||
          1,
      );
    } catch (err) {
      console.error("StoreStockSummary - Error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch stock data.",
      );
      setIsModalOpen(true);
      setStockData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (dates) => {
    const fromDate = dates?.fromDate || from;
    const toDate = dates?.toDate || to;

    if (!fromDate || !toDate || !storeId) return;

    setLoading(true);
    try {
      const params = {
        fromDate,
        toDate,
        storeId: storeId,
      };

      const res = await storeService.getStoreStockSummaryStats(params);
      const statsData = res.data || res;
      setStats(statsData);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch statistics.",
      );
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditTrail = async (dates) => {
    const fromDate = dates?.fromDate || from;
    const toDate = dates?.toDate || to;

    if (!fromDate || !toDate || !storeId) return;

    setLoading(true);
    try {
      const params = {
        fromDate,
        toDate,
        storeId: storeId,
        page,
        limit,
      };

      const res = await storeService.getStoreStockAuditTrail(params);
      const auditData = res.data || res.auditTrail || res || [];
      const paginationData = res.pagination || {};

      const mappedAudit = Array.isArray(auditData)
        ? auditData.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product?.name || "-",
            productSKU: item.product?.SKU || item.product?.sku || "-",
            transactionType: item.transactionType,
            quantity: item.quantity || 0,
            unit: item.unit || "kg",
            productType: item.productType || "packed",
            recordedAt: item.recordedAt,
            referenceType: item.referenceType,
            referenceId: item.referenceId,
            remarks: item.remarks,
            totalPrice: item.totalPrice || 0,
            store: item.store,
            product: item.product,
          }))
        : [];

      setAuditTrail(mappedAudit);
      setTotal(paginationData.total || mappedAudit.length);
      setTotalPages(
        paginationData.totalPages ||
          Math.ceil((paginationData.total || mappedAudit.length) / limit) ||
          1,
      );
    } catch (err) {
      console.error("Error fetching audit trail:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch audit trail.",
      );
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const thStyle = {
    fontSize: "12px",
    fontWeight: 600,
    padding: "8px 16px",
  };

  const tdStyle = {
    fontSize: "13px",
    padding: "8px 16px",
  };

  const backdropStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  };

  const modalStyle = {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    width: 480,
    maxWidth: "95%",
    fontFamily: "Poppins",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  };

  const paymentRow = {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
  };

  const fetchOpeningClosing = async (dates) => {
    const fromDate = dates?.fromDate || from;
    const toDate = dates?.toDate || to;

    if (!fromDate || !toDate || !storeId) return;

    setLoading(true);
    try {
      const params = {
        fromDate,
        toDate,
        storeId: storeId,
      };

      const res = await storeService.getStoreStockOpeningClosing(params);
      const data = res.data || res;
      setOpeningClosing(data);
    } catch (err) {
      console.error("Error fetching opening/closing stock:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch opening/closing stock.",
      );
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Removed automatic fetching on date change - now only fetches on Submit button click
  useEffect(() => {
    if (storeId && page > 1) {
      // Only auto-fetch for pagination changes
      if (activeTab === "summary") {
        fetchStock();
      } else if (activeTab === "audit") {
        fetchAuditTrail();
      }
    }
  }, [storeId, page, limit]);

  const handlePageChange = (direction) => {
    if (direction === "next" && page < totalPages) {
      setPage((prev) => prev + 1);
    } else if (direction === "prev" && page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1); // Reset to first page when switching tabs
  };

  const onSubmit = () => {
    setFrom(tempFrom);
    setTo(tempTo);
    setPage(1); // Reset to first page

    // Fetch data based on active tab immediately using the temp values
    const dateParams = { fromDate: tempFrom, toDate: tempTo };

    if (activeTab === "summary") {
      fetchStock(dateParams);
      fetchStats(dateParams); // Also fetch stats to get totals for the footer
    } else if (activeTab === "stats") fetchStats(dateParams);
    else if (activeTab === "audit") fetchAuditTrail(dateParams);
    else if (activeTab === "opening-closing") fetchOpeningClosing(dateParams);
  };

  const onCancel = () => {
    const today = new Date().toISOString().slice(0, 10);
    setTempFrom(today);
    setTempTo(today);
    setFrom(today);
    setTo(today);
    setDateRange("custom");
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    const today = new Date();
    const toDate = today.toISOString().slice(0, 10);
    let fromDate = toDate;

    switch (range) {
      case "today":
        fromDate = toDate;
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        fromDate = yesterday.toISOString().slice(0, 10);
        setTempTo(fromDate);
        break;
      case "last7days":
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        fromDate = last7.toISOString().slice(0, 10);
        break;
      case "last30days":
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        fromDate = last30.toISOString().slice(0, 10);
        break;
      case "thisMonth":
        const thisMonthStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        );
        fromDate = thisMonthStart.toISOString().slice(0, 10);
        break;
      case "lastMonth":
        const lastMonthStart = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1,
        );
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        fromDate = lastMonthStart.toISOString().slice(0, 10);
        setTempTo(lastMonthEnd.toISOString().slice(0, 10));
        break;
      case "custom":
        // Don't change dates for custom
        return;
      default:
        fromDate = toDate;
    }

    setTempFrom(fromDate);
    if (range !== "yesterday" && range !== "lastMonth") {
      setTempTo(toDate);
    }
  };

  // Export function
  const onExport = (type) => {
    let arr = [];
    let columns = [];
    let fileName = "";
    let dataToExport = [];

    if (activeTab === "summary") {
      columns = [
        "S.No",
        "Product",
        "SKU",
        "Date",
        "Opening Stock",
        "Inward Stock",
        "Inward Value",
        "Outward Stock",
        "Outward Value",
        "Stock In",
        "Stock In Price",
        "Stock Out",
        "Stock Out Price",
        "Closing Stock",
        "Unit",
      ];
      dataToExport =
        filteredStockData.length > 0 ? filteredStockData : stockData;
      fileName = "Stock_Summary";

      let x = 1;
      dataToExport.forEach((item) => {
        arr.push({
          "S.No": x++,
          Product: item.productName || "-",
          SKU: item.productSKU || "-",
          Date: item.date || "-",
          "Opening Stock": Number(item.opening || 0).toFixed(2),
          "Inward Stock": Number(item.inwardStock || 0).toFixed(2),
          "Inward Value": Number(item.inwardPrice || 0).toFixed(2),
          "Outward Stock": Number(item.outwardStock || 0).toFixed(2),
          "Outward Value": Number(item.outwardPrice || 0).toFixed(2),
          "Stock In": Number(item.stockIn || 0).toFixed(2),
          "Stock In Price": Number(item.stockInPrice || 0).toFixed(2),
          "Stock Out": Number(item.stockOut || 0).toFixed(2),
          "Stock Out Price": Number(item.stockOutPrice || 0).toFixed(2),
          "Closing Stock": Number(item.closing || 0).toFixed(2),
          Unit: item.unit || "kg",
        });
      });
    } else if (activeTab === "stats") {
      columns = [
        "Store Name",
        "Store Code",
        "Inward Stock",
        "Inward Value",
        "Outward Stock",
        "Outward Value",
        "Closing Stock",
        "Products",
      ];
      dataToExport =
        filteredStatsByStore.length > 0
          ? filteredStatsByStore
          : stats?.stockByStore || [];
      fileName = "Stock_By_Store_Statistics";

      dataToExport.forEach((store) => {
        arr.push({
          "Store Name": store.storeName,
          "Store Code": store.storeCode,
          "Inward Stock": Number(store.inwardStock || 0).toFixed(2),
          "Inward Value": Number(store.inwardStockPrice || 0).toFixed(2),
          "Outward Stock": Number(store.outwardStock || 0).toFixed(2),
          "Outward Value": Number(store.outwardStockPrice || 0).toFixed(2),
          "Closing Stock": Number(store.closingStock || 0).toFixed(2),
          Products: store.products || 0,
        });
      });
    } else if (activeTab === "audit") {
      columns = [
        "Product",
        "SKU",
        "Transaction Type",
        "Quantity",
        "Unit",
        "Total Price",
        "Recorded At",
        "Reference",
        "Remarks",
      ];
      dataToExport =
        filteredAuditTrail.length > 0 ? filteredAuditTrail : auditTrail || [];
      fileName = "Stock_Audit_Trail";

      dataToExport.forEach((item) => {
        arr.push({
          Product: item.productName,
          SKU: item.productSKU,
          "Transaction Type": item.transactionType?.toUpperCase() || "-",
          Quantity: Number(item.quantity || 0).toFixed(2),
          Unit: item.unit,
          "Total Price": Number(item.totalPrice || 0).toFixed(2),
          "Recorded At": item.recordedAt
            ? new Date(item.recordedAt).toLocaleString()
            : "-",
          Reference: item.referenceType
            ? `${item.referenceType}: ${item.referenceId}`
            : "-",
          Remarks: item.remarks || "-",
        });
      });
    } else if (activeTab === "opening-closing") {
      columns = [
        "Product",
        "SKU",
        "Opening Stock",
        "Opening Price",
        "Inward Stock",
        "Inward Price",
        "Outward Stock",
        "Outward Price",
        "Stock In",
        "Stock In Price",
        "Stock Out",
        "Stock Out Price",
        "Closing Stock",
        "Closing Price",
        "Unit",
      ];
      dataToExport =
        filteredOpeningClosing.length > 0
          ? filteredOpeningClosing
          : openingClosing?.summaries || [];
      fileName = "Opening_Closing_Stock";

      dataToExport.forEach((item) => {
        arr.push({
          Product: item.product?.name || "-",
          SKU: item.product?.SKU || item.product?.sku || "-",
          "Opening Stock": Number(item.openingStock || 0).toFixed(2),
          "Opening Price": Number(item.openingStockPrice || 0).toFixed(2),
          "Inward Stock": Number(item.inwardStock || 0).toFixed(2),
          "Inward Price": Number(item.inwardStockPrice || 0).toFixed(2),
          "Outward Stock": Number(item.outwardStock || 0).toFixed(2),
          "Outward Price": Number(item.outwardStockPrice || 0).toFixed(2),
          "Stock In": Number(item.stockIn || 0).toFixed(2),
          "Stock In Price": Number(item.stockInPrice || 0).toFixed(2),
          "Stock Out": Number(item.stockOut || 0).toFixed(2),
          "Stock Out Price": Number(item.stockOutPrice || 0).toFixed(2),
          "Closing Stock": Number(item.closingStock || 0).toFixed(2),
          "Closing Price": Number(item.closingStockPrice || 0).toFixed(2),
          Unit: item.product?.unit || item.unit || "kg",
        });
      });
    }

    if (arr.length > 0) {
      if (type === "PDF") handleExportPDF(columns, arr, fileName);
      else if (type === "XLS")
        handleExportExcel(columns, arr, fileName.replace(/_/g, ""));
    } else {
      setError("Table is Empty");
      setIsModalOpen(true);
    }
  };

  const renderSummaryTable = (dataArray) => (
    <div style={{ overflowX: "auto" }}>
      <table
        className="table table-bordered borderedtable table-sm mt-2"
        style={{ fontFamily: "Poppins" }}
      >
        <thead className="table-light">
          <tr>
            {renderSearchHeader(
              "Product",
              "summaryProduct",
              "data-summary-product",
            )}
            {renderSearchHeader("SKU", "summarySku", "data-summary-sku")}
            <th
              style={{
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              Date
            </th>
            <th
              style={{
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              Opening Stock
            </th>
            <th
              style={{
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              Inward
            </th>
            {showPrices && (
              <th
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                Inward Value
              </th>
            )}
            <th
              style={{
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              Outward
            </th>
            {showPrices && (
              <th
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                Outward Value
              </th>
            )}
            <th
              style={{
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              Stock In
            </th>
            {showPrices && (
              <th
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                Stock In Value
              </th>
            )}
            <th
              style={{
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              Stock Out
            </th>
            {showPrices && (
              <th
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                Stock Out Value
              </th>
            )}
            <th
              style={{
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              Closing Stock
            </th>
            <th
              style={{
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              Unit
            </th>
          </tr>
          {(searchTerms.summaryProduct || searchTerms.summarySku) && (
            <tr>
              <td
                colSpan={14}
                style={{
                  padding: "4px 12px",
                  fontSize: "12px",
                  borderRadius: "0",
                  backgroundColor: "#f8f9fa",
                  color: "#666",
                }}
              >
                {dataArray.length} items found
              </td>
            </tr>
          )}
        </thead>
        <tbody>
          {dataArray.length === 0 ? (
            <tr>
              <td
                colSpan={14}
                className="text-center"
                style={{ padding: "20px", fontFamily: "Poppins" }}
              >
                No stock data found
              </td>
            </tr>
          ) : (
            dataArray.map((item, index) => {
              const actualIndex = (page - 1) * limit + index + 1;
              return (
                <React.Fragment key={item.id || index}>
                  <tr
                    onClick={() =>
                      handleRowClick(item.id || index, item.productId)
                    }
                    style={{
                      background:
                        index % 2 === 0
                          ? "rgba(59, 130, 246, 0.03)"
                          : "transparent",
                      cursor: "pointer",
                      borderLeft:
                        expandedRowId === (item.id || index)
                          ? "4px solid var(--primary-color)"
                          : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    <td
                      style={{
                        fontFamily: "Poppins",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <i
                          className={`bi bi-chevron-${expandedRowId === (item.id || index) ? "down" : "right"}`}
                          style={{ fontSize: "10px" }}
                        ></i>
                        {item.productName || "-"}
                      </div>
                    </td>
                    <td
                      style={{
                        fontFamily: "Poppins",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      {item.productSKU || "-"}
                    </td>
                    <td style={{ fontFamily: "Poppins", fontSize: "13px" }}>
                      {item.date || "-"}
                    </td>
                    <td style={{ fontFamily: "Poppins", fontSize: "13px" }}>
                      {Number(item.opening || 0).toFixed(2)}
                    </td>
                    <td
                      style={{
                        fontFamily: "Poppins",
                        fontSize: "13px",
                        color: "#059669",
                      }}
                    >
                      {Number(item.inwardStock || 0).toFixed(2)}
                    </td>
                    {showPrices && (
                      <td
                        style={{
                          fontFamily: "Poppins",
                          fontSize: "13px",
                          color: "#059669",
                          fontWeight: 600,
                        }}
                      >
                        ₹{Number(item.inwardPrice || 0).toLocaleString()}
                      </td>
                    )}
                    <td
                      style={{
                        fontFamily: "Poppins",
                        fontSize: "13px",
                        color: "#ef4444",
                      }}
                    >
                      {Number(item.outwardStock || 0).toFixed(2)}
                    </td>
                    {showPrices && (
                      <td
                        style={{
                          fontFamily: "Poppins",
                          fontSize: "13px",
                          color: "#ef4444",
                          fontWeight: 600,
                        }}
                      >
                        ₹{Number(item.outwardPrice || 0).toLocaleString()}
                      </td>
                    )}
                    <td
                      style={{
                        fontFamily: "Poppins",
                        fontSize: "13px",
                        color: "#3b82f6",
                      }}
                    >
                      {Number(item.stockIn || 0).toFixed(2)}
                    </td>
                    {showPrices && (
                      <td
                        style={{
                          fontFamily: "Poppins",
                          fontSize: "13px",
                          color: "#3b82f6",
                          fontWeight: 600,
                        }}
                      >
                        ₹{Number(item.stockInPrice || 0).toLocaleString()}
                      </td>
                    )}
                    <td
                      style={{
                        fontFamily: "Poppins",
                        fontSize: "13px",
                        color: "#f59e0b",
                      }}
                    >
                      {Number(item.stockOut || 0).toFixed(2)}
                    </td>
                    {showPrices && (
                      <td
                        style={{
                          fontFamily: "Poppins",
                          fontSize: "13px",
                          color: "#f59e0b",
                          fontWeight: 600,
                        }}
                      >
                        ₹{Number(item.stockOutPrice || 0).toLocaleString()}
                      </td>
                    )}
                    <td
                      style={{
                        fontFamily: "Poppins",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--primary-color)",
                      }}
                    >
                      {Number(item.closing || 0).toFixed(2)}
                    </td>
                    <td style={{ fontFamily: "Poppins", fontSize: "13px" }}>
                      {item.unit || "kg"}
                    </td>
                  </tr>
                  {expandedRowId === (item.id || index) && (
                    <tr key={`detail-${item.id || index}`}>
                      <td
                        colSpan={14}
                        style={{ padding: 0, backgroundColor: "#f9fafb" }}
                      >
                        <div
                          style={{
                            padding: "16px 24px",
                            borderTop: "1px solid #e5e7eb",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          <h6
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#374151",
                              marginBottom: "12px",
                            }}
                          >
                            Sales Details for {item.productName} ({from} to {to}
                            )
                          </h6>

                          <div
                            style={{
                              overflowX: "auto",
                              backgroundColor: "white",
                              borderRadius: "6px",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            {loadingDetails[item.id || index] ? (
                              <div className="text-center p-3">
                                Loading details...
                              </div>
                            ) : (
                              (() => {
                                const rowData =
                                  productSalesDetails[item.id || index];
                                const salesRows = rowData?.salesDetails || [];
                                const invoiceRows = rowData?.invoices || [];
                                return (
                                  <table
                                    className="table table-sm mb-0"
                                    style={{ fontFamily: "Poppins" }}
                                  >
                                    <thead
                                      style={{ backgroundColor: "#f3f4f6" }}
                                    >
                                      <tr>
                                        <th style={thStyle}>Date</th>
                                        <th style={thStyle}>Type</th>
                                        <th style={thStyle}>Transfer Number</th>
                                        <th style={thStyle}>Invoice ID</th>
                                        <th style={thStyle}>Customer</th>
                                        <th style={thStyle}>Quantity</th>
                                        <th style={thStyle}>Price</th>
                                        <th style={thStyle}>Total</th>
                                        <th style={thStyle}>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {salesRows.length > 0 ? (
                                        salesRows.map((sale, i) => (
                                          <tr key={i}>
                                            <td style={tdStyle}>{sale.date}</td>
                                            <td style={tdStyle}>{sale.type}</td>
                                            <td style={tdStyle}>{sale.transferNumber || "-"}</td>
                                            <td style={tdStyle}>
                                              {rowData?.invoices?.find(
                                                (inv) =>
                                                  inv.saleId === sale.saleId,
                                              )?.invoice?.invoiceNumber || "-"}
                                            </td>
                                            <td style={tdStyle}>
                                              {sale.customer}
                                            </td>
                                            <td style={tdStyle}>
                                              {sale.quantity}{" "}
                                              <span
                                                style={{
                                                  color: "#6b7280",
                                                  fontSize: 12,
                                                }}
                                              >
                                                {sale.unit || item.unit}
                                              </span>
                                            </td>
                                            <td style={tdStyle}>
                                              ₹{sale.price}
                                            </td>
                                            <td
                                              style={{
                                                ...tdStyle,
                                                fontWeight: 600,
                                              }}
                                            >
                                              ₹
                                              {sale.totalAmount.toLocaleString()}
                                            </td>
                                            <td style={tdStyle}>
                                              <button
                                                className="homebtn"
                                                style={{ fontSize: "11px" }}
                                                onClick={() =>
                                                  openInvoicePopup(
                                                    sale.type === "sale"
                                                      ? sale.orderId
                                                      : sale.transferNumber,
                                                    rowData?.invoices,
                                                  )
                                                }
                                              >
                                                View
                                              </button>
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td
                                            colSpan={9}
                                            className="text-center p-3"
                                          >
                                            No sales found for this period
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                );
                              })()
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
        {dataArray.length > 0 && (
          <tfoot
            className="table-light"
            style={{
              borderTop: "2px solid #e5e7eb",
              fontFamily: "Poppins",
              fontSize: "13px",
            }}
          >
            <tr>
              <td
                colSpan={3}
                style={{
                  textAlign: "right",
                  fontWeight: 600,
                  padding: "12px 16px",
                }}
              >
                Total (Visible):
              </td>
              <td
                style={{ fontWeight: 600, color: "#374151", padding: "12px" }}
              >
                <div style={{ fontSize: "11px", color: "#666" }}>Opening</div>
                {dataArray
                  .reduce((sum, item) => sum + (Number(item.opening) || 0), 0)
                  .toFixed(2)}
              </td>
              <td
                style={{ fontWeight: 600, color: "#059669", padding: "12px" }}
              >
                <div style={{ fontSize: "11px", color: "#666" }}>Inward</div>
                {dataArray
                  .reduce(
                    (sum, item) => sum + (Number(item.inwardStock) || 0),
                    0,
                  )
                  .toFixed(2)}
              </td>
              {showPrices && (
                <td
                  style={{ fontWeight: 600, color: "#059669", padding: "12px" }}
                >
                  <div style={{ fontSize: "11px", color: "#666" }}>
                    Inward Val
                  </div>
                  ₹
                  {dataArray
                    .reduce(
                      (sum, item) => sum + (Number(item.inwardPrice) || 0),
                      0,
                    )
                    .toLocaleString()}
                </td>
              )}
              <td
                style={{ fontWeight: 600, color: "#ef4444", padding: "12px" }}
              >
                <div style={{ fontSize: "11px", color: "#666" }}>Outward</div>
                {dataArray
                  .reduce(
                    (sum, item) => sum + (Number(item.outwardStock) || 0),
                    0,
                  )
                  .toFixed(2)}
              </td>
              {showPrices && (
                <td
                  style={{ fontWeight: 600, color: "#ef4444", padding: "12px" }}
                >
                  <div style={{ fontSize: "11px", color: "#666" }}>
                    Outward Val
                  </div>
                  ₹
                  {dataArray
                    .reduce(
                      (sum, item) => sum + (Number(item.outwardPrice) || 0),
                      0,
                    )
                    .toLocaleString()}
                </td>
              )}
              <td
                style={{ fontWeight: 600, color: "#3b82f6", padding: "12px" }}
              >
                <div style={{ fontSize: "11px", color: "#666" }}>Stock In</div>
                {dataArray
                  .reduce((sum, item) => sum + (Number(item.stockIn) || 0), 0)
                  .toFixed(2)}
              </td>
              {showPrices && (
                <td
                  style={{ fontWeight: 600, color: "#3b82f6", padding: "12px" }}
                >
                  <div style={{ fontSize: "11px", color: "#666" }}>
                    Stock In Val
                  </div>
                  ₹
                  {dataArray
                    .reduce(
                      (sum, item) => sum + (Number(item.stockInPrice) || 0),
                      0,
                    )
                    .toLocaleString()}
                </td>
              )}
              <td
                style={{ fontWeight: 600, color: "#f59e0b", padding: "12px" }}
              >
                <div style={{ fontSize: "11px", color: "#666" }}>Stock Out</div>
                {dataArray
                  .reduce((sum, item) => sum + (Number(item.stockOut) || 0), 0)
                  .toFixed(2)}
              </td>
              {showPrices && (
                <td
                  style={{ fontWeight: 600, color: "#f59e0b", padding: "12px" }}
                >
                  <div style={{ fontSize: "11px", color: "#666" }}>
                    Stock Out Val
                  </div>
                  ₹
                  {dataArray
                    .reduce(
                      (sum, item) => sum + (Number(item.stockOutPrice) || 0),
                      0,
                    )
                    .toLocaleString()}
                </td>
              )}
              <td
                style={{
                  fontWeight: 600,
                  color: "var(--primary-color)",
                  padding: "12px",
                }}
              >
                <div style={{ fontSize: "11px", color: "#666" }}>Closing</div>
                {dataArray
                  .reduce((sum, item) => sum + (Number(item.closing) || 0), 0)
                  .toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        )}
      </table>
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div
            style={{ fontFamily: "Poppins", color: "#666", fontSize: "14px" }}
          >
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)}{" "}
            of {total} records
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handlePageChange("prev")}
              disabled={page === 1 || loading}
              style={{
                fontFamily: "Poppins",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FaArrowLeftLong />
              Previous
            </button>
            <span style={{ fontFamily: "Poppins", padding: "0 12px" }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handlePageChange("next")}
              disabled={page >= totalPages || loading}
              style={{
                fontFamily: "Poppins",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Next
              <FaArrowRightLong />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: "20px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontFamily: "Poppins",
            fontWeight: 700,
            fontSize: "28px",
            color: "var(--primary-color)",
            margin: 0,
            marginBottom: "8px",
          }}
        >
          Stock Summary
        </h2>
        <p className="path">
          <span onClick={() => navigate("/store/inventory")}>Inventory</span>{" "}
          <i className="bi bi-chevron-right"></i> Stock Summary
        </p>
      </div>

      {/* Tabs */}
      <div className={styles.orderStatusCard} style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            gap: "8px",
            borderBottom: "2px solid #e5e7eb",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => handleTabChange("summary")}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "transparent",
              borderBottom:
                activeTab === "summary"
                  ? "3px solid var(--primary-color)"
                  : "3px solid transparent",
              color: activeTab === "summary" ? "var(--primary-color)" : "#666",
              fontFamily: "Poppins",
              fontWeight: activeTab === "summary" ? 600 : 400,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Stock Summary
          </button>
          <button
            onClick={() => handleTabChange("stats")}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "transparent",
              borderBottom:
                activeTab === "stats"
                  ? "3px solid var(--primary-color)"
                  : "3px solid transparent",
              color: activeTab === "stats" ? "var(--primary-color)" : "#666",
              fontFamily: "Poppins",
              fontWeight: activeTab === "stats" ? 600 : 400,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Statistics
          </button>
          <button
            onClick={() => handleTabChange("audit")}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "transparent",
              borderBottom:
                activeTab === "audit"
                  ? "3px solid var(--primary-color)"
                  : "3px solid transparent",
              color: activeTab === "audit" ? "var(--primary-color)" : "#666",
              fontFamily: "Poppins",
              fontWeight: activeTab === "audit" ? 600 : 400,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Audit Trail
          </button>
          <button
            onClick={() => handleTabChange("opening-closing")}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "transparent",
              borderBottom:
                activeTab === "opening-closing"
                  ? "3px solid var(--primary-color)"
                  : "3px solid transparent",
              color:
                activeTab === "opening-closing"
                  ? "var(--primary-color)"
                  : "#666",
              fontFamily: "Poppins",
              fontWeight: activeTab === "opening-closing" ? 600 : 400,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Opening/Closing
          </button>
        </div>

        {/* Filters based on active tab */}
        <div className="row m-0 p-3">
          <div className="col-2 formcontent">
            <label htmlFor="">Date Range :</label>
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
            >
              <option value="custom">Custom</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
            </select>
          </div>
          <div className="col-2 formcontent">
            <label htmlFor="">From :</label>
            <input
              type="date"
              value={tempFrom}
              onChange={(e) => {
                setTempFrom(e.target.value);
                setDateRange("custom");
              }}
            />
          </div>
          <div className="col-2 formcontent">
            <label htmlFor="">To :</label>
            <input
              type="date"
              value={tempTo}
              onChange={(e) => {
                setTempTo(e.target.value);
                setDateRange("custom");
              }}
            />
          </div>
          <div
            className="col-6 formcontent"
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "8px",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="submitbtn"
              onClick={onSubmit}
              disabled={loading}
              style={{ margin: 0 }}
            >
              {loading ? "Loading..." : "Submit"}
            </button>
            <button
              className="cancelbtn"
              onClick={onCancel}
              style={{ margin: 0 }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && <Loading />}

      {/* Stock Summary Tab */}
      {!loading && activeTab === "summary" && stockData.length > 0 && (
        <div className={styles.orderStatusCard}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h4
              style={{
                margin: 0,
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: "20px",
                color: "var(--primary-color)",
              }}
            >
              Stock Summary
            </h4>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => onExport("XLS")}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "Poppins",
                  fontSize: "13px",
                }}
              >
                <img
                  src={xls}
                  alt="XLS"
                  style={{ width: "20px", height: "20px" }}
                />
                Export XLS
              </button>
              <button
                onClick={() => onExport("PDF")}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "Poppins",
                  fontSize: "13px",
                }}
              >
                <img
                  src={pdf}
                  alt="PDF"
                  style={{ width: "20px", height: "20px" }}
                />
                Export PDF
              </button>
              <button
                onClick={() => setShowPrices((prev) => !prev)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  background: "#fff",
                  cursor: "pointer",
                  fontFamily: "Poppins",
                  fontSize: "13px",
                }}
              >
                {showPrices ? "Hide Values" : "Show Values"}
              </button>
            </div>
          </div>
          {renderSummaryTable(filteredStockData)}
        </div>
      )}

      {/* Statistics Tab */}
      {!loading && activeTab === "stats" && stats && (
        <div className={styles.orderStatusCard}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h4
              style={{
                margin: 0,
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: "20px",
                color: "var(--primary-color)",
              }}
            >
              Overall Statistics
            </h4>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => onExport("XLS")}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "Poppins",
                  fontSize: "13px",
                }}
              >
                <img
                  src={xls}
                  alt="XLS"
                  style={{ width: "20px", height: "20px" }}
                />
                Export XLS
              </button>
              <button
                onClick={() => onExport("PDF")}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "Poppins",
                  fontSize: "13px",
                }}
              >
                <img
                  src={pdf}
                  alt="PDF"
                  style={{ width: "20px", height: "20px" }}
                />
                Export PDF
              </button>
              <button
                onClick={() => setShowPrices((prev) => !prev)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  background: "#fff",
                  cursor: "pointer",
                  fontFamily: "Poppins",
                  fontSize: "13px",
                }}
              >
                {showPrices ? "Hide Values" : "Show Values"}
              </button>
            </div>
          </div>
          {stats.summary && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#eff6ff",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "4px",
                  }}
                >
                  Total Inward Stock
                </div>
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#059669",
                  }}
                >
                  {Number(stats.summary.totalInwardStock || 0).toFixed(2)}
                </div>
              </div>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#fef2f2",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "4px",
                  }}
                >
                  Total Outward Stock
                </div>
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#ef4444",
                  }}
                >
                  {Number(stats.summary.totalOutwardStock || 0).toFixed(2)}
                </div>
              </div>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f0fdf4",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "4px",
                  }}
                >
                  Total Closing Stock
                </div>
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "var(--primary-color)",
                  }}
                >
                  {Number(stats.summary.totalClosingStock || 0).toFixed(2)}
                </div>
              </div>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#fef3c7",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "4px",
                  }}
                >
                  Total Products
                </div>
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#92400e",
                  }}
                >
                  {stats.summary.totalProducts || 0}
                </div>
              </div>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#e0e7ff",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "4px",
                  }}
                >
                  Total Stores
                </div>
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#4338ca",
                  }}
                >
                  {stats.summary.totalStores || 0}
                </div>
              </div>
            </div>
          )}
          {stats.stockByStore && stats.stockByStore.length > 0 && (
            <div>
              <h5
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  marginBottom: "16px",
                }}
              >
                Stock by Store
              </h5>
              {(searchTerms.statsStore || searchTerms.statsCode) && (
                <div
                  style={{
                    marginBottom: "10px",
                    fontSize: "13px",
                    color: "#666",
                  }}
                >
                  {filteredStatsByStore.length} stores found matching search
                  criteria
                </div>
              )}
              <div style={{ overflowX: "auto" }}>
                <table
                  className="table table-bordered borderedtable"
                  style={{ fontFamily: "Poppins" }}
                >
                  <thead className="table-light">
                    <tr>
                      {renderSearchHeader(
                        "Store Name",
                        "statsStore",
                        "data-stats-store",
                      )}
                      {renderSearchHeader(
                        "Store Code",
                        "statsCode",
                        "data-stats-code",
                      )}
                      <th>Inward Stock</th>
                      {showPrices && <th>Inward Value</th>}
                      <th>Outward Stock</th>
                      {showPrices && <th>Outward Value</th>}
                      <th>Closing Stock</th>
                      <th>Products</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStatsByStore.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center"
                          style={{ padding: "20px" }}
                        >
                          No stores match your search
                        </td>
                      </tr>
                    ) : (
                      filteredStatsByStore.map((store, index) => (
                        <tr key={store.storeId || index}>
                          <td>{store.storeName}</td>
                          <td>{store.storeCode}</td>
                          <td style={{ color: "#059669" }}>
                            {Number(store.inwardStock || 0).toFixed(2)}
                          </td>
                          <td style={{ color: "#059669", fontWeight: 500 }}>
                            ₹
                            {Number(
                              store.inwardStockPrice || 0,
                            ).toLocaleString()}
                          </td>
                          <td style={{ color: "#ef4444" }}>
                            {Number(store.outwardStock || 0).toFixed(2)}
                          </td>
                          <td style={{ color: "#ef4444", fontWeight: 500 }}>
                            ₹
                            {Number(
                              store.outwardStockPrice || 0,
                            ).toLocaleString()}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {Number(store.closingStock || 0).toFixed(2)}
                          </td>
                          <td>{store.products || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredStatsByStore.length > 0 && (
                    <tfoot
                      className="table-light"
                      style={{
                        borderTop: "2px solid #e5e7eb",
                        fontFamily: "Poppins",
                        fontSize: "13px",
                      }}
                    >
                      <tr>
                        <td
                          colSpan={2}
                          style={{
                            textAlign: "right",
                            fontWeight: 600,
                            padding: "12px 16px",
                          }}
                        >
                          Total (Visible):
                        </td>
                        <td
                          style={{
                            fontWeight: 600,
                            color: "#059669",
                            padding: "12px",
                          }}
                        >
                          {filteredStatsByStore
                            .reduce(
                              (sum, s) => sum + (Number(s.inwardStock) || 0),
                              0,
                            )
                            .toFixed(2)}
                        </td>
                        <td
                          style={{
                            fontWeight: 600,
                            color: "#059669",
                            padding: "12px",
                          }}
                        >
                          ₹
                          {filteredStatsByStore
                            .reduce(
                              (sum, s) =>
                                sum + (Number(s.inwardStockPrice) || 0),
                              0,
                            )
                            .toLocaleString()}
                        </td>
                        <td
                          style={{
                            fontWeight: 600,
                            color: "#ef4444",
                            padding: "12px",
                          }}
                        >
                          {filteredStatsByStore
                            .reduce(
                              (sum, s) => sum + (Number(s.outwardStock) || 0),
                              0,
                            )
                            .toFixed(2)}
                        </td>
                        <td
                          style={{
                            fontWeight: 600,
                            color: "#ef4444",
                            padding: "12px",
                          }}
                        >
                          ₹
                          {filteredStatsByStore
                            .reduce(
                              (sum, s) =>
                                sum + (Number(s.outwardStockPrice) || 0),
                              0,
                            )
                            .toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 600, padding: "12px" }}>
                          {filteredStatsByStore
                            .reduce(
                              (sum, s) => sum + (Number(s.closingStock) || 0),
                              0,
                            )
                            .toFixed(2)}
                        </td>
                        <td style={{ fontWeight: 600, padding: "12px" }}>
                          {filteredStatsByStore.reduce(
                            (sum, s) => sum + (Number(s.products) || 0),
                            0,
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Trail Tab */}
      {!loading && activeTab === "audit" && (
        <div className={styles.orderStatusCard}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h4
              style={{
                margin: 0,
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: "20px",
                color: "var(--primary-color)",
              }}
            >
              Stock Movement History
            </h4>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => onExport("XLS")}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "Poppins",
                  fontSize: "13px",
                }}
              >
                <img
                  src={xls}
                  alt="XLS"
                  style={{ width: "20px", height: "20px" }}
                />
                Export XLS
              </button>
              <button
                onClick={() => onExport("PDF")}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "Poppins",
                  fontSize: "13px",
                }}
              >
                <img
                  src={pdf}
                  alt="PDF"
                  style={{ width: "20px", height: "20px" }}
                />
                Export PDF
              </button>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              className="table table-bordered borderedtable"
              style={{ fontFamily: "Poppins" }}
            >
              <thead className="table-light">
                <tr>
                  {renderSearchHeader(
                    "Product",
                    "auditProduct",
                    "data-audit-product",
                  )}
                  {renderSearchHeader("SKU", "auditSku", "data-audit-sku")}
                  {renderSearchHeader("Type", "auditType", "data-audit-type")}
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Total Price</th>
                  <th>Recorded At</th>
                  {renderSearchHeader(
                    "Reference",
                    "auditRef",
                    "data-audit-ref",
                  )}
                  <th>Remarks</th>
                </tr>
                {(searchTerms.auditProduct ||
                  searchTerms.auditSku ||
                  searchTerms.auditType ||
                  searchTerms.auditRef) && (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        padding: "4px 12px",
                        fontSize: "12px",
                        color: "#666",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      {filteredAuditTrail.length} records found
                    </td>
                  </tr>
                )}
              </thead>
              <tbody>
                {filteredAuditTrail.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center"
                      style={{ padding: "20px" }}
                    >
                      No audit trail data matches your search
                    </td>
                  </tr>
                ) : (
                  filteredAuditTrail.map((item, index) => {
                    const actualIndex = (page - 1) * limit + index + 1;
                    return (
                      <tr
                        key={item.id || index}
                        style={{
                          background:
                            index % 2 === 0
                              ? "rgba(59, 130, 246, 0.03)"
                              : "transparent",
                        }}
                      >
                        <td>{item.productName}</td>
                        <td style={{ fontSize: "12px", color: "#666" }}>
                          {item.productSKU}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: 600,
                              backgroundColor:
                                item.transactionType === "inward"
                                  ? "#dcfce7"
                                  : "#fee2e2",
                              color:
                                item.transactionType === "inward"
                                  ? "#166534"
                                  : "#991b1b",
                            }}
                          >
                            {item.transactionType?.toUpperCase() || "-"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {Number(item.quantity || 0).toFixed(2)}
                        </td>
                        <td>{item.unit}</td>
                        <td style={{ fontWeight: 600 }}>
                          ₹{Number(item.totalPrice || 0).toLocaleString()}
                        </td>
                        <td>
                          {item.recordedAt
                            ? new Date(item.recordedAt).toLocaleString()
                            : "-"}
                        </td>
                        <td>
                          {item.referenceType
                            ? `${item.referenceType}: ${item.referenceId}`
                            : "-"}
                        </td>
                        <td style={{ fontSize: "12px", color: "#666" }}>
                          {item.remarks || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredAuditTrail.length > 0 && (
                <tfoot
                  className="table-light"
                  style={{
                    borderTop: "2px solid #e5e7eb",
                    fontFamily: "Poppins",
                    fontSize: "13px",
                  }}
                >
                  <tr>
                    <td
                      colSpan={3}
                      style={{
                        textAlign: "right",
                        fontWeight: 600,
                        padding: "12px 16px",
                      }}
                    >
                      Totals (Visible):
                    </td>
                    <td style={{ fontWeight: 600, padding: "12px" }}>
                      <div style={{ color: "#166534" }}>
                        In:{" "}
                        {filteredAuditTrail
                          .filter((i) => i.transactionType === "inward")
                          .reduce(
                            (sum, i) => sum + (Number(i.quantity) || 0),
                            0,
                          )
                          .toFixed(2)}
                      </div>
                      <div style={{ color: "#991b1b" }}>
                        Out:{" "}
                        {filteredAuditTrail
                          .filter((i) => i.transactionType !== "inward")
                          .reduce(
                            (sum, i) => sum + (Number(i.quantity) || 0),
                            0,
                          )
                          .toFixed(2)}
                      </div>
                    </td>
                    <td colSpan={5}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "16px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div
                style={{
                  fontFamily: "Poppins",
                  color: "#666",
                  fontSize: "14px",
                }}
              >
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, total)} of {total} records
              </div>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => handlePageChange("prev")}
                  disabled={page === 1 || loading}
                  style={{
                    fontFamily: "Poppins",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <FaArrowLeftLong />
                  Previous
                </button>
                <span style={{ fontFamily: "Poppins", padding: "0 12px" }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => handlePageChange("next")}
                  disabled={page >= totalPages || loading}
                  style={{
                    fontFamily: "Poppins",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Next
                  <FaArrowRightLong />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Opening/Closing Tab */}
      {!loading && activeTab === "opening-closing" && openingClosing && (
        <div className={styles.orderStatusCard}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h4
              style={{
                margin: 0,
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: "20px",
                color: "var(--primary-color)",
              }}
            >
              Opening and Closing Stock ({from} to {to})
            </h4>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => onExport("XLS")}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "Poppins",
                  fontSize: "13px",
                }}
              >
                <img
                  src={xls}
                  alt="XLS"
                  style={{ width: "20px", height: "20px" }}
                />
                Export XLS
              </button>
              <button
                onClick={() => onExport("PDF")}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "Poppins",
                  fontSize: "13px",
                }}
              >
                <img
                  src={pdf}
                  alt="PDF"
                  style={{ width: "20px", height: "20px" }}
                />
                Export PDF
              </button>
            </div>
          </div>
          {openingClosing.totals && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#eff6ff",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  Opening Stock
                </div>
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "18px",
                    fontWeight: 700,
                  }}
                >
                  {Number(openingClosing.totals.openingStock || 0).toFixed(2)}
                </div>
              </div>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#dcfce7",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  Inward Stock
                </div>
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#059669",
                  }}
                >
                  {Number(openingClosing.totals.inwardStock || 0).toFixed(2)}
                </div>
              </div>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#fee2e2",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  Outward Stock
                </div>
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#ef4444",
                  }}
                >
                  {Number(openingClosing.totals.outwardStock || 0).toFixed(2)}
                </div>
              </div>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f0fdf4",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  Closing Stock
                </div>
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--primary-color)",
                  }}
                >
                  {Number(openingClosing.totals.closingStock || 0).toFixed(2)}
                </div>
              </div>
            </div>
          )}
          {openingClosing.summaries && openingClosing.summaries.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table
                className="table table-bordered borderedtable"
                style={{ fontFamily: "Poppins" }}
              >
                <thead className="table-light">
                  <tr>
                    {renderSearchHeader(
                      "Product",
                      "ocProduct",
                      "data-oc-product",
                    )}
                    {renderSearchHeader("SKU", "ocSku", "data-oc-sku")}
                    <th>Opening Stock</th>
                    <th>Opening Price</th>
                    <th>Inward Stock</th>
                    <th>Inward Price</th>
                    <th>Outward Stock</th>
                    <th>Outward Price</th>
                    <th>Stock In</th>
                    <th>Stock In Price</th>
                    <th>Stock Out</th>
                    <th>Stock Out Price</th>
                    <th>Closing Stock</th>
                    <th>Closing Price</th>
                    <th>Unit</th>
                  </tr>
                  {(searchTerms.ocProduct || searchTerms.ocSku) && (
                    <tr>
                      <td
                        colSpan={15}
                        style={{
                          padding: "4px 12px",
                          fontSize: "12px",
                          color: "#666",
                          backgroundColor: "#f8f9fa",
                        }}
                      >
                        {filteredOpeningClosing.length} products found
                      </td>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {filteredOpeningClosing.length === 0 ? (
                    <tr>
                      <td
                        colSpan={15}
                        className="text-center"
                        style={{ padding: "20px" }}
                      >
                        No records match your search
                      </td>
                    </tr>
                  ) : (
                    filteredOpeningClosing.map((item, index) => (
                      <tr
                        key={item.id || index}
                        style={{
                          background:
                            index % 2 === 0
                              ? "rgba(59, 130, 246, 0.03)"
                              : "transparent",
                        }}
                      >
                        <td style={{ fontWeight: 600 }}>
                          {item.product?.name || "-"}
                        </td>
                        <td style={{ fontSize: "12px", color: "#666" }}>
                          {item.product?.SKU || item.product?.sku || "-"}
                        </td>
                        <td>{Number(item.openingStock || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: 600, color: "#3b82f6" }}>
                          ₹
                          {Number(item.openingStockPrice || 0).toLocaleString()}
                        </td>
                        <td style={{ color: "#059669" }}>
                          {Number(item.inwardStock || 0).toFixed(2)}
                        </td>
                        <td style={{ fontWeight: 600, color: "#059669" }}>
                          ₹{Number(item.inwardStockPrice || 0).toLocaleString()}
                        </td>
                        <td style={{ color: "#ef4444" }}>
                          {Number(item.outwardStock || 0).toFixed(2)}
                        </td>
                        <td style={{ fontWeight: 600, color: "#ef4444" }}>
                          ₹
                          {Number(item.outwardStockPrice || 0).toLocaleString()}
                        </td>
                        <td style={{ color: "#10b981" }}>
                          {Number(item.stockIn || 0).toFixed(2)}
                        </td>
                        <td style={{ fontWeight: 600, color: "#10b981" }}>
                          ₹{Number(item.stockInPrice || 0).toLocaleString()}
                        </td>
                        <td style={{ color: "#f59e0b" }}>
                          {Number(item.stockOut || 0).toFixed(2)}
                        </td>
                        <td style={{ fontWeight: 600, color: "#f59e0b" }}>
                          ₹{Number(item.stockOutPrice || 0).toLocaleString()}
                        </td>
                        <td
                          style={{
                            fontWeight: 600,
                            color: "var(--primary-color)",
                          }}
                        >
                          {Number(item.closingStock || 0).toFixed(2)}
                        </td>
                        <td
                          style={{
                            fontWeight: 600,
                            color: "var(--primary-color)",
                          }}
                        >
                          ₹
                          {Number(item.closingStockPrice || 0).toLocaleString()}
                        </td>
                        <td>{item.product?.unit || item.unit || "kg"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredOpeningClosing.length > 0 && (
                  <tfoot
                    className="table-light"
                    style={{
                      borderTop: "2px solid #e5e7eb",
                      fontFamily: "Poppins",
                      fontSize: "13px",
                    }}
                  >
                    <tr>
                      <td
                        colSpan={2}
                        style={{
                          textAlign: "right",
                          fontWeight: 600,
                          padding: "12px 16px",
                        }}
                      >
                        Total (Visible):
                      </td>
                      <td style={{ fontWeight: 600, padding: "12px" }}>
                        {filteredOpeningClosing
                          .reduce(
                            (sum, item) =>
                              sum + (Number(item.openingStock) || 0),
                            0,
                          )
                          .toFixed(2)}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "#3b82f6",
                          padding: "12px",
                        }}
                      >
                        ₹
                        {filteredOpeningClosing
                          .reduce(
                            (sum, item) =>
                              sum + (Number(item.openingStockPrice) || 0),
                            0,
                          )
                          .toLocaleString()}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "#059669",
                          padding: "12px",
                        }}
                      >
                        {filteredOpeningClosing
                          .reduce(
                            (sum, item) =>
                              sum + (Number(item.inwardStock) || 0),
                            0,
                          )
                          .toFixed(2)}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "#059669",
                          padding: "12px",
                        }}
                      >
                        ₹
                        {filteredOpeningClosing
                          .reduce(
                            (sum, item) =>
                              sum + (Number(item.inwardStockPrice) || 0),
                            0,
                          )
                          .toLocaleString()}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "#ef4444",
                          padding: "12px",
                        }}
                      >
                        {filteredOpeningClosing
                          .reduce(
                            (sum, item) =>
                              sum + (Number(item.outwardStock) || 0),
                            0,
                          )
                          .toFixed(2)}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "#ef4444",
                          padding: "12px",
                        }}
                      >
                        ₹
                        {filteredOpeningClosing
                          .reduce(
                            (sum, item) =>
                              sum +
                              (Number(
                                item.outwardPrice || item.outwardStockPrice,
                              ) || 0),
                            0,
                          )
                          .toLocaleString()}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "#10b981",
                          padding: "12px",
                        }}
                      >
                        {filteredOpeningClosing
                          .reduce(
                            (sum, item) => sum + (Number(item.stockIn) || 0),
                            0,
                          )
                          .toFixed(2)}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "#10b981",
                          padding: "12px",
                        }}
                      >
                        ₹
                        {filteredOpeningClosing
                          .reduce(
                            (sum, item) =>
                              sum + (Number(item.stockInPrice) || 0),
                            0,
                          )
                          .toLocaleString()}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "#f59e0b",
                          padding: "12px",
                        }}
                      >
                        {filteredOpeningClosing
                          .reduce(
                            (sum, item) => sum + (Number(item.stockOut) || 0),
                            0,
                          )
                          .toFixed(2)}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "#f59e0b",
                          padding: "12px",
                        }}
                      >
                        ₹
                        {filteredOpeningClosing
                          .reduce(
                            (sum, item) =>
                              sum + (Number(item.stockOutPrice) || 0),
                            0,
                          )
                          .toLocaleString()}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "var(--primary-color)",
                          padding: "12px",
                        }}
                      >
                        {filteredOpeningClosing
                          .reduce(
                            (sum, item) =>
                              sum + (Number(item.closingStock) || 0),
                            0,
                          )
                          .toFixed(2)}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "var(--primary-color)",
                          padding: "12px",
                        }}
                      >
                        ₹
                        {filteredOpeningClosing
                          .reduce(
                            (sum, item) =>
                              sum + (Number(item.closingStockPrice) || 0),
                            0,
                          )
                          .toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}

      {!loading &&
        activeTab === "summary" &&
        stockData.length === 0 &&
        from &&
        to && (
          <div className={styles.orderStatusCard}>
            <div style={{ textAlign: "center", padding: "40px" }}>
              <h4
                style={{
                  fontFamily: "Poppins",
                  color: "#666",
                  marginBottom: "12px",
                }}
              >
                No stock data found
              </h4>
              <p style={{ fontFamily: "Poppins", color: "#999", margin: 0 }}>
                No stock data available for the selected date range.
              </p>
            </div>
          </div>
        )}

      {showInvoicePopup && selectedInvoice && (
        <>
          <div style={backdropStyle}>
            <div style={{ ...modalStyle, width: "800px", maxWidth: "95%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h4 style={{ margin: 0 }}>
                  {selectedInvoice.type === "sale"
                    ? "Sale Invoice"
                    : "Transfer Note"}
                </h4>
                <button
                  onClick={() => setShowInvoicePopup(false)}
                  style={{
                    border: "none",
                    background: "none",
                    fontSize: "20px",
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={bodyStyle}>
                {/* LEFT COLUMN: Details and Items */}
                <div style={columnScroll}>
                  <div>
                    <strong>
                      {selectedInvoice.type === "sale"
                        ? "Invoice No: "
                        : "Transfer No: "}
                    </strong>
                    {selectedInvoice.type === "sale"
                      ? selectedInvoice.invoice?.invoiceNumber
                      : selectedInvoice.transferNumber}
                  </div>
                  <div>
                    <strong>Date:</strong>{" "}
                    {formatDate(
                      selectedInvoice.saleDate || selectedInvoice.transferDate,
                    )}
                  </div>
                  {selectedInvoice.customer && (
                    <div>
                      <strong>Customer:</strong> {selectedInvoice.customer.name}
                    </div>
                  )}
                  {selectedInvoice.toStore && (
                    <div>
                      <strong>To Store:</strong> {selectedInvoice.toStore.name}{" "}
                      ({selectedInvoice.toStore.storeCode})
                    </div>
                  )}

                  <div style={divider} />

                  <div style={sectionTitle}>Items</div>
                  <table className="table table-sm" width="100%">
                    <thead>
                      <tr
                        style={{
                          fontSize: "12px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <th align="left">Product</th>
                        <th align="left">Qty</th>
                        <th align="left">Price</th>
                        <th align="right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* SAFE MAPPING: Check if items exists */}
                      {selectedInvoice.items?.map((i, idx) => (
                        <tr key={idx} style={{ fontSize: "12px" }}>
                          <td>{i.productName}</td>
                          <td>
                            {i.quantity} {i.unit}
                          </td>
                          <td>₹{Number(i.unitPrice || 0).toLocaleString()}</td>
                          <td align="right">
                            ₹{Number(i.amount || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={divider} />

                  <div style={totalBox}>
                    Total Amount: ₹
                    {Number(
                      selectedInvoice.totals?.invoiceTotal ||
                        selectedInvoice.totals?.totalAmount ||
                        0,
                    ).toLocaleString()}
                  </div>
                </div>

                {/* RIGHT COLUMN: Payments (Only show if it's a sale) */}
                <div style={columnScroll}>
                  <div style={sectionTitle}>Payment Details</div>
                  {selectedInvoice.payments &&
                  selectedInvoice.payments.length > 0 ? (
                    selectedInvoice.payments.map((p, i) => (
                      <div key={i} style={paymentCard}>
                        <div style={{ fontSize: "13px", fontWeight: 600 }}>
                          {p.method?.toUpperCase()} – ₹
                          {Number(p.amount || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>
                          {formatDate(p.date)}
                          {p.transactionNumber &&
                            ` | Ref: ${p.transactionNumber}`}
                        </div>
                        {p.paymentProof && (
                          <img
                            src={imgSrc(p.paymentProof)}
                            alt="Proof"
                            style={proofThumb}
                            onClick={() => setZoomImage(imgSrc(p.paymentProof))}
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999",
                        padding: "10px",
                        textAlign: "center",
                        border: "1px dashed #ccc",
                        borderRadius: "8px",
                      }}
                    >
                      No payment records (Stock Transfer)
                    </div>
                  )}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <button
                  style={closeBtn}
                  onClick={() => setShowInvoicePopup(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          {/* IMAGE ZOOM */}
          {zoomImage && (
            <div style={zoomBackdrop} onClick={() => setZoomImage(null)}>
              <img src={zoomImage} style={zoomImageStyle} alt="Zoomed Proof" />
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {/* Invoice Details Modal */}
      <Modal
        show={showInvoiceModal}
        onHide={() => setShowInvoiceModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontFamily: "Poppins", fontWeight: 600 }}>
            Invoice Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontFamily: "Poppins" }}>
          {loadingInvoice ? (
            <div className="text-center p-5">
              <Loading />
              <p className="mt-2">Fetching invoice details...</p>
            </div>
          ) : selectedInvoiceData ? (
            <div>
              <div className="row mb-4">
                <div className="col-md-6">
                  <p
                    className="mb-1 text-muted"
                    style={{ fontSize: "12px", textTransform: "uppercase" }}
                  >
                    Invoice Number
                  </p>
                  <h5
                    className="mb-3"
                    style={{ fontWeight: 600, color: "var(--primary-color)" }}
                  >
                    {selectedInvoiceData.invoiceNumber}
                  </h5>
                  <p
                    className="mb-1 text-muted"
                    style={{ fontSize: "12px", textTransform: "uppercase" }}
                  >
                    Date
                  </p>
                  <h6>{selectedInvoiceData.date}</h6>
                </div>
                <div className="col-md-6 text-md-end">
                  <p
                    className="mb-1 text-muted"
                    style={{ fontSize: "12px", textTransform: "uppercase" }}
                  >
                    Customer
                  </p>
                  <h5 style={{ fontWeight: 600 }}>
                    {selectedInvoiceData.customerName}
                  </h5>
                </div>
              </div>

              <div className="table-responsive">
                <Table bordered hover className="mt-3">
                  <thead style={{ backgroundColor: "#f8f9fa" }}>
                    <tr style={{ fontSize: "13px" }}>
                      <th style={{ fontWeight: 600 }}>Product Name</th>
                      <th className="text-end" style={{ fontWeight: 600 }}>
                        Quantity
                      </th>
                      <th className="text-end" style={{ fontWeight: 600 }}>
                        Price
                      </th>
                      <th className="text-end" style={{ fontWeight: 600 }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "13px" }}>
                    {selectedInvoiceData.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.productName}</td>
                        <td className="text-end">{item.quantity}</td>
                        <td className="text-end">
                          ₹{item.price.toLocaleString("en-IN")}
                        </td>
                        <td className="text-end">
                          ₹{item.total.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ borderTop: "2px solid #dee2e6" }}>
                    <tr>
                      <td
                        colSpan="3"
                        className="text-end"
                        style={{ fontWeight: 600 }}
                      >
                        Subtotal
                      </td>
                      <td className="text-end" style={{ fontWeight: 600 }}>
                        ₹{selectedInvoiceData.subtotal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="3"
                        className="text-end"
                        style={{ fontWeight: 700 }}
                      >
                        Grand Total
                      </td>
                      <td
                        className="text-end"
                        style={{
                          fontWeight: 700,
                          color: "var(--primary-color)",
                          fontSize: "1.2rem",
                        }}
                      >
                        ₹{selectedInvoiceData.total.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center p-3 text-muted">
              No details available.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowInvoiceModal(false)}
            style={{ fontFamily: "Poppins" }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default StoreStockSummary;
