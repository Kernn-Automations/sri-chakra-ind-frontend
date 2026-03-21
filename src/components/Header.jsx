import bglogo from "../assets/logo_no_bg.png";

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: "24px",
  },
  logo: {
    width: "140px",
    height: "auto",
  },
  companyName: {
    marginTop: "14px",
    fontSize: "24px",
    fontWeight: "700",
    letterSpacing: "0.6px",
    color: "#1e293b",
    textAlign: "center",
  },
  divider: {
    marginTop: "8px",
    width: "56px",
    height: "3px",
    backgroundColor: "#2563eb",
    borderRadius: "2px",
  },
};

function Header() {
  return (
    <div style={styles.wrapper}>
      <img style={styles.logo} src={bglogo} alt="logo" />
      <h1 style={styles.companyName}>Sri Chakra Industries</h1>
      <div style={styles.divider} />
    </div>
  );
}

export default Header;
