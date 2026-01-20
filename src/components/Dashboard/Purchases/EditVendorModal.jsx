import React from "react";
import styles from "./Purchases.module.css";
import { DialogActionTrigger } from "@/components/ui/dialog";

function EditVendorModal({supplier}) {
  return (
    <>
      <h3 className={`px-3 pb-3 mdl-title`}>Create Vendor</h3>
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Vendor Code :</label>
          <input type="text" value={supplier.supplierCode} />
        </div>
      </div>{" "}
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Vendor Name :</label>
          <input type="text" value={supplier.name} />
        </div>
      </div>{" "}
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Plot :</label>
          <input type="text" value={supplier.plot} />
        </div>
      </div>
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Street :</label>
          <input type="text" value={supplier.street} />
        </div>
      </div>
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Area :</label>
          <input type="text"  value={supplier.area}/>
        </div>
      </div>
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">City/Village :</label>
          <input type="text" value={supplier.city} />
        </div>
      </div>
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">District :</label>
          <input type="text" value={supplier.district} />
        </div>
      </div>
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">State :</label>
          <input type="text" value={supplier.state} />
        </div>
      </div>
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Pincode :</label>
          <input type="text" value={supplier.pincode} />
        </div>
      </div>
      <div className="row pt-3 mt-3 justify-content-center">
        <div className={`col-5`}>
          <button type="submit" className={`submitbtn`} data-bs-dismiss="modal">
            Edit
          </button>
          <DialogActionTrigger asChild>
            <button
              type="button"
              className={`cancelbtn`}
              data-bs-dismiss="modal"
            >
              Close
            </button>
          </DialogActionTrigger>
        </div>
      </div>
    </>
  );
}

export default EditVendorModal;
