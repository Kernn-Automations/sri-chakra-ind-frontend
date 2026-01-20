import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import React, { useState } from "react";
import styles from "./Purchases.module.css";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";

function DeleteModal({ supplier, changeTrigger }) {
  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successful, setSuccessful] = useState();
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      const res = await axiosAPI.delete(`/suppliers/${supplier.id}`);
      console.log(res);
      changeTrigger();
      setSuccessful(res.data?.message)
    } catch (e) {
      console.log(e);
      setError(e.response?.data?.message);
      setIsModalOpen(true);

    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogRoot placement={"center"} size={"md"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button className={styles.deletebtn}>
            <i class="bi bi-trash3"></i>
          </button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <h3 className={`px-3 pb-1 mdl-title`}>Delete Vendor</h3>
            <div className="row m-0 p-1 justify-content-center">
              <div className="col-12">
                <p className={styles.deltext}>
                  Are you sure, you want to delete <span>{supplier.name}</span>
                </p>
              </div>
            </div>
            <div className="row m-0 p-3 justify-content-center">
              {!loading && !successful && (
                <div className="col-7">
                  <button className="cancelbtn" onClick={onDelete}>Delete</button>
                  <DialogActionTrigger asChild>
                    <button className="submitbtn">Cancel</button>
                  </DialogActionTrigger>
                </div>
              )}

              {successful && (
                <div className="col-8">
                  <DialogActionTrigger asChild>
                    <button className="submitbtn">{successful}</button>
                  </DialogActionTrigger>
                </div>
              )}

              {loading && <Loading />}
            </div>
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </>
  );
}

export default DeleteModal;
