import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import ErrorModal from "@/components/ErrorModal";
import SuccessModal from "@/components/SuccessModal";
import Loading from "@/components/Loading";
import storeService from "../../../services/storeService";

export default function StoreAssetTransfer() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    assetId: "",
    toStoreId: "",
    quantity: "",
    reason: "",
    additionalNotes: "",
    remarks: "",
  });
  const [currentStore, setCurrentStore] = useState(null);
  const [assets, setAssets] = useState([]);
  const [stores, setStores] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [assetsWithPendingTransfers, setAssetsWithPendingTransfers] = useState(new Set());
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [transferResponse, setTransferResponse] = useState(null);

  // Get current store ID
  const getStoreId = () => {
    try {
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        const store = JSON.parse(selectedStore);
        return store.id;
      }
      const currentStoreId = localStorage.getItem("currentStoreId");
      if (currentStoreId) {
        return parseInt(currentStoreId);
      }
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const user = userData.user || userData;
      return user?.storeId || user?.store?.id || null;
    } catch (e) {
      console.error("Error parsing store data:", e);
      return null;
    }
  };

  // Fetch current store details
  const fetchCurrentStore = async () => {
    const storeId = getStoreId();
    if (!storeId) {
      setError("Store information missing. Please select a store first.");
      setIsErrorModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      const res = await storeService.getStoreById(storeId);
      const store = res.store || res.data || res;
      if (store && store.id) {
        setCurrentStore(store);
      } else {
        throw new Error("Store not found");
      }
    } catch (err) {
      console.error("Error fetching current store:", err);
      setError(err.response?.data?.message || err.message || "Error fetching store information");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available assets from current store
  const fetchAssets = async () => {
    const storeId = getStoreId();
    if (!storeId) return;

    try {
      setLoading(true);
      const res = await storeService.getStoreAssets(storeId, { limit: 1000 }); // Get all assets
      console.log('Assets response:', res);
      
      const assetsData = res.data || res.assets || res || [];
      
      // Map assets - use quantity directly as available quantity for transfer
      // Backend returns: quantity (actual available), requestedQuantity, receivedQuantity
      const mappedAssets = Array.isArray(assetsData) ? assetsData.map(item => {
        const quantity = parseFloat(item.quantity || 0);
        const requestedQty = parseFloat(item.requestedQuantity || item.quantity || 0);
        const receivedQty = parseFloat(item.receivedQuantity || 0);
        
        // For transfer, available quantity is the quantity field (actual available quantity)
        // If quantity is not available, fall back to requestedQuantity - receivedQuantity
        const availableQty = quantity > 0 ? quantity : Math.max(requestedQty - receivedQty, 0);
        
        return {
          id: item.id,
          assetCode: item.assetCode || item.code || `AST-${item.id}`,
          itemName: item.itemName || item.name || "-",
          availableQuantity: availableQty,
          totalQuantity: requestedQty,
          receivedQuantity: receivedQty,
          quantity: quantity,
          status: item.status || "completed",
        };
      }) : [];
      
      // Filter out assets with pending transfers and assets with no available quantity
      const filteredAssets = mappedAssets.filter(asset => {
        const hasAvailableQty = asset.availableQuantity > 0;
        // Check both number and string versions of asset ID
        const assetIdNum = Number(asset.id);
        const hasPendingTransfer = assetsWithPendingTransfers.has(assetIdNum) || assetsWithPendingTransfers.has(String(asset.id));
        if (hasPendingTransfer) {
          console.log(`Filtering out asset ${asset.id} (${asset.itemName}) - has pending transfer`);
        }
        return hasAvailableQty && !hasPendingTransfer;
      });
      
      console.log('Mapped assets for dropdown:', filteredAssets);
      console.log('Assets with pending transfers (excluded):', Array.from(assetsWithPendingTransfers));
      setAssets(filteredAssets);
    } catch (err) {
      console.error("Error fetching assets:", err);
      setError(err.response?.data?.message || err.message || "Error fetching assets");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch destination stores
  const fetchStores = async () => {
    const storeId = getStoreId();
    if (!storeId) return;

    try {
      setLoading(true);
      const response = await storeService.getDestinationStores(storeId);
      const storesData = response.data || response.stores || response || [];
      const mappedStores = Array.isArray(storesData) ? storesData.map(store => ({
        id: store.id,
        name: store.name || store.storeName,
        storeCode: store.storeCode || store.code,
      })) : [];
      
      setStores(mappedStores);
      if (mappedStores.length === 0) {
        setError("No destination stores available for transfer.");
        setIsErrorModalOpen(true);
      }
    } catch (err) {
      console.error("Error fetching destination stores:", err);
      setError(err.response?.data?.message || err.message || "Error fetching destination stores");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch asset transfers
  const fetchTransfers = async () => {
    const storeId = getStoreId();
    if (!storeId) return;

    try {
      setTransfersLoading(true);
      const response = await storeService.getAssetTransfers(storeId, { limit: 50 });
      console.log('=== Transfers API Response ===');
      console.log('Full response:', JSON.stringify(response, null, 2));
      
      // The API returns { success: true, data: [...] } where data is an array of transfer records
      const transfersData = response.data || response.transfers || [];
      
      if (!Array.isArray(transfersData)) {
        console.error('Transfers data is not an array:', transfersData);
        setTransfers([]);
        setTransfersLoading(false);
        return;
      }
      
      console.log('Transfers data array length:', transfersData.length);
      if (transfersData.length > 0) {
        console.log('First transfer sample:', JSON.stringify(transfersData[0], null, 2));
      }
      
      // The API returns transfer records with items array
      // Each transfer has: transferCode, fromStore, toStore, items[], grandTotal, totalQuantity
      const mappedTransfers = transfersData.map((transfer, index) => {
        console.log(`\n=== Processing transfer ${index + 1}/${transfersData.length} ===`);
        console.log('Transfer ID:', transfer.id);
        console.log('Transfer Code:', transfer.transferCode);
        console.log('Items:', transfer.items);
        console.log('Total Quantity:', transfer.totalQuantity);
        console.log('Grand Total:', transfer.grandTotal);
        
        // Get asset information from items array or asset field
        let itemName = "-";
        let assetCode = "-";
        let quantity = 0;
        
        if (transfer.items && Array.isArray(transfer.items) && transfer.items.length > 0) {
          // Get from first item (most transfers have single item, but handle multiple)
          const firstItem = transfer.items[0];
          itemName = firstItem.itemName || transfer.asset || "-";
          assetCode = firstItem.destinationAsset?.assetCode || 
                     firstItem.sourceAsset?.assetCode || 
                     "-";
          // Sum up transferred quantities from all items
          quantity = transfer.items.reduce((sum, item) => {
            return sum + parseFloat(item.transferredQuantity || 0);
          }, 0);
        } else {
          // Fallback to transfer-level fields
          itemName = transfer.asset || transfer.assetNames?.[0] || "-";
          quantity = parseFloat(transfer.totalQuantity || 0);
        }
        
        // If quantity is still 0, try to get from items
        if (quantity === 0 && transfer.items && transfer.items.length > 0) {
          quantity = transfer.items.reduce((sum, item) => {
            return sum + parseFloat(item.transferredQuantity || 0);
          }, 0);
        }
        
        // Get totals
        const grandTotal = parseFloat(transfer.grandTotal || 0);
        const totalValue = parseFloat(transfer.totalValue || 0);
        const totalTax = parseFloat(transfer.totalTax || 0);
        
        console.log(`Mapped values - itemName: "${itemName}", quantity: ${quantity}, grandTotal: ${grandTotal}`);
        
        const mappedTransfer = {
          id: transfer.id,
          transferCode: transfer.transferCode || transfer.code || `AST-TRF-${transfer.id}`,
          fromStore: transfer.fromStore || {},
          toStore: transfer.toStore || {},
          asset: {
            id: transfer.items?.[0]?.destinationAssetId || transfer.items?.[0]?.sourceAssetId || null,
            assetCode: assetCode,
            itemName: itemName, // CRITICAL: Set itemName from items array
            value: totalValue.toString(),
            tax: totalTax.toString(),
            total: grandTotal.toString(),
            assetDate: transfer.transferDate || transfer.createdAt || null,
            quantity: quantity,
            // Include first item's asset data if available
            ...(transfer.items?.[0]?.destinationAsset || transfer.items?.[0]?.sourceAsset || {}),
            // Override with our mapped values
            itemName: itemName,
            assetCode: assetCode,
            quantity: quantity,
            total: grandTotal.toString(),
          },
          assetId: transfer.items?.[0]?.destinationAssetId || transfer.items?.[0]?.sourceAssetId || null,
          quantity: quantity, // CRITICAL: Set at transfer level for table display
          status: transfer.status || "pending",
          reason: transfer.reason || "-",
          transferDate: transfer.transferDate || transfer.createdAt,
          notes: transfer.notes || "",
          totals: {
            totalValue: totalValue,
            totalTax: totalTax,
            grandTotal: grandTotal,
          },
          items: transfer.items || [], // Keep items array for reference
        };
        
        console.log('Final mapped transfer:', {
          id: mappedTransfer.id,
          transferCode: mappedTransfer.transferCode,
          itemName: mappedTransfer.asset.itemName,
          quantity: mappedTransfer.quantity,
          grandTotal: mappedTransfer.totals.grandTotal,
        });
        return mappedTransfer;
      });
      console.log('\n=== Final Mapped Transfers ===');
      console.log('Total mapped transfers:', mappedTransfers.length);
      mappedTransfers.forEach((t, i) => {
        console.log(`Transfer ${i + 1}:`, {
          id: t.id,
          transferCode: t.transferCode,
          itemName: t.asset?.itemName,
          quantity: t.quantity,
          total: t.totals?.grandTotal,
        });
      });
      setTransfers(mappedTransfers);
      
      // Track assets with pending transfers (exclude completed/cancelled)
      const pendingAssetIds = new Set();
      mappedTransfers.forEach(transfer => {
        if (transfer.status === "pending" && transfer.assetId) {
          const assetIdNum = Number(transfer.assetId);
          console.log(`Asset ${assetIdNum} (type: ${typeof assetIdNum}) has pending transfer ${transfer.transferCode}`);
          pendingAssetIds.add(assetIdNum); // Ensure it's a number
          // Also add as string to catch both cases
          pendingAssetIds.add(String(transfer.assetId));
        }
      });
      console.log('Pending asset IDs Set:', Array.from(pendingAssetIds));
      setAssetsWithPendingTransfers(pendingAssetIds);
    } catch (err) {
      console.error("Error fetching asset transfers:", err);
      // Don't show error modal for transfers, just log it
    } finally {
      setTransfersLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentStore();
  }, []);

  useEffect(() => {
    if (currentStore?.id) {
      fetchStores();
      // Fetch transfers first, then fetch assets after transfers are loaded
      fetchTransfers().then(() => {
        fetchAssets();
      });
    }
  }, [currentStore]);

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
    setError(null);
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setSuccessMessage("");
    // Reset form after successful transfer
    setForm({
      assetId: "",
      toStoreId: "",
      quantity: "",
      reason: "",
      additionalNotes: "",
      remarks: "",
    });
    setTransferResponse(null);
    // Refresh assets list
    fetchAssets();
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.assetId || !form.toStoreId || !form.quantity || !form.reason) {
      setError("Please fill all the required fields.");
      setIsErrorModalOpen(true);
      return;
    }

    const selectedAsset = assets.find(a => a.id === Number(form.assetId));
    if (!selectedAsset) {
      setError("Selected asset not found.");
      setIsErrorModalOpen(true);
      return;
    }

    const quantity = parseInt(form.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError("Please enter a valid quantity.");
      setIsErrorModalOpen(true);
      return;
    }

    if (quantity > selectedAsset.availableQuantity) {
      setError(`Available quantity is only ${selectedAsset.availableQuantity}. Please enter a valid quantity.`);
      setIsErrorModalOpen(true);
      return;
    }

    // Refetch transfers to ensure we have latest data before validation
    const storeId = getStoreId();
    if (!storeId) {
      setError("Store information missing. Please select a store first.");
      setIsErrorModalOpen(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Fetch latest transfers to check for pending transfers
      const latestTransfersResponse = await storeService.getAssetTransfers(storeId, { limit: 50 });
      const latestTransfersData = latestTransfersResponse.data || latestTransfersResponse.transfers || latestTransfersResponse || [];
      const latestTransfers = Array.isArray(latestTransfersData) ? latestTransfersData.map(transfer => ({
        assetId: transfer.assetId || transfer.asset?.id,
        status: transfer.status || "pending",
        transferCode: transfer.transferCode || transfer.code || `AST-TRF-${transfer.id}`,
      })) : [];

      // Check if asset has a pending transfer (check both Set and latest transfers array)
      const assetIdNum = Number(form.assetId);
      console.log('Checking for pending transfers - Asset ID:', assetIdNum);
      console.log('Pending asset IDs Set:', Array.from(assetsWithPendingTransfers));
      console.log('Latest transfers:', latestTransfers);
      
      // Check in Set first
      const hasPendingInSet = assetsWithPendingTransfers.has(assetIdNum) || assetsWithPendingTransfers.has(String(assetIdNum));
      // Also check in latest transfers array directly as fallback
      const pendingTransfer = latestTransfers.find(t => {
        const tAssetId = Number(t.assetId);
        const matches = tAssetId === assetIdNum && t.status === "pending";
        if (matches) {
          console.log('Found pending transfer:', t);
        }
        return matches;
      });
      
      if (hasPendingInSet || pendingTransfer) {
        const transferCode = pendingTransfer?.transferCode || "N/A";
        setError(`This asset is already part of a pending transfer (${transferCode}). Please complete or cancel the existing transfer first.`);
        setIsErrorModalOpen(true);
        setSubmitting(false);
        return;
      }
      const requestBody = {
        storeId: storeId,
        assetId: Number(form.assetId),
        toStoreId: Number(form.toStoreId),
        quantity: quantity,
        reason: form.reason,
        additionalNotes: form.additionalNotes || "",
        remarks: form.remarks || "",
      };

      console.log('Creating asset transfer with body:', requestBody);

      const response = await storeService.createAssetTransfer(requestBody);

      if (response.success) {
        setTransferResponse(response.data);
        setSuccessMessage(response.message || "Assets transferred successfully");
        setIsSuccessModalOpen(true);
        // Refresh transfers list
        fetchTransfers();
        // Refresh assets list
        fetchAssets();
      } else {
        throw new Error(response.message || "Failed to transfer assets");
      }
    } catch (err) {
      console.error("Error transferring assets:", err);
      setError(err.response?.data?.message || err.message || "Failed to transfer assets. Please try again.");
      setIsErrorModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAsset = assets.find(a => a.id === Number(form.assetId));
  const selectedStore = stores.find(s => s.id === Number(form.toStoreId));

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
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
            Asset Transfer
          </h2>
          <p className="path">
            <span onClick={() => navigate("/store/assets")}>Assets</span> <i className="bi bi-chevron-right"></i> Transfer
          </p>
        </div>
        <button className="cancelbtn" onClick={() => navigate("/store/assets")}>
          Back to Assets
        </button>
      </div>

      {loading && !currentStore && (
        <div className={styles.orderStatusCard} style={{ textAlign: "center", padding: "40px" }}>
          <Loading />
        </div>
      )}

      {currentStore && (
        <div className={styles.orderStatusCard}>
          <h4 style={{ margin: 0, marginBottom: "20px", fontFamily: "Poppins", fontWeight: 600, fontSize: "20px", color: "var(--primary-color)" }}>
            Transfer Request
          </h4>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label>Asset *</label>
                <select 
                  value={form.assetId} 
                  onChange={(e) => handleChange("assetId", e.target.value)} 
                  required
                  disabled={submitting || loading}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #000",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "Poppins",
                    backgroundColor: submitting || loading ? "#f3f4f6" : "#fff",
                    color: "#000",
                    cursor: submitting || loading ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">Select Asset</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.itemName} ({asset.assetCode}) - Available: {asset.availableQuantity}
                    </option>
                  ))}
                </select>
                {selectedAsset && (
                  <small style={{ color: "#666", fontFamily: "Poppins", fontSize: "12px", display: "block", marginTop: "4px" }}>
                    Total: {selectedAsset.totalQuantity} | Received: {selectedAsset.receivedQuantity} | Available: {selectedAsset.availableQuantity}
                  </small>
                )}
              </div>
              <div>
                <label>From Store</label>
                <input 
                  type="text" 
                  value={currentStore.name || "Current Store"} 
                  disabled
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #000",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "Poppins",
                    backgroundColor: "#f3f4f6",
                    color: "#000",
                    cursor: "not-allowed",
                  }}
                />
              </div>
              <div>
                <label>To Store *</label>
                <select 
                  value={form.toStoreId} 
                  onChange={(e) => handleChange("toStoreId", e.target.value)} 
                  required
                  disabled={submitting || loading}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #000",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "Poppins",
                    backgroundColor: submitting || loading ? "#f3f4f6" : "#fff",
                    color: "#000",
                    cursor: submitting || loading ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">Select Store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} {store.storeCode ? `(${store.storeCode})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Quantity *</label>
                <input 
                  type="number" 
                  min="1" 
                  max={selectedAsset?.availableQuantity || ""}
                  value={form.quantity} 
                  onChange={(e) => handleChange("quantity", e.target.value)} 
                  required
                  disabled={submitting || loading}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #000",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "Poppins",
                    backgroundColor: submitting || loading ? "#f3f4f6" : "#fff",
                    color: "#000",
                  }}
                />
                {selectedAsset && (
                  <small style={{ color: "#666", fontFamily: "Poppins", fontSize: "12px", display: "block", marginTop: "4px" }}>
                    Max: {selectedAsset.availableQuantity}
                  </small>
                )}
              </div>
              <div>
                <label>Reason *</label>
                <select 
                  value={form.reason} 
                  onChange={(e) => handleChange("reason", e.target.value)} 
                  required
                  disabled={submitting || loading}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #000",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "Poppins",
                    backgroundColor: submitting || loading ? "#f3f4f6" : "#fff",
                    color: "#000",
                    cursor: submitting || loading ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">Select Reason</option>
                  <option value="Stock Reallocation">Stock Reallocation</option>
                  <option value="New Store Requirement">New Store Requirement</option>
                  <option value="Replacement">Replacement</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Emergency Transfer">Emergency Transfer</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Additional Notes (Optional)</label>
                <textarea 
                  rows="2" 
                  value={form.additionalNotes} 
                  onChange={(e) => handleChange("additionalNotes", e.target.value)} 
                  placeholder="Additional notes about the transfer..."
                  disabled={submitting || loading}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #000",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "Poppins",
                    backgroundColor: submitting || loading ? "#f3f4f6" : "#fff",
                    color: "#000",
                    resize: "vertical",
                  }}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Remarks (Optional)</label>
                <textarea 
                  rows="2" 
                  value={form.remarks} 
                  onChange={(e) => handleChange("remarks", e.target.value)} 
                  placeholder="Additional remarks..."
                  disabled={submitting || loading}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #000",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "Poppins",
                    backgroundColor: submitting || loading ? "#f3f4f6" : "#fff",
                    color: "#000",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button 
                type="submit" 
                className="homebtn"
                disabled={submitting || loading}
              >
                {submitting ? "Submitting..." : "Submit Transfer"}
              </button>
              <button
                type="button"
                className="homebtn"
                onClick={() => {
                  setForm({
                    assetId: "",
                    toStoreId: "",
                    quantity: "",
                    reason: "",
                    additionalNotes: "",
                    remarks: "",
                  });
                }}
                disabled={submitting || loading}
                style={{ background: "#f3f4f6", color: "#2563eb" }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      {transferResponse && (
        <div className={styles.orderStatusCard} style={{ marginTop: "24px" }}>
          <h4 style={{ margin: 0, marginBottom: "12px", fontFamily: "Poppins", fontWeight: 600, color: "#059669" }}>
            Transfer Successful
          </h4>
          {transferResponse.transfer && (
            <div style={{ fontFamily: "Poppins", fontSize: "14px" }}>
              <p style={{ margin: "8px 0" }}>
                <strong>Transfer Code:</strong> {transferResponse.transfer.transferCode || "-"}
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>From Store:</strong> {transferResponse.transfer.fromStore?.name || "-"} ({transferResponse.transfer.fromStore?.storeCode || "-"})
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>To Store:</strong> {transferResponse.transfer.toStore?.name || "-"} ({transferResponse.transfer.toStore?.storeCode || "-"})
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 500,
                    backgroundColor: transferResponse.transfer.status === "completed" ? "#d1fae5" : "#fef3c7",
                    color: transferResponse.transfer.status === "completed" ? "#065f46" : "#92400e",
                  }}
                >
                  {transferResponse.transfer.status || "pending"}
                </span>
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>Reason:</strong> {transferResponse.transfer.reason || "-"}
              </p>
              {transferResponse.transfer.notes && (
                <p style={{ margin: "8px 0" }}>
                  <strong>Notes:</strong> {transferResponse.transfer.notes}
                </p>
              )}
              {transferResponse.transfer.transferDate && (
                <p style={{ margin: "8px 0" }}>
                  <strong>Transfer Date:</strong>{" "}
                  {new Date(transferResponse.transfer.transferDate).toLocaleString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              {transferResponse.totals && (
                <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f9fafb", borderRadius: "4px" }}>
                  <p style={{ margin: "4px 0", fontWeight: 600 }}>Financial Summary:</p>
                  <p style={{ margin: "4px 0" }}>
                    Total Value: ₹{transferResponse.totals.totalValue?.toLocaleString("en-IN") || "0"}
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    Total Tax: ₹{transferResponse.totals.totalTax?.toLocaleString("en-IN") || "0"}
                  </p>
                  <p style={{ margin: "4px 0", fontWeight: 600, color: "var(--primary-color)" }}>
                    Grand Total: ₹{transferResponse.totals.grandTotal?.toLocaleString("en-IN") || "0"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Transferred Assets Table */}
      {currentStore && (
        <div className={styles.orderStatusCard} style={{ marginTop: "24px" }}>
          <h4 style={{ margin: 0, marginBottom: "20px", fontFamily: "Poppins", fontWeight: 600, fontSize: "20px", color: "var(--primary-color)" }}>
            Transferred Assets
          </h4>
          {transfersLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Loading />
            </div>
          ) : transfers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              <p style={{ fontFamily: "Poppins", margin: 0 }}>No asset transfers found</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table table-bordered borderedtable table-sm" style={{ fontFamily: "Poppins" }}>
                <thead className="table-light">
                  <tr>
                    <th>S.No</th>
                    <th>Transfer Code</th>
                    <th>Asset</th>
                    <th>From Store</th>
                    <th>To Store</th>
                    <th>Quantity</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Transfer Date</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer, index) => (
                    <tr
                      key={transfer.id}
                      style={{
                        background: index % 2 === 0 ? "rgba(59, 130, 246, 0.03)" : "transparent",
                      }}
                    >
                      <td style={{ fontFamily: "Poppins", fontSize: "13px" }}>{index + 1}</td>
                      <td style={{ fontFamily: "Poppins", fontSize: "13px", fontWeight: 600 }}>
                        {transfer.transferCode || `AST-TRF-${transfer.id}`}
                      </td>
                      <td style={{ fontFamily: "Poppins", fontSize: "13px" }}>
                        {transfer.asset?.itemName || transfer.itemName || 
                         (transfer.assetId ? `Asset ID: ${transfer.assetId}` : "-")}
                        {transfer.asset?.assetCode && transfer.asset.assetCode !== "-" && (
                          <div style={{ fontSize: "11px", color: "#6b7280" }}>
                            {transfer.asset.assetCode}
                          </div>
                        )}
                      </td>
                      <td style={{ fontFamily: "Poppins", fontSize: "13px" }}>
                        {transfer.fromStore?.name || "-"}
                        {transfer.fromStore?.storeCode && (
                          <div style={{ fontSize: "11px", color: "#6b7280" }}>
                            ({transfer.fromStore.storeCode})
                          </div>
                        )}
                      </td>
                      <td style={{ fontFamily: "Poppins", fontSize: "13px" }}>
                        {transfer.toStore?.name || "-"}
                        {transfer.toStore?.storeCode && (
                          <div style={{ fontSize: "11px", color: "#6b7280" }}>
                            ({transfer.toStore.storeCode})
                          </div>
                        )}
                      </td>
                      <td style={{ fontFamily: "Poppins", fontSize: "13px", fontWeight: 600 }}>
                        {transfer.quantity || transfer.asset?.quantity || 0}
                      </td>
                      <td style={{ fontFamily: "Poppins", fontSize: "13px" }}>
                        {transfer.reason || "-"}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: 500,
                            backgroundColor:
                              transfer.status === "completed"
                                ? "#d1fae5"
                                : transfer.status === "pending"
                                ? "#fef3c7"
                                : transfer.status === "cancelled"
                                ? "#fee2e2"
                                : "#e5e7eb",
                            color:
                              transfer.status === "completed"
                                ? "#065f46"
                                : transfer.status === "pending"
                                ? "#92400e"
                                : transfer.status === "cancelled"
                                ? "#991b1b"
                                : "#374151",
                          }}
                        >
                          {transfer.status || "pending"}
                        </span>
                      </td>
                      <td style={{ fontFamily: "Poppins", fontSize: "13px" }}>
                        {transfer.transferDate
                          ? new Date(transfer.transferDate).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </td>
                      <td style={{ fontFamily: "Poppins", fontSize: "13px", fontWeight: 600 }}>
                        {transfer.totals?.grandTotal
                          ? `₹${parseFloat(transfer.totals.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : transfer.asset?.total
                          ? `₹${parseFloat(transfer.asset.total).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : transfer.total
                          ? `₹${parseFloat(transfer.total).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {isErrorModalOpen && (
        <ErrorModal
          isOpen={isErrorModalOpen}
          message={error}
          onClose={closeErrorModal}
        />
      )}

      {isSuccessModalOpen && (
        <SuccessModal
          isOpen={isSuccessModalOpen}
          message={successMessage}
          onClose={closeSuccessModal}
        />
      )}
    </div>
  );
}
