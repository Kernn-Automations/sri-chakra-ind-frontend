import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "../Dashboard/navs/NavContainer.module.css";
import { isStoreEmployee, isAdmin, isDivisionHead } from "../../utils/roleUtils";
import LogoutModal from "../Dashboard/LogoutModal";

function StoreNavBg({ hover, setTab, tab, user, closeMobileMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isEmployee, setIsEmployee] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handler to close mobile menu when menu item is clicked
  const handleMenuItemClick = () => {
    if (isMobile && closeMobileMenu) {
      closeMobileMenu();
    }
  };
  
  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Re-check user role whenever component mounts or location changes
    let currentUser = user || {};
    try {
      if (!currentUser || Object.keys(currentUser).length === 0) {
        const storedUserData = localStorage.getItem("user");
        if (storedUserData) {
          currentUser = JSON.parse(storedUserData);
          // Handle case where user might be nested (user.user)
          if (currentUser.user && !currentUser.roles) {
            currentUser = currentUser.user;
          }
        }
      } else {
        // Handle case where user might be nested (user.user)
        if (currentUser.user && !currentUser.roles) {
          currentUser = currentUser.user;
        }
      }
      const employeeCheck = isStoreEmployee(currentUser);
      setIsEmployee(employeeCheck);
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      setIsEmployee(false);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [location.pathname, user]);

  // Handle user object structure
  const actualUser = user?.user || user || {};
  const userIsAdmin = isAdmin(actualUser);
  const showDivisionsOption = userIsAdmin || isDivisionHead(actualUser);

  const handleProfileClick = (e) => {
    e.preventDefault();
    // For store employees, navigate to store home instead of admin profile
    if (isEmployee) {
      navigate('/store');
      setTab("home");
    } else {
      // For store managers/admins, navigate to admin profile
      navigate('/profile');
    }
    handleMenuItemClick();
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  return (
    <>
      <div className={styles.navicons}>
        <div className={`${(location.pathname === "/store" || location.pathname === "/store/") ? styles.active : ""} `} onClick={() => { setTab("home"); handleMenuItemClick(); }}>
          <Link to="/store">
            <svg width="34" height="35" viewBox="0 0 34 35" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 15.8303C2 14.8731 2 14.3945 2.12338 13.9537C2.23267 13.5632 2.41228 13.196 2.65338 12.87C2.92556 12.502 3.30337 12.2082 4.05898 11.6205L15.3628 2.82859C15.9484 2.37317 16.2411 2.14546 16.5644 2.05793C16.8497 1.98069 17.1503 1.98069 17.4356 2.05793C17.7589 2.14546 18.0516 2.37317 18.6372 2.82859L29.941 11.6205C30.6966 12.2082 31.0744 12.502 31.3466 12.87C31.5877 13.196 31.7673 13.5632 31.8766 13.9537C32 14.3945 32 14.8731 32 15.8303V27.8886C32 29.7554 32 30.6888 31.6367 31.4019C31.3171 32.0291 30.8072 32.539 30.18 32.8586C29.4669 33.2219 28.5335 33.2219 26.6667 33.2219H7.33333C5.46649 33.2219 4.53307 33.2219 3.82003 32.8586C3.19282 32.539 2.68289 32.0291 2.36331 31.4019C2 30.6888 2 29.7554 2 27.8886V15.8303Z" stroke="black" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {(hover || isMobile) && <p>Home</p>}
          </Link>
        </div>

        {!isEmployee && (
          <div className={`${location.pathname.includes("inventory") ? styles.active : ""} `} onClick={() => { setTab("inventory"); handleMenuItemClick(); }}>
            <Link to="/store/inventory">
              <svg
                width="38"
                height="33"
                viewBox="0 0 38 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g>
                  <path
                    d="M36.9444 18.5625H31.6667V24.75L29.5556 23.3771L27.4444 24.75V18.5625H22.1667C21.5861 18.5625 21.1111 19.0266 21.1111 19.5938V31.9688C21.1111 32.5359 21.5861 33 22.1667 33H36.9444C37.525 33 38 32.5359 38 31.9688V19.5938C38 19.0266 37.525 18.5625 36.9444 18.5625ZM11.6111 14.4375H26.3889C26.9694 14.4375 27.4444 13.9734 27.4444 13.4062V1.03125C27.4444 0.464062 26.9694 0 26.3889 0H21.1111V6.1875L19 4.81465L16.8889 6.1875V0H11.6111C11.0306 0 10.5556 0.464062 10.5556 1.03125V13.4062C10.5556 13.9734 11.0306 14.4375 11.6111 14.4375ZM15.8333 18.5625H10.5556V24.75L8.44444 23.3771L6.33333 24.75V18.5625H1.05556C0.475 18.5625 0 19.0266 0 19.5938V31.9688C0 32.5359 0.475 33 1.05556 33H15.8333C16.4139 33 16.8889 32.5359 16.8889 31.9688V19.5938C16.8889 19.0266 16.4139 18.5625 15.8333 18.5625Z"
                    fill="black"
                  />
                </g>
              </svg>
              {(hover || isMobile) && <p>Inventory</p>}
            </Link>
          </div>
        )}

        <div className={`${location.pathname.includes("sales") ? styles.active : ""} `} onClick={() => { setTab("sales"); handleMenuItemClick(); }}>
          <Link to="/store/sales">
            <svg
              width="37"
              height="37"
              viewBox="0 0 37 37"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M27.6667 13L17.7038 22.9629C17.3407 23.3259 17.1592 23.5074 16.9499 23.5754C16.7658 23.6353 16.5675 23.6353 16.3834 23.5754C16.1741 23.5074 15.9926 23.3259 15.6296 22.9629L12.2038 19.5371C11.8407 19.1741 11.6592 18.9926 11.4499 18.9246C11.2658 18.8647 11.0675 18.8647 10.8834 18.9246C10.6741 18.9926 10.4926 19.1741 10.1296 19.5371L2 27.6667M27.6667 13H20.3333M27.6667 13V20.3333M10.8 35H26.2C29.2803 35 30.8204 35 31.9969 34.4005C33.0318 33.8732 33.8732 33.0318 34.4005 31.9969C35 30.8204 35 29.2803 35 26.2V10.8C35 7.71971 35 6.17957 34.4005 5.00305C33.8732 3.96816 33.0318 3.12677 31.9969 2.59946C30.8204 2 29.2803 2 26.2 2H10.8C7.71971 2 6.17957 2 5.00305 2.59946C3.96816 3.12677 3.12677 3.96816 2.59946 5.00305C2 6.17957 2 7.71971 2 10.8V26.2C2 29.2803 2 30.8204 2.59946 31.9969C3.12677 33.8732 3.96816 33.8732 5.00305 34.4005C6.17957 35 7.71971 35 10.8 35Z"
                stroke="black"
                strokeWidth="3.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {(hover || isMobile) && <p>Sales</p>}
          </Link>
        </div>

        {!isEmployee && (
          <div className={`${location.pathname.includes("indents") ? styles.active : ""} `} onClick={() => { setTab("indents"); handleMenuItemClick(); }}>
            <Link to="/store/indents">
              <svg width="38" height="37" viewBox="0 0 38 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 2H31V33H7V2Z" stroke="black" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 10H25" stroke="black" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 18H25" stroke="black" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 26H21" stroke="black" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {(hover || isMobile) && <p>Indents</p>}
            </Link>
          </div>
        )}

        {!isEmployee && (
          <div className={`${location.pathname.includes("customers") ? styles.active : ""} `} onClick={() => { setTab("customers"); handleMenuItemClick(); }}>
            <Link to="/store/customers">
              <svg
                width="38"
                height="37"
                viewBox="0 0 38 37"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g>
                  <path
                    d="M14.1232 22.889C18.3905 22.889 21.8499 18.3528 21.8499 12.757C21.8499 7.16126 18.3905 2.625 14.1232 2.625C9.85584 2.625 6.39648 7.16126 6.39648 12.757C6.39648 18.3528 9.85584 22.889 14.1232 22.889Z"
                    fill="black"
                  />
                  <path
                    d="M21.2801 24.0907C19.3167 26.1921 16.8467 27.468 14.1234 27.468C11.4 27.468 8.86669 26.1921 6.96669 24.0156C3.48334 25.8919 0 28.2936 0 32.0462V33.6223C0 35.4986 1.26667 36.9996 2.85001 36.9996H25.4601C27.0434 36.9996 28.3101 35.4986 28.3101 33.6223V32.0462C28.2467 28.2936 24.8267 25.967 21.2801 24.0907Z"
                    fill="black"
                  />
                </g>
              </svg>
              {(hover || isMobile) && <p>Customers</p>}
            </Link>
          </div>
        )}

        {/* Hide Employees section for store employees */}
        {!isEmployee && (
          <div className={`${location.pathname.includes("employees") ? styles.active : ""} `} onClick={() => { setTab("employees"); handleMenuItemClick(); }}>
            <Link to="/store/employees">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M29.3333 28V25.3333C29.3333 22.8483 27.6336 20.7601 25.3333 20.168M20.6667 4.38768C22.6212 5.17887 24 7.09508 24 9.33333C24 11.5716 22.6212 13.4879 20.6667 14.2789M22.6667 28C22.6667 25.5149 22.6667 24.2725 22.2607 23.2924C21.7193 21.9856 20.6811 20.9473 19.3743 20.406C18.3941 20 17.1517 20 14.6667 20H10.6667C8.18164 20 6.93913 20 5.95903 20.406C4.6522 20.9473 3.61395 21.9856 3.07264 23.2924C2.66667 24.2725 2.66667 25.5149 2.66667 28M18 9.33333C18 12.2789 15.6121 14.6667 12.6667 14.6667C9.72115 14.6667 7.33333 12.2789 7.33333 9.33333C7.33333 6.38781 9.72115 4 12.6667 4C15.6121 4 18 6.38781 18 9.33333Z"
                  stroke="black"
                  strokeWidth="3.33"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {(hover || isMobile) && <p>Employees</p>}
            </Link>
          </div>
        )}

        <div className={`${location.pathname.includes("products") ? styles.active : ""} `} onClick={() => { setTab("products"); handleMenuItemClick(); }}>
          <Link to="/store/products">
            <svg
              width="38"
              height="38"
              viewBox="0 0 38 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g>
                <path
                  d="M3.16634 11.082L2.45825 9.66582C1.92184 9.93403 1.58301 10.4823 1.58301 11.082H3.16634ZM18.9997 3.16536L19.7077 1.74919C19.262 1.52631 18.7373 1.52631 18.2916 1.74919L18.9997 3.16536ZM34.833 11.082H36.4163C36.4163 10.4823 36.0775 9.93403 35.5411 9.66582L34.833 11.082ZM34.833 26.9154L35.5411 28.3316C36.0775 28.0634 36.4163 27.5151 36.4163 26.9154H34.833ZM18.9997 34.832L18.2916 36.2482C18.7373 36.4711 19.262 36.4711 19.7077 36.2482L18.9997 34.832ZM3.16634 26.9154H1.58301C1.58301 27.5151 1.92184 28.0634 2.45825 28.3316L3.16634 26.9154ZM3.87443 12.4982L19.7077 4.58154L18.2916 1.74919L2.45825 9.66582L3.87443 12.4982ZM33.2497 11.082V26.9154H36.4163V11.082H33.2497ZM34.1249 25.4992L18.2916 33.4158L19.7077 36.2482L35.5411 28.3316L34.1249 25.4992ZM19.7077 33.4158L3.87443 25.4992L2.45825 28.3316L18.2916 36.2482L19.7077 33.4158ZM4.74967 26.9154V11.082H1.58301V26.9154H4.74967ZM35.5411 9.66582L19.7077 1.74919L18.2916 4.58154L34.1249 12.4982L35.5411 9.66582Z"
                  fill="black"
                />
                <path d="M260-640q25 0 42.5-17.5T320-700q0-25-17.5-42.5T260-760q-25 0-42.5 17.5T200-700q0 25 17.5 42.5T260-640Zm220 160Z" />
              </g>
            </svg>
            {(hover || isMobile) && <p>Products</p>}
          </Link>
        </div>

        {/* Hide Discounts section for store employees */}
        {!isEmployee && (
          <div className={`${location.pathname.includes("discounts") ? styles.active : ""} `} onClick={() => { setTab("discounts"); handleMenuItemClick(); }}>
            <Link to="/store/discounts">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="32"
                viewBox="0 -960 960 960"
                width="32"
                fill="black"
              >
                <g>
                  <path d="M856-390 570-104q-12 12-27 18t-30 6q-15 0-30-6t-27-18L103-457q-11-11-17-25.5T80-513v-287q0-33 23.5-56.5T160-880h287q16 0 31 6.5t26 17.5l352 353q12 12 17.5 27t5.5 30q0 15-5.5 29.5T856-390ZM513-160l286-286-353-354H160v286l353 354ZM260-640q25 0 42.5-17.5T320-700q0-25-17.5-42.5T260-760q-25 0-42.5 17.5T200-700q0 25 17.5 42.5T260-640Zm220 160Z" />
                </g>
              </svg>
              {(hover || isMobile) && <p>Discounts</p>}
            </Link>
          </div>
        )}

        {/* Expenditures section - available for all users */}
        <div className={`${location.pathname.includes("expenditures") ? styles.active : ""} `} onClick={() => { setTab("expenditures"); handleMenuItemClick(); }}>
          <Link to="/store/expenditures">
            <svg
              width="38"
              height="38"
              viewBox="0 0 38 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 2L2 10V19C2 27.2843 8.71573 34 17 34C25.2843 34 32 27.2843 32 19V10L19 2Z"
                stroke="black"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19 19V9"
                stroke="black"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 16L19 19L26 16"
                stroke="black"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {(hover || isMobile) && <p>Expenditures</p>}
          </Link>
        </div>

        <div className={`${location.pathname.includes("assets") ? styles.active : ""} `} onClick={() => { setTab("assets"); handleMenuItemClick(); }}>
          <Link to="/store/assets">
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="4" y="7" width="28" height="22" rx="4" stroke="black" strokeWidth="3" />
              <path d="M4 14H32" stroke="black" strokeWidth="3" />
              <path d="M12 21H24" stroke="black" strokeWidth="3" strokeLinecap="round" />
              <path d="M12 26H20" stroke="black" strokeWidth="3" strokeLinecap="round" />
            </svg>
            {(hover || isMobile) && <p>Assets</p>}
          </Link>
        </div>

        {/* Profile and Logout menu items - only show on mobile */}
        {isMobile && (
          <>
            <div className={styles.navDivider}></div>
            <div onClick={handleProfileClick} className={`${styles.navMenuItem} ${styles.mobileNavItem}`}>
              <svg
                width="34"
                height="35"
                viewBox="0 0 37 37"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.88155 30.4518L12.7741 24.5592M24.5592 24.5592L30.4518 30.4517M35.3333 18.6667C35.3333 27.8714 27.8714 35.3333 18.6667 35.3333C9.46192 35.3333 2 27.8714 2 18.6667C2 9.46192 9.46192 2 18.6667 2C27.8714 2 35.3333 9.46192 35.3333 18.6667ZM27 18.6667C27 23.269 23.269 27 18.6667 27C14.0643 27 10.3333 23.269 10.3333 18.6667C10.3333 14.0643 14.0643 10.3333 18.6667 10.3333C23.269 10.3333 27 14.0643 27 18.6667Z"
                  stroke="black"
                  strokeWidth="3.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p>Profile</p>
            </div>

            {/* Divisions option - only show for admin on mobile */}
            {isMobile && showDivisionsOption && (
              <div onClick={() => {
                if (isDivisionHead(actualUser) && !userIsAdmin) {
                  localStorage.setItem("activeView", "admin");
                  navigate('/');
                } else {
                  navigate('/divs');
                }
                handleMenuItemClick();
              }} className={`${styles.navMenuItem} ${styles.mobileNavItem}`}>
                <svg
                  width="34"
                  height="35"
                  viewBox="0 0 37 37"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18.5 2L24.5 8H30.5C31.6 8 32.5 8.9 32.5 10V28C32.5 29.1 31.6 30 30.5 30H6.5C5.4 30 4.5 29.1 4.5 28V10C4.5 8.9 5.4 8 6.5 8H12.5L18.5 2Z"
                    stroke="black"
                    strokeWidth="3.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.5 2V8H24.5"
                    stroke="black"
                    strokeWidth="3.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.5 18H24.5"
                    stroke="black"
                    strokeWidth="3.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.5 22H20.5"
                    stroke="black"
                    strokeWidth="3.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p>Divisions</p>
              </div>
            )}

            <div onClick={() => { setIsModalOpen(true); handleMenuItemClick(); }} className={`${styles.navMenuItem} ${styles.mobileNavItem}`}>
              <svg
                width="34"
                height="35"
                viewBox="0 0 37 37"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.20751 10.25C7.06043 5.31813 12.3927 2 18.5001 2C27.6127 2 35 9.38728 35 18.4999C35 27.6126 27.6127 34.9999 18.5001 34.9999C12.3927 34.9999 7.06043 31.6818 4.20751 26.7499M18.4999 25.0999L25.0999 18.4999M25.0999 18.4999L18.4999 11.9M25.0999 18.4999H2"
                  stroke="black"
                  strokeWidth="3.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p>Logout</p>
            </div>
          </>
        )}
      </div>
      {isModalOpen && <LogoutModal isOpen={isModalOpen} onClose={closeModal} />}
    </>
  );
}

export default StoreNavBg;


