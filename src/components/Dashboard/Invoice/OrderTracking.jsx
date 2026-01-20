import React from "react";
import styles from "./Invoices.module.css";

function OrderTracking({ invoice }) {
  const findTracking = (status, paymentStatus) => {
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
  return (
    <>
      <div className={styles.infoCard}>
        <div className="w-100">
          <h6 className={styles.title}>invoice Tracking</h6>
          <div className={styles.container}>
            <div
              className={`${styles.timeline} ${
                findTracking(
                  invoice.invoiceStatus,
                  invoice.paymentRequest?.status
                ) > 0
                  ? styles.linecomplete
                  : findTracking(
                        invoice.invoiceStatus,
                        invoice.paymentRequest?.status
                      ) === 0
                    ? styles.linecurrent
                    : styles.linepending
              }`}
            >
              <div className={styles.step}>
                <div
                  className={`${styles.circle} ${
                    findTracking(
                      invoice.invoiceStatus,
                      invoice.paymentRequest?.status
                    ) > 0
                      ? styles.completed
                      : findTracking(
                            invoice.invoiceStatus,
                            invoice.paymentRequest?.status
                          ) === 0
                        ? styles.current
                        : styles.pending
                  }`}
                ></div>
                <div className={styles.stepText}>
                  <p
                    className={`${
                      findTracking(
                        invoice.invoiceStatus,
                        invoice.paymentRequest?.status
                      ) > 0
                        ? styles.completedText
                        : findTracking(
                              invoice.invoiceStatus,
                              invoice.paymentRequest?.status
                            ) === 0
                          ? styles.currentText
                          : styles.pendingText
                    }`}
                  >
                    {findTracking(
                      invoice.invoiceStatus,
                      invoice.paymentRequest?.status
                    ) > 0
                      ? "Payment Details Subbmitted"
                      : "Awaiting For Payment Details"}
                  </p>
                  {/* {invoice.invoiceStatus && (
                            <p className={styles.date}>{invoice.invoiceStatus}</p>
                          )} */}
                </div>
              </div>
            </div>
            {/* 2 */}
            <div
              className={`${styles.timeline} ${
                findTracking(
                  invoice.invoiceStatus,
                  invoice.paymentRequest?.status
                ) > 1
                  ? styles.linecomplete
                  : findTracking(
                        invoice.invoiceStatus,
                        invoice.paymentRequest?.status
                      ) === 1
                    ? styles.linecurrent
                    : styles.linepending
              }`}
            >
              <div className={styles.step}>
                <div
                  className={`${styles.circle} ${
                    findTracking(
                      invoice.invoiceStatus,
                      invoice.paymentRequest?.status
                    ) > 1
                      ? styles.completed
                      : findTracking(
                            invoice.invoiceStatus,
                            invoice.paymentRequest?.status
                          ) === 1
                        ? styles.current
                        : styles.pending
                  }`}
                ></div>
                <div className={styles.stepText}>
                  <p
                    className={`${
                      findTracking(
                        invoice.invoiceStatus,
                        invoice.paymentRequest?.status
                      ) > 1
                        ? styles.completedText
                        : findTracking(
                              invoice.invoiceStatus,
                              invoice.paymentRequest?.status
                            ) === 1
                          ? styles.currentText
                          : styles.pendingText
                    }`}
                  >
                    {findTracking(
                      invoice.invoiceStatus,
                      invoice.paymentRequest?.status
                    ) > 1
                      ? "Payment Processed"
                      : "Awaiting Payment Processing"}
                  </p>
                  {/* {invoice.invoiceStatus && (
                            <p className={styles.date}>{invoice.invoiceStatus}</p>
                          )} */}
                </div>
              </div>
            </div>
            {/* 3 */}
            <div
              className={`${styles.timeline} ${
                findTracking(
                  invoice.invoiceStatus,
                  invoice.paymentRequest?.status
                ) > 2
                  ? styles.linecomplete
                  : findTracking(
                        invoice.invoiceStatus,
                        invoice.paymentRequest?.status
                      ) === 2
                    ? styles.linecurrent
                    : styles.linepending
              }`}
            >
              <div className={styles.step}>
                <div
                  className={`${styles.circle} ${
                    findTracking(
                      invoice.invoiceStatus,
                      invoice.paymentRequest?.status
                    ) > 2
                      ? styles.completed
                      : findTracking(
                            invoice.invoiceStatus,
                            invoice.paymentRequest?.status
                          ) === 2
                        ? styles.current
                        : styles.pending
                  }`}
                ></div>
                <div className={styles.stepText}>
                  <p
                    className={`${
                      findTracking(
                        invoice.invoiceStatus,
                        invoice.paymentRequest?.status
                      ) > 2
                        ? styles.completedText
                        : findTracking(
                              invoice.invoiceStatus,
                              invoice.paymentRequest?.status
                            ) === 2
                          ? styles.currentText
                          : styles.pendingText
                    }`}
                  >
                    {findTracking(
                      invoice.invoiceStatus,
                      invoice.paymentRequest?.status
                    ) > 2
                      ? "Payment Approved"
                      : "Awaiting Payment Approval"}
                  </p>
                  {findTracking(
                    invoice.invoiceStatus,
                    invoice.paymentRequest?.status
                  ) > 2 &&
                    invoice.paymentRequest?.updatedAt && (
                      <p className={styles.date}>
                        {formatToIST(invoice.paymentRequest?.updatedAt)}
                      </p>
                    )}
                </div>
              </div>
            </div>
            {/* 4 */}
            <div
              className={`${styles.timeline} ${
                findTracking(
                  invoice.invoiceStatus,
                  invoice.paymentRequest?.status
                ) > 3
                  ? styles.linecomplete
                  : findTracking(
                        invoice.invoiceStatus,
                        invoice.paymentRequest?.status
                      ) === 3
                    ? styles.linecurrent
                    : styles.linepending
              }`}
            >
              <div className={styles.step}>
                <div
                  className={`${styles.circle} ${
                    findTracking(
                      invoice.invoiceStatus,
                      invoice.paymentRequest?.status
                    ) > 3
                      ? styles.completed
                      : findTracking(
                            invoice.invoiceStatus,
                            invoice.paymentRequest?.status
                          ) === 3
                        ? styles.current
                        : styles.pending
                  }`}
                ></div>
                <div className={styles.stepText}>
                  <p
                    className={`${
                      findTracking(
                        invoice.invoiceStatus,
                        invoice.paymentRequest?.status
                      ) > 3
                        ? styles.completedText
                        : findTracking(
                              invoice.invoiceStatus,
                              invoice.paymentRequest?.status
                            ) === 3
                          ? styles.currentText
                          : styles.pendingText
                    }`}
                  >
                    {findTracking(
                      invoice.invoiceStatus,
                      invoice.paymentRequest?.status
                    ) > 3
                      ? "invoice Confirmed"
                      : "Awaiting invoice Confirmation"}
                  </p>
                  {findTracking(
                    invoice.invoiceStatus,
                    invoice.paymentRequest?.status
                  ) > 3 &&
                    invoice.updatedAt && (
                      <p className={styles.date}>
                        {formatToIST(invoice?.updatedAt)}
                      </p>
                    )}
                </div>
              </div>
            </div>
            {/* 5 */}
            <div
              className={`${`${styles.timeline} ${
                findTracking(
                  invoice.invoiceStatus,
                  invoice.paymentRequest?.status
                ) > 4
                  ? styles.linecomplete
                  : findTracking(
                        invoice.invoiceStatus,
                        invoice.paymentRequest?.status
                      ) === 4
                    ? styles.linecurrent
                    : styles.linepending
              }`} ${
                findTracking(
                  invoice.invoiceStatus,
                  invoice.paymentRequest?.status
                ) > 4
                  ? styles.linecomplete
                  : findTracking(
                        invoice.invoiceStatus,
                        invoice.paymentRequest?.status
                      ) === 4
                    ? styles.linecurrent
                    : styles.linepending
              }`}
            >
              <div className={styles.step}>
                <div
                  className={`${styles.circle} ${
                    findTracking(
                      invoice.invoiceStatus,
                      invoice.paymentRequest?.status
                    ) > 4
                      ? styles.completed
                      : findTracking(
                            invoice.invoiceStatus,
                            invoice.paymentRequest?.status
                          ) === 4
                        ? styles.current
                        : styles.pending
                  }`}
                ></div>
                <div className={styles.stepText}>
                  <p
                    className={`${
                      findTracking(
                        invoice.invoiceStatus,
                        invoice.paymentRequest?.status
                      ) > 4
                        ? styles.completedText
                        : findTracking(
                              invoice.invoiceStatus,
                              invoice.paymentRequest?.status
                            ) === 4
                          ? styles.currentText
                          : styles.pendingText
                    }`}
                  >
                    {findTracking(
                      invoice.invoiceStatus,
                      invoice.paymentRequest?.status
                    ) > 4
                      ? "invoice Dispatched"
                      : "Awaiting invoice Dispatch"}
                  </p>
                  {invoice.dispatchDate && (
                    <p className={styles.date}>
                      {formatToIST(invoice.dispatchDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* 6 */}
            <div
              className={`${styles.timelinelast} ${
                findTracking(
                  invoice.invoiceStatus,
                  invoice.paymentRequest?.status
                ) > 5
                  ? styles.linecomplete
                  : findTracking(
                        invoice.invoiceStatus,
                        invoice.paymentRequest?.status
                      ) === 5
                    ? styles.linecurrent
                    : styles.linepending
              }`}
            >
              <div className={styles.step}>
                <div
                  className={`${styles.circle} ${
                    findTracking(
                      invoice.invoiceStatus,
                      invoice.paymentRequest?.status
                    ) > 5
                      ? styles.completed
                      : findTracking(
                            invoice.invoiceStatus,
                            invoice.paymentRequest?.status
                          ) === 5
                        ? styles.current
                        : styles.pending
                  }`}
                ></div>
                <div className={styles.stepText}>
                  <p
                    className={`${
                      findTracking(
                        invoice.invoiceStatus,
                        invoice.paymentRequest?.status
                      ) > 5
                        ? styles.completedText
                        : findTracking(
                              invoice.invoiceStatus,
                              invoice.paymentRequest?.status
                            ) === 5
                          ? styles.currentText
                          : styles.pendingText
                    }`}
                  >
                    {findTracking(
                      invoice.invoiceStatus,
                      invoice.paymentRequest?.status
                    ) > 5
                      ? "invoice Delivered"
                      : "Awaiting invoice to Deliver"}
                  </p>
                  {invoice.deliveredDate && (
                    <p className={styles.date}>
                      {formatToIST(invoice.deliveredDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/*  */}
          </div>
        </div>
      </div>
    </>
  );
}

export default OrderTracking;
