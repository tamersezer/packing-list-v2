import React, { useEffect, useState } from 'react';
import { hsCodeService } from '../../services';
import { toast } from 'react-toastify';
import { LoadingSpinner } from '../common/LoadingSpinner';

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
      const validCodes = codes.filter(code => code && code.trim() !== '');
      setHsCodes(validCodes);
    } catch (error) {
      toast.error('Failed to load HS Codes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHSCodes();
  }, []);

  const formatHSCode = (code: string): string => {
    const numbers = code.replace(/\D/g, '');
    
    if (numbers.length !== 12) {
      throw new Error('HS Code must be exactly 12 digits');
    }

    return `${numbers.slice(0, 4)}.${numbers.slice(4, 6)}.${numbers.slice(6, 8)}.${numbers.slice(8, 10)}.${numbers.slice(10, 12)}`;
  };

  const handleAdd = async () => {
    if (!newHSCode) {
      toast.error('Please enter an HS Code');
      return;
    }

    try {
      const formattedHSCode = formatHSCode(newHSCode);
      
      if (hsCodes.includes(formattedHSCode)) {
        toast.error('This HS Code already exists');
        return;
      }

      await hsCodeService.add(formattedHSCode);
      setHsCodes(prev => [...prev, formattedHSCode]);
      setNewHSCode('');
      toast.success('HS Code added successfully');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to add HS Code');
      }
    }
  };

  const handleDelete = async (code: string) => {
    if (!code || code.trim() === '') {
      return;
    }

    if (window.confirm('Are you sure you want to delete this HS Code?')) {
      try {
        await hsCodeService.delete(code);
        setHsCodes(prev => prev.filter(c => c !== code));
        toast.success('HS Code deleted successfully');
      } catch (error) {
        toast.error('Failed to delete HS Code');
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="sm" text="Loading HS Codes..." />;
  }

  return (
    <div className="space-y-6">
      {/* Add HS Code Form */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={newHSCode}
          onChange={(e) => setNewHSCode(e.target.value)}
          placeholder="Enter HS Code (12 digits)"
          className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Example: 1234567890123 or 1234.56.78.90.12
      </p>

      {/* HS Codes List */}
      <div className="space-y-2">
        {hsCodes.map((code) => (
          <div
            key={code}
            className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150"
          >
            <span className="font-mono text-gray-900 dark:text-white">{code}</span>
            <button
              onClick={() => handleDelete(code)}
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {hsCodes.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No HS Codes found. Add your first one!
          </div>
        )}
      </div>

      {/* Close Button */}
      <div className="flex justify-end">
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