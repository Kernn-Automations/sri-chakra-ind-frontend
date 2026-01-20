import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import React, { useEffect, useState } from "react";
import styles from "./Discount.module.css";
import EditBilltoBillModal from "./EditBilltoBillModal";
import DeleteBilltoBillModal from "./DeleteBilltoBillModal";
import AddBilltoBillModal from "./AddBilltoBillModal";

function BillToBill({ navigate, isAdmin }) {
  const [discounts, setDiscounts] = useState();

  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [trigger, setTrigger] = useState(false);

  const changeTrigger = () => setTrigger(!trigger);

  useEffect(() => {
    async function fetchMeta() {
      try {
        setLoading(true);
        const res = await axiosAPI.get("/discounts/bill-to-bill");
        console.log(res);
        setDiscounts(res.data);
      } catch (e) {
        setError(e.response?.data?.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetchMeta();
  }, [trigger]);

  let index = 1;

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/discounts")}>Discounts</span>{" "}
        <i className="bi bi-chevron-right"></i> Bill-to-Bill
      </p>

      {isAdmin && (
        <div className="row m-0 p-3 pt-0">
          <div className="col-3">
            <AddBilltoBillModal changeTrigger={changeTrigger} />
          </div>
        </div>
      )}

      {discounts && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-lg-8">
            <table className="table table-bordered borderedtable">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Product Type</th>
                  <th>Min. Quantity</th>
                  <th>Discount per unit</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {discounts.length === 0 && (
                  <tr
                    className="animated-row"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td colSpan={6}>NO DATA FOUND</td>
                  </tr>
                )}
                {discounts.length > 0 &&
                  discounts.map((discount) => (
                    <tr
                      className="animated-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>{index++}</td>
                      <td>{discount.createdAt?.slice(0, 10)}</td>
                      <td>{discount.productType}</td>
                      <td>{discount.minQuantity}</td>
                      <td>{discount.discountPerUnit}</td>
                      <td className={styles.delcol}>
                        <EditBilltoBillModal
                          changeTrigger={changeTrigger}
                          discount={discount}
                          isAdmin={isAdmin}
                        />
                        {isAdmin && (
                          <DeleteBilltoBillModal
                            discount={discount}
                            changeTrigger={changeTrigger}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <Loading />}
    </>
  );
}

export default BillToBill;
