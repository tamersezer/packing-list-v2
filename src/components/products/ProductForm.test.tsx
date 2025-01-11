import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductForm } from './ProductForm';
import { toast } from 'react-toastify';

jest.mock('react-toastify');

describe('ProductForm', () => {
  const mockOnSubmit = jest.fn();
  const defaultProps = {
    onSubmit: mockOnSubmit,
    submitButtonText: 'Save Product'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty form correctly', () => {
    render(<ProductForm {...defaultProps} />);
    
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hs code/i)).toBeInTheDocument();
    expect(screen.getByText(/variants/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<ProductForm {...defaultProps} />);
    
    const submitButton = screen.getByText('Save Product');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Product must have at least one variant');
    });
  });

  it('handles variant addition correctly', async () => {
    render(<ProductForm {...defaultProps} />);

    // Varyant bilgilerini doldur
    fireEvent.change(screen.getByLabelText(/variant name/i), {
      target: { value: 'Test Variant' }
    });
    fireEvent.change(screen.getByLabelText(/box quantity/i), {
      target: { value: '24' }
    });
    fireEvent.change(screen.getByLabelText(/length/i), {
      target: { value: '30' }
    });
    fireEvent.change(screen.getByLabelText(/width/i), {
      target: { value: '20' }
    });
    fireEvent.change(screen.getByLabelText(/height/i), {
      target: { value: '15' }
    });
    fireEvent.change(screen.getByLabelText(/gross weight/i), {
      target: { value: '2.5' }
    });
    fireEvent.change(screen.getByLabelText(/net weight/i), {
      target: { value: '2.2' }
    });

    // Varyantı ekle
    const addVariantButton = screen.getByText('Add Variant');
    fireEvent.click(addVariantButton);

    // Varyantın eklendiğini kontrol et
    await waitFor(() => {
      expect(screen.getByText('Test Variant')).toBeInTheDocument();
    });
  });

  it('validates variant weights', async () => {
    render(<ProductForm {...defaultProps} />);

    // Net ağırlığı brüt ağırlıktan fazla gir
    fireEvent.change(screen.getByLabelText(/gross weight/i), {
      target: { value: '2.0' }
    });
    fireEvent.change(screen.getByLabelText(/net weight/i), {
      target: { value: '2.2' }
    });

    const addVariantButton = screen.getByText('Add Variant');
    fireEvent.click(addVariantButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Gross weight cannot be less than net weight');
    });
  });
}); 