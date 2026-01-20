import React from "react";
import styles from "./Customer.module.css";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import img from "./../../../images/dummy-img.jpeg";

function ImagesViewModal({ title, front, back }) {
  return (
    <>
      <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogTrigger asChild>
          
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <div className="row m-0 p-3 justify-content-around">
              <h3 className={`px-3 mdl-title`}>{title} Images</h3>
              <div className={`col-5`}>
                <img
                  src={front || img}
                  alt={`${title}-front`}
                  className={styles.imagesmdl}
                />
                <span>{title} Front</span>
              </div>
              {back && (
                <div className={`col-5`}>
                  <img
                    src={back || img}
                    alt={`${title}-back`}
                    className={styles.imagesmdl}
                  />
                  <span>{title} Back</span>
                </div>
              )}
            </div>
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default ImagesViewModal;
