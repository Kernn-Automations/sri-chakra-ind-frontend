import React from "react";
import styles from "./HomePage.module.css";
import { useNavigate } from "react-router-dom";

function PaymentApprovals({ orderStatuses }) {
  const navigate = useNavigate();

  return (
    <>
      {orderStatuses && (
        <div className={`col-6 ${styles.bigbox}`}>
          <h4>Order Statuses</h4>
          <div className={styles.kyccontent}>
            <p onClick={() => navigate("/payments/payment-approvals")} style={{ cursor: "pointer" }}>
              <span>Pending Payment Approvals :</span>{" "}
              <span className={styles.num}>
                {orderStatuses.pendingPaymentApprovals}
              </span>
            </p>
            <p onClick={() => navigate("/sales")} style={{ cursor: "pointer" }}>
              <span>Waiting for Delivery :</span>{" "}
              <span className={styles.num}>
                {orderStatuses.waitingForDelivery}
              </span>
            </p>
            <p onClick={() => navigate("/sales")} style={{ cursor: "pointer" }}>
              <span>Waiting for Dispatch :</span>{" "}
              <span className={styles.num}>
                {orderStatuses.waitingForDispatch}
              </span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default PaymentApprovals;
