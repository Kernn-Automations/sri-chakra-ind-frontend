import React, { useEffect, useState } from "react";
import styles from "./Settings.module.css";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { useAuth } from "@/Auth";
import OngoingMinOrderModal from "./OngoingMinOrderModal";
import NewDroppOffRuleModal from "./NewDroppOffRuleModal";
import DeleteDropOffRuleModal from "./DeleteDropOffRuleModal";
import NewMinOrderModal from "./NewMinOrderModal";
import DeleteMinOrderModal from "./DeleteMinOrderModal";

function OngoingMinOrder({ navigate }) {
  let index = 1;

  // BACKEND

  const [rules, setRules] = useState();

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
        const res = await axiosAPI.get("/moq/rules");
        // console.log(res);
        setRules(res.data.rules);
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
        <span onClick={() => navigate("/settings")}>Settings</span>{" "}
        <i class="bi bi-chevron-right"></i> Minimum Order Rules
      </p>
      <NewMinOrderModal />
      <DeleteMinOrderModal />

      <>
        {/* <button className="homebtn" onClick={onAddClick}>
          + Add
        </button> */}
        {rules && (
          <div className="row m-0 p-3 pt-5 justify-content-center">
            <div className="col-lg-9">
              <table className="table table-bordered borderedtable">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Rule Id</th>
                    <th>Rule Type</th>
                    <th>Minimum Quantity</th>
                    <th>Product Id</th>
                    <th>Unit</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No Data Found</td>
                    </tr>
                  ) : (
                    rules.map((rule, index) => (
                      <tr
                        key={rule.id}
                        className="animated-row"
                        style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                      >
                        <td>{index + 1}</td>
                        <td>{rule.id}</td>
                        <td>{rule.ruleType}</td>
                        <td>{rule.minQuantity}</td>
                        <td>{rule.productId}</td>
                        <td>{rule.unit}</td>
                        <td>
                          <OngoingMinOrderModal
                            rule={rule}
                            trigger={trigger}
                            setTrigger={setTrigger}
                          />
                        </td>
                      </tr>
                    ))
                  )}
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

export default OngoingMinOrder;
