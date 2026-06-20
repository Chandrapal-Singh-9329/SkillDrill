import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from "axios";
import {FaArrowLeft} from 'react-icons/fa';
const serverUrl = import.meta.env.VITE_SERVER_URL;


const InterviewHistory = () => {
    const [interviews, setInterviews] = useState([]);
    const navigate = useNavigate();

    useEffect(()=>{
        const getMyInterviews = async () => 
        {
            try {
            const result = await axios.get(serverUrl + "/api/interview/get-interview", {withCredentials:true})

            console.log(result.data);
            setInterviews(result.data);
            } catch (error) {
                console.log(error)
            }
        }

        getMyInterviews();
        
    }, [])
  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 to-emerald-50 py-10 dark:from-gray-950 dark:to-gray-900'>
        <div className='w-[90vw] lg:w-[70vw] max-w-[90%] mx-auto'>
            <div className='mb-10 w-full flex items-start gap-4 flex-wrap'>
                <button 
                onClick={()=> navigate('/')}
                className='mt-1 p-3 rounded-full bg-white shadow hover:shadow-md transition dark:border-gray-700'>
                <FaArrowLeft className='text-gray-900 border-gray-900'/>
                </button>

                <div>
                    <h1 className='text-3xl font-bold flex-nowrap text-gray-800 dark:text-white'>
                        Interview History
                    </h1>
                    <p className='text-gray-500 mt-2 dark:text-gray-300'>
                        Track your past interviews and performance reports
                    </p>
                </div>
            </div>

            {interviews.length === 0 ? 
            <div className='bg-white dark:bg-gray-900 p-10 rounded-2xl shadow border border-gray-200 dark:border-gray-700 text-center'> 
            <p>
                No interviews found. Start your first interview.
            </p>
            </div>

            :

            <div className='grid gap-6'>
                {interviews.map((item,index)=>(
                    <div key={index} 
                    onClick={()=> navigate(`/report/${item._id}`)}
                    className='bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:bg-gray-900 dark:border-gray-500'>
                        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'> 
                            <div>
                                <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>
                                    {item.role}
                                </h3>

                                <p className='text-gray-500 text-sm mt-1 dark:text-gray-300'>
                                    {item.experience} • {item.mode}
                                </p>

                                <p className='text-xs text-gray-400 mt-2 ark:text-gray-500'>
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            <div className='flex items-center gap-6'>
                                <div className='text-right'>
                                    <p className='text-xl font-bold text-emerald-600'>
                                        {item.finalScore || 0}/10
                                    </p>
                                    <p className='text-xs text-gray-400 '>
                                        Overall Score
                                    </p>
                                </div>

                                <span 
                                className={`px-4 py-1 rounded-full text-xs font-medium ${item.status === "completed"
                                    ? "bg-emerald-200 text-emerald-900"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                                >
                                    {item.status}
                                </span>
                            </div>
                        </div>
                </div>
                ))}
                
            </div>
            }
        </div>
      
    </div>
  )
}

export default InterviewHistory
