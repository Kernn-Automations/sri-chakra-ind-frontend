import React, { useState } from "react";
import styles from "./Products.module.css";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";
import { DialogActionTrigger } from "@/components/ui/dialog";

function PricingModal({ trigger, setTrigger, price }) {
  const [editclick, setEditclick] = useState(false);

  const onEditClick = () => setEditclick(!editclick);

  const [name, setName] = useState(price.name);
  const [type, setType] = useState(price.type);
  const [adjustmentType, setAdjustmentType] = useState(price.adjustmentType);
  const [adjustmentValue, setAdjustmentValue] = useState(price.adjustmentValue);

  const [successfull, setSuccessfull] = useState(null);

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [errors, setErrors] = useState({});

  const today = new Date(Date.now()).toISOString().slice(0, 10);

  const validateFields = () => {
    const newErrors = {};
    if (!name) newErrors.name = true;
    if (!type) newErrors.type = true;
    if (!adjustmentType) newErrors.adjustmentType = true;
    if (!adjustmentValue) newErrors.adjustmentValue = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // form subbmission

  const { axiosAPI } = useAuth();

  const onSubmitClick = () => {
    // console.log(name, type, adjustmentType);

    //  if (!validateFields()) {
    //    setError("Please Fill all feilds");
    //    setIsModalOpen(true);
    //    return;
    //  }
    async function create() {
      try {
        setLoading(true);
        const res = await axiosAPI.put(`/pricing/lists/update/${price.id}`, {
          name: name,
          type: type,
          adjustmentType: adjustmentType,
          adjustmentValue
        });

        // console.log(res);
        setTrigger(!trigger);
        setSuccessfull(res.data.message);
      } catch (e) {
        console.log(e);
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
      <h3 className={`px-3 pb-3 mdl-title`}>Pricing</h3>
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Date :</label>
          <input type="date" value={price.createdAt.slice(0, 10)} />
        </div>
      </div>{" "}
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Pricing Name :</label>
          <input type="text" value={name} required onChange={(e) => setName(e.target.value)} disabled={!editclick} />
        </div>
      </div>{" "}
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Pricing Type :</label>
          <select name="" id="" value={type} required onChange={(e) => setType(e.target.value)} disabled={!editclick}>
            <option value="null">--select--</option>
            <option value="Sales">Sales</option>
            <option value="Purchase">Purchase</option>
          </select>
        </div>
      </div>
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Adjustment Type :</label>
          <select name="" id="" value={adjustmentType} required onChange={(e) => setAdjustmentType(e.target.value)} disabled={!editclick}>
            <option value="null">--select--</option>
            <option value="Fixed">Fixed</option>
            <option value="Percentage">Percentage</option>
          </select>
        </div>
      </div>
      <div className="row justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Adjustment Value :</label>
          <input type="text" value={adjustmentValue} required onChange={(e) => setAdjustmentValue(e.target.value)} disabled={!editclick} />
        </div>
      </div>
      <div className="row pb-4 justify-content-center">
        <div className={`col-4  inputcolumn-mdl`}>
          <label htmlFor="">Currency :</label>
          <input type="text" value={price.currency} required disabled />
        </div>
      </div>

      {!editclick && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-5">
            <button className="submitbtn" onClick={onEditClick}>
              Edit
            </button>
            <DialogActionTrigger asChild>
              <button className="cancelbtn">Close</button>
            </DialogActionTrigger>
          </div>
        </div>
      )}
      {editclick && !loading && !successfull && (
        <div className="row pt-3 mt-3 justify-content-center">
          <div className={`col-5`}>
            <button
              type="submit"
              className={`submitbtn`}
              data-bs-dismiss="modal"
              onClick={onSubmitClick}
            >
              Update
            </button>
            <DialogActionTrigger asChild>
              <button
                type="button"
                className={`cancelbtn`}
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </DialogActionTrigger>
          </div>
        </div>
      )}
      {successfull && (
        <div className="row pt-3 mt-3 justify-content-center">
          <div className={`col-6`}>
            <DialogActionTrigger asChild>
              <button
                type="submit"
                className={`submitbtn`}
                data-bs-dismiss="modal"
              >
                {successfull}
              </button>
            </DialogActionTrigger>
          </div>
        </div>
      )}
      {loading && (
        <div className="row pt-3 mt-3 justify-content-center">
          <div className={`col-5`}>
            <Loading />
          </div>
        </div>
      )}
      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </>
  );
}

export default PricingModal;
