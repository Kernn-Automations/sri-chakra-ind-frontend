import React, { useEffect, useRef, useState } from "react";
import { RiChat1Fill, RiH6 } from "react-icons/ri";
import { LuTicketPlus } from "react-icons/lu";
import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import styles from "./Tickets.module.css";
import UserChat from "./UserChat";
import TicketChat from "./TicketChat";
import { FileUpload } from "@chakra-ui/react";
import FileUploadDialog from "./FileUploadDialog";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import axios from "axios";
import Loading from "@/components/Loading";
import LoadingAnimation from "@/components/LoadingAnimation";

function TicketingService() {
  const [oldtickets, setoldtickets] = useState();

  const [openchat, setOpenchat] = useState(false);

  const [ticketno, setTicketno] = useState();

  const [trigger, setTrigger] = useState();

  const onChatClick = (no) => {
    setOpenchat(true);
    setTicketno(no);
  };

  const [newticket, setNewticket] = useState(false);



 
  // backend for fetchig previous tickets
  const { axiosAPI } = useAuth();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successful, setSuccessful] = useState(null);
  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    async function fetch() {
      
      try {
        const res = await axiosAPI.get("/tickets/mine");
        // console.log(res);
        setoldtickets(res.data.tickets);
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

  // backend for create new ticket
  const [files, setFiles] = useState([]);
  const [subject, setSubject] = useState();
  const [description, setDescription] = useState();
  const VITE_API = import.meta.env.VITE_API_URL;
  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("description", description);

    if (files.length > 0) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }
    // console.log(files);
    // console.log(subject, description, formData);
    try {
      setLoading(true);
      const res = await axios.post(`${VITE_API}/tickets`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(res);
      setFiles([]);
      setTrigger(!trigger);
      setSuccessful(res.data.message);
      setTimeout(() => setSuccessful(null), 1000);
    } catch (error) {
      console.error("Upload failed:", error);
      setError(error.response.data.message);
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.chatcontainer}>
        <PopoverRoot>
          <PopoverTrigger asChild>
            <div
              className={styles.icon}
              onClick={() => {
                setOpenchat(false);
                setNewticket(false);
                // setSelectedFile(null);
              }}
            >
              <RiChat1Fill />
              <span className={styles.qmark}>?</span>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className={styles.userscontainer}
            class={openchat ? styles.showb : styles.showa}
          >
            {/* <PopoverArrow className="notdropdown-color" /> */}
            {!openchat && !newticket && !loading && (
              <PopoverBody className={styles.components}>
                <div className={styles.heading}>
                  <h2>Chat Services</h2>
                </div>
                <hr />
                {!oldtickets && (
                  <h6 className={`text-center ${styles.errorText}`}>{error}</h6>
                )}

                <div className={styles.ticketsContainer}>
                  {oldtickets &&
                    oldtickets.length > 0 &&
                    oldtickets.map((ticket) => (
                      <UserChat
                        key={ticket.id}
                        ticket={ticket}
                        onChatClick={onChatClick}
                      />
                    ))}
                  {oldtickets && oldtickets.length === 0 && (
                    <h3>NO TICKETS FOUND</h3>
                  )}

                  <div
                    className={styles.chatcontent}
                    onClick={() => setNewticket(true)}
                  >
                    <h3>
                      Raise New Ticket{" "}
                      <span>
                        <i class="bi bi-plus-circle"></i>
                      </span>
                    </h3>
                  </div>
                </div>

                {/* <hr /> */}
              </PopoverBody>
            )}
            {openchat && (
              <PopoverBody className={styles.components}>
                <TicketChat ticket={ticketno} setOpenchat={setOpenchat} />

                {/* <hr /> */}
              </PopoverBody>
            )}

            {newticket && (
              <PopoverBody className={styles.components}>
                <div className={styles.heading}>
                  <h2>
                    <span
                      className={styles.back}
                      onClick={() => setNewticket(false)}
                    >
                      <i class="bi bi-arrow-left-short"></i>
                    </span>
                    Raise new ticket{" "}
                  </h2>
                </div>
                <hr />

                <div className={styles.inputContainer}>
                  {/* <select name="" id="">
                    <option value="">--select Module--</option>
                    <option value="">Module 1</option>
                    <option value="">Module 2</option>
                    <option value="">Module 3</option>
                  </select>

                  <select name="" id="">
                    <option value="">--select Sub Module--</option>
                    <option value="">Sub Module 1</option>
                    <option value="">Sub Module 2</option>
                    <option value="">Sub Module 3</option>
                  </select> */}

                  <input
                    type="text"
                    placeholder="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                  <textarea
                    name=""
                    id=""
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>

                  <div style={{ textAlign: "center", padding: "10px" }}>
                    {/* Hidden file input */}
                    {/* <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    /> */}

                    {/* Custom upload button */}

                    {/* <button
                      onClick={handleButtonClick}
                      style={{
                        padding: "4px 20px",
                        backgroundColor: "#ccc",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: "5px",
                        fontSize: "16px",
                        fontWeight: 500,
                      }}
                    >
                      {!selectedFile && "Upload File"}
                      {selectedFile && selectedFile}
                    </button> */}
                    <FileUploadDialog files={files} setFiles={setFiles} />

                    {/* Display the selected file name
                    {selectedFile && (
                      <p style={{ marginTop: "10px" }}>📄 {selectedFile}</p>
                    )} */}
                  </div>
                  <p className="text-center">
                    {!loading && !successful && (
                      <button className={styles.send} onClick={handleUpload}>
                        Submit
                      </button>
                    )}
                    {loading && <Loading/>}
                    {successful && <p>{successful}</p>}
          
                  </p>
                </div>

                {/* <hr /> */}

                {/* {loading && <LoadingAnimation gif={deliverAni} />} */}
              </PopoverBody>
            )}
          </PopoverContent>
        </PopoverRoot>
      </div>
      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </>
  );
}

export default TicketingService;
