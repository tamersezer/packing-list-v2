import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { packingListService } from '../../services/api';
import type { PackingList } from '../../types/PackingList';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

export const PackingListPage: React.FC = () => {
  const [packingLists, setPackingLists] = useState<PackingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPackingLists = async () => {
    try {
      const data = await packingListService.getAll();
      setPackingLists(data);
    } catch (error) {
      toast.error('Failed to fetch packing lists');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackingLists();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this packing list?')) {
      try {
        await packingListService.delete(id);
        toast.success('Packing list deleted successfully');
        fetchPackingLists();
      } catch (error) {
        toast.error('Failed to delete packing list');
      }
    }
  };

  const handleExportToExcel = (packingList: PackingList) => {
    let rowIndex = 1; // Başlık satırı için 0. satırı atlıyoruz
    const merges: XLSX.Range[] = [];
    
    const formatNumber = (num: number): number => {
      return Number(num.toFixed(1));
    };

    const excelData = packingList.items.flatMap(packageRow => {
      const startRowIndex = rowIndex;
      const rowCount = packageRow.items.length;
      
      // Birleştirilecek hücreleri ekle
      if (rowCount > 1) {
        // Package No sütunu (A sütunu)
        merges.push({
          s: { r: startRowIndex, c: 0 },
          e: { r: startRowIndex + rowCount - 1, c: 0 }
        });
        // Gross Weight sütunu (D sütunu)
        merges.push({
          s: { r: startRowIndex, c: 3 },
          e: { r: startRowIndex + rowCount - 1, c: 3 }
        });
        // Net Weight sütunu (E sütunu)
        merges.push({
          s: { r: startRowIndex, c: 4 },
          e: { r: startRowIndex + rowCount - 1, c: 4 }
        });
        // Dimensions sütunu (G sütunu)
        merges.push({
          s: { r: startRowIndex, c: 6 },
          e: { r: startRowIndex + rowCount - 1, c: 6 }
        });
      }

      const rows = packageRow.items.map((item, index) => {
        const row = {
          'Package No': index === 0 ? packageRow.packageNo : '',
          'Product Name': item.product.name || '-',
          'Quantity': item.quantity || 0,
          'Gross Weight': index === 0 ? formatNumber(packageRow.grossWeight) : '',
          'Net Weight': index === 0 ? formatNumber(packageRow.netWeight) : '',
          'HS Code': item.product.hsCode || '-',
          'Dimensions': index === 0 
            ? `${formatNumber(packageRow.dimensions.length)} × ${formatNumber(packageRow.dimensions.width)} × ${formatNumber(packageRow.dimensions.height)}` 
            : ''
        };
        rowIndex++;
        return row;
      });

      return rows;
    });

    // Toplamları ekle
    excelData.push({
      'Package No': '',
      'Product Name': 'TOTAL',
      'Quantity': packingList.totalNumberOfBoxes || 0,
      'Gross Weight': formatNumber(packingList.totalGrossWeight),
      'Net Weight': formatNumber(packingList.totalNetWeight),
      'HS Code': '',
      'Dimensions': ''
    });

    // Büyük listeler için chunk'lara böl
    const CHUNK_SIZE = 1000;
    if (excelData.length > CHUNK_SIZE) {
      toast.warn(`Large packing list detected (${excelData.length} rows). Export may take a moment.`);
    }

    try {
      // Excel dosyası oluştur
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Birleştirmeleri uygula
      worksheet['!merges'] = merges;

      // Stil ayarları
      worksheet['!cols'] = [
        { width: 12 }, // Package No
        { width: 30 }, // Product Name
        { width: 10 }, // Quantity
        { width: 15 }, // Gross Weight
        { width: 15 }, // Net Weight
        { width: 20 }, // HS Code
        { width: 20 }, // Dimensions
      ];

      // Başlık satırı için stil
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "CCCCCC" } },
          alignment: { vertical: 'center', horizontal: 'center' }
        };
      }

      // Toplam satırı için stil
      const lastRowIndex = rowIndex;
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: lastRowIndex, c: C });
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          font: { bold: true },
          border: {
            top: { style: 'thin' }
          }
        };
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Packing List');

      // Dosyayı indir
      const fileName = `${packingList.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      toast.error('Failed to export to Excel');
      console.error('Excel export error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Packing Lists</h2>
        <button
          onClick={() => navigate('/packing-list/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New Packing List
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packingLists.map((list) => (
          <div
            key={list.id}
            className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {list.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Created: {new Date(list.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`
                px-2 py-1 text-xs font-medium rounded-full
                ${list.status === 'completed' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                }
              `}>
                {list.status.charAt(0).toUpperCase() + list.status.slice(1)}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p>Total Boxes: {list.totalNumberOfBoxes}</p>
              <p>Gross Weight: {list.totalGrossWeight} kg</p>
              <p>Net Weight: {list.totalNetWeight} kg</p>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => handleExportToExcel(list)}
                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
              >
                Export to Excel
              </button>
              <button
                onClick={() => navigate(`/packing-list/${list.id}`)}
                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(list.id!)}
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {packingLists.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            No packing lists found. Create your first one!
          </div>
        )}
      </div>
    </div>
  );
}; 