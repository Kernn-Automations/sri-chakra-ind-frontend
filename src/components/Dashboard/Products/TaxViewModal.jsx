import React from "react";
import styles from "./Products.module.css";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import PricingModal from "./PricingModal";
import TaxModal from "./TaxModal";

function TaxViewModal({ tax, trigger, setTrigger }) {
  return (
    <>
      <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button>view</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <TaxModal tax={tax} trigger={trigger} setTrigger={setTrigger}  />
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default TaxViewModal;
