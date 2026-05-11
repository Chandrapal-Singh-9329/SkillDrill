import {Routes , Route} from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import {useEffect} from "react";
import axios from "axios";

function App() {
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(()=>{
    const getUser = async () => {
      try {
        const result = await axios.get(serverUrl + "/api/user/current-user", {
          withCredentials:true
        });
        console.log(result);
        
      } catch (error) {
        console.log(error)
        
      } 
    }
    getUser();

  } ,[])


  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route  path='/auth' element={<Auth />} />
    </Routes>
    
  )
}

export default App
