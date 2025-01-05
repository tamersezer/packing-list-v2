import React, { useEffect, useState } from 'react';
import { hsCodeService } from '../../services/api';
import { toast } from 'react-toastify';

interface HSCodeListProps {
  onClose: () => void;
}

export const HSCodeList: React.FC<HSCodeListProps> = ({ onClose }) => {
  const [hsCodes, setHsCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newHSCode, setNewHSCode] = useState('');

  const fetchHSCodes = async () => {
    try {
      const codes = await hsCodeService.getAll();
      setHsCodes(codes);
    } catch (error) {
      toast.error('Failed to load HS Codes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHSCodes();
  }, []);

  const handleAdd = async () => {
    if (!newHSCode.trim()) {
      toast.error('Please enter an HS Code');
      return;
    }

    try {
      await hsCodeService.add(newHSCode);
      toast.success('HS Code added successfully');
      setNewHSCode('');
      fetchHSCodes();
    } catch (error) {
      toast.error('Failed to add HS Code');
    }
  };

  const handleDelete = async (code: string) => {
    if (window.confirm(`Are you sure you want to delete HS Code: ${code}?`)) {
      try {
        await hsCodeService.delete(code);
        toast.success('HS Code deleted successfully');
        fetchHSCodes();
      } catch (error) {
        toast.error('Failed to delete HS Code');
      }
    }
  };

  if (isLoading) {
    return <div className="py-4 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newHSCode}
          onChange={(e) => setNewHSCode(e.target.value)}
          placeholder="Enter new HS Code"
          className="flex-1 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md max-h-96 overflow-y-auto">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {hsCodes.map((code) => (
            <li key={code} className="px-4 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{code}</span>
              <button
                onClick={() => handleDelete(code)}
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}; 