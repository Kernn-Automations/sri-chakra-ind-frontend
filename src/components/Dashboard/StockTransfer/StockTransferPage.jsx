import React, { useEffect, useState } from "react";
import { useAuth } from "@/Auth";
import "./StockTransferPage.css";
import SuccessModal from "@/components/SuccessModal";
import ErrorModal from "@/components/ErrorModal";

function StockTransferPage({ navigate }) {
  const { axiosAPI } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [fromWarehouse, setFromWarehouse] = useState(null);
  const [toWarehouse, setToWarehouse] = useState(null);
  const [fromProducts, setFromProducts] = useState([]);
  const [toProducts, setToProducts] = useState([]);
  const [transferQty, setTransferQty] = useState({});
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);

  const convertToKg = (value, unit) => {
    const val = Number(value || 0);
    if (unit === "ton") return val * 1000;
    if (unit === "g") return val / 1000;
    if (unit === "mg") return val / 1e6;
    return val; // assume kg
  };

  useEffect(() => {
    setLoadingWarehouses(true);
    
    // ✅ Get division ID from localStorage for division filtering
    const currentDivisionId = localStorage.getItem('currentDivisionId');
    const currentDivisionName = localStorage.getItem('currentDivisionName');
    
    // ✅ Add division parameters to endpoint
    let endpoint = "/warehouse";
    if (currentDivisionId && currentDivisionId !== '1') {
      endpoint += `?divisionId=${currentDivisionId}`;
    } else if (currentDivisionId === '1') {
      endpoint += `?showAllDivisions=true`;
    }
    
    console.log('StockTransferPage - Fetching warehouses with endpoint:', endpoint);
    console.log('StockTransferPage - Division ID:', currentDivisionId);
    console.log('StockTransferPage - Division Name:', currentDivisionName);
    
    axiosAPI
      .get(endpoint)
      .then((res) => {
        setWarehouses(res.data.warehouses || []);
      })
      .catch(() => {
        setErrorMessage("Failed to load warehouses");
        setShowError(true);
      })
      .finally(() => setLoadingWarehouses(false));
  }, []);

  useEffect(() => {
    async function fetchInventory() {
      if (!fromWarehouse && !toWarehouse) return;

      setLoadingInventory(true);
      try {
        if (fromWarehouse) {
          const res = await axiosAPI.get(
            `/warehouse/${fromWarehouse.id}/inventory`
          );
          setFromProducts(res.data.products || []);
        }
        if (toWarehouse) {
          const res = await axiosAPI.get(
            `/warehouse/${toWarehouse.id}/inventory`
          );
          setToProducts(res.data.products || []);
        }
      } catch {
        setErrorMessage("Failed to load inventory");
        setShowError(true);
      } finally {
        setLoadingInventory(false);
      }
    }
    fetchInventory();
  }, [fromWarehouse, toWarehouse]);

  const handleQtyChange = (productId, value) => {
    const cleaned = value.replace(/^0+/, "") || "0"; // remove leading zeros
    const qty = Math.max(0, parseInt(cleaned, 10));
    setTransferQty((prev) => ({ ...prev, [productId]: qty }));
  };

  const getAdjustedQty = (productId, base, direction = "from") => {
    const delta = transferQty[productId] || 0;
    return direction === "from"
      ? Number(base) - Number(delta)
      : Number(base) + Number(delta);
  };

  const filteredFromWarehouses = warehouses.filter(
    (w) => w.id !== toWarehouse?.id
  );
  const filteredToWarehouses = warehouses.filter(
    (w) => w.id !== fromWarehouse?.id
  );
  const availableProducts = fromProducts.filter(
    (p) => p.quantity > 0 && !selectedProductIds.includes(p.id)
  );
  const selectedProducts = fromProducts.filter((p) =>
    selectedProductIds.includes(p.id)
  );

  const removeProduct = (productId) => {
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
    setTransferQty((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate("/stock-transfer"); // Redirect to warehouses page
  };

  const handleErrorClose = () => {
    setShowError(false);
  };

  const submitTransfer = async () => {
    if (!fromWarehouse || !toWarehouse || selectedProductIds.length === 0) {
      alert("Please select warehouses and products.");
      return;
    }

    const payload = {
      fromWarehouseId: fromWarehouse.id,
      toWarehouseId: toWarehouse.id,
      products: selectedProductIds
        .map((id) => ({ productId: id, quantity: transferQty[id] }))
        .filter((p) => p.quantity > 0),
    };

    if (payload.products.length === 0) {
      alert("Please enter valid transfer quantities.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axiosAPI.post("/warehouse/transfer/stock", payload);
      setSuccessMessage(
        `Transfer successful. Transfer Number: ${res.data.transferNumber}`
      );
      setShowSuccess(true);
      setTransferQty({});
      setSelectedProductIds([]);
    } catch (err) {
      console.error("Transfer failed", err);
      setErrorMessage(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/stock-transfer")}>Stock Transfer</span>{" "}
        <i className="bi bi-chevron-right"></i>Transfer
      </p>
      <div className="row m-0 p-3">
        <h4 className="mb-4">Stock Transfer</h4>
        {loadingWarehouses ||
          (loadingInventory && (
            <div className="text-center my-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ))}
        {/* Warehouse Selectors */}
        <div className="row mb-4">
          <div className="col-md-5 dateForms">
            <label>From Warehouse</label>
            <select
              className="form-select"
              value={fromWarehouse?.id || ""}
              onChange={(e) =>
                setFromWarehouse(
                  warehouses.find((w) => w.id === Number(e.target.value))
                )
              }
            >
              <option value="">--Select From Warehouse--</option>
              {filteredFromWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2 d-flex align-items-center justify-content-center">
            <div className="border-start h-100 mx-2"></div>
          </div>
          <div className="col-md-5 dateForms">
            <label>To Warehouse</label>
            <select
              className="form-select"
              value={toWarehouse?.id || ""}
              onChange={(e) =>
                setToWarehouse(
                  warehouses.find((w) => w.id === Number(e.target.value))
                )
              }
            >
              <option value="">--Select To Warehouse--</option>
              {filteredToWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Selector */}
        {fromWarehouse && toWarehouse && (
          <>
            <div className="row mb-3">
              <div className="col-md-6 dateForms">
                <label>--Select Product to Transfer--</label>
                <select
                  className="form-select"
                  onChange={(e) => {
                    const selectedId = Number(e.target.value);
                    if (
                      selectedId &&
                      !selectedProductIds.includes(selectedId)
                    ) {
                      setSelectedProductIds([
                        ...selectedProductIds,
                        selectedId,
                      ]);
                    }
                  }}
                >
                  <option value="">-- Select Product --</option>
                  {availableProducts.map((p) => {
                    const displayUnit =
                      p.productType === "packed" ? "packets" : p.unit;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.quantity} {displayUnit})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="row">
              {/* From Warehouse Table */}
              <div className="col-md-6">
                <h5 className="mb-3">From: {fromWarehouse.name}</h5>
                <table className="table table-bordered table-striped borderedtable">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Product</th>
                      <th>Type</th>
                      <th>Unit</th>
                      <th>Pack Info</th>
                      <th>Current</th>
                      <th>Deduct</th>
                      <th>After</th>
                      <th>In Tonnes</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducts.map((p, i) => {
                      const qty = transferQty[p.id] || 0;
                      const perUnitKg =
                        p.productType === "packed"
                          ? convertToKg(p.packageWeight, p.unit)
                          : convertToKg(1, p.unit);
                      const inTons = ((qty * perUnitKg) / 1000).toFixed(3);
                      return (
                        <tr key={p.id}>
                          <td>{i + 1}</td>
                          <td>{p.name}</td>
                          <td>{p.productType}</td>
                          <td>
                            {p.productType === "packed" ? "packets" : p.unit}
                          </td>
                          <td>
                            {p.productType === "packed"
                              ? `${p.packageWeight} ${p.unit}`
                              : "-"}
                          </td>
                          <td>{p.quantity}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="form-control form-control-sm"
                              value={qty}
                              onChange={(e) =>
                                handleQtyChange(p.id, e.target.value)
                              }
                            />
                          </td>
                          <td className="text-danger">
                            {" "}
                            {getAdjustedQty(p.id, p.quantity, "from")}
                          </td>
                          <td>{inTons} t</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeProduct(p.id)}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* To Warehouse Table */}
              <div className="col-md-6">
                <h5 className="mb-3">To: {toWarehouse.name}</h5>
                <table className="table table-bordered table-striped borderedtable">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Product</th>
                      <th>Type</th>
                      <th>Unit</th>
                      <th>Pack Info</th>
                      <th>Current</th>
                      <th>Added</th>
                      <th>After</th>
                      <th>In Tonnes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducts.map((p, i) => {
                      const toProduct = toProducts.find(
                        (tp) => tp.id === p.id
                      ) || { quantity: 0 };
                      const qty = transferQty[p.id] || 0;
                      const perUnitKg =
                        p.productType === "packed"
                          ? convertToKg(p.packageWeight, p.unit)
                          : convertToKg(1, p.unit);
                      const inTons = ((qty * perUnitKg) / 1000).toFixed(3);
                      return (
                        <tr key={p.id}>
                          <td>{i + 1}</td>
                          <td>{p.name}</td>
                          <td>{p.productType}</td>
                          <td>
                            {p.productType === "packed" ? "packets" : p.unit}
                          </td>
                          <td>
                            {p.productType === "packed"
                              ? `${p.packageWeight} ${p.unit}`
                              : "-"}
                          </td>
                          <td>{toProduct.quantity}</td>
                          <td className="text-success">+ {qty}</td>
                          <td className="text-success">
                            {getAdjustedQty(p.id, toProduct.quantity, "to")}
                          </td>
                          <td>{inTons} t</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 text-end">
              <button
                className="btn btn-primary"
                disabled={submitting}
                onClick={submitTransfer}
              >
                {submitting ? "Transferring..." : "Submit Stock Transfer"}
              </button>
            </div>
          </>
        )}
        <SuccessModal
          isOpen={showSuccess}
          message={successMessage}
          onClose={handleSuccessClose}
        />

        <ErrorModal
          isOpen={showError}
          message={errorMessage}
          onClose={handleErrorClose}
        />
      </div>
    </>
  );
}

export default StockTransferPage;
