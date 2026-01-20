import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import React, { useEffect, useState } from "react";
import TransferDetail from "./TransferDetail";

function TransferList({ navigate }) {
  const [transfers, setTransfers] = useState();

  const [transfer, setTransfer] = useState();

  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    async function fetch() {
      try {
        setTransfer(null);
        setTransfers(null);
        setLoading(true);
        console.log(`/stock-transfers`);

        const res = await axiosAPI.get("/stock-transfers");
        console.log(res);
        setTransfers(res.data);
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

  let index = 1;
  return (
    <>
      {!transfer && (
        <>
          <p className="path">
            <span onClick={() => navigate("/stock-transfer")}>
              Stock Transfer
            </span>{" "}
            <i className="bi bi-chevron-right"></i>Transfer List
          </p>

          {transfers && (
            <div className="row m-0 p-3 justify-content-center">
              <div className="col-lg-10">
                <table className={`table table-bordered borderedtable`}>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Date</th>
                      <th>Transfer Number</th>
                      <th>From Warehouse</th>
                      <th>To Warehouse</th>
                      <th>Transfer Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.length === 0 && (
                      <tr>
                        <td colSpan={7}>NO DATA FOUND</td>
                      </tr>
                    )}
                    {transfers.length > 0 &&
                      transfers.map((transfer) => (
                        <tr
                          key={transfer.id}
                          className="animated-row"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <td>{index++}</td>
                          <td>{transfer.createdAt?.slice(0, 10)}</td>
                          <td>{transfer.transferNumber}</td>
                          <td>{transfer.fromWarehouse?.name}</td>
                          <td>{transfer.toWarehouse?.name}</td>
                          <td>{transfer.transferDate?.slice(0, 10)}</td>
                          <td>
                            <button onClick={() => setTransfer(transfer)}>
                              view
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {loading && <Loading />}
          {isModalOpen && (
            <ErrorModal
              isOpen={isModalOpen}
              message={error}
              onClose={closeModal}
            />
          )}
        </>
      )}

      {transfer && (
        <TransferDetail
          transfer={transfer}
          setTransfer={setTransfer}
          navigate={navigate}
        />
      )}
    </>
  );
}

export default TransferList;
