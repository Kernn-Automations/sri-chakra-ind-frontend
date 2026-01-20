import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import React, { useState } from "react";
import styles from "./Discount.module.css";
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";

function AddMonthlyDiscountModal({ changeTrigger }) {
  const [productType, setProductType] = useState();
  const [minTurnover, setMinTurnover] = useState();
  const [discountPerUnit, setDiscountPerUnit] = useState();

  const { axiosAPI } = useAuth();
  // validation
  const [errors, setErrors] = useState({});

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successful, setSuccessful] = useState();
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const validateFields = () => {
    const newErrors = {};

    if (!productType) newErrors.productType = true;
    if (!minTurnover) newErrors.minTurnover = true;
    if (!discountPerUnit) newErrors.discountPerUnit = true;

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
    //   productType,
    //   minTurnover,
    //   discountPerUnit,
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
        const res = await axiosAPI.post("/discounts/monthly", {
          productType,
          minTurnover,
          discountPerUnit,
        });

        console.log(res);

        setSuccessful(res.data.message);
        changeTrigger();
        setTimeout(() => {
          setSuccessful(null);
          setDiscountPerUnit('')
          setMinTurnover('');
          setProductType("null")
        }, 1500);
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
      <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button className="homebtn">+ New Discount</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <h3 className={`px-3 pb-3 mdl-title`}>Create Discount</h3>
            <div className="row justify-content-center"></div>{" "}
            <div className="row justify-content-center"></div>{" "}
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">Product Type :</label>
                <select
                  name=""
                  id=""
                  value={productType}
                  onChange={(e) => onError(e, productType, setProductType)}
                  required
                  className={errors.productType ? styles.errorField : ""}
                >
                  <option value="null">--select--</option>
                  <option value="loose">Loose</option>
                  <option value="packed">Packed</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">Min. Turn-Over :</label>
                <input
                  type="text"
                  value={minTurnover}
                  onChange={(e) => onError(e, minTurnover, setMinTurnover)}
                  required
                  className={errors.minTurnover ? styles.errorField : ""}
                />
              </div>
            </div>
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">discount Per Unit :</label>
                <input
                  type="text"
                  value={discountPerUnit}
                  onChange={(e) =>
                    onError(e, discountPerUnit, setDiscountPerUnit)
                  }
                  required
                  className={errors.discountPerUnit ? styles.errorField : ""}
                />
              </div>
            </div>
            {!loading && !successful && (
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
            {successful && (
              <div className="row pt-3 mt-3 justify-content-center">
                <div className={`col-5`}>
                  <DialogActionTrigger asChild>
                    <button
                      type="button"
                      className={`submitbtn`}
                      data-bs-dismiss="modal"
                    >
                      {successful}
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

export default AddMonthlyDiscountModal;
