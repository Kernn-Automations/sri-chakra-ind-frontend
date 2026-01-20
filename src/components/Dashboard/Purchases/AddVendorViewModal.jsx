import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import React from "react";
import AddVendorModal from "./AddVendorModal";
import styles from "./Purchases.module.css"

function AddVendorViewModal({changeTrigger}) {
  return (
    <>
      <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button className="homebtn">+ Add Vendor</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <AddVendorModal  changeTrigger={changeTrigger}/>
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default AddVendorViewModal;
