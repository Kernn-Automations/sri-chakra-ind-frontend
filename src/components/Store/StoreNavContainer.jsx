import { useState, useEffect } from "react";
import Logo from "../Dashboard/navs/Logo";
import StoreNavBg from "./StoreNavBg";

function StoreNavContainer({ hover, setTab, tab, user, closeMobileMenu }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {!isMobile && <Logo />}
      <StoreNavBg hover={hover} setTab={setTab} tab={tab} user={user} closeMobileMenu={closeMobileMenu} />
    </>
  );
}

export default StoreNavContainer;


