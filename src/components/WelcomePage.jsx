function WelcomePage({ data }) {
  const { saveToken, saveRefreshToken } = useAuth();

  const user = data?.user;
  const name = user?.name || "there";

  function onClick() {
    if (!data) return;

    saveToken(data.accesstoken);
    saveRefreshToken(data.refresh);
    localStorage.setItem("user", JSON.stringify(user));

    if (user?.userDivision) {
      localStorage.setItem(
        "selectedDivision",
        JSON.stringify(user.userDivision),
      );
      localStorage.setItem("showDivisions", "false");
    }
  }

  return (
    <>
      <div className={styles.welcomecontainer}>
        <div className={styles.welcomebox}>
          <img className={styles.img} src={smlogo} alt="logo-sm" />

          {/* ✅ Company Name */}
          <h1 className={styles.companyName}>Sri Chakra Industries</h1>

          <p className={styles.wel}>
            Welcome <span>{name}</span>
          </p>

          <p className="text-center">
            <button
              onClick={onClick}
              className={styles.get}
              onKeyDown={onClick}
            >
              Get Started
            </button>
          </p>
        </div>
      </div>
      <FootLink />
    </>
  );
}

export default WelcomePage;
