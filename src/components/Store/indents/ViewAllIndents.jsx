import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import styles from "../../Dashboard/Purchases/Purchases.module.css";
import {
  FaFileAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import storeService from "../../../services/storeService";

export default function ViewAllIndents() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const [storeId, setStoreId] = useState(null);
  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [indents, setIndents] = useState([]);
  const [selectedIndent, setSelectedIndent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = ({ title, status, duration = 3000 }) => {
    setToast({ message: title, severity: status });
    setTimeout(() => setToast(null), duration);
  };

  // Header Search States
  const [showSearch, setShowSearch] = useState({
    code: false,
    status: false,
  });

  const [searchTerms, setSearchTerms] = useState({
    code: "",
    status: "",
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

  // Click outside functionality
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close header search if clicked outside
      if (!event.target.closest("[data-search-header]")) {
        setShowSearch({
          code: false,
          status: false,
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
          code: false,
          status: false,
        });
        setSearchTerms({
          code: "",
          status: "",
        });
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  const getSelectedManualProductIds = (currentIndex) => {
    return manualStockItems
      .filter((_, idx) => idx !== currentIndex)
      .map((item) => String(item.productId))
      .filter(Boolean);
  };

  // Stock In states
  const [showStockIn, setShowStockIn] = useState(false);
  const [receivedQuantities, setReceivedQuantities] = useState({});
  const [hasDamagedGoods, setHasDamagedGoods] = useState(false);
  const [damagedGoodsRows, setDamagedGoodsRows] = useState([]);
  const [stockInLoading, setStockInLoading] = useState(false);

  // Manual Stock In states
  const [showManualStockIn, setShowManualStockIn] = useState(false);
  const [products, setProducts] = useState([]);
  const [manualStockItems, setManualStockItems] = useState([
    { productId: "", quantity: "", unit: "units" },
  ]);
  const [manualStockDamagedGoods, setManualStockDamagedGoods] = useState([]);
  const [hasManualDamagedGoods, setHasManualDamagedGoods] = useState(false);
  const [manualStockInLoading, setManualStockInLoading] = useState(false);

  // Get store ID from localStorage
  useEffect(() => {
    try {
      // Get store ID from multiple sources
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

  // Fetch indents from backend
  useEffect(() => {
    if (storeId) {
      fetchIndents();
      fetchProducts();
    }
  }, [storeId, pageNo, limit]);

  // Fetch products for manual stock in
  const fetchProducts = async () => {
    if (!storeId) return;

    try {
      const res = await storeService.getStoreProducts(storeId);
      console.log(res);
      const productsData =
        res.data?.products || res.data || res.products || res || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchIndents = async () => {
    if (!storeId) return;

    try {
      setLoading(true);
      const params = {
        page: pageNo,
        limit: limit,
      };

      const res = await storeService.getStoreIndents(storeId, params);
      console.log(res);
      // Handle different response formats
      const indentsData =
        res.data?.indents || res.data || res.indents || res || [];
      const total = res.data?.total || res.total || indentsData.length;

      // Map backend response to UI format
      const mappedIndents = Array.isArray(indentsData)
        ? indentsData.map((indent) => ({
            id: indent.id,
            code:
              indent.indentCode ||
              indent.code ||
              `IND${String(indent.id).padStart(6, "0")}`,
            value: indent.totalAmount || indent.value || 0,
            status: mapStatus(indent.status),
            originalStatus: indent.status?.toLowerCase() || indent.status, // Store original backend status
            date: formatDate(indent.createdAt || indent.date),
            itemCount: indent.items?.length || indent.itemCount || 0,
            storeName: indent.store?.name || indent.storeName || "Store",
            notes: indent.notes || "",
            items: indent.items || [],
          }))
        : [];

      setIndents(mappedIndents);
      setTotalPages(Math.ceil(total / limit) || 1);
    } catch (err) {
      console.error("Error fetching indents:", err);
      setError(
        err.response?.data?.message || err.message || "Error fetching indents",
      );
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtered indents for header search
  const displayIndents = React.useMemo(() => {
    let filtered = indents;

    if (searchTerms.code) {
      filtered = filtered.filter((indent) =>
        indent.code?.toLowerCase().includes(searchTerms.code.toLowerCase()),
      );
    }

    if (searchTerms.status) {
      filtered = filtered.filter((indent) =>
        indent.status?.toLowerCase().includes(searchTerms.status.toLowerCase()),
      );
    }

    return filtered;
  }, [indents, searchTerms]);

  // Map backend status to UI status
  const mapStatus = (status) => {
    const statusMap = {
      pending: "Awaiting Approval",
      approved: "Approved",
      rejected: "Rejected",
      processing: "Waiting for Stock",
      completed: "Stocked In",
      stocked_in: "Stocked In",
    };
    return statusMap[status?.toLowerCase()] || status || "Awaiting Approval";
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  const needsStockInAttention = (indent) => {
    return (
      indent?.originalStatus === "approved" ||
      indent?.status === "Waiting for Stock"
    );
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      "Awaiting Approval": { class: "bg-warning", icon: <FaClock /> },
      "Waiting for Stock": { class: "bg-info", icon: <FaClock /> },
      Approved: { class: "bg-success", icon: <FaCheckCircle /> },
      Rejected: { class: "bg-danger", icon: <FaTimesCircle /> },
    };
    return statusMap[status] || { class: "bg-secondary", icon: <FaFileAlt /> };
  };

  const handleViewClick = (indent) => {
    setSelectedIndent(indent);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedIndent(null);
    setShowStockIn(false);
    setReceivedQuantities({});
    setHasDamagedGoods(false);
    setDamagedGoodsRows([]);
  };

  const handleCloseManualStockIn = () => {
    setShowManualStockIn(false);
    setManualStockItems([{ productId: "", quantity: "", unit: "units" }]);
    setManualStockDamagedGoods([]);
    setHasManualDamagedGoods(false);
  };

  const handleAddManualStockItem = () => {
    setManualStockItems([
      ...manualStockItems,
      { productId: "", quantity: "", unit: "units" },
    ]);
  };

  const handleRemoveManualStockItem = (index) => {
    setManualStockItems(manualStockItems.filter((_, i) => i !== index));
  };

  const handleManualStockItemChange = (index, field, value) => {
    const newItems = [...manualStockItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // If product changed, update unit from product data
    if (field === "productId" && value) {
      const product = products.find(
        (p) => (p.id || p.productId)?.toString() === value.toString(),
      );
      if (product) {
        newItems[index].unit = product.unit || "units";
      }
    }

    setManualStockItems(newItems);

    // Update damaged goods rows if enabled
    if (hasManualDamagedGoods) {
      const validItems = newItems.filter(
        (item) => item.productId && item.quantity,
      );
      const newDamagedRows = validItems.map((item) => {
        const product = products.find(
          (p) =>
            (p.id || p.productId)?.toString() === item.productId.toString(),
        );
        const existingRow = manualStockDamagedGoods.find(
          (row) =>
            (row.productId?.toString() || String(row.productId)) ===
            (item.productId?.toString() || String(item.productId)),
        );

        return {
          productId: item.productId,
          productName:
            product?.name ||
            product?.productName ||
            `Product ${item.productId}`,
          orderedQty: parseFloat(item.quantity) || 0,
          damagedQty: existingRow?.damagedQty || 0,
          reason: existingRow?.reason || "",
          image: existingRow?.image || null,
          imageBase64: existingRow?.imageBase64 || null,
          imagePreview: existingRow?.imagePreview || null,
        };
      });
      setManualStockDamagedGoods(newDamagedRows);
    }
  };

  const handleConfirmManualStockIn = async () => {
    if (!storeId) {
      setError("Store information missing");
      setIsModalOpen(true);
      return;
    }

    // Validate items
    const validItems = manualStockItems.filter(
      (item) =>
        item.productId && item.quantity && parseFloat(item.quantity) > 0,
    );

    if (validItems.length === 0) {
      setError("Please add at least one product with valid quantity");
      setIsModalOpen(true);
      return;
    }

    try {
      setManualStockInLoading(true);

      // Prepare stock in payload for manual stock (without indentId)
      // For manual stock in, we don't send indentId at all
      const stockInPayload = {
        storeId: storeId,
        // Note: indentId is NOT included for manual stock in
        items: validItems.map((item) => {
          const productId = parseInt(item.productId);
          const quantity = parseFloat(item.quantity);

          // Find damaged goods for this product if any
          const damagedRow = hasManualDamagedGoods
            ? manualStockDamagedGoods.find((row) => {
                const rowProductId =
                  row.productId?.toString() || String(row.productId);
                const itemProductId =
                  productId?.toString() || String(productId);
                return rowProductId === itemProductId;
              })
            : null;

          const damagedQty =
            damagedRow && damagedRow.damagedQty > 0
              ? parseFloat(damagedRow.damagedQty)
              : 0;

          // Extract base64 data (remove data:image/...;base64, prefix if present)
          const damagedImageBase64 =
            damagedRow && damagedRow.imageBase64
              ? damagedRow.imageBase64.includes(",")
                ? damagedRow.imageBase64.split(",")[1]
                : damagedRow.imageBase64
              : undefined;

          const itemPayload = {
            productId: productId,
            receivedQuantity: quantity,
          };

          // Add damaged goods fields only if damaged quantity > 0
          if (damagedQty > 0) {
            itemPayload.damagedQuantity = damagedQty;
            if (damagedImageBase64) {
              itemPayload.damagedImageBase64 = damagedImageBase64;
            }
          }

          return itemPayload;
        }),
      };

      // Prepare payload for manual stock in API endpoint
      // API: POST /stores/manual-stock-in or POST /stores/:storeId/manual-stock-in
      // Payload structure: { storeId, isDamagedGoods, items: [{ productId, quantity, unit, damagedQuantity, damagedImageBase64 }] }

      const hasAnyDamagedGoods =
        hasManualDamagedGoods &&
        manualStockDamagedGoods.some((row) => row.damagedQty > 0);

      const finalPayload = {
        storeId: storeId,
        isDamagedGoods: hasAnyDamagedGoods || false, // Optional flag
        items: validItems.map((item) => {
          const productId = parseInt(item.productId);
          const quantity = parseFloat(item.quantity);

          // Find damaged goods for this product if any
          const damagedRow = hasManualDamagedGoods
            ? manualStockDamagedGoods.find((row) => {
                const rowProductId =
                  row.productId?.toString() || String(row.productId);
                const itemProductId =
                  productId?.toString() || String(productId);
                return rowProductId === itemProductId;
              })
            : null;

          const damagedQty =
            damagedRow && damagedRow.damagedQty > 0
              ? parseFloat(damagedRow.damagedQty)
              : 0;

          // Extract base64 data (remove data:image/...;base64, prefix if present)
          const damagedImageBase64 =
            damagedRow && damagedRow.imageBase64
              ? damagedRow.imageBase64.includes(",")
                ? damagedRow.imageBase64.split(",")[1]
                : damagedRow.imageBase64
              : undefined;

          const itemPayload = {
            productId: productId,
            quantity: quantity, // API uses 'quantity' not 'receivedQuantity'
            unit: item.unit || "units", // Optional, uses product default if not provided
          };

          // Add damaged goods fields only if damaged quantity > 0
          if (damagedQty > 0) {
            itemPayload.damagedQuantity = damagedQty;
            if (damagedImageBase64) {
              itemPayload.damagedImageBase64 = damagedImageBase64;
            }
          }

          return itemPayload;
        }),
      };

      console.log(
        "Manual Stock In Payload:",
        JSON.stringify(finalPayload, null, 2),
      );
      console.log("Using endpoint: /stores/manual-stock-in");
      console.log("Payload keys:", Object.keys(finalPayload));
      console.log(
        "indentId in payload:",
        "indentId" in finalPayload ? "YES (ERROR!)" : "NO (CORRECT)",
      );

      const res = await storeService.processManualStockIn(finalPayload);

      const successMessage =
        res.message ||
        res.data?.message ||
        "Manual stock in processed successfully";
      showToast({
        title: successMessage,
        status: "success",
        duration: 3000,
      });

      // Reset form
      handleCloseManualStockIn();

      // Refresh the indents list (in case it shows stock history)
      fetchIndents();
    } catch (err) {
      console.error("Error processing manual stock in:", err);
      console.error("Error response:", err.response);
      console.error("Error response data:", err.response?.data);
      console.error("Error response status:", err.response?.status);
      console.error("Error details:", err.response?.data || err);

      let errorMessage = "Failed to process manual stock in";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.errors) {
        // Handle validation errors
        const errors = err.response.data.errors;
        if (Array.isArray(errors)) {
          errorMessage = errors.join(", ");
        } else if (typeof errors === "object") {
          errorMessage = Object.entries(errors)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");
        } else {
          errorMessage = String(errors);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsModalOpen(true);
    } finally {
      setManualStockInLoading(false);
    }
  };

  const handleManualDamagedGoodsToggle = (checked) => {
    setHasManualDamagedGoods(checked);
    if (checked) {
      // Initialize damaged goods rows from manual stock items
      const initialRows = manualStockItems
        .filter((item) => item.productId && item.quantity)
        .map((item) => {
          const product = products.find(
            (p) =>
              (p.id || p.productId)?.toString() === item.productId.toString(),
          );
          return {
            productId: item.productId,
            productName:
              product?.name ||
              product?.productName ||
              `Product ${item.productId}`,
            orderedQty: parseFloat(item.quantity) || 0,
            damagedQty: 0,
            reason: "",
            image: null,
            imageBase64: null,
            imagePreview: null,
          };
        });
      setManualStockDamagedGoods(initialRows);
    } else {
      setManualStockDamagedGoods([]);
    }
  };

  const handleManualDamagedGoodsChange = (index, field, value) => {
    setManualStockDamagedGoods((prev) => {
      const newRows = [...prev];
      const newValue =
        field === "damagedQty"
          ? Math.min(parseFloat(value) || 0, newRows[index].orderedQty)
          : value;
      newRows[index] = { ...newRows[index], [field]: newValue };
      return newRows;
    });
  };

  const handleManualImageUpload = async (index, file) => {
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      setIsModalOpen(true);
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      setIsModalOpen(true);
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setManualStockDamagedGoods((prev) => {
          const newRows = [...prev];
          newRows[index] = {
            ...newRows[index],
            image: file,
            imageBase64: base64String,
            imagePreview: base64String,
          };
          return newRows;
        });
      };
      reader.onerror = () => {
        setError("Error reading image file");
        setIsModalOpen(true);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error processing image:", err);
      setError("Error processing image");
      setIsModalOpen(true);
    }
  };

  const handleStockIn = () => {
    if (selectedIndent) {
      // Initialize received quantities with requested quantities
      const initialQuantities = {};
      const items = selectedIndent.items || selectedIndent.products || [];
      items.forEach((item, index) => {
        const productId = item.productId || item.id;
        initialQuantities[productId] =
          item.requestedQuantity || item.quantity || 0;
      });
      setReceivedQuantities(initialQuantities);
      setShowStockIn(true);
    }
  };

  const handleCancelStockIn = () => {
    setShowStockIn(false);
    setReceivedQuantities({});
    setHasDamagedGoods(false);
    setDamagedGoodsRows([]);
  };

  const handleReceivedQuantityChange = (productId, value) => {
    setReceivedQuantities((prev) => ({
      ...prev,
      [productId]: parseFloat(value) || 0,
    }));
  };

  const handleDamagedGoodsToggle = (checked) => {
    setHasDamagedGoods(checked);
    if (checked) {
      // Initialize damaged goods rows from items
      const items = selectedIndent.items || selectedIndent.products || [];
      const initialRows = items.map((item, index) => ({
        productId: item.productId || item.id,
        productName:
          item.product?.name ||
          item.productName ||
          `Product ${item.productId || item.id}`,
        orderedQty: item.requestedQuantity || item.quantity || 0,
        damagedQty: 0,
        reason: "",
        image: null,
        imageBase64: null,
        imagePreview: null,
      }));
      setDamagedGoodsRows(initialRows);
    } else {
      setDamagedGoodsRows([]);
    }
  };

  const handleDamagedGoodsChange = (index, field, value) => {
    setDamagedGoodsRows((prev) => {
      const newRows = [...prev];
      const newValue =
        field === "damagedQty"
          ? Math.min(parseFloat(value) || 0, newRows[index].orderedQty)
          : value;
      newRows[index] = { ...newRows[index], [field]: newValue };
      return newRows;
    });
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      setIsModalOpen(true);
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      setIsModalOpen(true);
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setDamagedGoodsRows((prev) => {
          const newRows = [...prev];
          newRows[index] = {
            ...newRows[index],
            image: file,
            imageBase64: base64String,
            imagePreview: base64String,
          };
          return newRows;
        });
      };
      reader.onerror = () => {
        setError("Error reading image file");
        setIsModalOpen(true);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error processing image:", err);
      setError("Error processing image");
      setIsModalOpen(true);
    }
  };

  const handleConfirmStockIn = async () => {
    if (!selectedIndent || !storeId) {
      setError("Store information missing");
      setIsModalOpen(true);
      return;
    }

    try {
      setStockInLoading(true);

      // Validate received quantities
      const items = selectedIndent.items || selectedIndent.products || [];
      const invalidItems = items.filter((item) => {
        const productId = item.productId || item.id;
        const receivedQty = receivedQuantities[productId] || 0;
        const requestedQty = item.requestedQuantity || item.quantity || 0;
        return receivedQty <= 0 || receivedQty > requestedQty;
      });

      if (invalidItems.length > 0) {
        setError(
          "Please enter valid received quantities (greater than 0 and not exceeding ordered quantity)",
        );
        setIsModalOpen(true);
        setStockInLoading(false);
        return;
      }

      // Validate damaged goods if enabled
      if (hasDamagedGoods) {
        // Note: API doesn't require reason or image, but we'll validate image is optional
        // Reason is kept in UI for user reference but not sent to API
        const damagedWithoutImage = damagedGoodsRows.filter((row) => {
          return row.damagedQty > 0 && !row.imageBase64;
        });

        // Image is optional according to API, but we can warn user
        // if (damagedWithoutImage.length > 0) {
        //   setError("Please upload image for all damaged goods");
        //   setIsModalOpen(true);
        //   setStockInLoading(false);
        //   return;
        // }
      }

      // Prepare stock in payload according to backend API format
      const stockInPayload = {
        indentId: selectedIndent.id,
        items: items.map((item) => {
          const productId = item.productId || item.id;
          const receivedQty = parseFloat(
            receivedQuantities[productId] ||
              item.requestedQuantity ||
              item.quantity ||
              0,
          );

          // Find damaged goods for this product if any
          const damagedRow = hasDamagedGoods
            ? damagedGoodsRows.find((row) => {
                const rowProductId =
                  row.productId?.toString() || String(row.productId);
                const itemProductId =
                  productId?.toString() || String(productId);
                return rowProductId === itemProductId;
              })
            : null;

          const damagedQty =
            damagedRow && damagedRow.damagedQty > 0
              ? parseFloat(damagedRow.damagedQty)
              : 0;

          // Extract base64 data (remove data:image/...;base64, prefix if present)
          const damagedImageBase64 =
            damagedRow && damagedRow.imageBase64
              ? damagedRow.imageBase64.includes(",")
                ? damagedRow.imageBase64.split(",")[1]
                : damagedRow.imageBase64
              : undefined;

          const itemPayload = {
            productId: parseInt(productId),
            receivedQuantity: receivedQty,
          };

          // Add damaged goods fields only if damaged quantity > 0
          if (damagedQty > 0) {
            itemPayload.damagedQuantity = damagedQty;
            if (damagedImageBase64) {
              itemPayload.damagedImageBase64 = damagedImageBase64;
            }
          }

          return itemPayload;
        }),
      };

      console.log("Stock In Payload:", JSON.stringify(stockInPayload, null, 2));

      const res = await storeService.processStockIn(stockInPayload);

      const successMessage =
        res.message || res.data?.message || "Stock in processed successfully";
      showToast({
        title: successMessage,
        status: "success",
        duration: 3000,
      });

      // Update selected indent status to reflect stock in completion
      if (selectedIndent) {
        setSelectedIndent((prev) => ({
          ...prev,
          status: "Stocked In",
          originalStatus: "completed",
        }));
      }

      // Reset stock in form but keep modal open to show updated status
      setShowStockIn(false);
      setReceivedQuantities({});
      setHasDamagedGoods(false);
      setDamagedGoodsRows([]);

      // Refresh the indents list
      fetchIndents();
    } catch (err) {
      console.error("Error processing stock in:", err);
      console.error("Error details:", err.response?.data || err);

      // Extract error message from various possible formats
      let errorMessage = "Failed to process stock in";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsModalOpen(true);
    } finally {
      setStockInLoading(false);
    }
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/store/indents")}>Indents</span>{" "}
        <i className="bi bi-chevron-right"></i> View Indents
      </p>

      <div className="row m-0 p-3">
        <div className="col-12">
          <div className="row m-0 mb-3 justify-content-between">
            <div className="col-auto">
              <button
                className="btn btn-primary"
                onClick={() => setShowManualStockIn(true)}
                style={{ fontFamily: "Poppins" }}
              >
                <i
                  className="bi bi-plus-circle"
                  style={{ marginRight: "8px" }}
                ></i>
                Manual Stock In
              </button>
            </div>
            <div
              className={`col-auto ${styles.entity}`}
              style={{ marginRight: 0 }}
            >
              <label htmlFor="">Entity :</label>
              <select
                name=""
                id=""
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPageNo(1); // Reset to first page when limit changes
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <table className={`table table-bordered borderedtable`}>
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
                {renderSearchHeader("Indent Code", "code", "data-code-header")}
                <th
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Items
                </th>
                {renderSearchHeader("Status", "status", "data-status-header")}
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
              {(searchTerms.code || searchTerms.status) && (
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
                    {displayIndents.length} indents found
                  </td>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : displayIndents.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    NO DATA FOUND
                  </td>
                </tr>
              ) : (
                displayIndents.map((indent, index) => {
                  const statusInfo = getStatusBadge(indent.status);
                  const actualIndex = (pageNo - 1) * limit + index + 1;
                  return (
                    <tr
                      key={index}
                      className="animated-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>{actualIndex}</td>
                      <td>{indent.date}</td>
                      <td>{indent.code}</td>
                      <td>
                        {indent.itemCount || indent.items?.length || 0} items
                      </td>
                      <td>
                        <span
                          className={`badge ${statusInfo.class}`}
                          style={{
                            padding: "4px 8px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {statusInfo.icon}
                          {indent.status}
                        </span>
                      </td>
                      <td
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {needsStockInAttention(indent) && (
                          <span
                            title="Action required – Stock In pending"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              backgroundColor: "#f59e0b",
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: "bold",
                              animation: "pulse 1.5s infinite",
                            }}
                          >
                            !
                          </span>
                        )}

                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewClick(indent)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div className="row m-0 p-0 pt-3 justify-content-between">
            <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
              {pageNo > 1 && (
                <button onClick={() => setPageNo(pageNo - 1)}>
                  <span>
                    <FaArrowLeftLong />
                  </span>{" "}
                  Previous
                </button>
              )}
            </div>
            <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
              {pageNo < totalPages && (
                <button onClick={() => setPageNo(pageNo + 1)}>
                  Next{" "}
                  <span>
                    <FaArrowRightLong />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Indent Details Modal */}
      {showModal && selectedIndent && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 150000,
          }}
          tabIndex="-1"
          role="dialog"
          onClick={handleCloseModal}
          onKeyDown={(e) => {
            if (e.key === "Escape") handleCloseModal();
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            role="document"
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 150001 }}
          >
            <div
              className="modal-content"
              style={{
                backgroundColor: "white",
                borderRadius: "0.5rem",
                boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
                zIndex: 150002,
              }}
            >
              <div
                className="modal-header"
                style={{
                  borderBottom: "1px solid #dee2e6",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "0.5rem 0.5rem 0 0",
                  padding: "1rem 1.5rem",
                }}
              >
                <h5
                  className="modal-title"
                  style={{
                    margin: 0,
                    fontWeight: "600",
                    fontFamily: "Poppins",
                  }}
                >
                  Indent Details - {selectedIndent.code}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div
                className="modal-body"
                style={{
                  padding: "1.5rem",
                  maxHeight: "70vh",
                  overflowY: "auto",
                }}
              >
                {!showStockIn ? (
                  <>
                    {/* Indent Information */}
                    <div style={{ marginBottom: "2rem" }}>
                      <h6
                        style={{
                          fontFamily: "Poppins",
                          fontWeight: 600,
                          marginBottom: "1rem",
                          color: "var(--primary-color)",
                        }}
                      >
                        Indent Information
                      </h6>
                      <div className="row" style={{ fontFamily: "Poppins" }}>
                        <div
                          className="col-6"
                          style={{ marginBottom: "0.75rem" }}
                        >
                          <strong>Indent Code:</strong> {selectedIndent.code}
                        </div>
                        <div
                          className="col-6"
                          style={{ marginBottom: "0.75rem" }}
                        >
                          <strong>Date:</strong> {selectedIndent.date}
                        </div>
                        <div
                          className="col-6"
                          style={{ marginBottom: "0.75rem" }}
                        >
                          <strong>Store:</strong>{" "}
                          {selectedIndent.storeName || "N/A"}
                        </div>
                        <div
                          className="col-6"
                          style={{ marginBottom: "0.75rem" }}
                        >
                          <strong>Status:</strong>
                          <span
                            className={`badge ${getStatusBadge(selectedIndent.status).class}`}
                            style={{ marginLeft: "8px" }}
                          >
                            {getStatusBadge(selectedIndent.status).icon}
                            {selectedIndent.status}
                          </span>
                        </div>
                        {/*<div
                          className="col-6"
                          style={{ marginBottom: "0.75rem" }}
                        >
                          <strong>Total Value:</strong> ₹
                          {Number(selectedIndent.value || 0).toLocaleString()}
                        </div>*/}
                        {selectedIndent.notes && (
                          <div
                            className="col-12"
                            style={{ marginTop: "0.5rem" }}
                          >
                            <strong>Notes:</strong>
                            <p
                              style={{ marginTop: "0.25rem", color: "#6b7280" }}
                            >
                              {selectedIndent.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items Table */}
                    <div>
                      <h6
                        style={{
                          fontFamily: "Poppins",
                          fontWeight: 600,
                          marginBottom: "1rem",
                          color: "var(--primary-color)",
                        }}
                      >
                        Items (
                        {selectedIndent.items?.length ||
                          selectedIndent.products?.length ||
                          selectedIndent.items ||
                          0}
                        )
                      </h6>
                      <div style={{ overflowX: "auto" }}>
                        <table
                          className={`table table-bordered borderedtable`}
                          style={{ fontFamily: "Poppins" }}
                        >
                          <thead>
                            <tr>
                              <th>S.No</th>
                              <th>Product Name</th>
                              <th>Quantity</th>
                              <th>Unit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedIndent.items &&
                            selectedIndent.items.length > 0 ? (
                              selectedIndent.items.map((item, index) => (
                                <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td>
                                    {item.product?.name ||
                                      item.productName ||
                                      `Product ${item.productId}`}
                                  </td>
                                  <td>
                                    {item.requestedQuantity ||
                                      item.quantity ||
                                      0}
                                  </td>
                                  <td>{item.unit || "units"}</td>
                                </tr>
                              ))
                            ) : selectedIndent.products &&
                              selectedIndent.products.length > 0 ? (
                              selectedIndent.products.map((product, index) => (
                                <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td>{product.name}</td>
                                  <td>{product.quantity}</td>
                                  <td>{product.unit}</td>
                                  <td>
                                    ₹
                                    {Number(
                                      product.price || 0,
                                    ).toLocaleString()}
                                  </td>
                                  <td>
                                    ₹
                                    {Number(
                                      (product.quantity || 0) *
                                        (product.price || 0),
                                    ).toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} style={{ textAlign: "center" }}>
                                  No items found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Stock In Form */}
                    <div style={{ marginBottom: "2rem" }}>
                      <h6
                        style={{
                          fontFamily: "Poppins",
                          fontWeight: 600,
                          marginBottom: "1rem",
                          color: "var(--primary-color)",
                        }}
                      >
                        Stock In - {selectedIndent.code}
                      </h6>

                      {/* Received Quantities Table */}
                      <div style={{ marginBottom: "1.5rem" }}>
                        <h6
                          style={{
                            fontFamily: "Poppins",
                            fontWeight: 600,
                            marginBottom: "0.75rem",
                            fontSize: "14px",
                          }}
                        >
                          Received Quantities
                        </h6>
                        <div style={{ overflowX: "auto" }}>
                          <table
                            className={`table table-bordered borderedtable`}
                            style={{ fontFamily: "Poppins", fontSize: "13px" }}
                          >
                            <thead>
                              <tr>
                                <th>S.No</th>
                                <th>Product</th>
                                <th>Ordered Qty</th>
                                <th>Received Qty</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(
                                selectedIndent.items ||
                                selectedIndent.products ||
                                []
                              ).map((item, index) => {
                                const productId = item.productId || item.id;
                                const orderedQty =
                                  item.requestedQuantity || item.quantity || 0;
                                const receivedQty =
                                  receivedQuantities[productId] || orderedQty;
                                return (
                                  <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>
                                      {item.product?.name ||
                                        item.productName ||
                                        `Product ${productId}`}
                                    </td>
                                    <td>
                                      {orderedQty} {item.unit || "units"}
                                    </td>
                                    <td>
                                      <input
                                        type="number"
                                        min="0"
                                        max={orderedQty}
                                        step="0.01"
                                        value={receivedQty}
                                        onChange={(e) =>
                                          handleReceivedQuantityChange(
                                            productId,
                                            e.target.value,
                                          )
                                        }
                                        style={{
                                          width: "100px",
                                          padding: "4px 8px",
                                          border: "1px solid #ddd",
                                          borderRadius: "4px",
                                          fontFamily: "Poppins",
                                        }}
                                      />
                                      <span
                                        style={{
                                          marginLeft: "8px",
                                          fontSize: "12px",
                                          color: "#666",
                                        }}
                                      >
                                        {item.unit || "units"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Damaged Goods Checkbox */}
                      <div style={{ marginBottom: "1.5rem" }}>
                        <label
                          style={{
                            fontFamily: "Poppins",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={hasDamagedGoods}
                            onChange={(e) =>
                              handleDamagedGoodsToggle(e.target.checked)
                            }
                            style={{
                              width: "18px",
                              height: "18px",
                              cursor: "pointer",
                            }}
                          />
                          <span style={{ fontWeight: 600 }}>Damaged Goods</span>
                        </label>
                      </div>

                      {/* Damaged Goods Table */}
                      {hasDamagedGoods && (
                        <div style={{ marginBottom: "1.5rem" }}>
                          <h6
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: 600,
                              marginBottom: "0.75rem",
                              fontSize: "14px",
                            }}
                          >
                            Damaged Goods Details
                          </h6>
                          <div style={{ overflowX: "auto" }}>
                            <table
                              className={`table table-bordered borderedtable`}
                              style={{
                                fontFamily: "Poppins",
                                fontSize: "12px",
                              }}
                            >
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>Ordered Qty</th>
                                  <th>Damaged Qty</th>
                                  <th>Reason</th>
                                  <th>Image</th>
                                </tr>
                              </thead>
                              <tbody>
                                {damagedGoodsRows.map((row, index) => {
                                  const orderedQty = row.orderedQty || 0;
                                  return (
                                    <tr key={index}>
                                      <td>{row.productName}</td>
                                      <td>{orderedQty}</td>
                                      <td>
                                        <input
                                          type="number"
                                          min="0"
                                          max={orderedQty}
                                          step="0.01"
                                          value={row.damagedQty}
                                          onChange={(e) =>
                                            handleDamagedGoodsChange(
                                              index,
                                              "damagedQty",
                                              parseFloat(e.target.value) || 0,
                                            )
                                          }
                                          style={{
                                            width: "80px",
                                            padding: "4px 8px",
                                            border: "1px solid #ddd",
                                            borderRadius: "4px",
                                            fontFamily: "Poppins",
                                          }}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          value={row.reason}
                                          onChange={(e) =>
                                            handleDamagedGoodsChange(
                                              index,
                                              "reason",
                                              e.target.value,
                                            )
                                          }
                                          placeholder="Enter reason"
                                          style={{
                                            width: "100%",
                                            padding: "4px 8px",
                                            border: "1px solid #ddd",
                                            borderRadius: "4px",
                                            fontFamily: "Poppins",
                                          }}
                                        />
                                      </td>
                                      <td>
                                        <div
                                          style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "4px",
                                          }}
                                        >
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file)
                                                handleImageUpload(index, file);
                                            }}
                                            style={{
                                              fontSize: "11px",
                                              fontFamily: "Poppins",
                                            }}
                                          />
                                          {row.imagePreview && (
                                            <img
                                              src={row.imagePreview}
                                              alt="Preview"
                                              style={{
                                                width: "60px",
                                                height: "60px",
                                                objectFit: "cover",
                                                borderRadius: "4px",
                                                border: "1px solid #ddd",
                                              }}
                                            />
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div
                className="modal-footer"
                style={{
                  borderTop: "1px solid #dee2e6",
                  padding: "1rem 1.5rem",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                {!showStockIn ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCloseModal}
                      style={{ fontFamily: "Poppins" }}
                    >
                      Close
                    </button>
                    {selectedIndent?.originalStatus === "approved" && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleStockIn}
                        style={{ fontFamily: "Poppins" }}
                      >
                        Stock In
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancelStockIn}
                      disabled={stockInLoading}
                      style={{ fontFamily: "Poppins" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleConfirmStockIn}
                      disabled={stockInLoading}
                      style={{ fontFamily: "Poppins" }}
                    >
                      {stockInLoading ? "Processing..." : "Confirm Stock In"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Stock In Modal */}
      {showManualStockIn && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 150000,
          }}
          tabIndex="-1"
          role="dialog"
          onClick={handleCloseManualStockIn}
          onKeyDown={(e) => {
            if (e.key === "Escape") handleCloseManualStockIn();
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            role="document"
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 150001 }}
          >
            <div
              className="modal-content"
              style={{
                backgroundColor: "white",
                borderRadius: "0.5rem",
                boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
                zIndex: 150002,
              }}
            >
              <div
                className="modal-header"
                style={{
                  borderBottom: "1px solid #dee2e6",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "0.5rem 0.5rem 0 0",
                  padding: "1rem 1.5rem",
                }}
              >
                <h5
                  className="modal-title"
                  style={{
                    margin: 0,
                    fontWeight: "600",
                    fontFamily: "Poppins",
                  }}
                >
                  Manual Stock In
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleCloseManualStockIn}
                ></button>
              </div>
              <div
                className="modal-body"
                style={{
                  padding: "1.5rem",
                  maxHeight: "70vh",
                  overflowY: "auto",
                }}
              >
                <div style={{ marginBottom: "2rem" }}>
                  <h6
                    style={{
                      fontFamily: "Poppins",
                      fontWeight: 600,
                      marginBottom: "1rem",
                      color: "var(--primary-color)",
                    }}
                  >
                    Add Products
                  </h6>

                  <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
                    <table
                      className={`table table-bordered borderedtable`}
                      style={{ fontFamily: "Poppins", fontSize: "13px" }}
                    >
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Unit</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manualStockItems.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <select
                                value={item.productId}
                                onChange={(e) =>
                                  handleManualStockItemChange(
                                    index,
                                    "productId",
                                    e.target.value,
                                  )
                                }
                                style={{
                                  width: "100%",
                                  padding: "4px 8px",
                                  border: "1px solid #ddd",
                                  borderRadius: "4px",
                                  fontFamily: "Poppins",
                                }}
                              >
                                <option value="">Select Product</option>
                                {products
                                  .filter((product) => {
                                    const selectedIds =
                                      getSelectedManualProductIds(index);
                                    const productId = String(
                                      product.id || product.productId,
                                    );

                                    return (
                                      !selectedIds.includes(productId) ||
                                      productId === String(item.productId)
                                    );
                                  })
                                  .map((product) => (
                                    <option
                                      key={product.id || product.productId}
                                      value={product.id || product.productId}
                                    >
                                      {product.name || product.productName}
                                      {product.code ? ` (${product.code})` : ""}
                                    </option>
                                  ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleManualStockItemChange(
                                    index,
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                                placeholder="Quantity"
                                style={{
                                  width: "100px",
                                  padding: "4px 8px",
                                  border: "1px solid #ddd",
                                  borderRadius: "4px",
                                  fontFamily: "Poppins",
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) =>
                                  handleManualStockItemChange(
                                    index,
                                    "unit",
                                    e.target.value,
                                  )
                                }
                                placeholder="Unit"
                                style={{
                                  width: "80px",
                                  padding: "4px 8px",
                                  border: "1px solid #ddd",
                                  borderRadius: "4px",
                                  fontFamily: "Poppins",
                                }}
                              />
                            </td>
                            <td>
                              {manualStockItems.length > 1 && (
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() =>
                                    handleRemoveManualStockItem(index)
                                  }
                                  style={{ fontFamily: "Poppins" }}
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleAddManualStockItem}
                    style={{ fontFamily: "Poppins" }}
                  >
                    <i
                      className="bi bi-plus-circle"
                      style={{ marginRight: "4px" }}
                    ></i>
                    Add Product
                  </button>
                </div>

                {/* Damaged Goods Checkbox */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      fontFamily: "Poppins",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={hasManualDamagedGoods}
                      onChange={(e) =>
                        handleManualDamagedGoodsToggle(e.target.checked)
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        cursor: "pointer",
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>Damaged Goods</span>
                  </label>
                </div>

                {/* Damaged Goods Table */}
                {hasManualDamagedGoods && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h6
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 600,
                        marginBottom: "0.75rem",
                        fontSize: "14px",
                      }}
                    >
                      Damaged Goods Details
                    </h6>
                    <div style={{ overflowX: "auto" }}>
                      <table
                        className={`table table-bordered borderedtable`}
                        style={{ fontFamily: "Poppins", fontSize: "12px" }}
                      >
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Received Qty</th>
                            <th>Damaged Qty</th>
                            <th>Reason</th>
                            <th>Image</th>
                          </tr>
                        </thead>
                        <tbody>
                          {manualStockDamagedGoods.map((row, index) => {
                            const receivedQty = row.orderedQty || 0;
                            return (
                              <tr key={index}>
                                <td>{row.productName}</td>
                                <td>{receivedQty}</td>
                                <td>
                                  <input
                                    type="number"
                                    min="0"
                                    max={receivedQty}
                                    step="0.01"
                                    value={row.damagedQty}
                                    onChange={(e) =>
                                      handleManualDamagedGoodsChange(
                                        index,
                                        "damagedQty",
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    style={{
                                      width: "80px",
                                      padding: "4px 8px",
                                      border: "1px solid #ddd",
                                      borderRadius: "4px",
                                      fontFamily: "Poppins",
                                    }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={row.reason}
                                    onChange={(e) =>
                                      handleManualDamagedGoodsChange(
                                        index,
                                        "reason",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Enter reason"
                                    style={{
                                      width: "100%",
                                      padding: "4px 8px",
                                      border: "1px solid #ddd",
                                      borderRadius: "4px",
                                      fontFamily: "Poppins",
                                    }}
                                  />
                                </td>
                                <td>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "4px",
                                    }}
                                  >
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file)
                                          handleManualImageUpload(index, file);
                                      }}
                                      style={{
                                        fontSize: "11px",
                                        fontFamily: "Poppins",
                                      }}
                                    />
                                    {row.imagePreview && (
                                      <img
                                        src={row.imagePreview}
                                        alt="Preview"
                                        style={{
                                          width: "60px",
                                          height: "60px",
                                          objectFit: "cover",
                                          borderRadius: "4px",
                                          border: "1px solid #ddd",
                                        }}
                                      />
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              <div
                className="modal-footer"
                style={{
                  borderTop: "1px solid #dee2e6",
                  padding: "1rem 1.5rem",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseManualStockIn}
                  disabled={manualStockInLoading}
                  style={{ fontFamily: "Poppins" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmManualStockIn}
                  disabled={manualStockInLoading}
                  style={{ fontFamily: "Poppins" }}
                >
                  {manualStockInLoading ? "Processing..." : "Confirm Stock In"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && <Loading />}
      {isModalOpen && (
        <ErrorModal
          isOpen={isModalOpen}
          message={error}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "12px 20px",
            borderRadius: "4px",
            color: "white",
            fontWeight: "500",
            zIndex: 200000,
            minWidth: "250px",
            fontSize: "14px",
            backgroundColor:
              toast.severity === "success" ? "#28a745" : "#dc3545",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            fontFamily: "Poppins",
            animation: "fadeIn 0.3s ease-in-out",
          }}
        >
          {toast.message}
        </div>
      )}

      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        `}
      </style>
    </>
  );
}
