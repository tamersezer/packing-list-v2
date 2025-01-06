import type { Product } from '../types/Product';
import type { PackingList } from '../types/PackingList';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const productService = {
  async getAll(): Promise<Product[]> {
    const response = await fetch(`${API_URL}/products`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    const data = await response.json();
    return data;
  },

  async create(product: Product): Promise<Product> {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create product');
    }
    
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
  },

  async update(id: string, product: Product): Promise<Product> {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update product');
    }
    
    return response.json();
  }
};

export const hsCodeService = {
  async getAll(): Promise<string[]> {
    const response = await fetch(`${API_URL}/hsCodes`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch HS Codes');
    }
    
    const data = await response.json();
    return data.map((item: { code: string }) => item.code);
  },

  async add(hsCode: string): Promise<void> {
    const response = await fetch(`${API_URL}/hsCodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: hsCode }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add HS Code');
    }
  },

  async delete(code: string): Promise<void> {
    const response = await fetch(`${API_URL}/hsCodes`);
    if (!response.ok) {
      throw new Error('Failed to fetch HS Codes');
    }
    const data = await response.json();
    
    const item = data.find((item: { code: string }) => item.code === code);
    if (!item) {
      throw new Error('HS Code not found');
    }
    
    const deleteResponse = await fetch(`${API_URL}/hsCodes/${item.id}`, {
      method: 'DELETE',
    });
    
    if (!deleteResponse.ok) {
      throw new Error('Failed to delete HS Code');
    }
  }
};

export const packingListService = {
  async getAll(): Promise<PackingList[]> {
    const response = await fetch(`${API_URL}/packingLists`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch packing lists');
    }
    
    return response.json();
  },

  async create(packingList: PackingList): Promise<PackingList> {
    const response = await fetch(`${API_URL}/packingLists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(packingList),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create packing list');
    }
    
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/packingLists/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete packing list');
    }
  },

  async update(id: string, packingList: PackingList): Promise<PackingList> {
    const response = await fetch(`${API_URL}/packingLists/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(packingList),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update packing list');
    }
    
    return response.json();
  },

  async getById(id: string): Promise<PackingList> {
    const response = await fetch(`${API_URL}/packingLists/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch packing list');
    }
    
    return response.json();
  }
}; 