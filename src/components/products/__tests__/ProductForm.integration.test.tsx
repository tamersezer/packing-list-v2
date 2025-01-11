import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductForm } from '../ProductForm';
import { productService } from '../../../services/api';
import { toast } from 'react-toastify';

jest.mock('../../../services/api');
jest.mock('react-toastify');

describe('ProductForm Integration', () => {
  const mockProduct = {
    name: 'Test Product',
    hsCode: '1234.56.78.90.00',
    variants: [
      {
        id: 'v1',
        name: 'Standard Box',
        boxQuantity: 24,
        boxDimensions: {
          length: 30,
          width: 20,
          height: 15
        },
        weights: {
          gross: 2.5,
          net: 2.2
        },
        isDefault: true
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits form data correctly', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    
    render(
      <ProductForm
        initialData={mockProduct}
        onSubmit={mockOnSubmit}
        submitButtonText="Update Product"
      />
    );

    // Ürün adını güncelle
    fireEvent.change(screen.getByLabelText(/product name/i), {
      target: { value: 'Updated Product' }
    });

    // Formu gönder
    fireEvent.click(screen.getByText('Update Product'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Updated Product',
        hsCode: '1234.56.78.90.00'
      }));
    });
  });

  it('handles API errors correctly', async () => {
    const mockError = new Error('API Error');
    const mockOnSubmit = jest.fn().mockRejectedValue(mockError);
    
    render(
      <ProductForm
        initialData={mockProduct}
        onSubmit={mockOnSubmit}
        submitButtonText="Update Product"
      />
    );

    fireEvent.click(screen.getByText('Update Product'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('API Error');
    });
  });

  it('validates HS Code format', async () => {
    const mockOnSubmit = jest.fn();
    
    render(
      <ProductForm
        onSubmit={mockOnSubmit}
        submitButtonText="Save Product"
      />
    );

    // Geçersiz HS Code formatı gir
    fireEvent.change(screen.getByLabelText(/hs code/i), {
      target: { value: '1234.56.78' }
    });

    // Formu göndermeye çalış
    fireEvent.click(screen.getByText('Save Product'));

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
}); 