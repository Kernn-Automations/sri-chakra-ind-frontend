import styles from "./Footer.module.css";
function Footer() {
  return (
    <div className={styles.footcontainer}>
      <div className={styles.footer}>
        <p className={styles.p1}>
          <a href="#" className="nav-link d-inline">Terms and Conditions</a>
          <span className={styles.pipe}>|</span>
          <a href="#" className="nav-link d-inline">Privacy Policy</a>
          <span className={styles.pipe}>|</span>
          <a href="#" className="nav-link d-inline">Refunds</a>
          <span className={styles.pipe}>|</span>
          <a href="#" className="nav-link d-inline">Contact Us</a>
        </p>
        <hr />
        <p className={styles.pwd}>
          Powered by <span className={styles.bnd}><a target="_blank" href="https://kernn.ai/" className="nav-link d-inline">KERNN</a></span>
        </p>
      </div>
    </div>
  );
}

export default Footer;