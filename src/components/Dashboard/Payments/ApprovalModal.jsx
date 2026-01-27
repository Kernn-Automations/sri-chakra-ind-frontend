import React, { useState, useEffect } from "react";
import styles from "./Payments.module.css";
import img from "./../../../images/dummy-img.jpeg";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";
import ImageZoomModal from "./ImageZoomModal";

function ApprovalModal({ report, changeTrigger }) {
  const { axiosAPI } = useAuth();

  const [error, setError] = useState(null);
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [isImageZoomModalOpen, setIsImageZoomModalOpen] = useState(false);
  const [currentZoomImageUrl, setCurrentZoomImageUrl] = useState(null);

  /* --------------------------------------------------
   * INIT PAYMENT STATUS MAP
   * -------------------------------------------------- */
  useEffect(() => {
    if (report?.paymentRequests?.length) {
      const map = report.paymentRequests.reduce((acc, pr) => {
        acc[pr.paymentRequestId] = pr.approvalStatus;
        return acc;
      }, {});
      setPaymentStatuses(map);
    }
  }, [report]);

  const paymentRequestsToShow = report?.paymentRequests || [];

  /* --------------------------------------------------
   * APPROVE / REJECT HANDLER
   * -------------------------------------------------- */
  const handleAction = async (paymentRequestId, action) => {
    setError(null);
    setLoadingIds((prev) => new Set(prev).add(paymentRequestId));

    try {
      await axiosAPI.post(`/payment-requests/${paymentRequestId}/${action}`);

      setPaymentStatuses((prev) => ({
        ...prev,
        [paymentRequestId]: action === "approve" ? "Approved" : "Rejected",
      }));

      changeTrigger();
    } catch (e) {
      setError(
        e.response?.data?.message || "Failed to update payment approval",
      );
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(paymentRequestId);
        return next;
      });
    }
  };

  /* --------------------------------------------------
   * IMAGE ZOOM
   * -------------------------------------------------- */
  const openImageZoomModal = (imageUrl) => {
    setCurrentZoomImageUrl(imageUrl);
    setIsImageZoomModalOpen(true);
  };

  const closeImageZoomModal = () => {
    setIsImageZoomModalOpen(false);
    setCurrentZoomImageUrl(null);
  };

  if (!report) return null;

  return (
    <>
      {/* HEADER */}
      <h3 className="px-3 mdl-title">
        Payment Approvals – Sales Order: {report.orderNumber}
      </h3>

      {/* ORDER INFO */}
      <div className="row m-0 p-0">
        <div className={`col-6 ${styles.longformmdl}`}>
          <label>Customer</label>
          <input type="text" value={report.customer?.name || "-"} readOnly />
        </div>

        <div className={`col-6 ${styles.longformmdl}`}>
          <label>Warehouse</label>
          <input type="text" value={report.warehouse?.name || "-"} readOnly />
        </div>

        <div className={`col-6 ${styles.longformmdl}`}>
          <label>Sales Executive</label>
          <input
            type="text"
            value={report.salesExecutive?.name || "-"}
            readOnly
          />
        </div>

        <div className={`col-6 ${styles.longformmdl}`}>
          <label>Total Paid</label>
          <input
            type="text"
            value={`₹ ${Number(report.totalPaidAmount || 0).toLocaleString(
              "en-IN",
            )}`}
            readOnly
          />
        </div>
      </div>

      {/* PAYMENTS */}
      <h4 className="mt-3">Payment Requests</h4>

      <div className={styles.paymentsContainer}>
        {paymentRequestsToShow.length === 0 ? (
          <p>No payment requests available</p>
        ) : (
          paymentRequestsToShow.map((pr) => {
            const status = paymentStatuses[pr.paymentRequestId] || "Pending";

            const isApproved = status === "Approved";
            const isRejected = status === "Rejected";

            return (
              <div key={pr.paymentRequestId} className={styles.paymentCard}>
                {/* DETAILS */}
                <div className={styles.paymentDetails}>
                  <div className={styles.paymentDetailRow}>
                    <span className={styles.paymentDetailLabel}>
                      Payment Mode:
                    </span>
                    <span className={styles.paymentDetailValue}>
                      {pr.paymentMode}
                    </span>
                  </div>

                  <div className={styles.paymentDetailRow}>
                    <span className={styles.paymentDetailLabel}>
                      Transaction Ref:
                    </span>
                    <span className={styles.paymentDetailValue}>
                      {pr.transactionReference || "N/A"}
                    </span>
                  </div>

                  <div className={styles.paymentDetailRow}>
                    <span className={styles.paymentDetailLabel}>Amount:</span>
                    <span className={styles.paymentDetailValue}>
                      ₹{Number(pr.amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className={styles.paymentDetailRow}>
                    <span className={styles.paymentDetailLabel}>Date:</span>
                    <span className={styles.paymentDetailValue}>
                      {pr.transactionDate
                        ? new Date(pr.transactionDate).toLocaleDateString(
                            "en-IN",
                          )
                        : "-"}
                    </span>
                  </div>

                  {pr.transactionRemark && (
                    <div className={styles.paymentDetailRow}>
                      <span className={styles.paymentDetailLabel}>Remark:</span>
                      <span className={styles.paymentDetailValue}>
                        {pr.transactionRemark}
                      </span>
                    </div>
                  )}
                </div>

                {/* PROOF 
                <div className={styles.paymentImageSection}>
                  <img
                    src={pr.paymentProof || img}
                    alt="Payment Proof"
                    className={styles.paymentImage}
                    onClick={() => openImageZoomModal(pr.paymentProof || img)}
                  />
                </div>*/}

                {/* STATUS + ACTIONS */}
                <div className={styles.statusRow}>
                  <div
                    className={`${styles.statusBadge} ${
                      isApproved
                        ? styles.statusApproved
                        : isRejected
                          ? styles.statusRejected
                          : styles.statusPending
                    }`}
                  >
                    {status}
                  </div>

                  <div className={styles.actionButtons}>
                    <button
                      disabled={
                        loadingIds.has(pr.paymentRequestId) || isApproved
                      }
                      onClick={() =>
                        handleAction(pr.paymentRequestId, "approve")
                      }
                      className={styles.approveBtn}
                    >
                      Approve
                    </button>

                    <button
                      disabled={
                        loadingIds.has(pr.paymentRequestId) || isRejected
                      }
                      onClick={() =>
                        handleAction(pr.paymentRequestId, "reject")
                      }
                      className={styles.rejectBtn}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ERROR */}
      {error && (
        <ErrorModal
          isOpen={true}
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* IMAGE ZOOM */}
      {isImageZoomModalOpen && (
        <ImageZoomModal
          imageUrl={currentZoomImageUrl}
          onClose={closeImageZoomModal}
        />
      )}

      {/* LOADING */}
      {loadingIds.size > 0 && <Loading />}
    </>
  );
}

export default ApprovalModal;
