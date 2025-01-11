import type { Product, BoxVariant } from './Product';

export interface PackageItem {
  product: Product;
  variant: BoxVariant;
  quantity: number;
}

export interface PackageRow {
  id: string;
  packageNo: string;
  packageRange?: {
    start: number;
    end: number;
  };
  items: PackageItem[];
  grossWeight: number;
  netWeight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  hsCode?: string;
}

export interface PackingList {
  id?: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'completed';
  items: PackageRow[];
  totalGrossWeight: number;
  totalNetWeight: number;
  totalNumberOfBoxes: number;
  totalVolume: number;
}

export interface PackageRange {
  start: number;
  end: number;
}

// Yardımcı fonksiyonlar
export const calculatePackageWeights = (items: PackageItem[], isPallet: boolean = false) => {
  const weights = items.reduce(
    (acc, item) => {
      // Her ürün için oransal ağırlık hesabı
      const weightRatio = item.quantity / item.variant.boxQuantity;
      const grossWeight = weightRatio * item.variant.weights.gross;
      const netWeight = weightRatio * item.variant.weights.net;

      return {
        gross: acc.gross + grossWeight,
        net: acc.net + netWeight
      };
    },
    { gross: 0, net: 0 }
  );

  // Eğer paletse, palet ağırlığını ekle
  if (isPallet) {
    weights.gross += 24; // PALLET_WEIGHT
  }

  // Son olarak yuvarla
  return {
    gross: Number(weights.gross.toFixed(1)),
    net: Number(weights.net.toFixed(1))
  };
};

export const calculateTotalBoxes = (items: PackageItem[]): number => {
  return items.reduce((total, item) => total + (item.quantity / item.variant.boxQuantity), 0);
};

export const calculatePackingListTotals = (rows: PackageRow[]): {
  grossWeight: number;
  netWeight: number;
  totalBoxes: number;
  totalVolume: number;
} => {
  return rows.reduce(
    (acc, row) => ({
      grossWeight: acc.grossWeight + row.grossWeight,
      netWeight: acc.netWeight + row.netWeight,
      totalBoxes: acc.totalBoxes + calculateTotalBoxes(row.items),
      totalVolume: acc.totalVolume + calculateVolume(row.dimensions, row.packageRange)
    }),
    { grossWeight: 0, netWeight: 0, totalBoxes: 0, totalVolume: 0 }
  );
};

export const validatePackageRow = (row: PackageRow): string[] => {
  const errors: string[] = [];

  if (row.items.length === 0) {
    errors.push('Package must contain at least one item');
  }

  if (row.grossWeight < row.netWeight) {
    errors.push('Gross weight cannot be less than net weight');
  }

  if (row.dimensions.length <= 0 || row.dimensions.width <= 0 || row.dimensions.height <= 0) {
    errors.push('All dimensions must be greater than 0');
  }

  return errors;
};

// Hacim hesaplama fonksiyonu
export const calculateVolume = (
  dimensions: { length: number; width: number; height: number },
  packageRange?: { start: number; end: number }
): number => {
  const singleVolume = (dimensions.length * dimensions.width * dimensions.height) / 1000000; // cm³'ten m³'e çevir
  
  if (packageRange) {
    // Range varsa koli sayısıyla çarp
    const boxCount = packageRange.end - packageRange.start + 1;
    return singleVolume * boxCount;
  }
  
  return singleVolume;
}; 