import styles from "./Login.module.css"
function LoginButton({onClick}){
    return <>
        <button className={styles.login} onClick={onClick}>Tap to Login</button>
    </>
}

export default LoginButton