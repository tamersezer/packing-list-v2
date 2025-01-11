import * as ExcelJS from 'exceljs';
import type { PackingList, PackageRow } from '../types/PackingList';

const TEMPLATE_URL = '/templates/PackingListTemplate.xlsx';

export async function exportToExcel(packingList: PackingList) {
  try {
    const response = await fetch(TEMPLATE_URL);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.status} - ${response.statusText}`);
    }
    
    const templateArrayBuffer = await response.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(templateArrayBuffer);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('Worksheet not found in template');
    }

    // Update tarihi ekle (F6 hücresi)
    worksheet.getCell('F6').value = new Date(packingList.updatedAt).toLocaleDateString();

    // A10'dan başlayarak verileri ekle
    const startRow = 10;
    let currentRow = startRow;

    packingList.items.forEach((packageRow: PackageRow) => {
      const packageStartRow = currentRow;
      
      packageRow.items.forEach((item, index) => {
        // Paket numarası sadece ilk üründe göster
        worksheet.getCell(`A${currentRow}`).value = index === 0 ? packageRow.packageNo : '';
        
        // Ürün bilgileri
        worksheet.getCell(`B${currentRow}`).value = item.product.name;
        worksheet.getCell(`C${currentRow}`).value = item.quantity;
        
        // Ağırlık bilgileri sadece paketin ilk ürününde göster
        if (index === 0) {
          worksheet.getCell(`D${currentRow}`).value = packageRow.grossWeight;
          worksheet.getCell(`E${currentRow}`).value = packageRow.netWeight;
        }
        
        // HS kodu
        worksheet.getCell(`F${currentRow}`).value = item.product.hsCode;

        // Ebatları sadece ilk üründe göster
        if (index === 0) {
          worksheet.getCell(`G${currentRow}`).value = `${packageRow.dimensions.length} x ${packageRow.dimensions.width} x ${packageRow.dimensions.height}`;
        }

        currentRow++;
      });

      // Eğer pakette birden fazla ürün varsa hücreleri birleştir
      if (packageRow.items.length > 1) {
        worksheet.mergeCells(`A${packageStartRow}:A${currentRow - 1}`);
        worksheet.mergeCells(`D${packageStartRow}:D${currentRow - 1}`);
        worksheet.mergeCells(`E${packageStartRow}:E${currentRow - 1}`);
        worksheet.mergeCells(`G${packageStartRow}:G${currentRow - 1}`);
      }
    });

    // Toplam paket sayısını hesapla
    const totalPackages = packingList.items.reduce((total, item) => {
      if (item.packageRange) {
        return total + (item.packageRange.end - item.packageRange.start + 1);
      }
      return total + 1;
    }, 0);

    // Toplam paket sayısı (B103 hücresi)
    worksheet.getCell('B103').value = totalPackages;

    // Toplam hacim (B106 hücresi)
    worksheet.getCell('B106').value = `${Number(packingList.totalVolume).toFixed(1)} cbm`;

    // Excel dosyasını oluştur ve indir
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `PackingList_${packingList.name || 'export'}.xlsx`;
    link.click();

  } catch (error) {
    console.error('Excel export error:', error);
    if (error instanceof Error) {
      throw new Error(`Export failed: ${error.message}`);
    } else {
      throw new Error('Export failed: Unknown error');
    }
  }
} 