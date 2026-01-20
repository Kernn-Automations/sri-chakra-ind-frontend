import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import React, { useState } from "react";
import styles from "./Discount.module.css";

function EditMonthlyDiscountModal({ discount, changeTrigger, isAdmin }) {
  const [editclick, setEditclick] = useState(false);

  const onEditClick = () => setEditclick(!editclick);

  const [productType, setProductType] = useState(discount.productType);
  const [minTurnover, setMinTurnover] = useState(discount.minTurnover);
  const [discountPerUnit, setDiscountPerUnit] = useState(
    discount.discountPerUnit
  );

  const [successfull, setSuccessfull] = useState(null);

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [errors, setErrors] = useState({});

  const validateFields = () => {
    const newErrors = {};
    if (!name) newErrors.productType = true;
    if (!minTurnover) newErrors.minTurnover = true;
    if (!discountPerUnit) newErrors.discountPerUnit = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // form subbmission

  const { axiosAPI } = useAuth();

  const onSubmitClick = () => {
    // console.log(name, minTurnover, discountPerUnit);

    //  if (!validateFields()) {
    //    setError("Please Fill all feilds");
    //    setIsModalOpen(true);
    //    return;
    //  }
    async function create() {
      try {
        setLoading(true);
        const res = await axiosAPI.put(`/discounts/monthly/${discount.id}`, {
          productType,
          minTurnover: minTurnover,
          discountPerUnit: discountPerUnit,
        });

        // console.log(res);
        changeTrigger();
        setSuccessfull(res.data.message);
        setTimeout(() => {
          setSuccessfull(null);
          onEditClick();
        }, 1000);
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
            <h3 className={`px-3 pb-3 mdl-title`}>Bill-to-Bill discount</h3>
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">Date :</label>
                <input
                  type="date"
                  value={discount.createdAt.slice(0, 10)}
                  disabled={!editclick}
                />
              </div>
            </div>{" "}
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">Product Type :</label>
                <select
                  name=""
                  id=""
                  value={productType}
                  required
                  onChange={(e) => setProductType(e.target.value)}
                  disabled={!editclick}
                >
                  <option value="loose">Loose</option>
                  <option value="packed">Packed</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>{" "}
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">Min. Quantity :</label>
                <input
                  type="number"
                  value={minTurnover}
                  onChange={(e) => setMinTurnover(e.target.value)}
                  disabled={!editclick}
                />
              </div>
            </div>
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">Discount Per Unit :</label>
                <input
                  type="text"
                  value={discountPerUnit}
                  onChange={(e) => setDiscountPerUnit(e.target.value)}
                  disabled={!editclick}
                />
              </div>
            </div>
            {!editclick && (
              <div className="row m-0 p-3 justify-content-center">
                <div className="col-5">
                  {isAdmin && (
                    <button className="submitbtn" onClick={onEditClick}>
                      Edit
                    </button>
                  )}
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

export default EditMonthlyDiscountModal;
