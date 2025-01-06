import { Product } from './Product';

export interface PackingListItem {
  boxNo: string;
  product: Product;
  quantity: number;
  mergeRows?: number;
}

export interface PackingList {
  id?: string;
  invoiceNo?: string;
  date?: string;
  items: PackingListItem[];
} 