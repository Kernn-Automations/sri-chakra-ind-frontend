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

function OngoingDropoffModal({ rule, trigger, setTrigger }) {
  const [editclick, setEditclick] = useState(false);

  const onEditClick = () => setEditclick(!editclick);

  const [minQuantity, setMinQuantity] = useState(rule.minQuantity);
  const [maxQuantity, setMaxQuantity] = useState(rule.maxQuantity);
  const [maxDropOffPoints, setMaxDropOffPoints] = useState(
    rule.maxDropOffPoints
  );

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
    if (!name) newErrors.minQuantity = true;
    if (!maxQuantity) newErrors.maxQuantity = true;
    if (!maxDropOffPoints) newErrors.maxDropOffPoints = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // form subbmission

  const { axiosAPI } = useAuth();

  const onSubmitClick = () => {
    // console.log(name, maxQuantity, maxDropOffPoints);

    //  if (!validateFields()) {
    //    setError("Please Fill all feilds");
    //    setIsModalOpen(true);
    //    return;
    //  }
    async function create() {
      try {
        setLoading(true);
        const res = await axiosAPI.put(`/drops/rules/${rule.id}`, {
          minQuantity,
          maxQuantity: maxQuantity,
          maxDropOffPoints: maxDropOffPoints,
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
                <label htmlFor="">maximum Quantity :</label>
                <input
                  type="number"
                  value={maxQuantity}
                  onChange={(e) => setMaxQuantity(e.target.value)}
                  disabled={!editclick}
                />
              </div>
            </div>
            <div className="row justify-content-center">
              <div className={`col-4  inputcolumn-mdl`}>
                <label htmlFor="">max Drop-off Points :</label>
                <select
                  name=""
                  id=""
                  value={maxDropOffPoints}
                  onChange={(e) => setMaxDropOffPoints(e.target.value)}
                  disabled={!editclick}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
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

export default OngoingDropoffModal;
