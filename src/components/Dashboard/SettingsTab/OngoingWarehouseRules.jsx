import React, { useEffect, useState } from "react";
import styles from "./Settings.module.css";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { useAuth } from "@/Auth";
import AddWarehouseRuleModal from "./AddWarehouseRuleModal";
import DeleteWarehouseRuleModal from "./DeleteWarehouseRuleModal";
import OngoingWarehouseRuleModal from "./OngoingWarehouseRuleModal";

function OngoingWarehouseRules({ navigate }) {
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
        const res = await axiosAPI.get("/warehouse/rules");
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
        <i class="bi bi-chevron-right"></i> Warehouse Rules
      </p>
      <AddWarehouseRuleModal />
      <DeleteWarehouseRuleModal />

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
                    <th>Minimum Quantity</th>
                    <th>Maximum Quantity</th>
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
                        <td>{rule.minQuantity}</td>
                        <td>{rule.maxQuantity}</td>
                        <td>{rule.unit}</td>
                        <td>
                          <OngoingWarehouseRuleModal
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

export default OngoingWarehouseRules;
