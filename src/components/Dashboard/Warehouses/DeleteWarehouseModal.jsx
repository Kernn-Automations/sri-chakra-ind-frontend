import styles from "./Warehouse.module.css";
import React, { useEffect, useState } from "react";
import { DialogActionTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import SuccessModal from "@/components/SuccessModal";

function DeleteWarehouseModal() {
  const onSubmit = (e) => e.preventDefault();

  const [warehouses, setWarehouses] = useState();

  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [issuccessModalOpen, setIssuccessModalOpen] = useState(false);
  const closesuccessModal = () => {
    setIssuccessModalOpen(false);
  };

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        
        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        const currentDivisionName = localStorage.getItem('currentDivisionName');
        
        // ✅ Add division parameters to endpoint
        let endpoint = "/warehouses";
        if (currentDivisionId && currentDivisionId !== '1') {
          endpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === '1') {
          endpoint += `?showAllDivisions=true`;
        }
        
        console.log('DeleteWarehouseModal - Fetching warehouses with endpoint:', endpoint);
        console.log('DeleteWarehouseModal - Division ID:', currentDivisionId);
        console.log('DeleteWarehouseModal - Division Name:', currentDivisionName);
        
        const res = await axiosAPI.get(endpoint);
        // console.log(res);
        setWarehouses(res.data.warehouses);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const [warehouse, setWarehouse] = useState();

  const onDelete = () => {
    if (!warehouse) {
      setError("Please select one Warehouse");
      setIsModalOpen(true);
      return;
    }

    async function del() {
      try {
        setLoading(true);
        const res = await axiosAPI.delete(`/warehouses/delete/${warehouse}`);
        // console.log(res);
        setError(res.data.message);
        setIssuccessModalOpen(true)
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
      <h3 className={`px-3 pb-3 mdl-title`}>Delete Warehouse</h3>
      <form action="" onSubmit={onSubmit}>
        <div className="row pt-3 justify-content-center">
          <div className={`col inputcolumn-mdl`}>
            {warehouses && (
              <select
                name=""
                id=""
                className={styles.delsec}
                onChange={(e) =>
                  setWarehouse(
                    e.target.value === "null" ? null : e.target.value
                  )
                }
              >
                <option value="null">--Select Warehouse--</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
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
        {!loading && (
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
      </form>

      {loading && (
        <Loading/>
      )}
      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
      {issuccessModalOpen && (
        <SuccessModal
          isOpen={issuccessModalOpen}
          message={error}
          onClose={closesuccessModal}
        />
      )}
    </>
  );
}

export default DeleteWarehouseModal;
