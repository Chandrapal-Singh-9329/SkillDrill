import React, {useEffect,useState} from 'react'
import {useParams} from 'react-router-dom';
import axios from 'axios';
const serverUrl = import.meta.env.VITE_SERVER_URL;
import Step3Report from '../components/Step3Report'

const InterviewReport = () => {
  const [report, setReport] = useState(null);
  const {id} = useParams();

  useEffect(()=>{
    const fetchReport = async () => {
    try {
      const result = await axios.get(serverUrl + '/api/interview/report/' + id, {withCredentials:true})

      console.log(result.data);
      setReport(result.data)
    } catch (error) {
      console.log(error)
    }
  }
    fetchReport();
  },[id])

  if(!report){
    return(
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-gray-500 text-lg'>
          Loading Report...
        </p>
      </div>
    )
  }
  
  return (
    <div>
      <Step3Report report={report}/>
    </div>
  )
}

export default InterviewReport
