import React from 'react';
import { exportToExcel } from '../services/excelService';
import type { PackingList } from '../types/PackingList';

export const PackingListExport: React.FC<{ packingList: PackingList }> = ({ packingList }) => {
  const handleExport = async () => {
    try {
      await exportToExcel(packingList);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <button 
      onClick={handleExport}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Export to Excel
    </button>
  );
}; 