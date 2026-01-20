import { DialogActionTrigger } from "@/components/ui/dialog";
import styles from "./Location.module.css";
import React from "react";
import GoogleMapTracker from "./GoogleMapTracker";

function LocationModal() {
  const onSubmit = (e) => e.prventDefault();
  return (
    <>
     <h3 className={`px-3 mdl-title`}>Track</h3>
      <form action="" onSubmit={onSubmit}>
        <div className="row justify-content-center">
          <div className={`col-4 inputcolumn-mdl`}>
            <label htmlFor="">Date :</label>
            <input type="date" />
          </div>
        </div>
        <div className="row pt-3 justify-content-center ">
          <div className={`col-11`}>
            <GoogleMapTracker />
          </div>
        </div>
      </form>
    </>
  );
}

export default LocationModal;
