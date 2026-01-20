import bglogo from "../assets/logo_no_bg.png";

function Header() {
  const styles = {
    logocol: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
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
      color: "#1e293b", // professional dark slate
      textAlign: "center",
    },
    divider: {
      marginTop: "8px",
      width: "56px",
      height: "3px",
      backgroundColor: "#2563eb", // brand accent
      borderRadius: "2px",
    },
  };

  return (
    <>
      <div style={styles.logocol}>
        <img style={styles.logo} src={bglogo} alt="logo-bg" />

        <h1 style={styles.companyName}>Sri Chakra Industries</h1>

        <div style={styles.divider} />
      </div>
    </>
  );
}

export default Header;
