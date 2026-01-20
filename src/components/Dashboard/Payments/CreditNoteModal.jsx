import React, { useEffect, useState } from "react";
import styles from "./Payments.module.css";
import { useAuth } from "@/Auth";
import PDFPreviewModal from "@/utils/PDFPreviewModal";

function CreditNoteModal({ credit }) {
  console.log(credit.invoiceProofSignedUrl);
  return (
    <>
      <h3 className={`px-3 mdl-title`}>Credit Note</h3>
      <div className={styles.creditDetails}>
        <p>
          <span>Credit Note Number :</span>
          {credit.creditNoteNumber}
        </p>
        <p>
          <span>Credit Amount :</span>&#8377;{credit.creditAmount}
        </p>
      </div>

      <div className="row m-0 p-0">
        <h6 className={styles.headmdl}>Customer Details</h6>
        <div className={`col-4 ${styles.longformmdl} `}>
          <label htmlFor="">Discount Type :</label>
          <select name="" id="" value={credit.discountType}>
            <option value="null">--select--</option>
            <option value="bill_to_bill">Bill to Bill</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className={`col-4 ${styles.longformmdl} `}>
          <label htmlFor="">Status :</label>
          <input type="text" value={credit.status} />
        </div>
        <div className={`col-4 ${styles.longformmdl} `}>
          <label htmlFor="">Customer ID :</label>
          <input type="text" value={credit.customer?.customer_id} />
        </div>
        <div className={`col-4 ${styles.longformmdl} `}>
          <label htmlFor="">Customer Name :</label>
          <input type="text" value={credit.customer?.name} />
        </div>

        <div className={`col-4 ${styles.longformmdl} `}>
          <label htmlFor="">Customer Mobile :</label>
          <input type="text" value={credit.customer?.mobile} />
        </div>
        <div className={`col-4 ${styles.longformmdl} `}>
          <label htmlFor="">Firm Name :</label>
          <input type="text" value={credit.customer?.firmName} />
        </div>
        <div className={`col-4 ${styles.longformmdl} `}>
          <label htmlFor="">Sales Executive :</label>
          <input type="text" value={credit.customer?.salesExecutive?.name} />
        </div>
        {credit.customer?.warehouse && (
          <div className={`col-4 ${styles.longformmdl} `}>
            <label htmlFor="">Warehouse Name :</label>
            <input type="text" value={credit.customer?.warehouse?.name} />
          </div>
        )}
      </div>

      {credit.salesOrder && (
        <>
          <div className="row m-0 p-0">
            <h6 className={styles.headmdl}>Sales Order</h6>
            <div className={`col-4 ${styles.longformmdl} `}>
              <label htmlFor="">Order Number :</label>
              <input type="text" value={credit.salesOrder.orderNumber} />
            </div>
            <div className={`col-4 ${styles.longformmdl} `}>
              <label htmlFor="">Order Status :</label>
              <input type="text" value={credit.salesOrder.orderStatus} />
            </div>
            <div className={`col-4 ${styles.longformmdl} `}>
              <label htmlFor="">Total Amount :</label>
              <input type="text" value={credit.salesOrder.totalAmount} />
            </div>
          </div>
        </>
      )}

      <div className="row m-0 p-0">
        <h6 className={styles.headmdl}>Sign Image</h6>
        {!credit.invoiceProofSignedUrl && (
          <>
            <div className="px-3">NO IMAGE FOUND</div>
          </>
        )}
        {credit.invoiceProofSignedUrl && (
          <>
            <div className="px-3">
              <img src={credit.invoiceProofSignedUrl} alt="" />
            </div>
          </>
        )}
      </div>

      <div className="row p-3 m-0 justify-content-center">
        <div className="col-5">
          {/* <button className="submitbtn">Generate</button> */}
          <PDFPreviewModal
            triggerText="Preview PDF"
            pdfUrl={`/credit-notes/${credit.creditNoteId}/pdf`}
            filename={`${credit.creditNoteNumber}.pdf`}
          />
          <button className="cancelbtn">Cancel</button>
        </div>
      </div>
    </>
  );
}

export default CreditNoteModal;
