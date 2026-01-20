import React, { useEffect, useState } from "react";
import styles from "./Products.module.css";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { useAuth } from "@/Auth";
import TaxAddViewModal from "./TaxAddViewModal";
import TaxViewModal from "./TaxViewModal";
import DeleteTaxModal from "./DeleteTaxModal";

function Taxes({ navigate, isAdmin }) {
  let index = 1;

  // BACKEND

  const [taxes, setTaxes] = useState();

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
        const res = await axiosAPI.get("/tax");
        // console.log(res);
        setTaxes(res.data.taxes);
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
        <i class="bi bi-chevron-right"></i> Taxes
      </p>

      <>
        {/* <button className="homebtn" onClick={onAddClick}>
          + Add
        </button> */}
        {isAdmin && (
          <>
            <TaxAddViewModal trigger={trigger} setTrigger={setTrigger} />
            <DeleteTaxModal
              trigger={trigger}
              setTrigger={setTrigger}
              taxes={taxes}
            />
          </>
        )}
        {taxes && (
          <div className="row m-0 p-3 pt-5 justify-content-center">
            <div className="col-lg-9">
              <table className="table table-bordered borderedtable">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Date</th>
                    <th>Tax Name</th>
                    <th>Tax Value</th>
                    {isAdmin && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {taxes.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4}>NO DATA FOUND</td>
                    </tr>
                  )}
                  {taxes.length > 0 &&
                    taxes.map((tax) => (
                      <tr
                        key={tax.id}
                        className="animated-row"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td>{index++}</td>
                        <td>{tax.createdAt.slice(0, 10)}</td>
                        <td>{tax.name}</td>
                        <td>
                          {tax.taxNature === "Exempt"
                            ? "Exempted"
                            : tax.percentage !== null
                              ? `${tax.percentage}%`
                              : "-"}
                        </td>

                        {isAdmin && (
                          <td>
                            <TaxViewModal
                              tax={tax}
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

export default Taxes;
