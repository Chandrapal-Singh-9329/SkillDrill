import React from "react";

const SkeletonCard = () => {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-6 w-40 bg-gray-300 dark:bg-gray-700 rounded mb-3"></div>

          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>

          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>

        <div>
          <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>

          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;