import {useState ,useEffect , createContext} from "react"
import axios from "axios";
export const UserContext =createContext(null);

export const UserContextprovider=(props)=>{

const [curruser,setcurruser]=useState({});
useEffect(()=>{
    async function getuser(){
        const response=await axios.get("/auth/authstatus",{withCredentials:true});
        console.log("the response in contex file",response);
        setcurruser(response.data.user);
    }
    getuser();
},[]);
return (
<UserContext.Provider value={{curruser}}>
{props.children}
</UserContext.Provider>
)

}
