import React, { useState } from "react";
import styles from "./Stock.module.css";
import ProductsList from "./ProductsList";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";
import axios from "axios";

function TransferDetail({ transfer, setTransfer, navigate }) {
  const [downloadLoading, setDownloadLoading] = useState(false);
  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleDownload = async () => {
    if (!transfer.id) return;

    try {
      setDownloadLoading(true);

      const token = localStorage.getItem("accessToken");
      const VITE_API = import.meta.env.VITE_API_URL;

      const response = await axios.get(
        `${VITE_API}/stock-transfers/${transfer.id}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `StockTransfer_${transfer.transferNumber}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // cleanup
    } catch (err) {
      console.error(err);
      setError("Failed to download PDF.");
      setIsModalOpen(true);
    } finally {
      setDownloadLoading(false);
    }
  };
  let index = 1;
  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/stock-transfer")}>Stock Transfer</span>{" "}
        <i className="bi bi-chevron-right"></i>
        <span onClick={() => setTransfer(null)}>Transfer List</span>{" "}
        <i className="bi bi-chevron-right"></i> transfer Details
      </p>

      <div className={styles.trackingContainer}>
        <h2 className={styles.trackingTitle}>Stock Transfer Details</h2>
        <div className={styles.flexx}>
          <div className={styles.infoCard}>
            <div>
              <h6>Transfer Number : {transfer?.transferNumber}</h6>
              <p>Date : {transfer.createdAt?.slice(0, 10)}</p>
              <p>Transfer Date : {transfer.transferDate?.slice(0, 10)}</p>
              {/* <p>Email : {order.customer.email}</p> */}
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
          </div>
        </div>

        <div className={styles.infoCard}>
          <div className={styles.wseDetails}>
            <h6>From Warehouse</h6>
            <p>
              <span>Name : </span>
              {transfer?.fromWarehouse?.name}
            </p>
            <p>
              <span>Address : </span>
              {transfer.fromWarehouse?.plot}, {transfer.fromWarehouse?.street},{" "}
              {transfer.fromWarehouse?.area}
            </p>
            <p>
              {transfer.fromWarehouse?.city}, {transfer.fromWarehouse?.district}
              , {transfer.fromWarehouse?.state}
            </p>
            <p>{transfer.fromWarehouse?.pincode}</p>
          </div>
          <div className={styles.wseDetails}>
            <h6>To Warehouse</h6>
            <p>
              <span>Name : </span>
              {transfer?.toWarehouse?.name}
            </p>
            <p>
              <span>Address : </span>
              {transfer.toWarehouse?.plot}, {transfer.toWarehouse?.street},{" "}
              {transfer.toWarehouse?.area}
              <p>
                {transfer.toWarehouse?.city}, {transfer.toWarehouse?.district},{" "}
                {transfer.toWarehouse?.state}
              </p>
              <p>{transfer.toWarehouse?.pincode}</p>
            </p>
          </div>
        </div>
        <div className={styles.infoGrid}>
          {/* <h6 className={styles.title}>Transfered Items </h6> */}
          {/* <div className={styles.infoCard}>
            <ProductsList items={transfer.items} />
          </div> */}
          <div className={`row m-0 p-3 justify-content-center ${styles.infoCard}`}>
            <h6 className={styles.title}>Transfered Items </h6>
            <div className="col-lg-11">
              <table className="table table-bordered borderedtable">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.items?.length === 0 && (
                    <tr>
                      <td>NO DATA FOUND</td>
                    </tr>
                  )}
                  {transfer.items?.length > 0 &&
                    transfer.items?.map((item) => (
                      <tr
                        key={item.id}
                        className="animated-row"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td>{index++}</td>
                        <td>{item.product?.name}</td>
                        <td>
                          {item.quantity}{" "}
                          {item.productType === "packed"
                            ? `packs (${item.product?.packageWeight || ""}${
                                item.product?.unit
                              } each)`
                            : `${item.product?.unit}(s)`}
                        </td>
                        <td>{item.quantity * item.product?.purchasePrice}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {loading && <Loading />}
      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </>
  );
}

export default TransferDetail;
