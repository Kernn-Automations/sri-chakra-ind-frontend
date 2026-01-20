import { DialogActionTrigger } from "@/components/ui/dialog";
import React, { useState } from "react";
import styles from "./Purchases.module.css";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import SuccessModal from "@/components/SuccessModal";

function AddVendorModal({changeTrigger}) {
  const [name, setName] = useState();
  const [plot, setPlot] = useState();
  const [street, setStreet] = useState();
  const [area, setArea] = useState();
  const [city, setCity] = useState();
  const [district, setDistrict] = useState();
  const [state, setState] = useState();
  const [supplierCode, setSupplierCode] = useState();
  const [pincode, setPincode] = useState();

  const { axiosAPI } = useAuth();
  // validation
  const [errors, setErrors] = useState({});

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };


  const [issuccessModalOpen, setIssuccessModalOpen] = useState(false);
  const closesuccessModal = () => {
    setIssuccessModalOpen(false);
  };

  const validateFields = () => {
    const newErrors = {};
    if (!name) newErrors.name = true;
    if (!plot) newErrors.plot = true;
    if (!street) newErrors.street = true;
    if (!area) newErrors.area = true;
    if (!city) newErrors.city = true;
    if (!district) newErrors.district = true;
    if (!state) newErrors.state = true;
    if (!supplierCode) newErrors.supplierCode = true;
    if (!pincode) newErrors.pincode = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  function onError(e, vari, setter) {
    const value = e.target.value === "null" ? null : e.target.value;
    setter(value);
    if (value) {
      setErrors((prev) => ({ ...prev, vari: false }));
    }
  }

  // form subbmission
  const onSubmitClick = () => {
    // console.log(name, location);
    // console.log(
    //   name,
    //   plot,
    //   street,
    //   area,
    //   city,
    //   district,
    //   state,
    //   supplierCode,
    //   pincode
    // );

    if (!validateFields()) {
      setError("Please Fill all feilds");
      setIsModalOpen(true);
      return;
    }
    async function create() {
      try {
        setLoading(true);
        const res = await axiosAPI.post("/suppliers", {
          name: name,
          plot,
          street,
          area,
          city,
          district,
          state,
          supplierCode,
          pincode,
        });

        // console.log(res);

        setError(res.data.message);
        setIssuccessModalOpen(true);
        changeTrigger();
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }

    create();
  };

  return (
    <>
      <h3 className={`px-3 mdl-title`}>Create Vendor</h3>

      {/* Vendor Basic Information */}
      <div className="row m-0 p-0">
        <div className={`col-3 ${styles.longformmdl}`}>
          <label>Vendor Code :</label>
          <input
            type="text"
            value={supplierCode || ""}
            onChange={(e) => onError(e, "supplierCode", setSupplierCode)}
            required
            className={errors.supplierCode ? styles.errorField : ""}
          />
        </div>
        <div className={`col-3 ${styles.longformmdl}`}>
          <label>Vendor Name :</label>
          <input
            type="text"
            value={name || ""}
            onChange={(e) => onError(e, "name", setName)}
            required
            className={errors.name ? styles.errorField : ""}
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="row m-0 p-0">
        <h5 className={styles.headmdl}>Address</h5>
        <div className={`col-3 ${styles.longformmdl}`}>
          <label>Plot :</label>
          <input
            type="text"
            value={plot || ""}
            onChange={(e) => onError(e, "plot", setPlot)}
            required
            className={errors.plot ? styles.errorField : ""}
          />
        </div>
        <div className={`col-3 ${styles.longformmdl}`}>
          <label>Street :</label>
          <input
            type="text"
            value={street || ""}
            onChange={(e) => onError(e, "street", setStreet)}
            required
            className={errors.street ? styles.errorField : ""}
          />
        </div>
        <div className={`col-3 ${styles.longformmdl}`}>
          <label>Area :</label>
          <input
            type="text"
            value={area || ""}
            onChange={(e) => onError(e, "area", setArea)}
            required
            className={errors.area ? styles.errorField : ""}
          />
        </div>
        <div className={`col-3 ${styles.longformmdl}`}>
          <label>Village/City :</label>
          <input
            type="text"
            value={city || ""}
            onChange={(e) => onError(e, "city", setCity)}
            required
            className={errors.city ? styles.errorField : ""}
          />
        </div>
        <div className={`col-3 ${styles.longformmdl}`}>
          <label>District :</label>
          <input
            type="text"
            value={district || ""}
            onChange={(e) => onError(e, "district", setDistrict)}
            required
            className={errors.district ? styles.errorField : ""}
          />
        </div>
        <div className={`col-3 ${styles.longformmdl}`}>
          <label>State :</label>
          <input
            type="text"
            value={state || ""}
            onChange={(e) => onError(e, "state", setState)}
            required
            className={errors.state ? styles.errorField : ""}
          />
        </div>
        <div className={`col-3 ${styles.longformmdl}`}>
          <label>Pincode :</label>
          <input
            type="text"
            value={pincode || ""}
            onChange={(e) => onError(e, "pincode", setPincode)}
            required
            className={errors.pincode ? styles.errorField : ""}
          />
        </div>
      </div>

      {/* Submit/Cancel Buttons */}
      {!loading && (
        <div className="row m-0 p-3 pt-4 justify-content-center">
          <div className="col-6 d-flex justify-content-center gap-3">
            <button
              type="submit"
              className="submitbtn"
              onClick={onSubmitClick}
            >
              Create
            </button>
            <DialogActionTrigger asChild>
              <button type="button" className="cancelbtn">
                Cancel
              </button>
            </DialogActionTrigger>
          </div>
        </div>
      )}
      {loading && (
        <div className="row m-0 p-3 pt-4 justify-content-center">
          <div className="col-6">
            <Loading />
          </div>
        </div>
      )}
      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
      {issuccessModalOpen && (
        <SuccessModal
          isOpen={issuccessModalOpen}
          message={error}
          onClose={() => {
            closesuccessModal();
            // Close the dialog after closing success modal
            const closeButton = document.querySelector("[data-radix-dialog-close]");
            if (closeButton) {
              closeButton.click();
            }
          }}
        />
      )}
    </>
  );
}

export default AddVendorModal;
