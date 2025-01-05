import { Product } from './Product';

export interface PackageRow {
  id: string;
  packageNo: string;
  items: {
    product: Product;
    quantity: number;
  }[];
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
} 