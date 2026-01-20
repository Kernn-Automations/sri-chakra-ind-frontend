import React from "react";
import styles from "./Sales.module.css";
function DropOffs({ dropoffs }) {
  return (
    <>
      {dropoffs &&
        dropoffs.map((drop) => (
          <div className={styles.dropoffs}>
            <div>
              <div className={styles.dropProfile}>
                <h6>D{drop.order}</h6>
              </div>
            </div>
            <div className={styles.dropContent}>
              <h6>{drop.receiverName}</h6>
              <p>
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#cf4121"
                  >
                    <path d="M480.14-490.77q26.71 0 45.59-19.02 18.89-19.02 18.89-45.73 0-26.71-19.03-45.6Q506.57-620 479.86-620q-26.71 0-45.59 19.02-18.89 19.02-18.89 45.73 0 26.71 19.03 45.6 19.02 18.88 45.73 18.88Z" />
                  </svg>
                </span>
                {drop.address}
              </p>
              <p>
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#333"
                  >
                    <path d="M757.23-160q-101.15 0-207.38-50.65-106.23-50.66-197.77-142.2-90.77-91.53-141.43-197.38Q160-656.08 160-757.23q0-18 12-30.39Q184-800 202-800h98.92q16.31 0 28.46 10.27 12.16 10.27 16.47 26.35L365.69-668q2.77 16.77-1 29.31t-13.31 20.54l-87.76 81.84q24.61 44.69 54.42 83.04 29.81 38.35 63.58 72.65 34.84 34.85 75 64.81 40.15 29.96 88.15 56.58l85.54-87.08q9.77-10.54 21.96-13.88 12.19-3.35 26.96-1.35l84.15 17.23q16.31 4 26.47 16.43Q800-315.46 800-299.38V-202q0 18-12.38 30-12.39 12-30.39 12Z" />
                  </svg>
                </span>
                {drop.receiverMobile}
              </p>
            </div>
            <div>
              <div className={styles.dropmap}>
                <p>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="40px"
                    viewBox="0 -960 960 960"
                    width="40px"
                    fill="#2155cf"
                  >
                    <path d="m600-187.08-240-72-125.31 40.23q-18.38 5.7-34.54-4.84Q184-234.23 184-255.62v-427.23q0-13.69 7.19-25.03 7.19-11.35 18.12-14.81L360-772.92l240 72 125.31-40.23q18.38-6.7 34.54 3.19 16.15 9.88 16.15 30.5v433.38q0 14.46-7.85 25.43-7.84 10.96-20.53 14.42L600-187.08Zm-16-36.77v-450l-208-63.84v450l208 63.84Z" />
                  </svg>
                </p>
              </div>
            </div>
          </div>
        ))}
    </>
  );
}

export default DropOffs;
