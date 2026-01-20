import React from "react";
import styles from "./Sales.module.css";
import { DialogActionTrigger } from "@/components/ui/dialog";

function DeliverModal({orderdata}) {
 let count = 1;
  return (
    <>
      <h3 className={`px-3 mdl-title`}>Deliveries</h3>
      <div className="row m-0 p-0">
        <div className={`col-4 ${styles.longformmdl}`}>
          <label htmlFor="">Date :</label>
          <input type="date" value={orderdata.createdAt.slice(0,10)} />
        </div>
        <div className={`col-4 ${styles.longformmdl}`}>
          <label htmlFor="">Order ID :</label>
          <input type="text" value={orderdata.orderNumber} />
        </div>
        <div className={`col-4 ${styles.longformmdl}`}>
          <label htmlFor="">Warehouse ID :</label>
          <input type="text" value={orderdata.warehouse.id}/>
        </div>
        <div className={`col-4 ${styles.longformmdl}`}>
          <label htmlFor="">Warehouse Name :</label>
          <input type="text" value={orderdata.warehouse.name} />
        </div>
        <div className={`col-4 ${styles.longformmdl}`}>
          <label htmlFor="">Customer ID :</label>
          <input type="text" value={orderdata.customer.customer_id} />
        </div>
        <div className={`col-4 ${styles.longformmdl}`}>
          <label htmlFor="">Customer Name :</label>
          <input type="text" value={orderdata.customer.name} />
        </div>
        <div className={`col-4 ${styles.longformmdl}`}>
          <label htmlFor="">SE ID :</label>
          <input type="text" value={orderdata.salesExecutive.id}/>
        </div>
        <div className={`col-4 ${styles.longformmdl}`}>
          <label htmlFor="">SE Name :</label>
          <input type="text" value={orderdata.salesExecutive.name} />
        </div>
        <div className={`col-4 ${styles.longformmdl}`}>
          <label htmlFor="">Txn Amount :</label>
          <input type="text" value={orderdata.totalAmount}/>
        </div>
        <div className={`col-4 ${styles.longformmdl}`}>
          <label htmlFor="">Dispatch Date :</label>
          <input type="text" value={orderdata.dispatchDate && orderdata.dispatchDate.slice(0,10) } />
        </div>
        <div className={`col-4 ${styles.longformmdl}`}>
          <label htmlFor="">Payment mode :</label>
          <input type="text" value={"UPI"} />
        </div>
        <div className={`col-4 ${styles.longformmdl}`}>
          <label htmlFor="">Delivery Date :</label>
          <input type="text" value={orderdata.deliveredDate && orderdata.deliveredDate.slice(0,10)}/>
        </div>
      </div>

      <div className="row m-0 p-0 justify-content-center">
        <h5 className={styles.headmdl}>Products</h5>
        <div className="col-10">
          <table
            className={`table table-bordered borderedtable ${styles.mdltable}`}
          >
            <thead>
              <tr>
                <th>S.No</th>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Units</th>
                <th>Quantity</th>
                <th>Net Amount</th>
              </tr>
            </thead>
            <tbody>
              {orderdata.items.length === 0 && <tr>
                <td colSpan={6}>No DATA FOUND</td>
              </tr>}
              {orderdata.items.length > 0 && orderdata.items.map((item) => (
                <tr>
                <td>{count++}</td>
                <td>{item.productId}</td>
                <td>{item.productName}</td>
                <td>{item.unit}</td>
                <td>{item.quantity}</td>
                <td>{item.totalPrice}</td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* <div className="row m-0 p-3 pt-4 justify-content-center">
        <div className={`col-2`}>
          <DialogActionTrigger asChild>
            <button className="cancelbtn">Cancel</button>
          </DialogActionTrigger>
        </div>
      </div> */}
    </>
  );
}

export default DeliverModal;
