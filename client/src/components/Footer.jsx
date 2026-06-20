import React from 'react'
import {BsRobot} from 'react-icons/bs'

const Footer = () => {
  return (
    <div className='bg-[#f3f3f3] flex justify-center px-4 pb-10 pt-10 dark:bg-gray-950'>
        <div className='w-full max-w-6xl bg-white dark:bg-gray-900 rounded-[24px] shadow-sm border border-gray-200 dark:border-gray-700 py-8 px-3 text-center'>
            <div className='flex justify-center items-center gap-3 mb-3'>
                <div className='bg-black text-white p-2 rounded-lg'>
                    <BsRobot size={16} />
                </div>
                <h2 className='font-semibold text-black dark:text-white'>SkillDrill</h2>
            </div>
            <p className='text-gray-500 text-base max-w-xl mx-auto dark:text-gray-300'>
                AI-powered interview preparation platform designed to improve communication skills, technical depth and professional confidence.
            </p>
        </div>
      
    </div>
  )
}

export default Footer
