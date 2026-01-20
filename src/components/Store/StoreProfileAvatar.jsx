import React, { useState } from "react";
import styles from "../Dashboard/Dashboard.module.css";
import { Avatar} from "@/components/ui/avatar";
import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import LogoutModal from "../Dashboard/LogoutModal";
import { Link, useNavigate } from "react-router-dom";
import { isAdmin, isStoreEmployee, isDivisionHead } from "../../utils/roleUtils";

function StoreProfileAvatar({ user, setTab }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  
  // Handle user object structure - might be user.user or just user
  const actualUser = user?.user || user || {};
  const userName = actualUser.name || actualUser.user?.name || user?.name || "";
  
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Check if user has admin role - only admins should see divisions in staff view
  const userIsAdmin = isAdmin(actualUser);
  const isEmployee = isStoreEmployee(actualUser);
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
  };

  return (
    <>
      <PopoverRoot>
        <PopoverTrigger asChild>
          <button>
            <Avatar
              className={styles.avatar}
              name={userName}
              colorPalette="var(--primary-color)"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className={styles.profilecontent}>
          <PopoverBody className={styles.profilebody}>
            <div onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
              <p>
                <span>
                  <svg
                    width="37"
                    height="37"
                    viewBox="0 0 37 37"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.88155 30.4518L12.7741 24.5592M24.5592 24.5592L30.4518 30.4517M35.3333 18.6667C35.3333 27.8714 27.8714 35.3333 18.6667 35.3333C9.46192 35.3333 2 27.8714 2 18.6667C2 9.46192 9.46192 2 18.6667 2C27.8714 2 35.3333 9.46192 35.3333 18.6667ZM27 18.6667C27 23.269 23.269 27 18.6667 27C14.0643 27 10.3333 23.269 10.3333 18.6667C10.3333 14.0643 14.0643 10.3333 18.6667 10.3333C23.269 10.3333 27 14.0643 27 18.6667Z"
                      stroke="black"
                      stroke-width="3.33333"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                Profile
              </p>
            </div>

            {/* Divisions option - only show for admin and store manager roles */}
            {showDivisionsOption && (
            <div onClick={() => {
              if (isDivisionHead(actualUser) && !userIsAdmin) {
                localStorage.setItem("activeView", "admin");
                navigate('/');
              } else {
                navigate('/divs');
              }
            }}>
                <p>
                  <span>
                    <svg
                      width="37"
                      height="37"
                      viewBox="0 0 37 37"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18.5 2L24.5 8H30.5C31.6 8 32.5 8.9 32.5 10V28C32.5 29.1 31.6 30 30.5 30H6.5C5.4 30 4.5 29.1 4.5 28V10C4.5 8.9 5.4 8 6.5 8H12.5L18.5 2Z"
                        stroke="black"
                        stroke-width="3.33333"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M18.5 2V8H24.5"
                        stroke="black"
                        stroke-width="3.33333"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M12.5 18H24.5"
                        stroke="black"
                        stroke-width="3.33333"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M12.5 22H20.5"
                        stroke="black"
                        stroke-width="3.33333"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </span>
                  Divisions
                </p>
              </div>
            )}

            <div onClick={() => setIsModalOpen(true)}>
              <p>
                <span>
                  <svg
                    width="37"
                    height="37"
                    viewBox="0 0 37 37"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.20751 10.25C7.06043 5.31813 12.3927 2 18.5001 2C27.6127 2 35 9.38728 35 18.4999C35 27.6126 27.6127 34.9999 18.5001 34.9999C12.3927 34.9999 7.06043 31.6818 4.20751 26.7499M18.4999 25.0999L25.0999 18.4999M25.0999 18.4999L18.4999 11.9M25.0999 18.4999H2"
                      stroke="black"
                      stroke-width="3.33333"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                Logout
              </p>
            </div>
          </PopoverBody>
        </PopoverContent>
      </PopoverRoot>

      {isModalOpen && <LogoutModal isOpen={isModalOpen} onClose={closeModal} />}
    </>
  );
}

export default StoreProfileAvatar;
