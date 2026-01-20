import React from "react";
import styles from "./Sales.module.css";

function PaymentInfo({ info }) {
  return (
    <>
      {info && (
        <div className={styles.info}>
          <p>
            <span>Payment ID : </span>
            {info.paymentId}
          </p>
          <p>
            <span>Mode : </span>
            {info.paymentMode}
          </p>
          <p>
            <span>Reference : </span>
            {info.transactionReference}
          </p>
          <p>
            <span>Status : </span>
            {info.status}
          </p>
          <div className={styles.image}>
            <img src={info.paymentProof} alt="payment proof" />
          </div>
        </div>
      )}
    </>
  );
}

export default PaymentInfo;
