// import { Input } from "@chakra-ui/react"
// import { InputRightElement } from "@chakra-ui/react";
// import { InputGroup } from "@/components/ui/input-group"
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";
import Notification from "./Notification";
import ProfileAvthar from "./ProfileAvthar";
import { IoSearch } from "react-icons/io5";
import SearchBar from "./SearchBar";
import DivisionSwitcher from "./DivisionSwitcher";
import { dashboardOptions } from "../../utils/searchOptions";

function DashHeader({
  notifications,
  user,
  setAdmin,
  setTab,
  admin,
  orgadmin,
}) {
  const navigate = useNavigate();
  return (
    <>
      <div className={styles.header}>
        <div className="row justify-content-between">
          <div className={`col-4 ${styles.headcontentTitle}`}>
            <p className={styles.brand}>Sri Chakra Industries</p>
            {orgadmin && (
              <p className={styles.reset}>
                <span
                  onClick={() => {
                    setAdmin();
                    navigate("/admin");
                  }}
                >
                  <i class="bi bi-arrow-repeat"></i>
                </span>
              </p>
            )}
          </div>
          <div className={`col-8 ${styles.headcontent}`}>
            <div className={styles.headerRight}>
              <div className={styles.searchContainer}>
                <SearchBar options={dashboardOptions} />
              </div>

              <div
                className={styles.divisionContainer}
                onClick={() => navigate("/divs")}
                style={{ cursor: "pointer" }}
              >
                <DivisionSwitcher />
              </div>

              <div className={styles.profileContainer}>
                <ProfileAvthar user={user} setTab={setTab} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DashHeader;
