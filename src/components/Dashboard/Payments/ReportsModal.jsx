import React from 'react';
import styles from "./Payments.module.css";
import img from "./../../../images/dummy-img.jpeg";
import { DialogActionTrigger } from "@/components/ui/dialog";
import ImageZoomModal from "./ImageZoomModal"; // New component for image zoom
import { useState } from 'react';

function ReportsModal({ report }) {
    // The `report` prop now contains a sales order object with a nested array of `paymentRequests`.
    console.log("ReportsModal received report:", report);
    // Handle cases where `report` or `paymentRequests` are not yet available.
    if (!report || !report.paymentRequests || report.paymentRequests.length === 0) {
        return <p className="p-3">No payment data available for this order.</p>;
    }

    const [zoomImageUrl, setZoomImageUrl] = useState(null);

    // Function to open the zoom modal
    const openZoomModal = (url) => {
        setZoomImageUrl(url);
    };

    // Function to close the zoom modal
    const closeZoomModal = () => {
        setZoomImageUrl(null);
    };

    // Since a sales order can have multiple payment requests, we need to iterate over them.
    // The modal will display a summary of the sales order and then a detailed list of its payment requests.

    return (
        <>
            <h3 className={`px-3 mdl-title`}>Payment Reports</h3>
            
            {/* Sales Order Summary Section */}
            <div className="row m-0 p-0">
                <h5 className={styles.headmdl}>Order Details</h5>
                <div className={`col-4 ${styles.longformmdl}`}>
                    <label htmlFor="">Order Number :</label>
                    <input type="text" value={report.orderNumber || ""} readOnly />
                </div>
                <div className={`col-4 ${styles.longformmdl}`}>
                    <label htmlFor="">Customer Name :</label>
                    <input type="text" value={report.customer?.name || ""} readOnly />
                </div>
                <div className={`col-4 ${styles.longformmdl}`}>
                    <label htmlFor="">SE Name :</label>
                    <input type="text" value={report.salesExecutive?.name || ""} readOnly />
                </div>
                <div className={`col-4 ${styles.longformmdl}`}>
                    <label htmlFor="">Warehouse Name :</label>
                    <input type="text" value={report.warehouse?.name || ""} readOnly />
                </div>
                {/* We can calculate the total amount from all payments */}
                <div className={`col-4 ${styles.longformmdl}`}>
                    <label htmlFor="">Total Amount :</label>
                    <input
                        type="text"
                        value={(report.paymentRequests
                            .reduce((sum, pr) => sum + (pr.netAmount || 0), 0)
                            .toFixed(2)) || ""}
                        readOnly
                    />
                </div>
            </div>

            {/* List of Individual Payment Requests */}
            {report.paymentRequests.map((payment, index) => (
                <div key={index}>
                    <h5 className={styles.headmdl}>Payment #{index + 1}</h5>
                    <div className="row m-0 p-0">
                        <div className={`col-4 ${styles.longformmdl}`}>
                            <label htmlFor="">Date :</label>
                            <input type="date" value={payment.transactionDate ? String(payment.transactionDate).slice(0,10) : ""} readOnly />
                        </div>
                        <div className={`col-4 ${styles.longformmdl}`}>
                            <label htmlFor="">Net Amount :</label>
                            <input type="text" value={payment.netAmount ?? ""} readOnly />
                        </div>
                        <div className={`col-4 ${styles.longformmdl}`}>
                            <label htmlFor="">Txn ID :</label>
                            <input type="text" value={payment.transactionReference || ""} readOnly />
                        </div>
                        <div className={`col-4 ${styles.longformmdl}`}>
                            <label htmlFor="">Payment ID :</label>
                            <input type="text" value={payment.paymentId || ""} readOnly />
                        </div>
                        <div className={`col-4 ${styles.longformmdl}`}>
                            <label htmlFor="">Payment Mode :</label>
                            <input type="text" value={payment.paymentMode || ""} readOnly />
                        </div>
                    </div>
                    <div className="row m-0 p-0 pt-3">
                        <h5 className={styles.headmdl}>Photo</h5>
                        <div className="col-3">
                            <img
                                src={payment.paymentProof || img}
                                alt={`Payment Proof ${index + 1}`}
                                className={styles.images}
                                onClick={() => openZoomModal(payment.paymentProof)} // Add this onClick handler
                                style={{ cursor: 'pointer' }} // Add a pointer cursor to indicate it's clickable
                            />
                        </div>
                    </div>
                </div>
            ))}

            {/* Conditionally render the zoom modal */}
            {zoomImageUrl && (
                <ImageZoomModal
                    imageUrl={zoomImageUrl}
                    onClose={closeZoomModal}
                />
            )}
        </>
    );
}

export default ReportsModal;