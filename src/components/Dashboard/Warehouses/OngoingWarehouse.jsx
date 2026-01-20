import React, { useEffect, useState } from "react";
import styles from "./Warehouse.module.css";
import ActionViewModal from "./ActionViewModal";
import SelectMode from "./SelectMode";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import { useNavigate } from "react-router-dom";
import WarehouseDetails from "./WarehouseDetails";
function OngoingWarehouse({
  navigate,
  managers,
  isAdmin,
  warehouseId,
  refreshKey,
}) {
  const [warehouses, setWarehouses] = useState();

  const { axiosAPI } = useAuth();

  // const navigate = useNavigate();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [trigger, setTrigger] = useState();

  const changeTrigger = () => setTrigger(!trigger);

  useEffect(() => {
    fetch();
  }, [refreshKey]);

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        setWarehouses(null);

        const user = JSON.parse(localStorage.getItem("user"));
        const roles = user?.roles || []; // make sure it's an array
        //const roles = ["Area Business Manager"]; // For testing purposes, replace with user.roles in production
        // Determine endpoint
        let endpoint = "/warehouses";

        const managerRoles = [
          "Area Business Manager",
          "Regional Business Manager",
          "Zonal Business Manager",
        ];

        const isAdmin =
          roles.includes("Admin") || roles.includes("Super Admin");
        const isManager = managerRoles.some((role) => roles.includes(role));

        if (isManager && !isAdmin) {
          endpoint = "/warehouses/manager";
        }

        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem("currentDivisionId");
        const currentDivisionName = localStorage.getItem("currentDivisionName");

        // ✅ Add division parameters to endpoint
        if (currentDivisionId && currentDivisionId !== "1") {
          endpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === "1") {
          endpoint += `?showAllDivisions=true`;
        }

        console.log(
          "OngoingWarehouse - Fetching warehouses with endpoint:",
          endpoint,
        );
        console.log("OngoingWarehouse - Division ID:", currentDivisionId);
        console.log("OngoingWarehouse - Division Name:", currentDivisionName);

        const res = await axiosAPI.get(endpoint);
        setWarehouses(res.data.warehouses);
      } catch (e) {
        console.error("Error fetching warehouses:", e);
        setError(e.response?.data?.message || "Something went wrong");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, [trigger]);

  let count = 1;
  return (
    <>
      {!warehouseId && (
        <div className="row m-0 p-3 pt-5 justify-content-center">
          <div className="col-lg-10">
            {warehouses && (
              <table className="table table-bordered borderedtable">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Warehouse ID</th>
                    <th>Warehouse Name</th>
                    {/* <th>Enable/Disable</th> */}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.length === 0 && (
                    <tr>
                      <td colSpan={5}>No Data Found</td>
                    </tr>
                  )}
                  {warehouses.length > 0 &&
                    warehouses.map((warehouse) => (
                      <tr
                        key={warehouse.id}
                        className="animated-row"
                        style={{ animationDelay: `${count * 0.1}s` }}
                      >
                        <td>{count++}</td>

                        <td>{warehouse.id}</td>
                        <td>{warehouse.name}</td>
                        {/* <td className={styles.selectmode}>
                        <SelectMode
                          val={warehouse.managerId ? "enable" : "disable"}
                        />
                      </td> */}
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              navigate(`/warehouses/${warehouse.id}`)
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
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

export default OngoingWarehouse;
