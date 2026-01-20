import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import React, { useEffect, useState } from "react";
import AddMonthlyDiscountModal from "./AddMonthlyDiscountModal";
import EditMonthlyDiscountModal from "./EditMonthlyDiscountModal";
import DeleteMonthlyDiscModal from "./DeleteMonthlyDiscModal";

import styles from "./Discount.module.css";

function MonthlyDiscount({ navigate, isAdmin }) {
  const [discounts, setDiscounts] = useState();

  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [trigger, setTrigger] = useState();

  const changeTrigger = () => setTrigger(!trigger);

  useEffect(() => {
    async function fetchMeta() {
      try {
        setLoading(true);
        const res = await axiosAPI.get("/discounts/monthly");
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
        <i className="bi bi-chevron-right"></i> Monthly Discount
      </p>

      {isAdmin && (
        <div className="row m-0 p-3 pt-0">
          <div className="col-3">
            <AddMonthlyDiscountModal changeTrigger={changeTrigger} />
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
                  <th>Min. Turn-Over</th>
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
                      <td>{discount.minTurnover}</td>
                      <td>{discount.discountPerUnit}</td>
                      <td className={styles.delcol}>
                        <EditMonthlyDiscountModal
                          discount={discount}
                          changeTrigger={changeTrigger}
                          isAdmin={isAdmin}
                        />
                        {isAdmin && (
                          <DeleteMonthlyDiscModal
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

export default MonthlyDiscount;
