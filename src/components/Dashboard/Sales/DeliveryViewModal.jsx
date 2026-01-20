import React, { useEffect, useState } from "react";
import styles from "./Sales.module.css";

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import DeliverModal from "./DeliverModal";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";

function DeliveryViewModal({order}) {
  const [orderdata, setOrderdata] = useState();
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
        const res = await axiosAPI.get(`/sales-orders/order/${order.id}`);
        // console.log(res);
        setOrderdata(res.data);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
        // setIsModalOpen(true)
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);
  return (
    <>
      {!orderdata && !loading &&  <span className="text-denger">{error}</span>}
      {orderdata && (
        <DialogRoot placement={"center"} size={"lg"} className={styles.mdl}>
          <DialogTrigger asChild>
            <button>view</button>
          </DialogTrigger>
          <DialogContent className="mdl">
            <DialogBody>
              <DeliverModal orderdata={orderdata}/>
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

export default DeliveryViewModal;
