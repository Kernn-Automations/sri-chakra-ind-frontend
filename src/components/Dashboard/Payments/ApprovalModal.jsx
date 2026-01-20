import React, { useState, useEffect } from "react";
import styles from "./Payments.module.css";
import img from "./../../../images/dummy-img.jpeg"; // Assuming this is a local dummy image
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";
import ImageZoomModal from "./ImageZoomModal"; // New component for image zoom

function ApprovalModal({ report, changeTrigger }) {
  const { axiosAPI } = useAuth();

  const [error, setError] = useState(null);
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [isImageZoomModalOpen, setIsImageZoomModalOpen] = useState(false);
  const [currentZoomImageUrl, setCurrentZoomImageUrl] = useState(null);

  useEffect(() => {
    if (report && report.paymentRequests) {
      const map = report.paymentRequests.reduce((acc, pr) => {
        acc[pr.paymentRequestId] = pr.status;
        return acc;
      }, {});
      setPaymentStatuses(map);
    }
  }, [report]);

  // Use actual payment requests from report, fallback to empty array if not available
  const paymentRequestsToShow = report?.paymentRequests || [];

  const handleAction = async (paymentRequestId, action) => {
    setError(null);
    setLoadingIds((prev) => new Set(prev).add(paymentRequestId));
    try {
      // Make API call to approve/reject payment request
      const endpoint = `/payment-requests/${paymentRequestId}/${action}`;
      await axiosAPI.post(endpoint);
      setPaymentStatuses((prev) => ({
        ...prev,
        [paymentRequestId]: action === "approve" ? "Approved" : "Rejected",
      }));
      changeTrigger(); // Notify parent to refresh list as needed
      setLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(paymentRequestId);
        return newSet;
      });
    } catch (e) {
      setError(e.response?.data?.message || "Error updating payment status");
      setLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(paymentRequestId);
        return newSet;
      });
    }
  };

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
      <h3 className={`px-3 mdl-title`}>
        Approvals - Sales Order: {report.orderNumber}
      </h3>

      <div className="row m-0 p-0">
        <div className={`col-6 ${styles.longformmdl}`}>
          <label>Customer Name:</label>
          <input type="text" value={report.customer?.name || "Jagan"} readOnly />
        </div>
        <div className={`col-6 ${styles.longformmdl}`}>
          <label>Warehouse:</label>
          <input type="text" value={report.warehouse?.name} readOnly />
        </div>
        <div className={`col-6 ${styles.longformmdl}`}>
          <label>Sales Executive:</label>
          <input type="text" value={report.salesExecutive?.name} readOnly />
        </div>
      </div>

      <h4>Payment Requests</h4>
      <div className={styles.paymentsContainer}>
        {paymentRequestsToShow.length === 0 ? (
          <p>No payment requests available</p>
        ) : (
          paymentRequestsToShow.map((pr) => (
          <div key={pr.paymentRequestId} className={styles.paymentCard}>
            <div className={styles.paymentDetails}>
              <div className={styles.paymentDetailRow}>
                <span className={styles.paymentDetailLabel}>Payment Mode:</span>
                <span className={styles.paymentDetailValue}>{pr.paymentMode}</span>
              </div>
              <div className={styles.paymentDetailRow}>
                <span className={styles.paymentDetailLabel}>Transaction Ref:</span>
                <span className={styles.paymentDetailValue}>{pr.transactionReference || "N/A"}</span>
              </div>
              <div className={styles.paymentDetailRow}>
                <span className={styles.paymentDetailLabel}>Amount:</span>
                <span className={styles.paymentDetailValue}>{pr.netAmount}</span>
              </div>
            </div>
            
            <div className={styles.paymentImageSection}>
              <img
                src={pr.paymentProof || img}
                alt="Payment Proof"
                className={styles.paymentImage}
                onClick={() => openImageZoomModal(pr.paymentProof || img)}
              />
            </div>
            
            <div className={styles.statusRow}>
              <div className={`${styles.statusBadge} ${
                paymentStatuses[pr.paymentRequestId] === "Approved" 
                  ? styles.statusApproved 
                  : paymentStatuses[pr.paymentRequestId] === "Rejected" 
                  ? styles.statusRejected 
                  : styles.statusPending
              }`}>
                {paymentStatuses[pr.paymentRequestId] || "Pending"}
              </div>
              
              <div className={styles.actionButtons}>
                <button
                  disabled={
                    loadingIds.has(pr.paymentRequestId) ||
                    paymentStatuses[pr.paymentRequestId] === "Approved"
                  }
                  onClick={() => handleAction(pr.paymentRequestId, "approve")}
                  className={styles.approveBtn}
                  title="Approve"
                >
                  Accept
                </button>
                <button
                  disabled={
                    loadingIds.has(pr.paymentRequestId) ||
                    paymentStatuses[pr.paymentRequestId] === "Rejected"
                  }
                  onClick={() => handleAction(pr.paymentRequestId, "reject")}
                  className={styles.rejectBtn}
                  title="Reject"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
          ))
        )}
      </div>

      {error && (
        <ErrorModal
          isOpen={!!error}
          message={error}
          onClose={() => setError(null)}
          // Using global z-index hierarchy for error modal
          // No need for inline z-index as it's handled by global CSS
          className="error-modal-override"
        />
      )}

      {isImageZoomModalOpen && (
        <ImageZoomModal
          imageUrl={currentZoomImageUrl}
          onClose={closeImageZoomModal}
        />
      )}

      {loadingIds.size > 0 && <Loading />}
    </>
  );
}

export default ApprovalModal;