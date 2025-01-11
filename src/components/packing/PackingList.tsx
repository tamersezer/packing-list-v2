import React from 'react';
import type { PackingList } from '../../types/PackingList';
import { Link } from 'react-router-dom';

interface PackingListItemProps {
  list: PackingList;
  onExport: (list: PackingList) => void;
  onDelete: (id: string) => void;
}

export const PackingListItem: React.FC<PackingListItemProps> = ({ list, onExport, onDelete }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-start">
        <div>
          <Link 
            to={`/packing-list/${list.id}`}
            className="text-lg font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {list.name}
          </Link>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Created: {new Date(list.createdAt).toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onExport(list)}
            className="text-sm px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export
          </button>
          <button
            onClick={() => onDelete(list.id!)}
            className="text-sm px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <div className="text-gray-500 dark:text-gray-400">Total Boxes</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {list.totalNumberOfBoxes}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <div className="text-gray-500 dark:text-gray-400">Gross Weight</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {list.totalGrossWeight.toFixed(1)} kg
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <div className="text-gray-500 dark:text-gray-400">Net Weight</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {list.totalNetWeight.toFixed(1)} kg
          </div>
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
        {list.items.length} packages
      </div>
    </div>
  );
}; 