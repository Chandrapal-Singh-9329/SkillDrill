import {Routes , Route} from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import {useEffect} from "react";
import axios from "axios";
import {useDispatch} from 'react-redux';
import {setUserData} from './redux/userSlice.js'

function App() {
  const dispatch = useDispatch();
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  useEffect(()=>{
    const getUser = async () => {
      try {
        const result = await axios.get(serverUrl + "/api/user/current-user", {
          withCredentials:true
        });
        dispatch(setUserData(result.data));
        
      } catch (error) {
        console.log(error)
        dispatch(setUserData(null));
      } 
    }
    getUser();

  } ,[dispatch])


  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route  path='/auth' element={<Auth />} />
    </Routes>
    
  )
}

export default App
