import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductForm } from '../ProductForm';
import { productService } from '../../../services/api';

jest.mock('../../../services/api');

describe('ProductForm Integration Tests', () => {
  test('submits form successfully', async () => {
    const mockCreate = productService.create as jest.Mock;
    mockCreate.mockResolvedValueOnce({ id: '1', ...mockProductData });

    render(<ProductForm />);
    
    // Form doldurma
    await userEvent.type(screen.getByLabelText(/product name/i), 'Test Product');
    // ... diğer alanları doldur

    // Submit
    await userEvent.click(screen.getByText(/save product/i));

    // Beklenen sonuçları kontrol et
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Product'
      }));
    });
  });
}); 