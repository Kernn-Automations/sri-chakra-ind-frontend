import React from "react";
import styles from "./Payments.module.css";

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
} from "@/components/ui/dialog";
import ReportsModal from "./ReportsModal";

function ReportsViewModal({ report, isOpen, onClose }) {
  console.log("ReportsViewModal received report:", report);
  return (
    <>
      <DialogRoot open={isOpen} onOpenChange={onClose} placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogContent backdrop={false} className={styles.dialogContent}>
          <DialogBody>
            <ReportsModal report={report} />
          </DialogBody>

          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default ReportsViewModal;
