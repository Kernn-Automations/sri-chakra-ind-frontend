import React from "react";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import styles from "./Payments.module.css";
import CreditNoteModal from "./CreditNoteModal";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { useAuth } from "@/Auth";

function CreditNoteViewModal({ creditNote }) {
  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [credit, setCredit] = useState();

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const res = await axiosAPI.get(
          `/credit-notes/${creditNote.creditNoteId}`
        );
        console.log(res);
        setCredit(res.data);
      } catch (e) {
        console.log(e);
        setError(e.response?.data?.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);
  return (
    <>
      <DialogRoot placement={"center"} size={"xl"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button>view</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            {credit && <CreditNoteModal credit={credit} />}
            {loading && <Loading />}
            {isModalOpen && (
              <p className="text-center" style={{ color: "red", fontSize: "20px" }}>
                {error || "Error While Fetching"}
              </p>
            )}
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export default CreditNoteViewModal;
