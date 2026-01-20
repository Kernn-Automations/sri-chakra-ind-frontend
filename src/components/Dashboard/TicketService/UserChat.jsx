import React from "react";
import styles from "./Tickets.module.css";

function UserChat({ ticket, onChatClick }) {
  return (
    <>
     
        <div className={styles.chatcontent} onClick={() => onChatClick(ticket)}>
          <h3>{ticket.ticketId}</h3>
          <div className={styles.message}>
            <p>status : {ticket.status}</p>
            <p className={styles.time}>{ticket.createdAt.slice(0, 10)}
            </p>
          </div>
        </div>
      <hr />
    </>
  );
}

export default UserChat;
