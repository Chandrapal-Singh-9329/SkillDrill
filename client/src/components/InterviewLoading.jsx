import React from "react";
import { BsRobot } from "react-icons/bs";
import { motion } from "motion/react";

const InterviewLoading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center"
        >
          <BsRobot size={36} className="text-green-600" />
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Preparing Your Interview
        </h2>

        <p className="text-gray-500 dark:text-gray-300 mb-8">
          Please wait while AI creates your personalized interview.
        </p>

        <div className="space-y-4 text-left">
          <div className="flex items-center gap-3">
            <span className="text-green-600">✓</span>
            <span className="text-gray-700 dark:text-gray-200">
              Resume Processed
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700 dark:text-gray-200">
              Generating Questions
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700 dark:text-gray-200">
              Creating Interview Session
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewLoading;