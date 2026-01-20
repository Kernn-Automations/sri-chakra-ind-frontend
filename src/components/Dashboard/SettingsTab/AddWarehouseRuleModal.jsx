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
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { useAuth } from "@/Auth";

function AddWarehouseRuleModal() {
  const [minimumQty, setMinimumQty] = useState();
  const [maxQty, setMaxQty] = useState();
  const [unit, setUnit] = useState();
  const [warehouseOptions, setWarehouseOptions] = useState([]);

  const { axiosAPI } = useAuth();
  // validation
  const [errors, setErrors] = useState({});

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successfull, setSuccessfull] = useState(null);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const validateFields = () => {
    const newErrors = {};
    if (!minimumQty) newErrors.minimumQty = true;
    if (!maxQty) newErrors.maxQty = true;
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
    console.log(minimumQty, maxQty, unit);
    setWarehouseOptions(warehouseOptions);
    console.log(warehouseOptions);

    async function create() {
      try {
        setLoading(true);
        const res = await axiosAPI.post("/warehouse/rules", {
          minQuantity: minimumQty,
          maxQuantity: maxQty,
          unit,
          warehouseOptions,
        });

        console.log(res);
        setSuccessfull(res.data.message);
        setTimeout(() => setSuccessfull(null), 1000);
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
  const allOptions = ["local", "central"];

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
          <button className="homebtn">+ Add</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <h3 className={`px-3 pb-3 mdl-title`}>Create Warehouse</h3>
            {/* <div className="row justify-content-center">
          <div className={`col-4  inputcolumn-mdl`}>
            <label htmlFor="">Warehouse ID :</label>
            <input type="text" />
          </div>
        </div>{" "} */}
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">Date :</label>
                <input type="date" required />
              </div>
            </div>{" "}
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">minimumQty :</label>
                <input
                  type="text"
                  value={minimumQty}
                  onChange={(e) => onError(e, minimumQty, setMinimumQty)}
                  required
                  className={errors.minimumQty ? styles.errorField : ""}
                />
              </div>
            </div>
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">maxQty :</label>
                <input
                  type="text"
                  value={maxQty}
                  onChange={(e) => onError(e, maxQty, setMaxQty)}
                  required
                  className={errors.maxQty ? styles.errorField : ""}
                />
              </div>
            </div>
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">unit :</label>
                <select
                  name=""
                  id=""
                  onChange={(e) => onError(e, unit, setUnit)}
                  required
                  className={errors.unit ? styles.errorField : ""}
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
                  <select onChange={handleSelect} value="">
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
            {/*  */}
            {!loading && !successfull && (
              <div className="row pt-3 mt-3 justify-content-center">
                <div className={`col-5`}>
                  <button
                    type="submit"
                    className={`submitbtn`}
                    data-bs-dismiss="modal"
                    onClick={onSubmitClick}
                  >
                    Create
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
            {loading && (
              <div className="row pt-3 mt-3 justify-content-center">
                <div className={`col-5`}>
                  <Loading />
                </div>
              </div>
            )}
            {successfull && (
              <div className="row pt-3 mt-3 justify-content-center">
                <div className={`col-5`}>
                  <DialogActionTrigger asChild>
                    <button
                      type="button"
                      className={`submitbtn`}
                      data-bs-dismiss="modal"
                    >
                      {successfull}
                    </button>
                  </DialogActionTrigger>
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

export default AddWarehouseRuleModal;
