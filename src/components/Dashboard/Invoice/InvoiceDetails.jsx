import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import React, { useEffect, useState } from "react";
import styles from "./Invoices.module.css";
import OrderTracking from "./OrderTracking";
import DropOffs from "./DropOffs";
import ProductsList from "./ProductsList";
import PaymentInfo from "./PaymentInfo";
import dummy from "../../../images/dummy-img.jpeg";
import PDFPreviewModal from "@/utils/PDFPreviewModal";

function InvoiceDetails({ navigate, invoiceId }) {
  const [invoice, setInvoice] = useState();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);

  const { axiosAPI } = useAuth();

  useEffect(() => {
    async function fetch() {
      console.log("fetching started");
      try {
        setLoading(true);
        const res = await axiosAPI.get(`/invoice/${invoiceId}`);
        setInvoice(res.data.invoice);
        console.log("hello", res);
      } catch (err) {
        setError(err.response?.data?.message);
        setIsModalOpen(true);
        console.log(err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/invoices")}>Invoices</span>{" "}
        <i class="bi bi-chevron-right"></i> Details
      </p>

      {invoice && (
        <div className={styles.trackingContainer}>
          <h2 className={styles.trackingTitle}>Sales Order Details</h2>
          <div className={styles.flexx}>
            <div className={styles.infoCard}>
              <div>
                <img
                  src={invoice.customer?.photo || dummy}
                  alt="Customer"
                  className={styles.customerPhoto}
                />
              </div>
              <div>
                <h6>{invoice.customer?.name}</h6>
                <p>ID : {invoice.customer?.customer_id}</p>
                <p>Mobile : {invoice.customer?.mobile}</p>
                <p>WhatsApp : {invoice.customer?.whatsapp}</p>
                <p>Email : {invoice.customer?.email}</p>
                {/* <p>
                <strong>Address:</strong> {invoice.customer.address}
              </p> */}
              </div>
            </div>

            <div>
              <div className={styles.trackingHeader}>
                <div className={styles.downloadBtn}>
                  <PDFPreviewModal
                    pdfUrl={`/invoice/${invoice.salesOrder?.id}/pdf?type=${invoice.type}`}
                    filename={`${invoice.invoiceNumber}.pdf`}
                    triggerText={<><i className="bi bi-download"></i> Download Invoice </>}
                  />
                </div>

                <div className={styles.downloadBtn}>
                  <PDFPreviewModal
                    pdfUrl={`/sales-orders/dc/${invoice.salesOrder?.id}/pdf`}
                    filename={`DeliveryChallan_SO${invoice.salesOrder?.id}.pdf`}
                    triggerText="Delivery Challan"
                  />
                </div>
              </div>
            </div>
          </div>

          <OrderTracking invoice={invoice} />

          {/* se-s and ws */}
          <div className={styles.infoCard}>
            <div className={styles.wseDetails}>
              <h6>Sales Executive</h6>
              <p>
                <span>Name : </span>
                {invoice.salesOrder?.salesExecutive?.name}
              </p>
              <p>
                <span>Mobile : </span>
                {invoice.salesOrder?.salesExecutive?.mobile}
              </p>
            </div>
            <div className={styles.wseDetails}>
              <h6>Warehouse </h6>
              <p>
                <span>Name : </span>
                {invoice.salesOrder?.warehouse?.name}
              </p>
              <p>
                <span>Address : </span>
                {invoice.salesOrder?.warehouse?.plot},{" "}
                {invoice.salesOrder?.warehouse?.street},{" "}
                {invoice.salesOrder?.warehouse?.area},{" "}
                {invoice.salesOrder?.warehouse?.city},{" "}
                {invoice.salesOrder?.warehouse?.district},{" "}
                {invoice.salesOrder?.warehouse?.state},{" "}
                {invoice.salesOrder?.warehouse?.pincode}
              </p>
            </div>
          </div>

          {/* drop-offs */}
          <div className={styles.infoGrid}>
            <h6 className={styles.title}>Drop-off Points </h6>
            <div className={styles.infoCard}>
              <DropOffs dropoffs={invoice.salesOrder?.dropOffs} />
            </div>
          </div>

          {/* products */}
          <div className={styles.infoGrid}>
            <h6 className={styles.title}>Order Items </h6>
            <div className={styles.infoCard}>
              <ProductsList items={invoice.salesOrder?.items} />
            </div>
          </div>
          {/* payment info */}
          <div className={styles.infoGrid}>
            <h6 className={styles.title}>Payment Details </h6>
            <div className={styles.infoCard}>
              <PaymentInfo info={invoice.salesOrder?.paymentRequest} />
            </div>
          </div>
        </div>
      )}

      {loading && <Loading />}
    </>
  );
}

export default InvoiceDetails;
