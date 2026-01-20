import React from "react";
import styles from "./Warehouse.module.css";
import { DialogBody, DialogCloseTrigger, DialogContent, DialogRoot, DialogTrigger } from "@/components/ui/dialog";
import DeleteWarehouseModal from "./DeleteWarehouseModal";

function DeleteWarehouseViewModal() {
  return (
    <>
      {/* <button
        type="button"
        data-bs-toggle="modal"
        data-bs-target="#deletebmcmodal"
        className={styles.homebtn}
      >
        - Delete BMC / CC
      </button>

      <div
        class="modal fade"
        id="deletebmcmodal"
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

              <DeleteBMCModal />
            </div>
          </div>
        </div>
      </div> */}

      <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button className='homebtn'>- Delete</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <DeleteWarehouseModal/>
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default DeleteWarehouseViewModal;
