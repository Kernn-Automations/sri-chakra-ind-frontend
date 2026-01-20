import React, { useEffect, useState } from "react";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import styles from "./Customer.module.css";
import CustomersModal from "./CustomersModal";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { useAuth } from "@/Auth";

function CustomersViewModal({ customer }) {
  const [customerdata, setCustomerdata] = useState();
  const [error, setError] = useState();
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const closeModal = () => {
      setIsModalOpen(false);
    };

  const { axiosAPI } = useAuth();

    async function fetch() {
      try {
        setLoading(true)
        const res = await axiosAPI.get(
          `/customers/${customer.id}`
        );
        console.log(res);
        setCustomerdata(res.data.customer);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
      }finally{
        setLoading(false)
      }
    }

  useEffect(() => {
    fetch();
  },[]);

  return (
    <>
    {!customerdata && <span className="text-denger"></span>}
      {customerdata && <DialogRoot placement={"center"} size={"xl"} className={styles.mdl}>
        <DialogTrigger asChild>
          <button>view</button>
        </DialogTrigger>
        <DialogContent className="mdl">
          <DialogBody>
            <CustomersModal customerdata={customerdata} refetchCustomer={fetch} />
          </DialogBody>
          <DialogCloseTrigger className="inputcolumn-mdl-close" />
        </DialogContent>
      </DialogRoot>}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
      {loading && <span>loading..</span>}
    </>
  );
}

export default CustomersViewModal;
