import React, { useEffect } from 'react'
import { Modal, Button } from "react-bootstrap";
import styles from "./Login.module.css"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "../Auth";

function ErrorModal({isOpen, message, onClose}) {
  const { removeLogin } = useAuth();
  
  // Check if the error message indicates token issues
  const isTokenError = message && (
    message.toLowerCase().includes('invalid or expired token') ||
    message.toLowerCase().includes('authentication failed') ||
    message.toLowerCase().includes('unauthorized') ||
    message.toLowerCase().includes('token may be expired') ||
    message.toLowerCase().includes('please log in again') ||
    message.toLowerCase().includes('please login again')
  );

  // Automatically logout when token error is detected
  useEffect(() => {
    if (isOpen && isTokenError) {
      console.log('Token-related error detected, automatically logging out...');
      // 1 second delay for immediate logout
      const timeoutId = setTimeout(() => {
        onClose(); // Close the modal first
        removeLogin(); // Then logout
      }, 1000); // 1 second delay
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isTokenError, onClose, removeLogin]);

  return (
    <>
    <Modal show={isOpen} onHide={isTokenError ? undefined : onClose} backdrop={isTokenError ? 'static' : true} keyboard={!isTokenError}>
      <Modal.Header closeButton={!isTokenError}>
        <Modal.Title>Error</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className={styles.error}>{message || "Unknown Error, Please contact Admin"}</p>
        {isTokenError && (
          <p className={styles.error} style={{marginTop: '10px', fontSize: '14px', color: '#ff6b6b'}}>
            You will be automatically logged out 
          </p>
        )}
      </Modal.Body>
      {!isTokenError && (
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </Modal.Footer>
      )}
    </Modal>

{/* <DialogRoot open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className={styles.error}>
           {message}
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <button variant="outline" onClick={onClose}>Cancel</button>
          </DialogActionTrigger>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot> */}
    </>
  )
}

export default ErrorModal
