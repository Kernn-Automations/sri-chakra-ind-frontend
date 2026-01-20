import React, { useEffect, useState } from "react";

import styles from "./Products.module.css";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import PricingAddViewModal from "./PricingAddViewModal";
import PricingViewModal from "./PricingViewModal";
import DeletePricingListModal from "./DeletePricingListModal";

function PricingList({ navigate, isAdmin }) {
  let index = 1;

  // backend
  const [pricing, setPricing] = useState();

  const { axiosAPI } = useAuth();

  const [trigger, setTrigger] = useState();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const res = await axiosAPI.get("/pricing/lists/fetch");
        // console.log(res);
        setPricing(res.data.pricingLists);
      } catch (e) {
        // console.log(e);
        setError(e.response.data.message);
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [trigger]);

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/products")}>Products</span>{" "}
        <i class="bi bi-chevron-right"></i> Pricing List
      </p>

      <>
        {/* <button className="homebtn" onClick={() => setAddclick(true)}>
            + Add
          </button> */}
        {isAdmin && (
          <>
            {" "}
            <PricingAddViewModal trigger={trigger} setTrigger={setTrigger} />
            <DeletePricingListModal
              trigger={trigger}
              setTrigger={setTrigger}
              pricingLists={pricing}
            />
          </>
        )}

        {pricing && (
          <div className="row m-0 p-3 pt-5 justify-content-center">
            <div className="col-lg-9">
              <table className="table table-bordered borderedtable">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Value</th>
                    {isAdmin && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {pricing.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin? 6 : 5}>NO DATA FOUND</td>
                    </tr>
                  )}
                  {pricing.length > 0 &&
                    pricing.map((price) => (
                      <tr
                        key={price.id}
                        className="animated-row"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td>{index++}</td>
                        <td>{price.createdAt.slice(0, 10)}</td>
                        <td>{price.name}</td>
                        <td>{price.type}</td>
                        <td>
                          {price.adjustmentValue}
                          {price.adjustmentType === "Percentage" ? "%" : ""}
                        </td>
                        {isAdmin && (
                          <td>
                            <PricingViewModal
                              price={price}
                              trigger={trigger}
                              setTrigger={setTrigger}
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}

      {loading && <Loading />}
    </>
  );
}

export default PricingList;
