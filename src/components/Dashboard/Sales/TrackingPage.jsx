import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import React, { useEffect, useState } from "react";
import styles from "./Sales.module.css";
import DropOffs from "./DropOffs";
import ProductsList from "./ProductsList";
import PaymentInfo from "./PaymentInfo";
import axios from "axios";
import SignUploadModal from "./SignUploadModal";
import VerifyOTP from "./VerifyOTP";
import DispatchForm from "./DispatchForm";
import PaymentsSection from "./PaymentSection";
import CustomersModal from "../Customers/CustomersModal";

const TrackingPage = ({ orderId, setOrderId, navigate, isAdmin }) => {
  const [order, setOrder] = useState();
  const { axiosAPI } = useAuth();

  const [showDispatchModal, setShowDispatchModal] = useState(false);

  const [customerId, setCustomerId] = useState(null);

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Cancel-related states
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Return form states for dispatched orders
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnFormData, setReturnFormData] = useState({
    productId: "",
    returnType: "",
    returnReason: "",
    returnQuantity: "",
    paymentMode: "",
    description: "",
  });
  const [returnFormErrors, setReturnFormErrors] = useState({});

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const res = await axiosAPI.get(`/sales-orders/order/${orderId}`);
        setOrder(res.data);
      } catch (e) {
        setError(e.response?.data?.message || "Something went wrong");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
    // eslint-disable-next-line
  }, []);

  // ESC key and click outside functionality for return modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && showReturnModal) {
        handleReturnModalClose();
      }
    };

    const handleClickOutside = (event) => {
      if (
        showReturnModal &&
        event.target.classList.contains(styles.cancelModalOverlay)
      ) {
        handleReturnModalClose();
      }
    };

    if (showReturnModal) {
      document.addEventListener("keydown", handleEscKey);
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showReturnModal]);

  const handlePaymentSubmitted = async (response) => {
    // Refresh order data after payment submission
    try {
      setLoading(true);
      const res = await axiosAPI.get(`/sales-orders/order/${orderId}`);
      setOrder(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to refresh order data");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!orderId) return;

    try {
      setDownloadLoading(true);

      const token = localStorage.getItem("accessToken");
      const VITE_API = import.meta.env.VITE_API_URL;

      const response = await axios.get(
        `${VITE_API}/sales-orders/${orderId}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SalesOrder_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // cleanup
    } catch (err) {
      setError("Failed to download PDF.");
      setIsModalOpen(true);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDispatch = async () => {
    try {
      setActionLoading(true);

      // ✅ Step 1: Check eligibility
      const eligibility = await axiosAPI.get(
        `/sales-orders/${orderId}/dispatch/eligibility`,
      );
      console.log("Eligible : ", eligibility);
      if (!eligibility.data.eligible) {
        setError(eligibility.data.reason || "Not eligible for dispatch");
        setIsModalOpen(true);
        return;
      }

      // ✅ Step 2: Collect truck & driver info (simplified prompt for now)
      const truckNumber = prompt("Enter Truck Number:");
      const driverName = prompt("Enter Driver Name:");
      const driverMobile = prompt("Enter Driver Mobile:");

      if (!truckNumber || !driverName || !driverMobile) {
        setError("All driver/truck details are required.");
        setIsModalOpen(true);
        return;
      }

      // ✅ Step 3: Call dispatch API
      const res = await axiosAPI.put(`/sales-orders/${orderId}/dispatch`, {
        truckNumber,
        driverName,
        driverMobile,
      });

      // ✅ Step 4: Refresh page state
      setOrder({ ...order, orderStatus: res.data.orderStatus });
    } catch (err) {
      setError(err.response?.data?.message || "Dispatch failed");
      setIsModalOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendOtp = async () => {
    try {
      setActionLoading(true);

      await axiosAPI.get(`/sales-orders/${orderId}/deliver/otp`, {
        salesOrderId: orderId,
      });
      openDialog();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
      setIsModalOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  // === Cancel order feature ===
  const handleCancelOrderClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = () => {
    setShowCancelConfirm(false);
    setShowCancelReason(true);
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      setError("Reason is required to cancel order.");
      setIsModalOpen(true);
      return;
    }
    setCancelLoading(true);
    try {
      // Use POST and send reason in body
      const res = await axiosAPI.post(`/sales-orders/cancel/${orderId}`, {
        reason: cancelReason,
      });
      setOrder({
        ...order,
        orderStatus: "Cancelled",
        cancelledReason: cancelReason,
        cancelledAt: new Date().toISOString(),
      });
      setShowCancelReason(false);
      setCancelReason("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel order");
      setIsModalOpen(true);
    } finally {
      setCancelLoading(false);
    }
  };
  const handleCancelClose = () => {
    setShowCancelConfirm(false);
    setShowCancelReason(false);
    setCancelReason("");
  };

  // Return form handlers for dispatched orders
  const handleReturnFormChange = (e) => {
    const { name, value } = e.target;
    setReturnFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (returnFormErrors[name]) {
      setReturnFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateReturnForm = () => {
    const newErrors = {};

    if (!returnFormData.productId)
      newErrors.productId = "Product selection is required";
    if (!returnFormData.returnType)
      newErrors.returnType = "Return type is required";
    if (!returnFormData.returnReason)
      newErrors.returnReason = "Return reason is required";
    if (!returnFormData.returnQuantity || returnFormData.returnQuantity <= 0) {
      newErrors.returnQuantity = "Valid return quantity is required";
    }
    if (!returnFormData.paymentMode)
      newErrors.paymentMode = "Payment mode is required";

    setReturnFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReturnFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateReturnForm()) {
      return;
    }

    setCancelLoading(true);
    try {
      const res = await axiosAPI.post(`/sales-orders/cancel/${orderId}`, {
        productId: returnFormData.productId,
        reason: returnFormData.returnReason,
        returnType: returnFormData.returnType,
        returnQuantity: returnFormData.returnQuantity,
        paymentMode: returnFormData.paymentMode,
        description: returnFormData.description,
        isDispatchedReturn: true,
      });

      setOrder({
        ...order,
        orderStatus: "Cancelled",
        cancelledReason: returnFormData.returnReason,
        cancelledAt: new Date().toISOString(),
      });

      setShowReturnModal(false);
      setReturnFormData({
        productId: "",
        returnType: "",
        returnReason: "",
        returnQuantity: "",
        paymentMode: "",
        description: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel order");
      setIsModalOpen(true);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReturnModalClose = () => {
    setShowReturnModal(false);
    setReturnFormData({
      productId: "",
      returnType: "",
      returnReason: "",
      returnQuantity: "",
      paymentMode: "",
      description: "",
    });
    setReturnFormErrors({});
  };

  const findTracking = (status, paymentStatus) => {
    if (status === "Cancelled") return 100; // Special marker
    if (paymentStatus === "pending") return 2;
    else if (
      paymentStatus === "awaitingPaymentConfirmation" &&
      status === "pending"
    )
      return 3;
    else if (status === "Confirmed") return 4;
    else if (status === "Dispatched") return 5;
    else if (status === "Delivered") return 6;
    else return 1;
  };

  function formatToIST(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    const options = {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    const formatted = date.toLocaleString("en-IN", options);
    return `${formatted} IST`;
  }

  // Derive payment info from either singular Request or array Requests
  const paymentInfo = order?.paymentRequest || order?.paymentRequests?.[0];

  const getPendingAmount = () => {
    if (!order) return 0;

    const total = Number(order.grandTotal || 0);

    const paid = (order.paymentRequests || [])
      .filter(
        (p) => p.status === "Approved" || p.transactionStatus === "Completed",
      )
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return Math.max(total - paid, 0);
  };

  const pendingAmount = getPendingAmount();

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/sales")}>Sales</span>{" "}
        <i className="bi bi-chevron-right"></i>
        <span onClick={() => navigate("/sales/orders")}> Orders</span>{" "}
        <i className="bi bi-chevron-right"></i> Tracking-Details
      </p>

      {order && (
        <div className={styles.trackingContainer}>
          <h2 className={styles.trackingTitle}>Sales Order Details</h2>
          <div className={styles.flexx}>
            <div className={styles.infoCard}>
              <div>
                <img
                  src={order.customer.photo}
                  alt="Customer"
                  className={styles.customerPhoto}
                />
              </div>
              <div>
                <h6
                  style={{ cursor: "pointer", color: "#0d6efd", margin: 0 }}
                  onClick={() => setCustomerId(order.customer.id)}
                >
                  {order.customer.name}
                </h6>

                <p>ID : {order.customer?.customer_id}</p>
                <p>Mobile : {order.customer.mobile}</p>
                <p>WhatsApp : {order.customer.whatsapp}</p>
                <p>Email : {order.customer.email}</p>
              </div>
            </div>

            <div>
              <div className={styles.trackingHeader}>
                <button
                  className={styles.downloadBtn}
                  onClick={handleDownload}
                  disabled={downloadLoading}
                >
                  <i className="bi bi-download"></i>{" "}
                  {downloadLoading ? "Downloading..." : "Download PDF"}
                </button>
              </div>

              {/* Cancel Button logic */}
              {order.orderStatus !== "Dispatched" &&
                order.orderStatus !== "Delivered" &&
                order.orderStatus !== "Cancelled" && (
                  <div style={{ marginTop: "10px" }}>
                    <button
                      className={styles.cancelOrderBtn}
                      onClick={handleCancelOrderClick}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? "Cancelling..." : "Cancel Order"}
                    </button>
                  </div>
                )}

              {/* Cancelled Banner */}
              {order.orderStatus === "Cancelled" && (
                <div className={styles.cancelledBanner}>
                  Order Cancelled
                  {order.cancelledReason ? (
                    <div className={styles.cancelledReason}>
                      <span>Reason: {order.cancelledReason}</span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Cancel Confirmation Modal */}
              {showCancelConfirm && (
                <div className={styles.cancelModalOverlay}>
                  <div className={styles.cancelModalBox}>
                    <div className={styles.cancelModalTitle}>
                      Are you sure you want to cancel this order?
                    </div>
                    <div className={styles.cancelModalBtns}>
                      <button
                        className={styles.cancelBtn}
                        onClick={handleCancelClose}
                      >
                        No
                      </button>
                      <button
                        className={styles.confirmBtn}
                        onClick={handleCancelConfirm}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancel Reason Modal */}
              {showCancelReason && (
                <div className={styles.cancelModalOverlay}>
                  <div className={styles.cancelModalBox}>
                    <div className={styles.cancelModalTitle}>
                      Enter reason for cancellation
                    </div>
                    <textarea
                      className={styles.cancelReasonTextarea}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      disabled={cancelLoading}
                    />
                    <div className={styles.cancelModalBtns}>
                      <button
                        className={styles.cancelBtn}
                        onClick={handleCancelClose}
                      >
                        Cancel
                      </button>
                      <button
                        className={styles.confirmBtn}
                        onClick={handleCancelSubmit}
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? "Cancelling..." : "Submit"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {downloadLoading && <Loading />}
              {order?.orderStatus === "Confirmed" && (
                <>
                  {/* ⚠️ Pending Amount Warning */}
                  {pendingAmount > 0 && (
                    <div
                      style={{
                        marginBottom: "12px",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        backgroundColor: "#fff8e1",
                        border: "1px solid #ffecb3",
                        color: "#8d6e63",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      ⚠️ <strong>Warning:</strong> ₹
                      {pendingAmount.toLocaleString("en-IN")} is still pending
                      for this order.
                      <br />
                      You may proceed with dispatch, but payment is not fully
                      settled.
                    </div>
                  )}

                  <DispatchForm
                    actionLoading={actionLoading}
                    orderId={orderId}
                    setActionLoading={setActionLoading}
                    setShowDispatchModal={setShowDispatchModal}
                    showDispatchModal={showDispatchModal}
                    order={order}
                    setOrder={setOrder}
                    setError={setError}
                    setIsModalOpen={setIsModalOpen}
                  />
                </>
              )}

              {order?.orderStatus === "Dispatched" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <button
                    className={styles.otpBtn}
                    onClick={handleSendOtp}
                    disabled={actionLoading}
                    style={{ marginTop: "10px" }}
                  >
                    {actionLoading ? "Sending OTP..." : "Send Delivery OTP"}
                  </button>
                  <button
                    className={styles.cancelOrderBtn}
                    onClick={() => setShowReturnModal(true)}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? "Processing..." : "Cancel Order"}
                  </button>
                  <VerifyOTP
                    actionLoading={actionLoading}
                    enteredOtp={enteredOtp}
                    handleSendOtp={handleSendOtp}
                    order={order}
                    orderId={orderId}
                    setActionLoading={setActionLoading}
                    setEnteredOtp={setEnteredOtp}
                    isDialogOpen={isDialogOpen}
                    setIsDialogOpen={setIsDialogOpen}
                    closeDialog={closeDialog}
                  />
                </div>
              )}
            </div>
          </div>
          {order && (
            <div className={styles.infoGrid}>
              <PaymentsSection
                order={order}
                axiosAPI={axiosAPI}
                setError={setError}
                setIsModalOpen={setIsModalOpen}
                onPaymentSubmitted={handlePaymentSubmitted}
              />
            </div>
          )}
          <div className={styles.infoCard}>
            <div className="w-100">
              <h6 className={styles.title}>Order Tracking</h6>
              <div className={styles.container}>
                {/* If Cancelled show only Cancel step */}
                {findTracking(order.orderStatus, paymentInfo?.status) ===
                100 ? (
                  <div className={`${styles.timeline} ${styles.linecomplete}`}>
                    <div className={styles.step}>
                      <div
                        className={`${styles.circle} ${styles.cancelledCircle}`}
                      ></div>
                      <div className={styles.stepText}>
                        <p className={styles.cancelledText}>Order Cancelled</p>

                        <p className={styles.date}>
                          Cancelled At:{" "}
                          {order.cancelledAt
                            ? formatToIST(order.cancelledAt)
                            : formatToIST(order.updatedAt || new Date())}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className={`${styles.timeline} ${
                        findTracking(order.orderStatus, paymentInfo?.status) > 0
                          ? styles.linecomplete
                          : findTracking(
                                order.orderStatus,
                                paymentInfo?.status,
                              ) === 0
                            ? styles.linecurrent
                            : styles.linepending
                      }`}
                    >
                      <div className={styles.step}>
                        <div
                          className={`${styles.circle} ${
                            findTracking(
                              order.orderStatus,
                              paymentInfo?.status,
                            ) > 0
                              ? styles.completed
                              : findTracking(
                                    order.orderStatus,
                                    paymentInfo?.status,
                                  ) === 0
                                ? styles.current
                                : styles.pending
                          }`}
                        ></div>
                        <div className={styles.stepText}>
                          <p
                            className={`${
                              findTracking(
                                order.orderStatus,
                                paymentInfo?.status,
                              ) > 0
                                ? styles.completedText
                                : findTracking(
                                      order.orderStatus,
                                      paymentInfo?.status,
                                    ) === 0
                                  ? styles.currentText
                                  : styles.pendingText
                            }`}
                          >
                            {findTracking(
                              order.orderStatus,
                              paymentInfo?.status,
                            ) > 0
                              ? "Payment Details Submitted"
                              : "Awaiting For Payment Details"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`${styles.timeline} ${
                        findTracking(order.orderStatus, paymentInfo?.status) > 1
                          ? styles.linecomplete
                          : findTracking(
                                order.orderStatus,
                                paymentInfo?.status,
                              ) === 1
                            ? styles.linecurrent
                            : styles.linepending
                      }`}
                    >
                      <div className={styles.step}>
                        <div
                          className={`${styles.circle} ${
                            findTracking(
                              order.orderStatus,
                              paymentInfo?.status,
                            ) > 1
                              ? styles.completed
                              : findTracking(
                                    order.orderStatus,
                                    paymentInfo?.status,
                                  ) === 1
                                ? styles.current
                                : styles.pending
                          }`}
                        ></div>
                        <div className={styles.stepText}>
                          <p
                            className={`${
                              findTracking(
                                order.orderStatus,
                                paymentInfo?.status,
                              ) > 1
                                ? styles.completedText
                                : findTracking(
                                      order.orderStatus,
                                      paymentInfo?.status,
                                    ) === 1
                                  ? styles.currentText
                                  : styles.pendingText
                            }`}
                          >
                            {findTracking(
                              order.orderStatus,
                              paymentInfo?.status,
                            ) > 1
                              ? "Payment Processed"
                              : "Awaiting Payment Processing"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`${styles.timeline} ${
                        findTracking(order.orderStatus, paymentInfo?.status) > 2
                          ? styles.linecomplete
                          : findTracking(
                                order.orderStatus,
                                paymentInfo?.status,
                              ) === 2
                            ? styles.linecurrent
                            : styles.linepending
                      }`}
                    >
                      <div className={styles.step}>
                        <div
                          className={`${styles.circle} ${
                            findTracking(
                              order.orderStatus,
                              paymentInfo?.status,
                            ) > 2
                              ? styles.completed
                              : findTracking(
                                    order.orderStatus,
                                    paymentInfo?.status,
                                  ) === 2
                                ? styles.current
                                : styles.pending
                          }`}
                        ></div>
                        <div className={styles.stepText}>
                          <p
                            className={`${
                              findTracking(
                                order.orderStatus,
                                paymentInfo?.status,
                              ) > 2
                                ? styles.completedText
                                : findTracking(
                                      order.orderStatus,
                                      paymentInfo?.status,
                                    ) === 2
                                  ? styles.currentText
                                  : styles.pendingText
                            }`}
                          >
                            {findTracking(
                              order.orderStatus,
                              paymentInfo?.status,
                            ) > 2
                              ? "Payment Approved"
                              : "Awaiting Payment Approval"}
                          </p>
                          {findTracking(
                            order.orderStatus,
                            paymentInfo?.status,
                          ) > 2 &&
                            paymentInfo?.updatedAt && (
                              <p className={styles.date}>
                                {formatToIST(paymentInfo?.updatedAt)}
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`${styles.timeline} ${
                        findTracking(order.orderStatus, paymentInfo?.status) > 3
                          ? styles.linecomplete
                          : findTracking(
                                order.orderStatus,
                                paymentInfo?.status,
                              ) === 3
                            ? styles.linecurrent
                            : styles.linepending
                      }`}
                    >
                      <div className={styles.step}>
                        <div
                          className={`${styles.circle} ${
                            findTracking(
                              order.orderStatus,
                              paymentInfo?.status,
                            ) > 3
                              ? styles.completed
                              : findTracking(
                                    order.orderStatus,
                                    paymentInfo?.status,
                                  ) === 3
                                ? styles.current
                                : styles.pending
                          }`}
                        ></div>
                        <div className={styles.stepText}>
                          <p
                            className={`${
                              findTracking(
                                order.orderStatus,
                                paymentInfo?.status,
                              ) > 3
                                ? styles.completedText
                                : findTracking(
                                      order.orderStatus,
                                      paymentInfo?.status,
                                    ) === 3
                                  ? styles.currentText
                                  : styles.pendingText
                            }`}
                          >
                            {findTracking(
                              order.orderStatus,
                              paymentInfo?.status,
                            ) > 3
                              ? "Order Confirmed"
                              : "Awaiting Order Confirmation"}
                          </p>
                          {findTracking(
                            order.orderStatus,
                            paymentInfo?.status,
                          ) > 3 &&
                            order.updatedAt && (
                              <p className={styles.date}>
                                {formatToIST(order?.updatedAt)}
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`${styles.timeline} ${
                        findTracking(order.orderStatus, paymentInfo?.status) > 4
                          ? styles.linecomplete
                          : findTracking(
                                order.orderStatus,
                                paymentInfo?.status,
                              ) === 4
                            ? styles.linecurrent
                            : styles.linepending
                      }`}
                    >
                      <div className={styles.step}>
                        <div
                          className={`${styles.circle} ${
                            findTracking(
                              order.orderStatus,
                              paymentInfo?.status,
                            ) > 4
                              ? styles.completed
                              : findTracking(
                                    order.orderStatus,
                                    paymentInfo?.status,
                                  ) === 4
                                ? styles.current
                                : styles.pending
                          }`}
                        ></div>
                        <div className={styles.stepText}>
                          <p
                            className={`${
                              findTracking(
                                order.orderStatus,
                                paymentInfo?.status,
                              ) > 4
                                ? styles.completedText
                                : findTracking(
                                      order.orderStatus,
                                      paymentInfo?.status,
                                    ) === 4
                                  ? styles.currentText
                                  : styles.pendingText
                            }`}
                          >
                            {findTracking(
                              order.orderStatus,
                              paymentInfo?.status,
                            ) > 4
                              ? "Order Dispatched"
                              : "Awaiting Order Dispatch"}
                          </p>
                          {order.dispatchDate && (
                            <p className={styles.date}>
                              {formatToIST(order.dispatchDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`${styles.timelinelast} ${
                        findTracking(order.orderStatus, paymentInfo?.status) > 5
                          ? styles.linecomplete
                          : findTracking(
                                order.orderStatus,
                                paymentInfo?.status,
                              ) === 5
                            ? styles.linecurrent
                            : styles.linepending
                      }`}
                    >
                      <div className={styles.step}>
                        <div
                          className={`${styles.circle} ${
                            findTracking(
                              order.orderStatus,
                              paymentInfo?.status,
                            ) > 5
                              ? styles.completed
                              : findTracking(
                                    order.orderStatus,
                                    paymentInfo?.status,
                                  ) === 5
                                ? styles.current
                                : styles.pending
                          }`}
                        ></div>
                        <div className={styles.stepText}>
                          <p
                            className={`${
                              findTracking(
                                order.orderStatus,
                                paymentInfo?.status,
                              ) > 5
                                ? styles.completedText
                                : findTracking(
                                      order.orderStatus,
                                      paymentInfo?.status,
                                    ) === 5
                                  ? styles.currentText
                                  : styles.pendingText
                            }`}
                          >
                            {findTracking(
                              order.orderStatus,
                              paymentInfo?.status,
                            ) > 5
                              ? "Order Delivered"
                              : "Awaiting Order to Deliver"}
                          </p>
                          {order.deliveredDate && (
                            <p className={styles.date}>
                              {formatToIST(order.deliveredDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          {/* Delivery History Section */}
          {(order.orderStatus === "Dispatched" ||
            order.orderStatus === "Delivered") && (
            <div className={styles.infoCard}>
              <div className="w-100">
                <h6 className={styles.title}>Delivery History</h6>
                <div className={styles.deliveryHistoryContainer}>
                  {/* Combined Delivery History */}
                  {(order.dispatchDate ||
                    order.truckNumber ||
                    order.orderStatus === "Dispatched" ||
                    order.orderStatus === "Delivered") && (
                    <div className={styles.deliveryHistoryItem}>
                      <div className={styles.deliveryHistoryHeader}>
                        <div className={styles.deliveryHistoryIcon}>
                          <i className="bi bi-truck"></i>
                        </div>
                        <div className={styles.deliveryHistoryContent}>
                          <h6 className={styles.deliveryHistoryTitle}>
                            {order.dispatchDetails?.isPartialDispatch
                              ? "First Dispatch"
                              : "Dispatch"}
                          </h6>
                          <p className={styles.deliveryHistoryDate}>
                            {order.dispatchDate
                              ? `Dispatched on: ${formatToIST(order.dispatchDate)}`
                              : order.orderStatus === "Dispatched" ||
                                  order.orderStatus === "Delivered"
                                ? `Dispatched on: ${formatToIST(order.updatedAt)}`
                                : "Dispatch information not available"}
                          </p>
                          <div className={styles.dispatchDetails}>
                            {order.truckNumber && (
                              <p className={styles.dispatchInfo}>
                                <strong>Truck Number:</strong>{" "}
                                {order.truckNumber}
                              </p>
                            )}
                            {order.driverName && (
                              <p className={styles.dispatchInfo}>
                                <strong>Driver:</strong> {order.driverName}{" "}
                                {order.driverMobile &&
                                  `(${order.driverMobile})`}
                              </p>
                            )}
                            {order.dispatchDetails && (
                              <>
                                {order.dispatchDetails.truckNumber && (
                                  <p className={styles.dispatchInfo}>
                                    <strong>Truck Number:</strong>{" "}
                                    {order.dispatchDetails.truckNumber}
                                  </p>
                                )}
                                {order.dispatchDetails.driverName && (
                                  <p className={styles.dispatchInfo}>
                                    <strong>Driver:</strong>{" "}
                                    {order.dispatchDetails.driverName} (
                                    {order.dispatchDetails.driverMobile})
                                  </p>
                                )}
                                {order.dispatchDetails.isPartialDispatch &&
                                  order.dispatchDetails.destinations && (
                                    <div
                                      className={styles.partialDispatchDetails}
                                    >
                                      <p
                                        className={styles.partialDispatchTitle}
                                      >
                                        <strong>
                                          Partial Dispatch Details:
                                        </strong>
                                      </p>
                                      {order.dispatchDetails.destinations.map(
                                        (dest, index) => (
                                          <div
                                            key={index}
                                            className={styles.destinationItem}
                                          >
                                            <p
                                              className={styles.destinationInfo}
                                            >
                                              <strong>Product:</strong>{" "}
                                              {dest.dealerName} |
                                              <strong> Quantity:</strong>{" "}
                                              {dest.quantity}
                                            </p>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                              </>
                            )}
                            {!order.truckNumber &&
                              !order.driverName &&
                              !order.dispatchDetails && (
                                <div className={styles.dispatchInfo}>
                                  <p>
                                    <strong>Products Dispatched:</strong>
                                  </p>
                                  {order.items && order.items.length > 0 ? (
                                    <div
                                      className={styles.dispatchProductsList}
                                    >
                                      {order.items.map((item, index) => (
                                        <div
                                          key={index}
                                          className={styles.dispatchProductItem}
                                        >
                                          <p
                                            className={
                                              styles.dispatchProductInfo
                                            }
                                          >
                                            <strong>Product:</strong>{" "}
                                            {item.productName || item.name} |
                                            <strong> Quantity:</strong>{" "}
                                            {item.quantity}{" "}
                                            {item.unit && `(${item.unit})`}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p>
                                      <em>Product details not available</em>
                                    </p>
                                  )}
                                </div>
                              )}
                          </div>

                          {/* Delivery Information - Outside dispatch details */}
                          {(order.deliveredDate ||
                            order.orderStatus === "Delivered") && (
                            <div className={styles.deliveryInfoSection}>
                              <div className={styles.deliveryInfoHeader}>
                                <div className={styles.deliveryInfoIcon}>
                                  <i className="bi bi-check-circle"></i>
                                </div>
                                <div className={styles.deliveryInfoContent}>
                                  <h6 className={styles.deliveryInfoTitle}>
                                    {order.dispatchDetails?.isPartialDispatch
                                      ? "First Delivery"
                                      : "Delivery"}
                                  </h6>
                                  <p className={styles.deliveryInfoDate}>
                                    {order.deliveredDate
                                      ? `Delivered on: ${formatToIST(order.deliveredDate)}`
                                      : order.orderStatus === "Delivered"
                                        ? `Delivered on: ${formatToIST(order.updatedAt)}`
                                        : "Delivery information not available"}
                                  </p>
                                  {order.deliveryDetails && (
                                    <div className={styles.deliveryDetails}>
                                      <p className={styles.deliveryInfo}>
                                        <strong>Delivery Status:</strong>{" "}
                                        {order.deliveryDetails.status ||
                                          "Completed"}
                                      </p>
                                      {order.deliveryDetails.notes && (
                                        <p className={styles.deliveryInfo}>
                                          <strong>Notes:</strong>{" "}
                                          {order.deliveryDetails.notes}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {!order.deliveryDetails && (
                                    <div className={styles.deliveryDetails}>
                                      <p className={styles.deliveryInfo}>
                                        <strong>Delivery Status:</strong>{" "}
                                        Completed
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show message if no delivery history yet */}
                  {order.orderStatus !== "Dispatched" &&
                    order.orderStatus !== "Delivered" && (
                      <div className={styles.noHistoryMessage}>
                        <p>No delivery history available yet.</p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
          <div className={styles.infoCard}>
            <div className={styles.wseDetails}>
              <h6>Sales Executive</h6>
              <p>
                <span>Name : </span>
                {order.salesExecutive?.name}
              </p>
              <p>
                <span>Mobile : </span>
                {order.salesExecutive?.mobile}
              </p>
            </div>
            <div className={styles.wseDetails}>
              <h6>Warehouse </h6>
              <p>
                <span>Name : </span>
                {order.warehouse?.name}
              </p>
              <p>
                <span>Address : </span>
                {order.warehouse?.fullAddress}
              </p>
            </div>
          </div>
          <div className={styles.infoGrid}>
            <h6 className={styles.title}>Order Items </h6>
            <div className={styles.infoCard}>
              <ProductsList items={order.items} />
            </div>
          </div>
          <div className={styles.infoGrid}>
            <h6 className={styles.title}>Payment Details </h6>
            <div className={styles.infoCard}>
              <PaymentInfo info={paymentInfo} />
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
      {loading && <Loading />}
      {showDispatchModal && <></>}

      {/* Return Modal for Dispatched Orders */}
      {showReturnModal && (
        <div className={styles.cancelModalOverlay}>
          <div
            className={styles.cancelModalBox}
            style={{ minWidth: "500px", maxWidth: "600px" }}
          >
            <div className={styles.cancelModalTitle}>
              Cancel Order - Return Form
            </div>

            <form onSubmit={handleReturnFormSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  className={styles.formLabel}
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "600",
                  }}
                >
                  Select Product *
                </label>
                <select
                  name="productId"
                  value={returnFormData.productId}
                  onChange={handleReturnFormChange}
                  className={styles.formSelect}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                  required
                >
                  <option value="">Select Product to Return</option>
                  {order?.items?.map((item, index) => (
                    <option key={index} value={item.productId || item.id}>
                      {item.productName || item.name} - Qty: {item.quantity} - ₹
                      {item.price}
                    </option>
                  ))}
                </select>
                {returnFormErrors.productId && (
                  <span style={{ color: "#e53935", fontSize: "12px" }}>
                    {returnFormErrors.productId}
                  </span>
                )}
              </div>

              <div
                style={{ display: "flex", gap: "20px", marginBottom: "20px" }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    className={styles.formLabel}
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "600",
                    }}
                  >
                    Return Type *
                  </label>
                  <select
                    name="returnType"
                    value={returnFormData.returnType}
                    onChange={handleReturnFormChange}
                    className={styles.formSelect}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                    required
                  >
                    <option value="">Select Return Type</option>
                    <option value="damage_delivery">
                      Damage during delivery
                    </option>
                    <option value="quality_issue">Quality issue</option>
                    <option value="expired_goods">Expired goods</option>
                    <option value="customer_preference">
                      Customer preference
                    </option>
                    <option value="other">Other</option>
                  </select>
                  {returnFormErrors.returnType && (
                    <span style={{ color: "#e53935", fontSize: "12px" }}>
                      {returnFormErrors.returnType}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    className={styles.formLabel}
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "600",
                    }}
                  >
                    Payment Mode *
                  </label>
                  <select
                    name="paymentMode"
                    value={returnFormData.paymentMode}
                    onChange={handleReturnFormChange}
                    className={styles.formSelect}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                    required
                  >
                    <option value="">Select Payment Mode</option>
                    <option value="credit_note">Credit Note</option>
                    <option value="replacement">Replacement</option>
                    <option value="refund">Refund</option>
                  </select>
                  {returnFormErrors.paymentMode && (
                    <span style={{ color: "#e53935", fontSize: "12px" }}>
                      {returnFormErrors.paymentMode}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  className={styles.formLabel}
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "600",
                  }}
                >
                  Return Quantity *
                </label>
                <input
                  type="number"
                  name="returnQuantity"
                  value={returnFormData.returnQuantity}
                  onChange={handleReturnFormChange}
                  className={styles.formInput}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                  min="1"
                  max={
                    returnFormData.productId
                      ? order?.items?.find(
                          (item) =>
                            (item.productId || item.id) ===
                            returnFormData.productId,
                        )?.quantity || 1
                      : order?.items?.reduce(
                          (total, item) => total + item.quantity,
                          0,
                        ) || 1
                  }
                  placeholder="Enter quantity to return"
                  required
                />
                {returnFormErrors.returnQuantity && (
                  <span style={{ color: "#e53935", fontSize: "12px" }}>
                    {returnFormErrors.returnQuantity}
                  </span>
                )}
                {returnFormData.productId && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "5px",
                    }}
                  >
                    Max quantity:{" "}
                    {order?.items?.find(
                      (item) =>
                        (item.productId || item.id) ===
                        returnFormData.productId,
                    )?.quantity || 0}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  className={styles.formLabel}
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "600",
                  }}
                >
                  Reason for Return *
                </label>
                <input
                  type="text"
                  name="returnReason"
                  value={returnFormData.returnReason}
                  onChange={handleReturnFormChange}
                  className={styles.formInput}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                  placeholder="Brief reason for return"
                  required
                />
                {returnFormErrors.returnReason && (
                  <span style={{ color: "#e53935", fontSize: "12px" }}>
                    {returnFormErrors.returnReason}
                  </span>
                )}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  className={styles.formLabel}
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "600",
                  }}
                >
                  Additional Description
                </label>
                <textarea
                  name="description"
                  value={returnFormData.description}
                  onChange={handleReturnFormChange}
                  className={styles.formTextarea}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    minHeight: "80px",
                  }}
                  placeholder="Additional details about the return"
                  rows="3"
                />
              </div>

              <div className={styles.cancelModalBtns}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleReturnModalClose}
                  disabled={cancelLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.confirmBtn}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? "Processing..." : "Submit Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {customerId && (
        <CustomersModal
          customerId={customerId}
          setCustomerId={setCustomerId}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
};

export default TrackingPage;
