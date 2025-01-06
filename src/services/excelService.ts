import ExcelJS from 'exceljs';
import type { PackingList } from '../types/Product';

export async function exportToExcel(packingList: PackingList) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/templates/PackingListTemplate.xlsx');
    const worksheet = workbook.getWorksheet(1);

    // A10'dan başlayarak verileri ekle
    const startRow = 10;
    let currentRow = startRow;

    packingList.items.forEach((item) => {
      // Temel değerleri ekle
      worksheet.getCell(`A${currentRow}`).value = item.boxNo;
      worksheet.getCell(`B${currentRow}`).value = item.product.name;
      worksheet.getCell(`C${currentRow}`).value = item.quantity;
      worksheet.getCell(`D${currentRow}`).value = item.product.weights.net;
      worksheet.getCell(`E${currentRow}`).value = item.product.weights.gross;
      worksheet.getCell(`F${currentRow}`).value = {
        formula: `=C${currentRow}*E${currentRow}` // Toplam ağırlık formülü
      };

      // Eğer aynı kutu numarası için birden fazla ürün varsa
      if (item.mergeRows && item.mergeRows > 1) {
        const mergeEndRow = currentRow + item.mergeRows - 1;
        
        // Box No sütununu birleştir
        worksheet.mergeCells(`A${currentRow}:A${mergeEndRow}`);
        
        // Hücre stillerini koru
        worksheet.getCell(`A${currentRow}`).style = {
          ...worksheet.getCell(`A${currentRow}`).style,
          alignment: { vertical: 'middle', horizontal: 'center' }
        };
      }

      currentRow++;
    });

    // Toplam satırı
    const totalRow = currentRow;
    worksheet.getCell(`C${totalRow}`).value = { 
      formula: `=SUM(C${startRow}:C${totalRow-1})` 
    };
    worksheet.getCell(`F${totalRow}`).value = { 
      formula: `=SUM(F${startRow}:F${totalRow-1})` 
    };

    // Excel dosyasını oluştur ve indir
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `PackingList_${packingList.invoiceNo || 'export'}.xlsx`;
    link.click();

  } catch (error) {
    console.error('Excel export error:', error);
    throw error;
  }
} 