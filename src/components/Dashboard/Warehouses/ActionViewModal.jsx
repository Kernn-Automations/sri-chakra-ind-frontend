import React from "react";
import styles from "./Warehouse.module.css";
import ActionModal from "./ActionModal";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";

function ActionViewModal({warehouse, managers, changeTrigger}) {
  return (
    <>
      {/* <button
        type="button"
        data-bs-toggle="modal"
        data-bs-target={`#${centre.centre_name}`}
        className={styles.action}
      >
        Action
      </button>

      <div
        class="modal fade"
        id={centre.centre_name}
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

              <ActionModal centre={centre} />
            </div>
          </div>
        </div>
      </div> */}
      <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button className={styles.action}> Action</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <ActionModal warehouse={warehouse} managers={managers} changeTrigger={changeTrigger}/>
          </DialogBody>

          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default ActionViewModal;
