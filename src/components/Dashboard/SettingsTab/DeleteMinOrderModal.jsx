import React, { useEffect, useState } from "react";
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
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";

function DeleteMinOrderModal() {
  const onSubmit = (e) => e.preventDefault();

  const [rules, setRules] = useState();

  const { axiosAPI } = useAuth();

  const [trigger, setTrigger] = useState(false);
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successfull, setSuccessfull] = useState(null);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const res = await axiosAPI.get("/moq/rules");
        console.log(res);
        setRules(res.data.rules);
      } catch (e) {
        console.log(e);
        setError(e.response.data.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [trigger]);

  const [rule, setRule] = useState();

  const onDelete = () => {
    if (!rule) {
      setError("Please select one Warehouse");
      setIsModalOpen(true);
      return;
    }

    async function del() {
      try {
        setLoading(true);
        const res = await axiosAPI.delete(`/moq/rules/${rule}`);
        // console.log(res);
        setError(res.data.message);
        setTrigger(!trigger);
        setSuccessfull(res.data.message);
        setTimeout(() => setSuccessfull(null), 1000);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    del();
  };
  return (
    <>
      <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button className="homebtn">- Delete</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <h3 className={`px-3 pb-3 mdl-title`}>Delete Warehouse</h3>
            <form action="" onSubmit={onSubmit}>
              <div className="row pt-3 justify-content-center">
                <div className={`col inputcolumn-mdl`}>
                  {rules && (
                    <select
                      name=""
                      id=""
                      className={styles.delsec}
                      onChange={(e) =>
                        setRule(
                          e.target.value === "null" ? null : e.target.value
                        )
                      }
                    >
                      <option value="null">--Select Rule--</option>
                      {rules.map((rule) => (
                        <option key={rule.id} value={rule.id}>
                         {rule.productId} - {rule.minQuantity} - {rule.unit}
                        </option>
                      ))}
                    </select>
                  )}
                  {isModalOpen && (
                    <ErrorModal
                      isOpen={isModalOpen}
                      message={error}
                      onClose={closeModal}
                    />
                  )}
                </div>
              </div>
              {!loading && !successfull && (
                <div className="row pt-3 justify-content-center">
                  <div className={`col-5`}>
                    <button
                      type="button"
                      className={` cancelbtn`}
                      data-bs-dismiss="modal"
                      onClick={onDelete}
                    >
                      Delete
                    </button>

                    <DialogActionTrigger asChild>
                      <button
                        type="button"
                        className={`submitbtn`}
                        data-bs-dismiss="modal"
                      >
                        Close
                      </button>
                    </DialogActionTrigger>
                  </div>
                </div>
              )}
              {successfull && (
                <div className="row pt-3 justify-content-center">
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
            </form>

            {loading && <Loading />}
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

export default DeleteMinOrderModal;
