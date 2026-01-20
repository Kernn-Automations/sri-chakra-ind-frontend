import styles from "./NavContainer.module.css";
// import smlogo from "../../../images/logo-sm2.png"
import smlogo from "../../../assets/logo_no_bg.png";

function Logo() {
  return (
    <>
      <div className={styles.logo}>
        <img src={smlogo} alt="logo-sm" />
      </div>
    </>
  );
}

export default Logo;
