import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import { isStoreEmployee } from "../../../utils/roleUtils";
import ErrorModal from "@/components/ErrorModal";
import SuccessModal from "@/components/SuccessModal";
import Loading from "@/components/Loading";
import storeService from "../../../services/storeService";
import styles from "../sales/StoreSalesOrders.module.css";
import homeStyles from "../../Dashboard/HomePage/HomePage.module.css";
import inventoryStyles from "../../Dashboard/Inventory/Inventory.module.css";
import { handleExportPDF, handleExportExcel } from "@/utils/PDFndXLSGenerator";
import xls from "../../../images/xls-png.png";
import pdf from "../../../images/pdf-png.png";

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const initialUpdateForm = {
  assetDate: "",
  itemName: "",
  quantity: "",
  value: "",
  tax: "",
  notes: "",
  condition: "good",
};

export default function StoreAssets() {
  const navigate = useNavigate();
  const { user, axiosAPI } = useAuth();
  const actualUser = user?.user || user || {};
  const inferredStoreId = actualUser?.storeId || actualUser?.store?.id || null;
  const isEmployee = isStoreEmployee(actualUser);

  const [storeId, setStoreId] = useState(inferredStoreId);
  const [assets, setAssets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [updateForm, setUpdateForm] = useState(initialUpdateForm);
  const [updateBillDocument, setUpdateBillDocument] = useState(null);
  const [selectedBillImage, setSelectedBillImage] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [stockInQty, setStockInQty] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    assetDate: new Date().toISOString().slice(0, 10),
    itemName: "",
    quantity: "",
    value: "",
    tax: "",
    notes: "",
    condition: "good",
    billDocument: null,
    billDocumentFile: null,
    billDocumentPreview: null,
  });

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Header Search States
  const [showHeadersSearch, setShowHeadersSearch] = useState({
    assetCode: false,
    itemName: false,
    status: false
  });

  const [headerSearchTerms, setHeaderSearchTerms] = useState({
    assetCode: "",
    itemName: "",
    status: ""
  });

  const toggleHeaderSearch = (key) => {
    setShowHeadersSearch(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k] = k === key ? !prev[k] : false;
      });
      return next;
    });
  };

  const handleHeaderSearchChange = (key, value) => {
    setHeaderSearchTerms(prev => ({ ...prev, [key]: value }));
  };

  const clearHeaderSearch = (key) => {
    setHeaderSearchTerms(prev => ({ ...prev, [key]: "" }));
  };

  const renderSearchHeader = (label, searchKey, dataAttr) => {
    const isSearching = showHeadersSearch[searchKey];
    const searchTerm = headerSearchTerms[searchKey];

    return (
      <th
        onClick={() => toggleHeaderSearch(searchKey)}
        style={{ cursor: "pointer", position: "relative", fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}
        data-search-header="true"
        {...{ [dataAttr]: true }}
      >
        {isSearching ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              placeholder={`Search ${label}...`}
              value={searchTerm}
              onChange={(e) => handleHeaderSearchChange(searchKey, e.target.value)}
              style={{
                flex: 1, padding: "2px 6px", border: "1px solid #ddd", borderRadius: "4px",
                fontSize: "12px", minWidth: "120px", height: "28px", color: "#000", backgroundColor: "#fff",
              }}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={(e) => { e.stopPropagation(); clearHeaderSearch(searchKey); }}
                style={{
                  padding: "4px 8px", border: "1px solid #dc3545", borderRadius: "4px",
                  background: "#dc3545", color: "#fff", cursor: "pointer", fontSize: "12px",
                  fontWeight: "bold", minWidth: "24px", height: "28px", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
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
      if (!event.target.closest('[data-search-header]')) {
        setShowHeadersSearch({
          assetCode: false,
          itemName: false,
          status: false
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
        setShowHeadersSearch({
          assetCode: false,
          itemName: false,
          status: false
        });
        setHeaderSearchTerms({
          assetCode: "",
          itemName: "",
          status: ""
        });
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  const showError = useCallback((message) => {
    setError(message || "Something went wrong. Please try again.");
    setIsErrorModalOpen(true);
  }, []);

  const showSuccess = useCallback((message) => {
    setSuccessMessage(message || "Action completed successfully.");
    setIsSuccessModalOpen(true);
  }, []);

  useEffect(() => {
    if (!storeId) {
      try {
        // Get store ID from user context - try multiple sources
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const user = userData.user || userData;
        let id = user?.storeId || user?.store?.id;
        
        // Fallback to other localStorage keys
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
        } else {
          showError("Store information missing. Please re-login to continue.");
        }
      } catch (err) {
        console.error("Unable to parse stored user data", err);
        showError("Unable to determine store information. Please re-login.");
      }
    }
  }, [storeId, showError]);

  const fetchStoreAssets = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const params = {
        page: query.page,
        limit: query.limit
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      const res = await storeService.getStoreAssets(storeId, params);
      const assetsData = res.data || res.assets || res || [];
      const paginationData = res.pagination || {};
      
      // Debug: Log first asset to see billDocument field
      if (assetsData.length > 0) {
        console.log('First asset from API:', assetsData[0]);
        console.log('billDocument field:', assetsData[0].billDocument);
      }
      
      // Map backend response to frontend format
      const mappedAssets = Array.isArray(assetsData) ? assetsData.map(item => ({
        id: item.id,
        assetCode: item.assetCode || item.code || `AST-${item.id}`,
        assetDate: item.assetDate || item.date || item.createdAt,
        itemName: item.itemName || item.name || "-",
        requestedQuantity: parseFloat(item.requestedQuantity || item.quantity || 0),
        quantity: parseFloat(item.quantity || item.requestedQuantity || 0),
        receivedQuantity: parseFloat(item.receivedQuantity || 0),
        value: parseFloat(item.value || 0),
        tax: parseFloat(item.tax || 0),
        total: parseFloat(item.total || (item.value + item.tax) || 0),
        status: item.status || "pending",
        notes: item.notes || "",
        condition: item.condition || item.itemCondition || "good",
        billDocument: item.billDocument || null,
        store: item.store || { name: "-" },
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })) : [];

      setAssets(mappedAssets);
      setPagination({
        page: paginationData.page || query.page,
        limit: paginationData.limit || query.limit,
        total: paginationData.total || mappedAssets.length,
        totalPages: paginationData.totalPages || Math.ceil((paginationData.total || mappedAssets.length) / query.limit) || 1,
      });
    } catch (err) {
      console.error("Failed to fetch store assets", err);
      showError(err.response?.data?.message || err.message || "Failed to fetch store assets");
    } finally {
      setLoading(false);
    }
  }, [storeId, query.page, query.limit, statusFilter, showError]);

  useEffect(() => {
    if (storeId) {
      fetchStoreAssets();
    }
  }, [storeId, fetchStoreAssets]);

  const loadAssetDetails = useCallback(
    async (assetId, { silent = false } = {}) => {
      if (!storeId || !assetId) return;
      if (!silent) {
        setDetailLoading(true);
      }
      try {
        const res = await storeService.getStoreAssetById(storeId, assetId);
        const data = res.data || res.asset || res;
        
        if (data && data.id) {
          const mappedData = {
            id: data.id,
            assetCode: data.assetCode || data.code || `AST-${data.id}`,
            assetDate: data.assetDate || data.date || data.createdAt,
            itemName: data.itemName || data.name || "-",
            requestedQuantity: parseFloat(data.requestedQuantity || data.quantity || 0),
            quantity: parseFloat(data.quantity || data.requestedQuantity || 0),
            receivedQuantity: parseFloat(data.receivedQuantity || 0),
            value: parseFloat(data.value || 0),
            tax: parseFloat(data.tax || 0),
            total: parseFloat(data.total || (data.value + data.tax) || 0),
            status: data.status || "pending",
            notes: data.notes || "",
            condition: data.condition || data.itemCondition || "good",
            billDocument: data.billDocument || null,
            store: data.store || { name: "-" },
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
          
          setSelectedAsset(mappedData);
          setUpdateForm({
            assetDate: mappedData.assetDate ? mappedData.assetDate.split("T")[0] : "",
            itemName: mappedData.itemName || "",
            quantity: mappedData.quantity.toString(),
            value: mappedData.value.toString(),
            tax: mappedData.tax.toString(),
            notes: mappedData.notes || "",
            condition: mappedData.condition || "good",
          });
          setUpdateBillDocument(null);
          setStockInQty("");
        } else {
          throw new Error("Asset not found.");
        }
      } catch (err) {
        console.error("Failed to load asset details", err);
        showError(err.response?.data?.message || err.message || "Failed to load asset details");
      } finally {
        if (!silent) {
          setDetailLoading(false);
        }
      }
    },
    [storeId, showError]
  );

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return assets;
    const needle = searchTerm.toLowerCase();
    return assets.filter((asset) => {
      const code = asset.assetCode?.toLowerCase() || "";
      const name = asset.itemName?.toLowerCase() || "";
      return code.includes(needle) || name.includes(needle);
    });
  }, [assets, searchTerm]);

  const totalValue = useMemo(
    () => filteredAssets.reduce((sum, asset) => sum + Number(asset.total ?? asset.value ?? 0), 0),
    [filteredAssets]
  );

  const maxReceivable = useMemo(() => {
    if (!selectedAsset) return 0;
    const requested = Number(selectedAsset.requestedQuantity || selectedAsset.quantity || 0);
    const received = Number(selectedAsset.receivedQuantity || 0);
    return Math.max(requested - received, 0);
  }, [selectedAsset]);

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setQuery((prev) => ({ ...prev, page: 1 }));
  };

  const handleLimitChange = (value) => {
    setQuery((prev) => ({ ...prev, limit: Number(value) || 10, page: 1 }));
  };

  const handlePageChange = (direction) => {
    setQuery((prev) => {
      const totalPages = pagination.totalPages || 1;
      const nextPage = direction === "next" ? prev.page + 1 : prev.page - 1;
      if (nextPage < 1 || nextPage > totalPages) {
        return prev;
      }
      return { ...prev, page: nextPage };
    });
  };

  const handleUpdateInputChange = (field, value) => {
    setUpdateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectAsset = (assetId) => {
    loadAssetDetails(assetId);
  };

  const handleUpdateAsset = async (event) => {
    event.preventDefault();
    if (!selectedAsset || !storeId) return;
    if (selectedAsset.status !== "pending") {
      showError("Only assets in pending status can be updated.");
      return;
    }

    setActionLoading(true);
    try {
      // Validate bill document size before proceeding
      if (updateBillDocument) {
        const formattedBase64 = formatBase64DataURL(updateBillDocument);
        if (!formattedBase64) {
          const base64Part = updateBillDocument.includes(',') 
            ? updateBillDocument.split(',')[1] 
            : updateBillDocument;
          const base64SizeMB = (base64Part.length * 3) / 4 / 1024 / 1024;
          showError(`Bill document is too large (${base64SizeMB.toFixed(2)}MB). Please use a smaller file (max 1.5MB) or remove the document.`);
          setActionLoading(false);
          return;
        }
      }

      const payload = {
        assetDate: updateForm.assetDate,
        itemName: updateForm.itemName,
        quantity: Number(updateForm.quantity || 0),
        requestedQuantity: Number(updateForm.quantity || 0),
        value: Number(updateForm.value || 0),
        tax: Number(updateForm.tax || 0),
        notes: updateForm.notes || "",
        condition: updateForm.condition || "good",
      };
      
      // Add billDocumentBase64 if bill document is present (send full data URL)
      if (updateBillDocument) {
        payload.billDocumentBase64 = formatBase64DataURL(updateBillDocument);
      }
      
      const res = await storeService.updateStoreAsset(storeId, selectedAsset.id, payload);
      showSuccess(res.message || "Asset updated successfully.");
      const updatedData = res.data || res.asset || res;
      
      if (updatedData && updatedData.id) {
        const mappedData = {
          id: updatedData.id,
          assetCode: updatedData.assetCode || updatedData.code || `AST-${updatedData.id}`,
          assetDate: updatedData.assetDate || updatedData.date || updatedData.createdAt,
          itemName: updatedData.itemName || updatedData.name || "-",
          requestedQuantity: parseFloat(updatedData.requestedQuantity || updatedData.quantity || 0),
          quantity: parseFloat(updatedData.quantity || updatedData.requestedQuantity || 0),
          receivedQuantity: parseFloat(updatedData.receivedQuantity || 0),
          value: parseFloat(updatedData.value || 0),
          tax: parseFloat(updatedData.tax || 0),
          total: parseFloat(updatedData.total || (updatedData.value + updatedData.tax) || 0),
          status: updatedData.status || "pending",
          notes: updatedData.notes || "",
          condition: updatedData.condition || updatedData.itemCondition || "good",
          billDocument: updatedData.billDocument || null,
          store: updatedData.store || { name: "-" },
          createdAt: updatedData.createdAt,
          updatedAt: updatedData.updatedAt
        };
        
        setSelectedAsset(mappedData);
        await fetchStoreAssets();
      } else {
        await fetchStoreAssets();
      }
    } catch (err) {
      console.error("Failed to update asset", err);
      showError(err.response?.data?.message || err.message || "Failed to update asset");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStockIn = async (event) => {
    event.preventDefault();
    if (!selectedAsset || !storeId) return;

    const qty = Number(stockInQty || 0);
    if (!qty) {
      showError("Enter the received quantity to continue.");
      return;
    }
    if (qty > maxReceivable) {
      showError(`You can receive a maximum of ${maxReceivable} units.`);
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        receivedQuantity: qty
      };
      
      const res = await storeService.stockInStoreAsset(storeId, selectedAsset.id, payload);
      const updatedData = res.data || res.asset || res;
      
      if (updatedData && updatedData.id) {
        const mappedData = {
          id: updatedData.id,
          assetCode: updatedData.assetCode || updatedData.code || `AST-${updatedData.id}`,
          assetDate: updatedData.assetDate || updatedData.date || updatedData.createdAt,
          itemName: updatedData.itemName || updatedData.name || "-",
          requestedQuantity: parseFloat(updatedData.requestedQuantity || updatedData.quantity || 0),
          quantity: parseFloat(updatedData.quantity || updatedData.requestedQuantity || 0),
          receivedQuantity: parseFloat(updatedData.receivedQuantity || 0),
          value: parseFloat(updatedData.value || 0),
          tax: parseFloat(updatedData.tax || 0),
          total: parseFloat(updatedData.total || (updatedData.value + updatedData.tax) || 0),
          status: updatedData.status || "pending",
          notes: updatedData.notes || "",
          condition: updatedData.condition || updatedData.itemCondition || "good",
          billDocument: updatedData.billDocument || updatedData.bill || null,
          store: updatedData.store || { name: "-" },
          createdAt: updatedData.createdAt,
          updatedAt: updatedData.updatedAt
        };
        
        setSelectedAsset(mappedData);
        showSuccess(res.message || "Stock in processed successfully.");
        setStockInQty("");
        await fetchStoreAssets();
      } else {
        showSuccess("Stock in processed successfully.");
        setStockInQty("");
        await fetchStoreAssets();
      }
    } catch (err) {
      console.error("Failed to process stock in", err);
      showError(err.response?.data?.message || err.message || "Failed to process stock in");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset || !storeId || selectedAsset.status !== "pending") {
      showError("Only pending assets can be deleted.");
      return;
    }
    const confirmDelete = window.confirm(`Delete asset ${selectedAsset.assetCode}? This action cannot be undone.`);
    if (!confirmDelete) return;

    setActionLoading(true);
    try {
      const res = await storeService.deleteStoreAsset(storeId, selectedAsset.id);
      
      setSelectedAsset(null);
      setUpdateForm(initialUpdateForm);
      setStockInQty("");
      showSuccess(res.message || "Asset deleted successfully.");
      await fetchStoreAssets();
    } catch (err) {
      console.error("Failed to delete asset", err);
      showError(err.response?.data?.message || err.message || "Failed to delete asset");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInputChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  // Compress image function (same as store creation)
  const compressImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (maintain aspect ratio)
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, file.type, quality);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Helper function to validate and format base64 data URL
  const formatBase64DataURL = (base64String) => {
    if (!base64String) return undefined;
    
    // If it's already a data URL (data:image/...;base64,...), use it as is
    if (base64String.startsWith('data:')) {
      // Extract just the base64 part for size calculation
      const base64Part = base64String.includes(',') ? base64String.split(',')[1] : base64String;
      const base64SizeMB = (base64Part.length * 3) / 4 / 1024 / 1024;
      
      if (base64SizeMB > 1.5) {
        return undefined; // Will be handled below
      }
      
      // Return full data URL as backend expects: data:image/...;base64,...
      return base64String;
    }
    
    // If it's just base64 string without prefix, add default image prefix
    const mimeType = 'image/jpeg'; // Default
    return `data:${mimeType};base64,${base64String}`;
  };

  const handleCreateBillChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB for images, 3MB for PDFs)
    const maxSize = file.type === 'application/pdf' ? 3 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxSize) {
      showError(`File size should be less than ${maxSize / 1024 / 1024}MB`);
      e.target.value = ''; // Reset input
      return;
    }

    try {
      let processedFile = file;
      let previewUrl = null;

      // Compress images before converting to base64
      if (file.type.startsWith('image/')) {
        // Compress image
        const compressedBlob = await compressImage(file, 800, 600, 0.7);
        processedFile = new File([compressedBlob], file.name, { type: file.type });
        previewUrl = URL.createObjectURL(compressedBlob);
        
        // Check compressed size
        if (compressedBlob.size > 1.5 * 1024 * 1024) {
          showError("Image is still too large after compression. Please use a smaller image.");
          e.target.value = '';
          return;
        }
      } else if (file.type === 'application/pdf') {
        // For PDFs, just check size - no compression
        if (file.size > 2 * 1024 * 1024) {
          showError("PDF size should be less than 2MB. Please compress the PDF or use a smaller file.");
          e.target.value = '';
          return;
        }
      }

      // Convert to base64 using FileReader.readAsDataURL (returns full data URL)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result; // Full data URL: data:image/jpeg;base64,...
        setCreateForm((prev) => ({ 
          ...prev, 
          billDocument: base64String, 
          billDocumentFile: processedFile,
          billDocumentPreview: previewUrl
        }));
      };
      reader.onerror = () => {
        showError("Error reading file");
        e.target.value = '';
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error("Error processing file:", error);
      showError("Error processing file: " + error.message);
      e.target.value = '';
    }
  };

  const handleUpdateBillChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB for images, 3MB for PDFs)
    const maxSize = file.type === 'application/pdf' ? 3 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxSize) {
      showError(`File size should be less than ${maxSize / 1024 / 1024}MB`);
      e.target.value = ''; // Reset input
      return;
    }

    try {
      let processedFile = file;
      let previewUrl = null;

      // Compress images before converting to base64
      if (file.type.startsWith('image/')) {
        // Compress image
        const compressedBlob = await compressImage(file, 800, 600, 0.7);
        processedFile = new File([compressedBlob], file.name, { type: file.type });
        previewUrl = URL.createObjectURL(compressedBlob);
        
        // Check compressed size
        if (compressedBlob.size > 1.5 * 1024 * 1024) {
          showError("Image is still too large after compression. Please use a smaller image.");
          e.target.value = '';
          return;
        }
      } else if (file.type === 'application/pdf') {
        // For PDFs, just check size - no compression
        if (file.size > 2 * 1024 * 1024) {
          showError("PDF size should be less than 2MB. Please compress the PDF or use a smaller file.");
          e.target.value = '';
          return;
        }
      }

      // Convert to base64 using FileReader.readAsDataURL (returns full data URL)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result; // Full data URL: data:image/jpeg;base64,...
        setUpdateBillDocument(base64String);
      };
      reader.onerror = () => {
        showError("Error reading file");
        e.target.value = '';
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error("Error processing file:", error);
      showError("Error processing file: " + error.message);
      e.target.value = '';
    }
  };

  const handleViewBill = (billUrl) => {
    if (billUrl) {
      setSelectedBillImage(billUrl);
      setShowBillModal(true);
    }
  };

  const closeBillModal = () => {
    setShowBillModal(false);
    setSelectedBillImage(null);
  };

  const handleCreateAsset = async (event) => {
    event.preventDefault();
    if (!storeId) {
      showError("Store information missing.");
      return;
    }

    if (!createForm.itemName || !createForm.quantity || !createForm.value) {
      showError("Please fill in all required fields (Item Name, Quantity, Value).");
      return;
    }

    setActionLoading(true);
    try {
      // Validate bill document size before proceeding
      if (createForm.billDocument) {
        const formattedBase64 = formatBase64DataURL(createForm.billDocument);
        if (!formattedBase64) {
          const base64Part = createForm.billDocument.includes(',') 
            ? createForm.billDocument.split(',')[1] 
            : createForm.billDocument;
          const base64SizeMB = (base64Part.length * 3) / 4 / 1024 / 1024;
          showError(`Bill document is too large (${base64SizeMB.toFixed(2)}MB). Please use a smaller file (max 1.5MB) or remove the document.`);
          setActionLoading(false);
          return;
        }
      }

      const payload = {
        storeId: storeId,
        assetDate: createForm.assetDate,
        itemName: createForm.itemName,
        quantity: Number(createForm.quantity || 0),
        requestedQuantity: Number(createForm.quantity || 0),
        value: Number(createForm.value || 0),
        tax: Number(createForm.tax || 0),
        notes: createForm.notes || "",
        condition: createForm.condition || "good",
      };
      
      // Add billDocumentBase64 if bill document is present (send full data URL)
      if (createForm.billDocument) {
        payload.billDocumentBase64 = formatBase64DataURL(createForm.billDocument);
      }
      
      const res = await storeService.createStoreAsset(payload);
      showSuccess(res.message || "Asset created successfully.");
      
      setShowCreateForm(false);
        setCreateForm({
        assetDate: new Date().toISOString().slice(0, 10),
        itemName: "",
        quantity: "",
        value: "",
        tax: "",
        notes: "",
        condition: "good",
        billDocument: null,
        billDocumentFile: null,
        billDocumentPreview: null,
      });
      await fetchStoreAssets();
    } catch (err) {
      console.error("Failed to create asset", err);
      showError(err.response?.data?.message || err.message || "Failed to create asset");
    } finally {
      setActionLoading(false);
    }
  };

  const closeErrorModal = () => setIsErrorModalOpen(false);
  const closeSuccessModal = () => setIsSuccessModalOpen(false);

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Memoized filtered assets for search and header search
  const displayAssets = useMemo(() => {
    let filtered = assets;

    // Apply global search term
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const code = (item.assetCode || `AST-${item.id}`).toLowerCase();
        const name = (item.itemName || "").toLowerCase();
        const search = searchTerm.toLowerCase();
        return code.includes(search) || name.includes(search);
      });
    }

    // Apply header search terms
    if (headerSearchTerms.assetCode) {
      filtered = filtered.filter(item => {
        const code = (item.assetCode || `AST-${item.id}`).toLowerCase();
        return code.includes(headerSearchTerms.assetCode.toLowerCase());
      });
    }

    if (headerSearchTerms.itemName) {
      filtered = filtered.filter(item => {
        const name = (item.itemName || "").toLowerCase();
        return name.includes(headerSearchTerms.itemName.toLowerCase());
      });
    }

    if (headerSearchTerms.status) {
      filtered = filtered.filter(item => {
        const status = (item.status || "pending").toLowerCase();
        return status.includes(headerSearchTerms.status.toLowerCase());
      });
    }

    return filtered;
  }, [assets, searchTerm, headerSearchTerms]);

  // Export function
  const onExport = (type) => {
    const arr = [];
    let x = 1;
    const columns = [
      "S.No",
      "Asset Code",
      "Date",
      "Item Name",
      "Quantity",
      "Value",
      "Tax",
      "Total",
      "Status"
    ];
    const dataToExport = displayAssets && displayAssets.length > 0 ? displayAssets : assets;
    if (dataToExport && dataToExport.length > 0) {
      dataToExport.forEach((item) => {
        arr.push({
          "S.No": x++,
          "Asset Code": item.assetCode || '-',
          "Date": item.assetDate ? new Date(item.assetDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : '-',
          "Item Name": item.itemName || '-',
          "Quantity": item.quantity || 0,
          "Value": formatCurrency(item.value || 0),
          "Tax": formatCurrency(item.tax || 0),
          "Total": formatCurrency(item.total || 0),
          "Status": item.status || 'pending'
        });
      });

      if (type === "PDF") handleExportPDF(columns, arr, "Store_Assets");
      else if (type === "XLS")
        handleExportExcel(columns, arr, "StoreAssets");
    } else {
      showError("Table is Empty");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div className={styles.pageHeader}>
        <div>
          <h2>Store Assets</h2>
          <p className="path">
            Assets
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {!isEmployee && (
            <>
              <button 
                className="homebtn" 
                onClick={() => setShowCreateForm(!showCreateForm)} 
                style={{ fontFamily: "Poppins", background: showCreateForm ? "#f3f4f6" : undefined }}
              >
                {showCreateForm ? "Cancel" : "Create Asset"}
              </button>
              <button className="homebtn" onClick={() => navigate("/store/assets/transfer")} style={{ fontFamily: "Poppins" }}>
                Asset Transfer
              </button>
            </>
          )}
        </div>
      </div>

      {!storeId && (
        <div className={`${homeStyles.orderStatusCard} ${styles.cardWrapper}`} style={{ marginBottom: "24px" }}>
          <p style={{ margin: 0, fontFamily: "Poppins" }}>Store details are missing. Please re-login to continue.</p>
        </div>
      )}

      {storeId && (
        <div className={`${homeStyles.orderStatusCard} ${styles.cardWrapper}`}>
          {/* Create Asset Form */}
          {showCreateForm && (
            <div style={{ marginBottom: "24px", padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <h4
                style={{
                  margin: 0,
                  marginBottom: "20px",
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontSize: "20px",
                  color: "var(--primary-color)",
                }}
              >
                Create New Asset
              </h4>
              <form onSubmit={handleCreateAsset}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <label>Date</label>
                    <input
                      type="date"
                      value={createForm.assetDate}
                      onChange={(e) => handleCreateInputChange("assetDate", e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    />
                  </div>
                  <div>
                    <label>Item Name</label>
                    <input
                      type="text"
                      value={createForm.itemName}
                      onChange={(e) => handleCreateInputChange("itemName", e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    />
                  </div>
                  <div>
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={createForm.quantity}
                      onChange={(e) => handleCreateInputChange("quantity", e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    />
                  </div>
                  <div>
                    <label>Value (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.value}
                      onChange={(e) => handleCreateInputChange("value", e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    />
                  </div>
                  <div>
                    <label>Tax (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.tax}
                      onChange={(e) => handleCreateInputChange("tax", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    />
                  </div>
                  <div>
                    <label>Item Condition</label>
                    <select
                      value={createForm.condition}
                      onChange={(e) => handleCreateInputChange("condition", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    >
                      <option value="good">Good</option>
                      <option value="bad">Bad</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label>Bill Upload</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleCreateBillChange}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                      }}
                    />
                    {createForm.billDocument && (
                      <div style={{ marginTop: "8px" }}>
                        <p style={{ margin: "4px 0", fontSize: "12px", color: "#059669", fontFamily: "Poppins" }}>
                          Selected: {createForm.billDocumentFile?.name || "Bill document ready"}
                        </p>
                        {createForm.billDocumentPreview && (
                          <img
                            src={createForm.billDocumentPreview}
                            alt="Bill preview"
                            style={{
                              maxWidth: "200px",
                              maxHeight: "150px",
                              marginTop: "8px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label>Notes</label>
                    <textarea
                      rows="2"
                      value={createForm.notes}
                      onChange={(e) => handleCreateInputChange("notes", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #000",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Poppins",
                        backgroundColor: "#fff",
                        color: "#000",
                        resize: "vertical",
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button className="homebtn" type="submit" disabled={actionLoading}>
                    {actionLoading ? "Creating..." : "Create Asset"}
                  </button>
                  <button
                    className="homebtn"
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setCreateForm({
                        assetDate: new Date().toISOString().slice(0, 10),
                        itemName: "",
                        quantity: "",
                        value: "",
                        tax: "",
                        notes: "",
                        condition: "good",
                        billDocument: null,
                        billDocumentFile: null,
                      });
                    }}
                    style={{ background: "#f3f4f6", color: "#2563eb" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h4 style={{ margin: 0, fontFamily: "Poppins", fontWeight: 600, fontSize: "20px", color: "var(--primary-color)" }}>
                  Asset Summary
                </h4>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                <p style={{ fontFamily: "Poppins", margin: 0, color: "#059669", fontWeight: 700, fontSize: "18px" }}>
                  Asset Total: {formatCurrency(totalValue)}
                </p>
                <p style={{ fontFamily: "Poppins", margin: 0, color: "#6b7280", fontSize: "12px" }}>
                  (Total of {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''} on this page)
                </p>
              </div>
            </div>

            <div className={`row g-3 ${styles.filtersRow}`} style={{ padding: "0 15px", marginBottom: "24px" }}>
              <div className={`col-xl-2 col-lg-3 col-md-4 col-sm-6 formcontent`}>
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => handleStatusChange(e.target.value)}>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={`col-xl-2 col-lg-3 col-md-4 col-sm-6 formcontent`}>
                <label>Rows per page</label>
                <select value={query.limit} onChange={(e) => handleLimitChange(e.target.value)}>
                  {[10, 25, 50].map((limit) => (
                    <option key={limit} value={limit}>
                      {limit}
                    </option>
                  ))}
                </select>
              </div>
              <div className={`col-xl-3 col-lg-4 col-md-4 col-sm-6 formcontent`}>
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Search by name or code"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    height: '32px',
                    outline: '1.5px solid var(--primary-color)',
                    padding: '2px 10px',
                    borderRadius: '16px',
                    boxShadow: '2px 2px 4px #333',
                    fontFamily: 'Poppins',
                    fontSize: '13px',
                    border: 'none',
                    backgroundColor: 'white'
                  }}
                />
              </div>
              <div className="col-12 mt-2">
                <p style={{ margin: 0, fontFamily: "Poppins", color: "#6b7280", fontSize: "13px" }}>
                  Showing page {pagination.page} of {pagination.totalPages || 1}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <h4
                style={{
                  margin: 0,
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontSize: "20px",
                  color: "var(--primary-color)",
                }}
              >
                Asset Register ({displayAssets.length})
              </h4>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <button className="cancelbtn" type="button" onClick={() => handlePageChange("prev")} disabled={query.page <= 1} style={{ padding: "4px 12px", fontSize: "14px" }}>
                  Prev
                </button>
                <span style={{ fontFamily: "Poppins", fontSize: "14px" }}>
                  Page {pagination.page} / {pagination.totalPages || 1}
                </span>
                <button
                  className="homebtn"
                  type="button"
                  onClick={() => handlePageChange("next")}
                  disabled={pagination.totalPages <= pagination.page}
                  style={{ padding: "4px 12px", fontSize: "14px" }}
                >
                  Next
                </button>
              </div>
            </div>

            <div className={`${styles.tableContainer} table-responsive`} style={{ marginTop: "16px" }}>
              <table className="table table-bordered borderedtable table-sm table-hover" style={{ fontFamily: "Poppins" }}>
                <thead className="table-light">
                  <tr>
                    <th>S.No</th>
                    {renderSearchHeader("Asset Code", "assetCode", "data-code-header")}
                    <th>Date</th>
                    {renderSearchHeader("Item Name", "itemName", "data-name-header")}
                    <th>Requested</th>
                    <th>Received</th>
                    <th>Value (₹)</th>
                    <th>Tax (₹)</th>
                    <th>Total (₹)</th>
                    <th>Condition</th>
                    <th>Bill</th>
                    {renderSearchHeader("Status", "status", "data-status-header")}
                    <th>Actions</th>
                  </tr>
                  {(headerSearchTerms.assetCode || headerSearchTerms.itemName || headerSearchTerms.status) && (
                    <tr>
                      <td colSpan="13" style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '0', backgroundColor: '#f8f9fa', color: '#666' }}>
                        {displayAssets.length} assets found
                      </td>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {displayAssets.length === 0 ? (
                    <tr>
                      <td colSpan={13} style={{ textAlign: "center", padding: "32px", color: "#666" }}>
                        {loading ? "Loading assets..." : "No assets found"}
                      </td>
                    </tr>
                  ) : (
                    displayAssets.map((asset, index) => (
                      <tr key={asset.id} style={{ background: index % 2 === 0 ? "rgba(59, 130, 246, 0.03)" : "transparent" }}>
                        <td>{index + 1}</td>
                        <td>{asset.assetCode || "-"}</td>
                        <td>{asset.assetDate ? new Date(asset.assetDate).toLocaleDateString("en-IN") : "-"}</td>
                        <td style={{ fontWeight: 600 }}>{asset.itemName || "-"}</td>
                        <td>{asset.requestedQuantity ?? asset.quantity ?? "-"}</td>
                        <td>{asset.receivedQuantity ?? "-"}</td>
                        <td>{formatCurrency(asset.value)}</td>
                        <td>{formatCurrency(asset.tax)}</td>
                        <td>{formatCurrency(asset.total)}</td>
                        <td>
                          <span
                            className={`badge ${
                              (asset.condition || "good") === "good" ? "bg-success" : "bg-danger"
                            }`}
                          >
                            {(asset.condition || "good") === "good" ? "Good" : "Bad"}
                          </span>
                        </td>
                        <td>
                          {asset.billDocument && asset.billDocument !== null && asset.billDocument !== '' ? (
                            <button
                              className="homebtn"
                              style={{ fontSize: "11px" }}
                              onClick={() => handleViewBill(asset.billDocument)}
                              title="View Bill"
                            >
                              <i className="bi bi-eye"></i> View
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              asset.status === "completed"
                                ? "bg-success"
                                : asset.status === "pending"
                                ? "bg-warning text-dark"
                                : asset.status === "cancelled"
                                ? "bg-danger"
                                : "bg-secondary"
                            }`}
                          >
                            {asset.status || "-"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <button className="homebtn" style={{ fontSize: "11px" }} type="button" onClick={() => handleSelectAsset(asset.id)}>
                              View Details
                            </button>
                            {!isEmployee && asset.status === "pending" && (
                              <>
                                <button className="homebtn" style={{ fontSize: "11px" }} type="button" onClick={() => handleSelectAsset(asset.id)}>
                                  Edit
                                </button>
                                <button className="cancelbtn" style={{ fontSize: "11px" }} type="button" onClick={() => handleSelectAsset(asset.id)}>
                                  Stock In
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedAsset && (
            <div style={{ marginTop: "24px", padding: "24px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <h4 style={{ margin: 0, fontFamily: "Poppins", fontWeight: 600, fontSize: "20px", color: "var(--primary-color)" }}>
                    Asset Details
                  </h4>
                  <p style={{ margin: 0, fontFamily: "Poppins", color: "#6b7280" }}>
                    {selectedAsset.assetCode} &middot; Status: {selectedAsset.status}
                  </p>
                </div>
                {!isEmployee && selectedAsset.status === "pending" && (
                  <button className="cancelbtn" type="button" onClick={handleDeleteAsset} disabled={actionLoading}>
                    Delete Asset
                  </button>
                )}
              </div>

              {detailLoading ? (
                <p style={{ marginTop: "16px", fontFamily: "Poppins" }}>Loading details...</p>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "16px" }}>
                    <div>
                      <label>Store</label>
                      <p style={{ fontFamily: "Poppins", fontWeight: 600 }}>{selectedAsset.store?.name || "-"}</p>
                    </div>
                    <div>
                      <label>Requested vs Received</label>
                      <p style={{ fontFamily: "Poppins", fontWeight: 600 }}>
                        {selectedAsset.requestedQuantity ?? selectedAsset.quantity ?? 0} / {selectedAsset.receivedQuantity ?? 0}
                      </p>
                    </div>
                    <div>
                      <label>Total Value</label>
                      <p style={{ fontFamily: "Poppins", fontWeight: 600 }}>{formatCurrency(selectedAsset.total)}</p>
                    </div>
                    <div>
                      <label>Item Condition</label>
                      <p style={{ fontFamily: "Poppins", fontWeight: 600 }}>
                        <span
                          className={`badge ${
                            selectedAsset.condition === "good" ? "bg-success" : "bg-danger"
                          }`}
                        >
                          {selectedAsset.condition === "good" ? "Good" : "Bad"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {!isEmployee && (
                    <div style={{ marginTop: "24px", display: "grid", gap: "24px" }}>
                      <form onSubmit={handleUpdateAsset}>
                        <h5 style={{ fontFamily: "Poppins", fontWeight: 600, marginBottom: "16px", fontSize: "18px", color: "var(--primary-color)" }}>Update Asset</h5>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                          <div>
                            <label style={{ fontFamily: "Poppins", fontSize: "14px", fontWeight: 500, marginBottom: "4px", display: "block" }}>Date</label>
                            <input
                              type="date"
                              value={updateForm.assetDate}
                              onChange={(e) => handleUpdateInputChange("assetDate", e.target.value)}
                              required
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #000",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontFamily: "Poppins",
                                backgroundColor: "#fff",
                                color: "#000",
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontFamily: "Poppins", fontSize: "14px", fontWeight: 500, marginBottom: "4px", display: "block" }}>Item Name</label>
                            <input
                              type="text"
                              value={updateForm.itemName}
                              onChange={(e) => handleUpdateInputChange("itemName", e.target.value)}
                              required
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #000",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontFamily: "Poppins",
                                backgroundColor: "#fff",
                                color: "#000",
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontFamily: "Poppins", fontSize: "14px", fontWeight: 500, marginBottom: "4px", display: "block" }}>Quantity</label>
                            <input
                              type="number"
                              min="1"
                              value={updateForm.quantity}
                              onChange={(e) => handleUpdateInputChange("quantity", e.target.value)}
                              required
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #000",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontFamily: "Poppins",
                                backgroundColor: "#fff",
                                color: "#000",
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontFamily: "Poppins", fontSize: "14px", fontWeight: 500, marginBottom: "4px", display: "block" }}>Value (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={updateForm.value}
                              onChange={(e) => handleUpdateInputChange("value", e.target.value)}
                              required
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #000",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontFamily: "Poppins",
                                backgroundColor: "#fff",
                                color: "#000",
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontFamily: "Poppins", fontSize: "14px", fontWeight: 500, marginBottom: "4px", display: "block" }}>Tax (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={updateForm.tax}
                              onChange={(e) => handleUpdateInputChange("tax", e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #000",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontFamily: "Poppins",
                                backgroundColor: "#fff",
                                color: "#000",
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontFamily: "Poppins", fontSize: "14px", fontWeight: 500, marginBottom: "4px", display: "block" }}>Item Condition</label>
                            <select
                              value={updateForm.condition}
                              onChange={(e) => handleUpdateInputChange("condition", e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #000",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontFamily: "Poppins",
                                backgroundColor: "#fff",
                                color: "#000",
                              }}
                            >
                              <option value="good">Good</option>
                              <option value="bad">Bad</option>
                            </select>
                          </div>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ fontFamily: "Poppins", fontSize: "14px", fontWeight: 500, marginBottom: "4px", display: "block" }}>Bill Upload</label>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={handleUpdateBillChange}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #000",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontFamily: "Poppins",
                                backgroundColor: "#fff",
                                color: "#000",
                              }}
                            />
                            {updateBillDocument && (
                              <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#059669", fontFamily: "Poppins" }}>
                                New file selected
                              </p>
                            )}
                            {selectedAsset?.billDocument && !updateBillDocument && selectedAsset.billDocument !== null && selectedAsset.billDocument !== '' ? (
                              <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#6b7280", fontFamily: "Poppins" }}>
                                Current bill: <button
                                  type="button"
                                  onClick={() => handleViewBill(selectedAsset.billDocument)}
                                  style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", textDecoration: "underline", fontFamily: "Poppins", fontSize: "12px" }}
                                >
                                  View
                                </button>
                              </p>
                            ) : null}
                          </div>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ fontFamily: "Poppins", fontSize: "14px", fontWeight: 500, marginBottom: "4px", display: "block" }}>Notes</label>
                            <textarea
                              rows="2"
                              value={updateForm.notes}
                              onChange={(e) => handleUpdateInputChange("notes", e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #000",
                                borderRadius: "4px",
                                fontSize: "14px",
                                fontFamily: "Poppins",
                                backgroundColor: "#fff",
                                color: "#000",
                                resize: "vertical",
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ marginTop: "12px", display: "flex", gap: "12px" }}>
                          <button className="homebtn" type="submit" disabled={actionLoading || selectedAsset.status !== "pending"}>
                            Save Changes
                          </button>
                          <button
                            className="homebtn"
                            type="button"
                            onClick={() => {
                              setSelectedAsset(null);
                              setUpdateForm(initialUpdateForm);
                              setStockInQty("");
                            }}
                            disabled={actionLoading}
                            style={{ background: "#f3f4f6", color: "#374151" }}
                          >
                            Close
                          </button>
                        </div>
                      </form>

                      <form onSubmit={handleStockIn}>
                        <h5 style={{ fontFamily: "Poppins", fontWeight: 600 }}>Process Stock In</h5>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                          <div style={{ flex: "1 1 200px" }}>
                            <label>Received Quantity</label>
                            <input
                              type="number"
                              min="1"
                              max={maxReceivable || undefined}
                              value={stockInQty}
                              onChange={(e) => setStockInQty(e.target.value)}
                              required
                            />
                            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>
                              Remaining receivable: {maxReceivable} units
                            </p>
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
                            <button className="homebtn" type="submit" disabled={actionLoading || maxReceivable === 0}>
                              Stock In
                            </button>
                            <button
                              className="homebtn"
                              type="button"
                              onClick={() => {
                                setSelectedAsset(null);
                                setUpdateForm(initialUpdateForm);
                                setStockInQty("");
                              }}
                              disabled={actionLoading}
                              style={{ background: "#f3f4f6", color: "#374151" }}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bill View Modal */}
      {showBillModal && selectedBillImage && (
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
          onClick={closeBillModal}
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
                background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent)",
              }}
            >
              <button
                onClick={closeBillModal}
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
                src={selectedBillImage}
                alt="Bill Document"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
                onError={(e) => {
                  e.target.src = '';
                  e.target.alt = 'Failed to load bill';
                }}
              />
            </div>
          </div>
        </div>
      )}

      {(loading || detailLoading || actionLoading) && <Loading />}
      <ErrorModal isOpen={isErrorModalOpen} message={error} onClose={closeErrorModal} />
      <SuccessModal isOpen={isSuccessModalOpen} message={successMessage} onClose={closeSuccessModal} />
    </div>
  );
}