import React from 'react';

export const PackingList: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Packing List</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <p className="text-gray-600 dark:text-gray-300">Packing list content will be added here...</p>
      </div>
    </div>
  );
}; 