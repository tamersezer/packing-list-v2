import { Product } from './Product';

export interface PackageItem {
  product: Product;
  quantity: number;
  totalGrossWeight: number;
  totalNetWeight: number;
}

export interface PackageRow {
  id: string;
  items: PackageItem[];
  packageNumber: string;
  totalGrossWeight: number;
  totalNetWeight: number;
}

export interface PackingList {
  id?: string;
  name: string;
  date: string;
  packageType: 'box' | 'pallet';
  items: PackageRow[];
  totals: {
    grossWeight: number;
    netWeight: number;
    packageCount: number;
  };
} 