import React from "react";
import LocationModal from "./LocationModal";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";

function LocationViewModal() {
  return (
    <>
      

      <DialogRoot placement={"center"} size={"xl"}>
        <DialogTrigger asChild>
          <button>View</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <LocationModal />
          </DialogBody>

          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default LocationViewModal;
