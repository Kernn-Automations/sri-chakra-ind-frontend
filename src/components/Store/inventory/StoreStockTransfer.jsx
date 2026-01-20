import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import LoadingAnimation from "@/components/LoadingAnimation";
import inventoryAni from "../../../images/animations/fetchingAnimation.gif";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import inventoryStyles from "../../Dashboard/Inventory/Inventory.module.css";
import storeService from "../../../services/storeService";
import { handleExportPDF, handleExportExcel } from "@/utils/PDFndXLSGenerator";
import xls from "../../../images/xls-png.png";
import pdf from "../../../images/pdf-png.png";

function StoreStockTransfer() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [storesWarning, setStoresWarning] = useState("");

  // Store data
  const [currentStore, setCurrentStore] = useState(null);
  const [stores, setStores] = useState([]);
  const [selectedDestinationStore, setSelectedDestinationStore] = useState("");
  const [currentStock, setCurrentStock] = useState([]);

  // Destination store search
  const [storeSearch, setStoreSearch] = useState("");

  // Transfer items
  // Transfer items
  const [transferItems, setTransferItems] = useState({}); // { productId: { quantity, product } }

  // History State
  const [viewMode, setViewMode] = useState("create"); // "create" or "history"
  const [transferHistory, setTransferHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Search Visibility states
  const [showSearch, setShowSearch] = useState({
    product: false,
    historyTransferCode: false,
    historyToStore: false,
  });

  // Search Term states
  const [searchTerms, setSearchTerms] = useState({
    product: "",
    historyTransferCode: "",
    historyToStore: "",
  });

  const filteredDestinationStores = stores.filter((store) => {
    if (!storeSearch) return true;

    const term = storeSearch.toLowerCase();
    return (
      store.name?.toLowerCase().includes(term) ||
      store.storeCode?.toLowerCase().includes(term) ||
      (store.storeType || store.type || "").toLowerCase().includes(term)
    );
  });

  // Filtered Stock
  const [filteredStock, setFilteredStock] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);

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
    fetchCurrentStore();
  }, []);

  useEffect(() => {
    if (currentStore?.id) {
      fetchCurrentStock();
      fetchStores();
    }
  }, [currentStore]);

  useEffect(() => {
    if (viewMode === "history" && currentStore?.id) {
      fetchHistory();
    }
  }, [viewMode, currentStore]);

  const fetchCurrentStore = async () => {
    try {
      setLoading(true);
      let storeId = null;

      // Try from selectedStore in localStorage
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        try {
          const store = JSON.parse(selectedStore);
          storeId = store.id;
        } catch (e) {
          console.error("Error parsing selectedStore:", e);
        }
      }

      // Fallback to currentStoreId
      if (!storeId) {
        const currentStoreId = localStorage.getItem("currentStoreId");
        storeId = currentStoreId ? parseInt(currentStoreId) : null;
      }

      // Fallback to user object
      if (!storeId) {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const user = userData.user || userData;
        storeId = user?.storeId || user?.store?.id;
      }

      if (!storeId) {
        throw new Error(
          "Store information missing. Please re-login to continue.",
        );
      }

      // Fetch store details from backend
      const res = await storeService.getStoreById(storeId);
      const store = res.store || res.data || res;
      if (store && store.id) {
        setCurrentStore(store);
      } else {
        throw new Error("Store not found");
      }
    } catch (err) {
      console.error("Error fetching current store:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error fetching store information",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    if (!currentStore?.id) return;

    setLoading(true);
    try {
      const response = await storeService.getDestinationStores(currentStore.id);
      const storesData = response.data || response.stores || response || [];
      const mappedStores = Array.isArray(storesData)
        ? storesData.map((store) => ({
            id: store.id,
            name: store.name || store.storeName,
            storeCode: store.storeCode || store.code,
            storeType: store.storeType || store.type || "own",
            type: store.type || store.storeType || "own",
            division: store.division || null,
          }))
        : [];

      setStores(mappedStores);
      if (mappedStores.length === 0) {
        setStoresWarning("No destination stores available for transfer.");
      } else {
        setStoresWarning("");
      }
    } catch (err) {
      console.error("Error fetching destination stores:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error fetching destination stores",
      );
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentStock = async () => {
    if (!currentStore?.id) return;

    setLoading(true);
    try {
      const response = await storeService.getAvailableStockForTransfer(
        currentStore.id,
      );
      const stockData = response.data || response.stock || response || [];

      // Map backend response to frontend format
      const mappedStock = Array.isArray(stockData)
        ? stockData.map((item) => ({
            id: item.productId,
            productId: item.productId,
            productName: item.productName || item.name,
            productCode: item.sku || item.SKU || item.productCode,
            currentStock: item.available || item.quantity || 0,
            available: item.available || item.quantity || 0,
            unit: item.unit || "kg",
            unitPrice: item.customPrice || item.basePrice || 0,
            basePrice: item.basePrice || 0,
            customPrice: item.customPrice || null,
            productType: item.productType || "packed",
          }))
        : [];

      setCurrentStock(mappedStock);
    } catch (err) {
      console.error("Error fetching available stock:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error fetching available stock",
      );
      setCurrentStock([]);
    } finally {
      setLoading(false);
    }
  };

  // ESC key functionality
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setShowSearch({
          product: false,
          historyTransferCode: false,
          historyToStore: false,
        });
        setSearchTerms({
          product: "",
          historyTransferCode: "",
          historyToStore: "",
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
          product: false,
          historyTransferCode: false,
          historyToStore: false,
        });
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  // Filtering Logic for Available Stock
  useEffect(() => {
    let filtered = currentStock;
    if (searchTerms.product) {
      filtered = filtered.filter(
        (item) =>
          item.productName
            ?.toLowerCase()
            .includes(searchTerms.product.toLowerCase()) ||
          item.productCode
            ?.toLowerCase()
            .includes(searchTerms.product.toLowerCase()),
      );
    }
    setFilteredStock(filtered);
  }, [currentStock, searchTerms.product]);

  // Filtering Logic for History
  useEffect(() => {
    let filtered = transferHistory;
    if (searchTerms.historyTransferCode) {
      filtered = filtered.filter((item) =>
        item.transferCode
          ?.toLowerCase()
          .includes(searchTerms.historyTransferCode.toLowerCase()),
      );
    }
    if (searchTerms.historyToStore) {
      filtered = filtered.filter((item) =>
        (item.toStore?.name || item.toStoreName || "")
          .toLowerCase()
          .includes(searchTerms.historyToStore.toLowerCase()),
      );
    }
    setFilteredHistory(filtered);
  }, [
    transferHistory,
    searchTerms.historyTransferCode,
    searchTerms.historyToStore,
  ]);

  const handleQuantityChange = (productId, quantity) => {
    const product = currentStock.find(
      (p) => p.id === productId || p.productId === productId,
    );
    if (!product) return;

    const qty = parseFloat(quantity) || 0;
    if (qty < 0) return;
    const availableStock = product.available || product.currentStock || 0;
    if (qty > availableStock) {
      setError(
        `Quantity cannot exceed available stock (${availableStock} ${product.unit})`,
      );
      return;
    }

    if (qty === 0) {
      setTransferItems((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    } else {
      setTransferItems((prev) => ({
        ...prev,
        [productId]: {
          quantity: qty,
          product: product,
        },
      }));
    }
  };

  const getDestinationStore = () => {
    return stores.find((s) => s.id === parseInt(selectedDestinationStore));
  };

  const getTransferType = () => {
    if (!currentStore || !selectedDestinationStore) return null;

    const destinationStore = getDestinationStore();
    if (!destinationStore) return null;

    // Check if both stores are own stores or franchise stores
    const currentStoreType =
      currentStore.storeType || currentStore.type || "own";
    const destStoreType =
      destinationStore.storeType || destinationStore.type || "own";

    // If transfer from own store to franchise store, it's a sale
    if (currentStoreType === "own" && destStoreType === "franchise") {
      return "sale";
    }

    // If transfer between two own stores, it's a stock transfer
    if (currentStoreType === "own" && destStoreType === "own") {
      return "stock_transfer";
    }

    // Default to stock transfer for other cases
    return "stock_transfer";
  };

  const handleSubmit = async () => {
    if (!selectedDestinationStore) {
      setError("Please select a destination store");
      return;
    }

    const items = Object.values(transferItems);
    if (items.length === 0) {
      setError("Please add at least one product to transfer");
      return;
    }

    // Validate quantities
    for (const item of items) {
      if (item.quantity <= 0) {
        setError(`Invalid quantity for ${item.product.productName}`);
        return;
      }
      const availableStock =
        item.product.available || item.product.currentStock || 0;
      if (item.quantity > availableStock) {
        setError(
          `Quantity exceeds available stock for ${item.product.productName}`,
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const transferType = getTransferType();
      const destinationStore = getDestinationStore();

      const payload = {
        fromStoreId: currentStore.id,
        toStoreId: parseInt(selectedDestinationStore),
        items: items.map((item) => ({
          productId: item.product.productId || item.product.id,
          quantity: item.quantity,
        })),
        notes: `Stock transfer from ${currentStore.name || "Current Store"} to ${destinationStore?.name || "Destination Store"}`,
      };

      const res = await storeService.createStockTransfer(payload);
      const transferData = res.data || res;
      const transferCode =
        transferData?.transfer?.transferCode ||
        transferData?.transferCode ||
        res.transferCode ||
        "N/A";

      setSuccessMessage(
        `Stock transfer completed successfully! Transfer Code: ${transferCode}`,
      );

      // Clear form
      setTransferItems({});
      setSelectedDestinationStore("");

      // Refresh stock
      setTimeout(() => {
        fetchCurrentStock();
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error submitting stock transfer:", err);
      setError(
        err?.response?.data?.message || "Failed to submit stock transfer",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const closeErrorModal = () => {
    setError(null);
  };

  const fetchHistory = async () => {
    if (!currentStore?.id) return;
    setHistoryLoading(true);
    try {
      const res = await storeService.getStockTransfers(currentStore.id);
      const data = res.data || res.transfers || res || [];
      setTransferHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching transfer history:", err);
      // setError("Failed to fetch transfer history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewDetails = async (transferId) => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      const res = await storeService.getStockTransferById(
        currentStore.id,
        transferId,
      );
      const data = res.data || res.transfer || res;
      setSelectedTransfer(data);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Error fetching transfer details:", err);
      setError("Failed to fetch transfer details");
    } finally {
      setLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTransfer(null);
  };

  const handleDownloadInvoice = async (transferId) => {
    if (!transferId) return;
    setLoading(true);
    try {
      const response =
        await storeService.downloadStockTransferInvoice(transferId);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `stock_transfer_invoice_${transferId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Error downloading invoice:", err);
      setError("Failed to download invoice");
    } finally {
      setLoading(false);
    }
  };

  // Export function
  const onExport = (type) => {
    const arr = [];
    let x = 1;
    const columns = [
      "S.No",
      "Product",
      "Product Code",
      "Available Stock",
      "Unit",
    ];
    const dataToExport =
      filteredStock && filteredStock.length > 0
        ? filteredStock.filter(
            (product) => (product.available || product.currentStock || 0) > 0,
          )
        : (currentStock || []).filter(
            (product) => (product.available || product.currentStock || 0) > 0,
          );
    if (dataToExport && dataToExport.length > 0) {
      dataToExport.forEach((item) => {
        arr.push({
          "S.No": x++,
          Product: item.productName || "-",
          "Product Code": item.productCode || "-",
          "Available Stock": Number(
            item.available || item.currentStock || 0,
          ).toFixed(2),
          Unit: item.unit || "kg",
        });
      });

      if (type === "PDF") handleExportPDF(columns, arr, "Stock_Transfer");
      else if (type === "XLS") handleExportExcel(columns, arr, "StockTransfer");
    } else {
      setError("Table is Empty");
    }
  };

  const transferItemsList = Object.values(transferItems);
  const totalItems = transferItemsList.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const transferType = getTransferType();
  const destinationStore = getDestinationStore();

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
          Stock Transfer
        </h2>
        <p className="path">
          <span onClick={() => navigate("/store/inventory")}>Inventory</span>{" "}
          <i className="bi bi-chevron-right"></i> Stock Transfer
        </p>
      </div>

      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          className="homebtn"
          onClick={() =>
            setViewMode(viewMode === "create" ? "history" : "create")
          }
          style={{
            fontFamily: "Poppins",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {viewMode === "create" ? (
            <>
              <i className="bi bi-clock-history"></i> History
            </>
          ) : (
            <>
              <i className="bi bi-plus-lg"></i> New Transfer
            </>
          )}
        </button>
      </div>

      {/* Loading Animation */}
      {loading && (
        <LoadingAnimation gif={inventoryAni} msg="Loading stock data..." />
      )}

      {/* Error Modal */}
      {error && <ErrorModal message={error} onClose={closeErrorModal} />}

      {/* Success Message */}
      {successMessage && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#dcfce7",
            color: "#166534",
            border: "1px solid #86efac",
            marginBottom: "16px",
            fontFamily: "Poppins",
            fontWeight: 600,
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Stores Warning */}
      {storesWarning && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#fef3c7",
            color: "#92400e",
            border: "1px solid #fcd34d",
            marginBottom: "16px",
            fontFamily: "Poppins",
            fontSize: "14px",
          }}
        >
          <strong>⚠️ Warning:</strong> {storesWarning}
        </div>
      )}

      {!loading && currentStore && viewMode === "create" && (
        <>
          {/* Store Information */}
          <div
            className={styles.orderStatusCard}
            style={{ marginBottom: "24px" }}
          >
            <h4
              style={{
                margin: 0,
                marginBottom: "16px",
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: "20px",
                color: "var(--primary-color)",
              }}
            >
              Transfer Information
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#666",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  From Store (Source)
                </label>
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {currentStore.name || "Current Store"}
                </div>
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  Type:{" "}
                  {(
                    currentStore.storeType ||
                    currentStore.type ||
                    "own"
                  ).toUpperCase()}
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#666",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  To Store (Destination)
                </label>
                <select
                  className="form-control"
                  value={selectedDestinationStore}
                  onChange={(e) => setSelectedDestinationStore(e.target.value)}
                  style={{ fontFamily: "Poppins", fontSize: "14px" }}
                >
                  <option value="">Select destination store...</option>
                  {stores
                    .filter((store) => store.id !== currentStore.id)
                    .map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name} (
                        {(store.storeType || store.type || "own").toUpperCase()}
                        )
                      </option>
                    ))}
                </select>
              </div>
              {destinationStore && (
                <div>
                  <label
                    style={{
                      fontFamily: "Poppins",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#666",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Transfer Type
                  </label>
                  <div
                    style={{
                      fontFamily: "Poppins",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: transferType === "sale" ? "#dc2626" : "#059669",
                    }}
                  >
                    {transferType === "sale" ? "SALE" : "STOCK TRANSFER"}
                  </div>
                  <div
                    style={{
                      fontFamily: "Poppins",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    {transferType === "sale"
                      ? "Own store to Franchise store"
                      : "Own store to Own store"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Export buttons */}
          {currentStock.filter(
            (product) => (product.available || product.currentStock || 0) > 0,
          ).length > 0 && (
            <div className="row m-0 p-3 justify-content-around">
              <div className="col-lg-5">
                <button
                  className={inventoryStyles.xls}
                  onClick={() => onExport("XLS")}
                >
                  <p>Export to </p>
                  <img src={xls} alt="" />
                </button>
                <button
                  className={inventoryStyles.xls}
                  onClick={() => onExport("PDF")}
                >
                  <p>Export to </p>
                  <img src={pdf} alt="" />
                </button>
              </div>
            </div>
          )}

          {/* Available Stock */}
          <div
            className={styles.orderStatusCard}
            style={{ marginBottom: "24px" }}
          >
            <h4
              style={{
                margin: 0,
                marginBottom: "16px",
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: "20px",
                color: "var(--primary-color)",
              }}
            >
              Available Stock
            </h4>
            {currentStock.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: "40px", color: "#666" }}
              >
                <p style={{ fontFamily: "Poppins" }}>
                  No stock available for transfer
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  className="table table-bordered borderedtable table-sm"
                  style={{ fontFamily: "Poppins" }}
                >
                  <thead className="table-light">
                    <tr>
                      {renderSearchHeader(
                        "Product",
                        "product",
                        "data-product-header",
                      )}
                      <th
                        style={{
                          fontFamily: "Poppins",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        Available
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
                      <th
                        style={{
                          fontFamily: "Poppins",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        Transfer Qty
                      </th>
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
                    {searchTerms.product && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            padding: "4px 12px",
                            fontSize: "12px",
                            borderRadius: "0",
                            backgroundColor: "#f8f9fa",
                            color: "#666",
                          }}
                        >
                          {
                            filteredStock.filter(
                              (p) => (p.available || p.currentStock || 0) > 0,
                            ).length
                          }{" "}
                          products found
                        </td>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {filteredStock
                      .filter(
                        (product) =>
                          (product.available || product.currentStock || 0) > 0,
                      )
                      .map((product, index) => {
                        const productId = product.id || product.productId;
                        const availableStock =
                          product.available || product.currentStock || 0;
                        const transferItem = transferItems[productId];
                        const transferQty = transferItem?.quantity || 0;
                        return (
                          <tr
                            key={productId}
                            style={{
                              background:
                                index % 2 === 0
                                  ? "rgba(59, 130, 246, 0.03)"
                                  : "transparent",
                            }}
                          >
                            <td
                              style={{
                                fontFamily: "Poppins",
                                fontSize: "13px",
                              }}
                            >
                              <div style={{ fontWeight: 600 }}>
                                {product.productName}
                              </div>
                              <div style={{ fontSize: "12px", color: "#666" }}>
                                {product.productCode || product.sku}
                              </div>
                            </td>
                            <td
                              style={{
                                fontFamily: "Poppins",
                                fontSize: "13px",
                              }}
                            >
                              {Number(availableStock || 0).toFixed(2)}
                            </td>
                            <td
                              style={{
                                fontFamily: "Poppins",
                                fontSize: "13px",
                              }}
                            >
                              {product.unit}
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                max={availableStock}
                                step="0.01"
                                value={transferQty}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    productId,
                                    e.target.value,
                                  )
                                }
                                style={{
                                  width: "100px",
                                  padding: "6px 8px",
                                  borderRadius: "6px",
                                  border: "1px solid #000",
                                  fontFamily: "Poppins",
                                  fontSize: "13px",
                                  backgroundColor: "#fff",
                                  color: "#000",
                                }}
                                placeholder="0"
                              />
                            </td>
                            <td>
                              {transferQty > 0 && (
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() =>
                                    handleQuantityChange(productId, 0)
                                  }
                                  style={{
                                    fontFamily: "Poppins",
                                    fontSize: "12px",
                                  }}
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transfer Summary */}
          {transferItemsList.length > 0 && (
            <div
              className={styles.orderStatusCard}
              style={{ marginBottom: "24px" }}
            >
              <h4
                style={{
                  margin: 0,
                  marginBottom: "16px",
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontSize: "20px",
                  color: "var(--primary-color)",
                }}
              >
                Transfer Summary
              </h4>
              <div style={{ overflowX: "auto" }}>
                <table
                  className="table table-bordered borderedtable table-sm"
                  style={{ fontFamily: "Poppins" }}
                >
                  <thead className="table-light">
                    <tr>
                      <th
                        style={{
                          fontFamily: "Poppins",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        Product
                      </th>
                      <th
                        style={{
                          fontFamily: "Poppins",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        Quantity
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
                  </thead>
                  <tbody>
                    {transferItemsList.map((item, index) => (
                      <tr
                        key={item.product.id || item.product.productId}
                        style={{
                          background:
                            index % 2 === 0
                              ? "rgba(59, 130, 246, 0.03)"
                              : "transparent",
                        }}
                      >
                        <td style={{ fontFamily: "Poppins", fontSize: "13px" }}>
                          <div style={{ fontWeight: 600 }}>
                            {item.product.productName}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            {item.product.productCode || item.product.sku}
                          </div>
                        </td>
                        <td
                          style={{
                            fontFamily: "Poppins",
                            fontSize: "13px",
                            fontWeight: 600,
                          }}
                        >
                          {Number(item.quantity || 0).toFixed(2)}
                        </td>
                        <td style={{ fontFamily: "Poppins", fontSize: "13px" }}>
                          {item.product.unit}
                        </td>
                        <td>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() =>
                              handleQuantityChange(
                                item.product.id || item.product.productId,
                                0,
                              )
                            }
                            style={{ fontFamily: "Poppins", fontSize: "12px" }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  backgroundColor: "#eff6ff",
                  borderRadius: "8px",
                  fontFamily: "Poppins",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", color: "#475569" }}>
                      Total Items
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {transferItemsList.length} products
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", color: "#475569" }}>
                      Total Quantity
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "var(--primary-color)",
                      }}
                    >
                      {totalItems} units
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              marginTop: "24px",
            }}
          >
            <button
              className="btn btn-light"
              onClick={() => navigate("/store/inventory")}
              disabled={submitting}
              style={{ fontFamily: "Poppins" }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={
                submitting ||
                transferItemsList.length === 0 ||
                !selectedDestinationStore
              }
              style={{ fontFamily: "Poppins" }}
            >
              {submitting
                ? "Submitting..."
                : transferType === "sale"
                  ? "Record Sale"
                  : "Transfer Stock"}
            </button>
          </div>
        </>
      )}

      {/* History View */}
      {!loading && currentStore && viewMode === "history" && (
        <div className={styles.orderStatusCard}>
          <h4
            style={{
              margin: 0,
              marginBottom: "16px",
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: "20px",
              color: "var(--primary-color)",
            }}
          >
            Transfer History
          </h4>
          {historyLoading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              Loading history...
            </div>
          ) : transferHistory.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#666" }}
            >
              <p style={{ fontFamily: "Poppins" }}>No transfer history found</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                className="table table-bordered borderedtable table-sm"
                style={{ fontFamily: "Poppins" }}
              >
                <thead className="table-light">
                  <tr>
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
                      "Transfer Code",
                      "historyTransferCode",
                      "data-history-transfer-code",
                    )}
                    {renderSearchHeader(
                      "To Store",
                      "historyToStore",
                      "data-history-to-store",
                    )}
                    <th
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 600,
                        fontSize: "13px",
                      }}
                    >
                      Items
                    </th>
                    <th
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 600,
                        fontSize: "13px",
                      }}
                    >
                      Status
                    </th>
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
                  {(searchTerms.historyTransferCode ||
                    searchTerms.historyToStore) && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: "4px 12px",
                          fontSize: "12px",
                          borderRadius: "0",
                          backgroundColor: "#f8f9fa",
                          color: "#666",
                        }}
                      >
                        {filteredHistory.length} transfers found
                      </td>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {filteredHistory.map((transfer) => (
                    <tr key={transfer.id}>
                      <td>
                        {new Date(transfer.createdAt).toLocaleDateString()}
                      </td>
                      <td>{transfer.transferCode || "-"}</td>
                      <td>
                        {transfer.toStore?.name || transfer.toStoreName || "-"}
                      </td>
                      <td>
                        {transfer.items?.length || transfer.itemCount || 0}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: 600,
                            backgroundColor:
                              transfer.status === "completed"
                                ? "#dcfce7"
                                : transfer.status === "pending"
                                  ? "#fef9c3"
                                  : "#fee2e2",
                            color:
                              transfer.status === "completed"
                                ? "#166534"
                                : transfer.status === "pending"
                                  ? "#854d0e"
                                  : "#991b1b",
                          }}
                        >
                          {(transfer.status || "Unknown").toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewDetails(transfer.id)}
                          style={{ fontSize: "12px" }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTransfer && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1050,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={closeDetailModal}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              padding: "24px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <h4 style={{ margin: 0, fontFamily: "Poppins", fontWeight: 600 }}>
                Transfer Details
              </h4>
              <button
                onClick={closeDetailModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>

            <div
              style={{
                marginBottom: "16px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <small style={{ color: "#666" }}>Transfer Code</small>
                <div style={{ fontWeight: 600 }}>
                  {selectedTransfer.transferCode || "-"}
                </div>
              </div>
              <div>
                <small style={{ color: "#666" }}>Date</small>
                <div style={{ fontWeight: 600 }}>
                  {new Date(selectedTransfer.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                <small style={{ color: "#666" }}>From Store</small>
                <div style={{ fontWeight: 600 }}>
                  {selectedTransfer.fromStore?.name || "-"}
                </div>
              </div>
              <div>
                <small style={{ color: "#666" }}>To Store</small>
                <div style={{ fontWeight: 600 }}>
                  {selectedTransfer.toStore?.name || "-"}
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <small style={{ color: "#666" }}>Status</small>
                <div>
                  {(selectedTransfer.status || "Unknown").toUpperCase()}
                </div>
              </div>
              {selectedTransfer.notes && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <small style={{ color: "#666" }}>Notes</small>
                  <div>{selectedTransfer.notes}</div>
                </div>
              )}
            </div>

            <table
              className="table table-sm table-bordered"
              style={{ fontFamily: "Poppins", fontSize: "14px" }}
            >
              <thead className="table-light">
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {(selectedTransfer.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div>
                        {item.product?.name || item.productName || "Product"}
                      </div>
                      <small style={{ color: "#666" }}>
                        {item.product?.sku || item.sku || ""}
                      </small>
                    </td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownloadInvoice(selectedTransfer.id)}
                style={{ fontFamily: "Poppins" }}
              >
                <i className="bi bi-download"></i> Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoreStockTransfer;
