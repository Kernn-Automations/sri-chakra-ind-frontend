import { useAuth } from "../../Auth";

function Logout({setTab}){

    const {removeToken} = useAuth();

    if(confirm("Are You Sure You want to logout") == true){
       removeToken()
    }
    else{
        console.log("gng to home")
        setTab("home")
    }
    
   
    return <>
       
    
    </>
}

export default Logout