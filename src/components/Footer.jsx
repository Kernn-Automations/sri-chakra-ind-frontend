const styles = {
  container: {
    width: "100%",
    paddingTop: "16px",
    borderTop: "1px solid #e2e8f0",
    marginTop: "8px",
  },
  linkRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: "2px",
    marginBottom: "10px",
  },
  link: {
    fontSize: "11px",
    color: "#64748b",
    textDecoration: "none",
    padding: "0 6px",
  },
  pipe: {
    fontSize: "11px",
    color: "#cbd5e1",
    userSelect: "none",
  },
  poweredBy: {
    textAlign: "center",
    fontSize: "11px",
    color: "#94a3b8",
    margin: "0",
  },
  brandLink: {
    color: "#a92427",
    textDecoration: "none",
    fontWeight: "600",
  },
};

const links = [
  { label: "Terms and Conditions", href: "https://kernn.ai/terms-of-service" },
  { label: "Privacy Policy", href: "https://kernn.ai/privacy-policy" },
  { label: "Refunds", href: "https://kernn.ai/refund-policy" },
  { label: "Contact Us", href: "https://kernn.ai" },
];

function Footer() {
  return (
    <div style={styles.container}>
      <div style={styles.linkRow}>
        {links.map((item, i) => (
          <span
            key={item.label}
            style={{ display: "flex", alignItems: "center" }}
          >
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              style={styles.link}
            >
              {item.label}
            </a>
            {i < links.length - 1 && <span style={styles.pipe}>|</span>}
          </span>
        ))}
      </div>
      <p style={styles.poweredBy}>
        Powered by{" "}
        <a
          href="https://kernn.ai/"
          target="_blank"
          rel="noreferrer"
          style={styles.brandLink}
        >
          KERNN
        </a>
      </p>
    </div>
  );
}

export default Footer;
