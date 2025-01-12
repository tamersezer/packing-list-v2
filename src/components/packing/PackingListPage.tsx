import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { packingListService } from '../../services/api';
import type { PackingList } from '../../types/PackingList';
import { toast } from 'react-toastify';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { exportToExcel } from '../../services/excelService';

type SortField = 'name' | 'createdAt' | 'status' | 'totalPackages' | 'totalVolume' | 'totalGrossWeight';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'draft' | 'completed';

interface ActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onExport: () => void;
  onDelete: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ isOpen, onClose, onEdit, onExport, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5">
      <div className="py-1" role="menu">
        <button
          onClick={onEdit}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
        >
          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button
          onClick={onExport}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
        >
          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
        <button
          onClick={onDelete}
          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
        >
          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
};

export const PackingListPage: React.FC = () => {
  const [packingLists, setPackingLists] = useState<PackingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const filteredAndSortedLists = packingLists
    .filter(list => {
      const matchesSearch = list.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || list.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'totalPackages':
          comparison = a.items.length - b.items.length;
          break;
        case 'totalVolume':
          comparison = a.totalVolume - b.totalVolume;
          break;
        case 'totalGrossWeight':
          comparison = a.totalGrossWeight - b.totalGrossWeight;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (isLoading) {
    return <LoadingSpinner text="Loading packing lists..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Packing Lists</h1>
          <Link
            to="/packing-list/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New List
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-2">
            <input
              type="text"
              placeholder="Search packing lists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortField(field as SortField);
                setSortOrder(order as SortOrder);
              }}
              className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="totalVolume-desc">Volume (High-Low)</option>
              <option value="totalVolume-asc">Volume (Low-High)</option>
              <option value="totalGrossWeight-desc">Weight (High-Low)</option>
              <option value="totalGrossWeight-asc">Weight (Low-High)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredAndSortedLists.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'No packing lists match your filters'
                : 'No packing lists found. Create your first one!'}
            </p>
          </div>
        ) : (
          filteredAndSortedLists.map(list => (
            <div key={list.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Link 
                        to={`/packing-list/${list.id}`}
                        className="text-lg font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {list.name || 'Untitled List'}
                      </Link>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        list.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                      }`}>
                        {list.status.charAt(0).toUpperCase() + list.status.slice(1)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm whitespace-nowrap">
                        <span className="text-gray-500 dark:text-gray-400">Packages:</span>{' '}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {list.items.reduce((total, item) => total + (item.packageRange ? item.packageRange.end - item.packageRange.start + 1 : 1), 0)}
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm whitespace-nowrap">
                        <span className="text-gray-500 dark:text-gray-400">Boxes:</span>{' '}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {Number(list.totalNumberOfBoxes).toFixed(0)}
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm whitespace-nowrap">
                        <span className="text-gray-500 dark:text-gray-400">Weight:</span>{' '}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {Number(list.totalGrossWeight).toFixed(1)}/{Number(list.totalNetWeight).toFixed(1)} kg
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm whitespace-nowrap">
                        <span className="text-gray-500 dark:text-gray-400">Volume:</span>{' '}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {Number(list.totalVolume).toFixed(1)} m³
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative self-start sm:ml-4">
                  <button
                    onClick={() => {
                      if (list.id) {
                        const newValue = activeMenu === list.id ? null : list.id;
                        setActiveMenu(newValue);
                      }
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>
                  <ActionMenu
                    isOpen={activeMenu === list.id}
                    onClose={() => setActiveMenu(null)}
                    onEdit={() => {
                      setActiveMenu(null);
                      navigate(`/packing-list/${list.id}`);
                    }}
                    onExport={() => {
                      setActiveMenu(null);
                      handleExport(list);
                    }}
                    onDelete={() => {
                      setActiveMenu(null);
                      handleDelete(list.id!);
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 