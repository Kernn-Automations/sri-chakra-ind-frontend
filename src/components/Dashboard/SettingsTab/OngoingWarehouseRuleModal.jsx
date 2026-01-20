import React, { useState } from "react";
import styles from "./Settings.module.css";
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";

function OngoingMinOrderModal({ rule, trigger, setTrigger }) {
  const [editclick, setEditclick] = useState(false);

  const onEditClick = () => setEditclick(!editclick);

  const [minQuantity, setMinQuantity] = useState(rule.minQuantity);
  const [maxQuantity, setMaxQuantity] = useState(rule.maxQuantity);
  const [unit, setUnit] = useState(rule.unit);
  const [warehouseOptions, setWarehouseOptions] = useState(
    rule.warehouseOptions
  );

  const [successfull, setSuccessfull] = useState(null);

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const {axiosAPI} = useAuth();
  const [errors, setErrors] = useState({});

  const today = new Date(Date.now()).toISOString().slice(0, 10);
  const validateFields = () => {
    const newErrors = {};
    if (!minQuantity) newErrors.minQuantity = true;
    if (!maxQuantity) newErrors.maxQuantity = true;
    if (!unit) newErrors.unit = true;

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
    console.log(minQuantity, maxQuantity, unit);
    setWarehouseOptions(warehouseOptions);
    console.log(warehouseOptions);

    async function create() {
      try {
        setLoading(true);
        const res = await axiosAPI.put(`/warehouse/rules/${rule.id}`, {
          minQuantity: minQuantity,
          maxQuantity: maxQuantity,
          unit,
          warehouseOptions,
        });

        console.log(res);
        setSuccessfull(res.data.message);
        setTimeout(() => setSuccessfull(null), 1000);
        setTrigger(!trigger)
        onEditClick();
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

  //   multiple select
  const allOptions = ["local", "central", "state", "district"];

  const [availableOptions, setAvailableOptions] = useState(allOptions);

  const handleSelect = (e) => {
    const value = e.target.value;
    if (value === "") return;

    setWarehouseOptions((prev) => [...prev, value]);
    setAvailableOptions((prev) => prev.filter((opt) => opt !== value));
  };

  const handleRemove = (value) => {
    setWarehouseOptions((prev) => prev.filter((val) => val !== value));
    setAvailableOptions((prev) => [...prev, value]);
  };

  return (
    <>
      <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button>view</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <h3 className={`px-3 pb-3 mdl-title`}>Drop-off Rule</h3>
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">Date :</label>
                <input type="date" required />
              </div>
            </div>{" "}
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">Minimum Quantity :</label>
                <input
                  type="text"
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.minQuantity)}
                  required
                  className={errors.minQuantity ? styles.errorField : ""}
                  disabled={!editclick}
                />
              </div>
            </div>
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">Maximum Quantity :</label>
                <input
                  type="text"
                  value={maxQuantity}
                  onChange={(e) => setMaxQuantity(e.target.value)}
                  required
                  className={errors.maxQuantity ? styles.errorField : ""}
                  disabled={!editclick}
                />
              </div>
            </div>
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">unit :</label>
                <select
                  name=""
                  id=""
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                  className={errors.unit ? styles.errorField : ""}
                  disabled={!editclick}
                >
                  <option value="null">--select--</option>
                  <option value="kg">Kgs</option>
                  <option value="ton">Tons</option>
                  <option value="g">Grams</option>
                </select>
              </div>
            </div>
            {/* multi select */}
            <div
              style={{
                width: "80%",
                margin: "20px auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  justifyContent: "center",
                }}
              >
                {warehouseOptions.map((value) => (
                  <div
                    key={value}
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "#f0f0f0",
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <span>{value}</span>
                    <button
                      disabled={!editclick}
                      onClick={() => handleRemove(value)}
                      style={{
                        marginLeft: "8px",
                        backgroundColor: "transparent",
                        border: "none",
                        color: "red",
                        cursor: "pointer",
                        fontSize: "16px",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="row m-0 p-2 justify-content-center">
                <div className={`col-12  inputcolumn-mdl`}>
                  <label>Warehouse Options :</label>
                  <select
                    onChange={handleSelect}
                    value=""
                    disabled={!editclick}
                  >
                    <option value="">-- Select --</option>
                    {availableOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
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
              <ErrorModal
                isOpen={isModalOpen}
                message={error}
                onClose={closeModal}
              />
            )}
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default OngoingMinOrderModal;
