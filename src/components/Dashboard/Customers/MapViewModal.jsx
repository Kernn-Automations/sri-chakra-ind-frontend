import React from "react";
import styles from "./Customer.module.css";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import GoogleMapLocator from "./GoogleMapLocator";

function MapViewModal({ setLocation, defaultLocation, setDefaultLocation, onClose }) {
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

      <DialogRoot placement={"center"} size={"xl"} className={styles.mdl} open={true}>
        <DialogTrigger asChild>
          <button className={styles.locate}>LOCATE</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <h3 className={`px-3 mdl-title`}>Locate on Map</h3>
            <div className="row justify-content-center">
              <div className="col-11 pb-3">
                <GoogleMapLocator
                  setLocation={setLocation}
                  defaultLocation={defaultLocation}
                  setDefaultLocation={setDefaultLocation}
                  onClose={onClose}
                />
              </div>
            </div>
          </DialogBody>

          <DialogCloseTrigger className="inputcolumn-mdl-close" asChild><span onClick={() => onClose()}><i class="bi bi-x"></i></span></DialogCloseTrigger>
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default MapViewModal;
