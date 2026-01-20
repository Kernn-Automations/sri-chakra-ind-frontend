import React from "react";
import styles from "./Warehouse.module.css";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import NewWarehouseModal from "./NewWarehouseModal";

function NewWarehouseViewModal({ managers, products, onSuccess }) {
  return (
    <>
      {/* <button
        type="button"
        data-bs-toggle="modal"
        data-bs-target="#pendingmodal"
        className={styles.homebtn}
      >
        + Add BMC / CC
      </button>

      <div
        class="modal fade"
        id="pendingmodal"
        data-bs-backdrop="static"
        data-bs-keyboard="true"
        tabindex="-1"
        aria-labelledby="staticBackdropLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class={`modal-content ${styles.mdl}`}>
            <div class="modal-body">
            <p className="mdlp">
              <button
                type="button"
                data-bs-dismiss="modal"
                aria-label="Close"
                className="btn-close mdlclose"
              ></button>
              </p>

             <NewBMCModal/>
            </div>
          </div>
        </div>
      </div> */}

      <DialogRoot placement={"center"} size={"xl"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button className="homebtn">+ Add</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <NewWarehouseModal
              managers={managers}
              products={products}
              onSuccess={onSuccess}
            />
          </DialogBody>

          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default NewWarehouseViewModal;
