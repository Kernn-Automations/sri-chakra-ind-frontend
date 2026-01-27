import { useAuth } from "@/Auth";
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
} from "@/components/ui/dialog";
import React, { useEffect, useState } from "react";
import styles from "./Sales.module.css";
import ComplementryModal from "./ComplementryModal";

function DispatchForm({
  actionLoading,
  setActionLoading,
  showDispatchModal,
  setShowDispatchModal,
  orderId,
  order,
  setOrder,
  setError,
  setIsModalOpen,
}) {
  const [truckNumber, setTruckNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverMobile, setDriverMobile] = useState("");
  const [isPartialDispatch, setIsPartialDispatch] = useState(false);
  const [isComplementryAdded, setIsComplementryAdded] = useState(false);
  const [destinations, setDestinations] = useState([
    { productId: "", quantity: "" },
  ]);
  const [complimentries, setComplimentries] = useState([]);
  const { axiosAPI } = useAuth();

  const [openComplementryModal, setOpenComplementryModal] = useState(false);

  const onIsComplementryChange = (e) => {
    setIsComplementryAdded(e.target.checked);
    if (e.target.checked) setOpenComplementryModal(true);
  };

  // Helper functions for managing destinations
  const addDestination = () => {
    setDestinations([...destinations, { productId: "", quantity: "" }]);
  };

  const removeDestination = (index) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter((_, i) => i !== index));
    }
  };

  const updateDestination = (index, field, value) => {
    const updated = destinations.map((dest, i) =>
      i === index ? { ...dest, [field]: value } : dest,
    );
    setDestinations(updated);
  };

  const [products, setProducts] = useState();
  const [partialStatus, setPartialStatus] = useState(null);

  useEffect(() => {
    async function fetch(params) {
      try {
        const res = await axiosAPI.get("/products?showAll=true");
        console.log(res);
        setProducts(res.data.products);
      } catch (e) {
        console.log(e);
      }
    }

    fetch();
  }, [axiosAPI]);

  useEffect(() => {
    async function fetchPartialStatus() {
      try {
        const res = await axiosAPI.get(
          `/sales-orders/${orderId}/partial-dispatch-status`,
        );
        console.log("Partial dispatch status:", res.data);
        setPartialStatus(res.data);
      } catch (statusError) {
        console.error("Failed to fetch partial dispatch status:", statusError);
      }
    }

    fetchPartialStatus();
  }, [axiosAPI, orderId]);

  const findProductById = (productId) =>
    order?.items?.find(
      (item) => String(item.productId || item.id) === String(productId),
    );

  const getStatusCandidates = () => {
    if (!partialStatus) return [];
    const candidates = [];
    if (Array.isArray(partialStatus)) candidates.push(partialStatus);
    if (Array.isArray(partialStatus?.items))
      candidates.push(partialStatus.items);
    if (Array.isArray(partialStatus?.data?.items))
      candidates.push(partialStatus.data.items);
    if (Array.isArray(partialStatus?.data)) candidates.push(partialStatus.data);
    return candidates;
  };

  const getStatusItem = (productId) => {
    const candidates = getStatusCandidates();
    for (const list of candidates) {
      const found = list.find(
        (item) => String(item.productId || item.id) === String(productId),
      );
      if (found) return found;
    }
    return undefined;
  };

  const normalizeNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  };

  const getFirstAvailableNumber = (source, fields = []) => {
    if (!source) return undefined;
    for (const field of fields) {
      if (source[field] !== undefined && source[field] !== null) {
        const num = normalizeNumber(source[field]);
        if (num !== undefined) return num;
      }
    }
    return undefined;
  };

  const getAvailableQuantity = (productId) => {
    const statusValue = getFirstAvailableNumber(getStatusItem(productId), [
      "availableQuantity",
      "availableQty",
      "availableStock",
      "available",
      "currentQuantity",
      "currentStock",
      "balanceQuantity",
      "remainingQuantity",
      "stock",
    ]);
    if (statusValue !== undefined) return statusValue;

    const product = findProductById(productId);
    const productValue = getFirstAvailableNumber(product, [
      "availableQuantity",
      "availableQty",
      "availableStock",
      "available",
      "remainingQuantity",
      "balanceQuantity",
      "quantity",
    ]);
    return productValue !== undefined ? productValue : Infinity;
  };

  const getNeedQuantity = (productId) => {
    const statusValue = getFirstAvailableNumber(getStatusItem(productId), [
      "needQuantity",
      "requiredQuantity",
      "requiredQty",
      "remainingQuantity",
      "quantityNeeded",
      "pendingQuantity",
    ]);
    if (statusValue !== undefined) return statusValue;

    const product = findProductById(productId);
    const productValue = getFirstAvailableNumber(product, [
      "needQuantity",
      "requiredQuantity",
      "remainingQuantity",
      "quantity",
    ]);
    return productValue !== undefined ? productValue : undefined;
  };

  const getOrderedQuantity = (productId) => {
    const statusValue = getFirstAvailableNumber(getStatusItem(productId), [
      "orderedQuantity",
      "orderQuantity",
      "orderedQty",
      "orderQty",
      "quantity",
    ]);
    if (statusValue !== undefined) return statusValue;

    const product = findProductById(productId);
    const productValue = getFirstAvailableNumber(product, [
      "orderedQuantity",
      "orderQuantity",
      "quantity",
    ]);
    return productValue !== undefined ? productValue : undefined;
  };

  const onSubmitBtn = async () => {
    if (!truckNumber || !driverName || !driverMobile) {
      setError("All fields are required");
      setIsModalOpen(true);
      return;
    }

    // Validate partial dispatch destinations if enabled
    let payloadDestinations = [];

    if (isPartialDispatch) {
      const hasEmptyDestinations = destinations.some(
        (dest) =>
          !String(dest.productId).trim() || String(dest.quantity).trim() === "",
      );
      if (hasEmptyDestinations) {
        setError(
          "All product and quantity fields are required for partial dispatch",
        );
        setIsModalOpen(true);
        return;
      }

      payloadDestinations = destinations.map((dest) => {
        const qty = Number(dest.quantity);
        const product = findProductById(dest.productId) || {};
        const statusItem = getStatusItem(dest.productId);
        const available = getAvailableQuantity(dest.productId);
        const needQty = getNeedQuantity(dest.productId);
        const orderedQty =
          getOrderedQuantity(dest.productId) ?? product.quantity;
        return {
          productId: dest.productId,
          quantity: qty,
          dispatchQuantity: qty,
          dispatchedQuantity: qty,
          requiredQuantity: needQty ?? qty,
          needQuantity: needQty ?? qty,
          availableQuantity: Number.isFinite(available) ? available : undefined,
          availableStock: Number.isFinite(available) ? available : undefined,
          remainingQuantity: statusItem?.remainingQuantity,
          orderedQuantity: orderedQty,
          orderQuantity: orderedQty,
          itemId: statusItem?.itemId ?? product?.id,
        };
      });

      const invalidQuantity = payloadDestinations.some(
        (dest) => Number.isNaN(dest.quantity) || dest.quantity <= 0,
      );
      if (invalidQuantity) {
        setError(
          "Please enter a valid quantity greater than 0 for partial dispatch.",
        );
        setIsModalOpen(true);
        return;
      }

      const exceedsAvailable = payloadDestinations.some((dest) => {
        const available = getAvailableQuantity(dest.productId);
        return Number.isFinite(available) && dest.quantity > available;
      });

      if (exceedsAvailable) {
        setError(
          "Partial dispatch quantity cannot exceed available quantity for the selected product.",
        );
        setIsModalOpen(true);
        return;
      }
    }

    try {
      setActionLoading(true);
      if (!isPartialDispatch) {
        const eligibility = await axiosAPI.get(
          `/sales-orders/${orderId}/dispatch/eligibility`,
        );
        if (!eligibility.data.eligible) {
          setError(eligibility.data.reason || "Not eligible for dispatch");
          setIsModalOpen(true);
          return;
        }
      }

      let dispatchItems = null;
      if (isPartialDispatch && order?.items?.length) {
        dispatchItems = order.items.map((item) => {
          const productId = item.productId || item.id;
          const match = payloadDestinations.find(
            (dest) => String(dest.productId) === String(productId),
          );
          const qty = match ? match.quantity : 0;
          const available = Number.isFinite(match?.availableQuantity)
            ? match.availableQuantity
            : getAvailableQuantity(productId);
          const needQty = getNeedQuantity(productId);
          const orderedQty = getOrderedQuantity(productId) ?? item.quantity;
          return {
            productId,
            quantity: qty,
            dispatchQuantity: qty,
            dispatchedQuantity: qty,
            requiredQuantity: needQty ?? qty,
            needQuantity: needQty ?? qty,
            availableQuantity: Number.isFinite(available)
              ? available
              : undefined,
            availableStock: Number.isFinite(available) ? available : undefined,
            remainingQuantity: getStatusItem(productId)?.remainingQuantity,
            orderedQuantity: orderedQty,
            orderQuantity: orderedQty,
            itemId: getStatusItem(productId)?.itemId ?? item.id,
          };
        });
      }

      const dispatchData = {
        truckNumber,
        driverName,
        driverMobile,
        isPartialDispatch,
        addComplementaryAttribute: isComplementryAdded,
        complementaryItems: isComplementryAdded ? complimentries : [],
        ...(isPartialDispatch && { destinations: payloadDestinations }),
        ...(dispatchItems ? { items: dispatchItems, dispatchItems } : {}),
      };

      console.log(dispatchData);

      const res = await axiosAPI.put(
        `/sales-orders/${orderId}/dispatch`,
        dispatchData,
      );
      console.log("Dispatch Form Response :", res);
      setOrder({
        ...order,
        orderStatus: res.data.orderStatus,
      });
      setShowDispatchModal(false);
    } catch (err) {
      console.error("Dispatch API error:", err);
      console.error("Dispatch API response:", err?.response?.data);

      // Handle network errors (connection refused, network error, etc.)
      let errorMessage = "Dispatch failed";

      if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        errorMessage =
          "Unable to connect to the server. Please check if the backend server is running and try again.";
      } else if (err.code === "ERR_CONNECTION_REFUSED") {
        errorMessage =
          "Connection refused. The backend server at http://localhost:8080 is not running. Please start the server and try again.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsModalOpen(true);
    } finally {
      setActionLoading(false);
    }
  };
  return (
    <>
      <DialogRoot
        placement={"center"}
        size={"md"}
        className={styles.mdl}
        open={showDispatchModal}
        onOpenChange={setShowDispatchModal}
      >
        <DialogActionTrigger asChild>
          <button
            className={styles.dispatchBtn}
            onClick={() => setShowDispatchModal(true)}
          >
            {actionLoading ? "Checking..." : "Dispatch Order"}
          </button>
        </DialogActionTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <h5 className="px-3 mdl-title">Dispatch Order</h5>
            <div className={`mb-2 ${styles.dispatchForm}`}>
              <label>Truck Number</label>
              <input
                type="text"
                value={truckNumber}
                onChange={(e) => setTruckNumber(e.target.value)}
                placeholder="Enter truck number"
              />
            </div>
            <div className={`mb-2 ${styles.dispatchForm}`}>
              <label>Driver Name</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Enter driver name"
              />
            </div>
            <div className={`mb-2 ${styles.dispatchForm}`}>
              <label>Driver Mobile</label>
              <input
                type="text"
                value={driverMobile}
                onChange={(e) => setDriverMobile(e.target.value)}
                placeholder="Enter driver mobile"
              />
            </div>

            {/* Partial Dispatch Checkbox */}
            <div className={`mb-3 ${styles.dispatchForm}`}>
              <div className="d-flex align-items-center">
                <input
                  type="checkbox"
                  id="partialDispatch"
                  checked={isPartialDispatch}
                  onChange={(e) => setIsPartialDispatch(e.target.checked)}
                  className="me-2"
                />
                <label htmlFor="partialDispatch" className="mb-0">
                  Partial Dispatch
                </label>
              </div>
              <div className="d-flex align-items-center">
                <input
                  type="checkbox"
                  id="isComplementryAdded"
                  checked={isComplementryAdded}
                  onChange={(e) => onIsComplementryChange(e)}
                  className="me-2"
                />
                <label htmlFor="isComplementryAdded" className="mb-0">
                  Add Complementry
                </label>
              </div>
            </div>
            {isComplementryAdded && (
              <div className={styles.compDetails}>
                <h6>Complementry Details</h6>
                {complimentries.map((comp) => {
                  const product = products.find(
                    (p) => String(p.id) === String(comp.productId),
                  );
                  return (
                    <p>
                      <span>{product?.name || comp.productId} : </span>
                      {comp.bags} Bags
                    </p>
                  );
                })}
              </div>
            )}

            <ComplementryModal
              openComplementryModal={openComplementryModal}
              setOpenComplementryModal={setOpenComplementryModal}
              isComplementryAdded={isComplementryAdded}
              setIsComplementryAdded={setIsComplementryAdded}
              products={products}
              complimentries={complimentries}
              setComplimentries={setComplimentries}
              orderId={orderId}
            />

            {/* Partial Dispatch Destinations */}
            {isPartialDispatch && (
              <div className={`mb-3 ${styles.partialDispatchSection}`}>
                <h6 className="mb-3">Dispatch Details</h6>
                {destinations.map((destination, index) => (
                  <div key={index} className={`mb-3 ${styles.destinationCard}`}>
                    {destinations.length > 1 && (
                      <div className="d-flex justify-content-end mb-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeDestination(index)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <div className={`mb-2 ${styles.dispatchForm}`}>
                      <label>Product</label>
                      <select
                        value={destination.productId}
                        onChange={(e) =>
                          updateDestination(index, "productId", e.target.value)
                        }
                        className={styles.dispatchFormSelect}
                      >
                        <option value="">Select Product</option>
                        {order?.items?.map((item, itemIndex) => (
                          <option
                            key={itemIndex}
                            value={item.productId || item.id}
                          >
                            {item.productName || item.name} - Qty:{" "}
                            {item.quantity} {item.unit && `(${item.unit})`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={`mb-2 ${styles.dispatchForm}`}>
                      <label>Quantity</label>
                      <input
                        type="number"
                        value={destination.quantity}
                        onChange={(e) =>
                          updateDestination(index, "quantity", e.target.value)
                        }
                        placeholder="Enter quantity"
                        min="0.01"
                        step="any"
                        max={
                          destination.productId
                            ? (() => {
                                const available = getAvailableQuantity(
                                  destination.productId,
                                );
                                return Number.isFinite(available)
                                  ? available
                                  : undefined;
                              })()
                            : undefined
                        }
                      />
                      {destination.productId &&
                        (() => {
                          const available = getAvailableQuantity(
                            destination.productId,
                          );
                          const needQty = getNeedQuantity(
                            destination.productId,
                          );
                          if (
                            !Number.isFinite(available) &&
                            !Number.isFinite(needQty)
                          )
                            return null;
                          return (
                            <small className="text-muted">
                              {Number.isFinite(available) && (
                                <>Available: {available}</>
                              )}
                              {Number.isFinite(needQty) && (
                                <>
                                  {Number.isFinite(available) ? " | " : ""}
                                  Needed: {needQty}
                                </>
                              )}
                            </small>
                          );
                        })()}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={addDestination}
                >
                  + Add More Product
                </button>
              </div>
            )}
            <div className="d-flex justify-content-end gap-2 py-3">
              <button
                className="cancelbtn"
                onClick={() => setShowDispatchModal(false)}
              >
                Cancel
              </button>
              <button
                className="submitbtn"
                disabled={actionLoading}
                onClick={onSubmitBtn}
              >
                {actionLoading ? "Dispatching..." : "Dispatch"}
              </button>
            </div>
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" asChild>
            <button onClick={() => setShowDispatchModal(false)}>
              <i className="bi bi-x"></i>
            </button>
          </DialogCloseTrigger>
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default DispatchForm;
