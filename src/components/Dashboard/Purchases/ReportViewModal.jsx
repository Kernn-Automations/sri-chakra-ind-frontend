import React, { useEffect, useState } from "react";
import styles from "./Purchases.module.css";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import ReportsModal from "./ReportsModal";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";

function ReportViewModal({ order, warehouses , setWarehouses, onStockInSuccess }) {
  const [pdetails, setPdetails] = useState();
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const { axiosAPI } = useAuth();
  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const res = await axiosAPI.get(`/purchases/${order.id}`);
        console.log(res);
        setPdetails(res.data.purchaseOrder);
      } catch (e) {
        console.log(e);
        setError(e.response.data.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);
  return (
    <>
      {!pdetails && !loading && <span className="text-denger">{error}</span>}
      {pdetails && (
        <DialogRoot placement={"center"} size={"xl"} className={styles.mdl}>
          <DialogTrigger asChild>
            <button className={styles}>view</button>
          </DialogTrigger>
          <DialogContent className="mdl">
            <DialogBody>
              <ReportsModal 
                pdetails={pdetails} 
                warehouses={warehouses} 
                setWarehouses={setWarehouses}
                onStockInSuccess={onStockInSuccess}
              />
            </DialogBody>
            <DialogCloseTrigger className="inputcolumn-mdl-close" />
          </DialogContent>
        </DialogRoot>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
      {loading && <span>loading..</span>}
    </>
  );
}

export default ReportViewModal;
