import React, { useEffect, useRef, useState } from "react";
import styles from "./Tickets.module.css";

import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import chatAni from "../../../images/animations/chatAnimation.gif";

function TicketChat({ ticket, setOpenchat, token }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const { axiosAPI } = useAuth();
  const ticketId = ticket.id;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await axiosAPI.get(`/tickets/${ticketId}/messages`);
        const formatted = res.data.messages.map((msg) => ({
          ...msg,
          sender: msg.senderType === "Employee" ? "sent" : "received",
        }));
        setMessages(formatted);
      } catch (err) {
       
        setError(err.response?.data?.message || "Error loading messages.");
        setIsModalOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [ticketId, token]);

  const triggerFileSelect = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).filter((file) =>
      file.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const sendMessage = async () => {
    if (!input.trim() && files.length === 0) return;

    let base64Files = [];
    for (const file of files) {
      const base64 = await convertToBase64(file);
      base64Files.push({ name: file.name, type: file.type, data: base64 });
    }

    // For now, just add the message locally since socket is not available
    setMessages((prev) => [
      ...prev,
      {
        sender: "sent",
        message: input,
        sentAt: new Date(),
        files: base64Files,
      },
    ]);

    setInput("");
    setFiles([]);
  };

  return (
    <>
      <div className={styles.heading}>
        <h2>
          <span className={styles.back} onClick={() => setOpenchat(false)}>
            <i className="bi bi-arrow-left-short"></i>
          </span>{" "}
          {ticket.ticketId}
        </h2>
      </div>
      <hr />
      <div className={styles.chatbox}>
        {messages.length === 0 && !loading && <p>No chat found</p>}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={msg.sender === "sent" ? styles.sent : styles.recieve}
          >
            {msg.message && <p>{msg.message}</p>}

            {msg.files &&
              msg.files.map((file, i) =>
                file.type.startsWith("image/") ? (
                  <img
                    key={i}
                    src={file.data || file.url}
                    alt={file.name}
                    className={styles.chatImage}
                  />
                ) : (
                  <a key={i} href={file.url || "#"} target="_blank" rel="noreferrer">
                    {file.name}
                  </a>
                )
              )}
            <span className={styles.chatTime}>
              {new Date(msg.sentAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
        {loading && <img src={chatAni} alt="Loading..." />}
        <div ref={chatEndRef} />
      </div>

      {files.length > 0 && (
        <div className={styles.previewBox}>
          {files.map((file, idx) => (
            <div key={idx} className={styles.previewItem}>
              <span>{file.name}</span>
              <button
                onClick={() => removeFile(idx)}
                className={styles.removeBtn}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.inputbar}>
        <span onClick={triggerFileSelect}>
          <i className="bi bi-folder-plus"></i>
        </span>
        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}

export default TicketChat;
