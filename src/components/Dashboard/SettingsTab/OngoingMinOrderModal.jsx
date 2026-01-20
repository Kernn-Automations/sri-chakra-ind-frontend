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
  const [productId, setProductId] = useState(rule.productId);
  const [ruleType, setRuleType] = useState(rule.ruleType);
  const [unit, setUnit] = useState(rule.unit);

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
    if (!minQuantity) newErrors.minQuantity = true;
    if (!productId) newErrors.productId = true;
    if (!unit) newErrors.unit = true;
    if (!ruleType) newErrors.ruleType = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // form subbmission

  const { axiosAPI } = useAuth();

  const onSubmitClick = () => {
    // console.log(name, productId, unit);

    //  if (!validateFields()) {
    //    setError("Please Fill all feilds");
    //    setIsModalOpen(true);
    //    return;
    //  }
    async function create() {
      try {
        setLoading(true);
        const res = await axiosAPI.put(`/moq/rules/${rule.id}`, {
          minQuantity,
          productId: productId,
          ruleType,
          unit: unit,
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
                <input
                  type="date"
                  value={rule.createdAt.slice(0, 10)}
                  disabled={!editclick}
                />
              </div>
            </div>{" "}
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">Rule Type :</label>
                <select
                  name=""
                  id=""
                  value={ruleType}
                  required
                  onChange={(e) => setRuleType(e.target.value)}
                  disabled={!editclick}
                >
                  <option value="null">--select--</option>
                  <option value="product">Product</option>
                  <option value="cart">Cart</option>
                </select>
              </div>
            </div>{" "}
            {ruleType === "product" && (
              <div className="row justify-content-center">
                <div className={`col-4  inputcolumn-mdl`}>
                  <label htmlFor="">Product Id :</label>
                  <input
                    type="number"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    disabled={!editclick}
                  />
                </div>
              </div>
            )}
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">Minimum Qunatity :</label>
                <input
                  type="text"
                  value={minQuantity}
                  required
                  onChange={(e) => setMinQuantity(e.target.value)}
                  disabled={!editclick}
                />
              </div>
            </div>{" "}
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">Unit :</label>
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
