export interface Product {
  id?: string;
  name: string;
  hsCode: string;
  boxQuantity: number;
  boxDimensions: {
    length: number;
    width: number;
    height: number;
  };
  weights: {
    net: number;
    gross: number;
  };
}

export interface ProductResponse {
  items: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
} 