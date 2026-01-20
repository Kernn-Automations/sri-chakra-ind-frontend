import React from 'react'
import { Modal, Button } from "react-bootstrap";
import styles from "./Login.module.css"

function SuccessModal({isOpen, message, onClose}) {
  return (
    <>
    <Modal show={isOpen} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Success</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className={styles.success}>{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  )
}

export default SuccessModal
