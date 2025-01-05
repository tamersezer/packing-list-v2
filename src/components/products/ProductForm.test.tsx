import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductForm } from './ProductForm';

const mockOnSubmit = jest.fn();

describe('ProductForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  test('form alanlarını doğru şekilde render eder', () => {
    render(<ProductForm onSubmit={mockOnSubmit} />);
    
    // Gerekli form alanlarının varlığını kontrol et
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sku/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/box quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/length/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/width/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/net weight/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gross weight/i)).toBeInTheDocument();
  });

  test('form validasyonu çalışıyor', async () => {
    render(<ProductForm onSubmit={mockOnSubmit} />);
    
    // Submit butonuna tıkla
    const submitButton = screen.getByText(/save product/i);
    await userEvent.click(submitButton);

    // Hata mesajlarını kontrol et
    expect(screen.getByText(/product name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/sku is required/i)).toBeInTheDocument();
  });

  test('form başarılı şekilde submit ediliyor', async () => {
    render(<ProductForm onSubmit={mockOnSubmit} />);
    
    // Form alanlarını doldur
    await userEvent.type(screen.getByLabelText(/product name/i), 'Test Ürün');
    await userEvent.type(screen.getByLabelText(/sku/i), 'TEST123');
    await userEvent.type(screen.getByLabelText(/box quantity/i), '10');
    await userEvent.type(screen.getByLabelText(/length/i), '20');
    await userEvent.type(screen.getByLabelText(/width/i), '30');
    await userEvent.type(screen.getByLabelText(/height/i), '40');
    await userEvent.type(screen.getByLabelText(/net weight/i), '5.5');
    await userEvent.type(screen.getByLabelText(/gross weight/i), '6.0');

    // Submit butonuna tıkla
    const submitButton = screen.getByText(/save product/i);
    await userEvent.click(submitButton);

    // onSubmit fonksiyonunun çağrıldığını kontrol et
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test Ürün',
      sku: 'TEST123'
    }));
  });
}); 