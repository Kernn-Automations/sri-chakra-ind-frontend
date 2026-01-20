import React from "react";
import styles from "./Products.module.css";
import { DialogBody, DialogCloseTrigger, DialogContent, DialogRoot, DialogTrigger } from "@/components/ui/dialog";
import DeleteProductModal from "./DeleteProductModal";


function DeleteProductViewModal() {
  return (
    <>
      <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button className='homebtn'>- Delete</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <DeleteProductModal/>
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default DeleteProductViewModal;
