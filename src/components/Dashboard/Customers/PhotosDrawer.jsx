import React, { useEffect, useRef, useState } from "react";
import styles from "./PhotosDrawer.module.css";

function PhotosDrawer({ front, back, title = "Photos" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const drawerRef = useRef();

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  // Ctrl + / Ctrl -
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.ctrlKey && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        setZoom((prev) => Math.min(prev + 0.1, 3));
      } else if (e.ctrlKey && e.key === "-") {
        e.preventDefault();
        setZoom((prev) => Math.max(prev - 0.1, 0.3));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Mouse scroll zoom only with Ctrl
  useEffect(() => {
    const handleWheel = (e) => {
      if (!isOpen || !drawerRef.current.contains(e.target)) return;
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        setZoom((prev) => Math.min(Math.max(prev + delta, 0.3), 3));
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isOpen]);

  return (
    <>
      <img
        src={front || "/placeholder.jpg"}
        alt={`${title}-front`}
        className={styles.thumbnail}
        onClick={openDrawer}
      />

      {isOpen && (
        <div className={styles.drawerOverlay} onClick={closeDrawer}>
          <div
            className={styles.drawer}
            ref={drawerRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <h2>{title}</h2>
              <button onClick={closeDrawer}>&times;</button>
            </div>

            <div className={styles.zoomControls}>
              <button onClick={() => setZoom((z) => Math.min(z + 0.1, 3))}>
                Zoom In
              </button>
              <button onClick={() => setZoom((z) => Math.max(z - 0.1, 0.3))}>
                Zoom Out
              </button>
              <span className={styles.zoomLabel}>
                {(zoom * 100).toFixed(0)}%
              </span>
            </div>

            <div className={styles.drawerBody}>
              <div
                className={styles.zoomWrapper}
                style={{
                  transform: `scale(${zoom})`,
                }}
              >
                {front && (
                  <img src={front} alt="Front" className={styles.zoomImage} />
                )}
                {back && (
                  <img src={back} alt="Back" className={styles.zoomImage} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PhotosDrawer;
