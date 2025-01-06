import * as XLSX from 'xlsx';
import type { PackingList, PackageRow } from '../types/PackingList';

export const exportToExcel = async (packingList: PackingList) => {
  // Excel için veriyi hazırla
  const rows = packingList.items.map((packageRow: PackageRow) => {
    const weights = {
      gross: packageRow.totalGrossWeight,
      net: packageRow.totalNetWeight
    };

    // Palet ağırlığını ekle
    if (packageRow.packageNumber.indexOf('to') === -1 && packingList.packageType === 'pallet') {
      weights.gross += 24; // Palet ağırlığı
    }

    return {
      'Package No': packageRow.packageNumber,
      'Products': packageRow.items.map(item => item.product.name).join(', '),
      'Gross Weight (kg)': weights.gross.toFixed(2),
      'Net Weight (kg)': weights.net.toFixed(2)
    };
  });

  // Excel workbook oluştur
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Worksheet'i workbook'a ekle
  XLSX.utils.book_append_sheet(wb, ws, 'Packing List');

  // Excel dosyasını indir
  XLSX.writeFile(wb, `${packingList.name}_${packingList.date}.xlsx`);
}; 