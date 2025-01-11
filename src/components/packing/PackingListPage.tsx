import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { packingListService } from '../../services/api';
import type { PackingList } from '../../types/PackingList';
import { toast } from 'react-toastify';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { exportToExcel } from '../../services/excelService';

export const PackingListPage: React.FC = () => {
  const [packingLists, setPackingLists] = useState<PackingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPackingLists = async () => {
    try {
      const data = await packingListService.getAll();
      setPackingLists(data);
    } catch (error) {
      toast.error('Failed to load packing lists');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackingLists();
  }, []);

  const handleExport = async (list: PackingList) => {
    try {
      await exportToExcel(list);
      toast.success('Packing list exported successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export packing list');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await packingListService.delete(id);
      setPackingLists(prev => prev.filter(list => list.id !== id));
      toast.success('Packing list deleted successfully');
    } catch (error) {
      toast.error('Failed to delete packing list');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading packing lists..." />;
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">Packing Lists</h2>
        <Link
          to="/packing-list/new"
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New List
        </Link>
      </div>

      <div className="space-y-3">
        {packingLists.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No packing lists found. Create your first one!
            </p>
          </div>
        ) : (
          packingLists.map(list => (
            <div key={list.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <Link 
                      to={`/packing-list/${list.id}`}
                      className="text-lg font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {list.name || 'Untitled List'}
                    </Link>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      list.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                    }`}>
                      {list.status.charAt(0).toUpperCase() + list.status.slice(1)}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Created: {new Date(list.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/packing-list/${list.id}`}
                    className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleExport(list)}
                    className="text-sm px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => handleDelete(list.id!)}
                    className="text-sm px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="text-gray-500 dark:text-gray-400">Total Boxes</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {list.totalNumberOfBoxes}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="text-gray-500 dark:text-gray-400">Volume</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {Number(list.totalVolume).toFixed(1)} m³
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="text-gray-500 dark:text-gray-400">Gross Weight</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {Number(list.totalGrossWeight).toFixed(1)} kg
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="text-gray-500 dark:text-gray-400">Net Weight</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {Number(list.totalNetWeight).toFixed(1)} kg 
                  </div>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {list.items.reduce((total, item) => {
                  if (item.packageRange) {
                    return total + (item.packageRange.end - item.packageRange.start + 1);
                  }
                  return total + 1;
                }, 0)} packages
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 