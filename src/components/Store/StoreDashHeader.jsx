import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "../Dashboard/Dashboard.module.css";
import StoreProfileAvatar from "./StoreProfileAvatar";
import SearchBar from "../Dashboard/SearchBar";
import Logo from "../Dashboard/navs/Logo";
import StoreSwitcher from "./StoreSwitcher";
import { storeOptions } from "../../utils/searchOptions";

function StoreDashHeader({ notifications, user, setTab, admin, orgadmin }) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mobile header layout: Logo + Brand centered, Search + Profile on right
  if (isMobile) {
    return (
      <>
        <div className={styles.header}>
          <div
            className={`row ${styles.mobileHeaderRow}`}
            style={{ width: "100%", margin: 0 }}
          >
            {/* Left spacer for hamburger menu */}
            <div className={styles.mobileHeaderSpacer}></div>

            {/* Centered logo + brand */}
            <div className={styles.mobileHeaderCenter}>
              <Logo />
              <p className={styles.brand}>Sri Chakra Industries</p>
            </div>

            {/* Right: Search only (Profile moved to navbar on mobile) */}
            <div className={`col-auto ${styles.headcontent}`}>
              <div className={styles.headerRight}>
                <div className={styles.searchContainer}>
                  <SearchBar options={storeOptions} />
                </div>

                <div className={styles.storeContainer}>
                  <StoreSwitcher />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop header layout (unchanged)
  return (
    <>
      <div className={styles.header}>
        <div
          className="row justify-content-between align-items-center"
          style={{ width: "100%", margin: 0 }}
        >
          <div className={`col-auto ${styles.headcontentTitle}`}>
            <p className={styles.brand}>Sri Chakra Industries</p>
          </div>
          <div className={`col-auto ${styles.headcontent}`}>
            <div className={styles.headerRight}>
              <div className={styles.searchContainer}>
                <SearchBar options={storeOptions} />
              </div>

              <div className={styles.storeContainer}>
                <StoreSwitcher />
              </div>

              <div className={styles.profileContainer}>
                <StoreProfileAvatar user={user} setTab={setTab} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default StoreDashHeader;
