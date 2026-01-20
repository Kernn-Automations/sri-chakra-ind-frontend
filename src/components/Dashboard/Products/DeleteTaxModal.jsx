import React, { useEffect, useState } from "react";
import styles from "./Products.module.css";
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

function DeleteTaxModal({trigger, setTrigger, taxes}) {
  const onSubmit = (e) => e.preventDefault();

  

  const { axiosAPI } = useAuth();

  
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successfull, setSuccessfull] = useState(null);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [tax, setTax] = useState();

  const onDelete = () => {
    if (!tax) {
      setError("Please select one Tax");
      setIsModalOpen(true);
      return;
    }

    async function del() {
      try {
        setLoading(true);
        const res = await axiosAPI.delete(`/tax/${tax}`);
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
                  {taxes && (
                    <select
                      name=""
                      id=""
                      className={styles.delsec}
                      onChange={(e) =>
                        setTax(
                          e.target.value === "null" ? null : e.target.value
                        )
                      }
                    >
                      <option value="null">--Select tax--</option>
                      {taxes.map((tax) => (
                        <option key={tax.id} value={tax.id}>
                         {tax.name}
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

export default DeleteTaxModal;
