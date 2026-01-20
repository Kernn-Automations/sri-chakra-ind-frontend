import React from "react";
import styles from "./Warehouse.module.css";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
} from "@/components/ui/dialog";
import { Portal } from "@chakra-ui/react";
import GoogleMapLocator from "./GoogleMapLocator";

function MapViewModal({
  setLocation,
  defaultLocation,
  setDefaultLocation,
  onClose,
}) {
  return (
    <DialogRoot
      placement={"center"}
      size={"xl"}
      open={true}
      trapFocus={false}
      preventScroll={false}
    >
      <Portal>
        {/* Added bg="white" and color="black" to force correct colors */}
        <DialogContent
          className={styles.mdl}
          style={{
            zIndex: 2000,
            backgroundColor: "white", // Fixes black background
            color: "black", // Ensures text is visible
            borderRadius: "8px",
            boxShadow: "0px 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          <DialogBody>
            <h3
              className="px-3 mdl-title"
              style={{ color: "#333", marginBottom: "15px" }}
            >
              Locate on Map
            </h3>
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

          {/* Close trigger with explicit color to ensure it shows against white */}
          <DialogCloseTrigger
            className="inputcolumn-mdl-close"
            style={{ color: "black" }}
            onClick={onClose}
          />
        </DialogContent>
      </Portal>
    </DialogRoot>
  );
}

export default MapViewModal;
