import React from "react";
import styles from "./Payments.module.css";

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import ApprovalModal from "./ApprovalModal";
function ApprovalsViewModal({report, changeTrigger}) {
  return (
    <>
      <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button>view</button>
        </DialogTrigger>
        <DialogContent className="mdl" backdrop={false}>
          <DialogBody>
            <ApprovalModal report={report} changeTrigger={changeTrigger} />
          </DialogBody>

          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default ApprovalsViewModal;
