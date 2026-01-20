import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import React from "react";
import styles from "./Products.module.css";
import PricingAddModal from "./PricingAddModal";

function PricingAddViewModal({trigger, setTrigger}) {
  return (
    <>
      <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button className="homebtn">+ Add</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <PricingAddModal trigger={trigger} setTrigger={setTrigger} />
          </DialogBody>

          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default PricingAddViewModal;
