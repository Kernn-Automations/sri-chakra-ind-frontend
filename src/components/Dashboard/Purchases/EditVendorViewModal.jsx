import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import React from "react";
import styles from "./Purchases.module.css"
import EditVendorModal from "./EditVendorModal";

function EditVendorViewModal({supplier}) {
  return (
    <>
      <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button className="">view</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <EditVendorModal supplier={supplier} />
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default EditVendorViewModal;
