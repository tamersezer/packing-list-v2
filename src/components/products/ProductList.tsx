import React, { useEffect, useState } from 'react';
import { productService } from '../../services/api';
import type { Product } from '../../types/Product';
import { toast } from 'react-toastify';
import { ProductForm } from './ProductForm';
import { Modal } from '../common/Modal';
import { HSCodeList } from './HSCodeList';
import { Pagination } from '../common/Pagination';

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isHSCodeModalVisible, setIsHSCodeModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll(currentPage);
      setProducts(response.items);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to fetch products');
      toast.error('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.delete(id);
        toast.success('Product deleted successfully');
        fetchProducts(); // Listeyi yenile
      } catch (err) {
        toast.error('Failed to delete product');
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormVisible(true);
  };

  const handleUpdate = async (updatedProduct: Product) => {
    try {
      await productService.update(updatedProduct.id!, updatedProduct);
      toast.success('Product updated successfully');
      setEditingProduct(null);
      setIsFormVisible(false);
      fetchProducts(); // Listeyi yenile
    } catch (err) {
      toast.error('Failed to update product');
    }
  };

  const handleCreate = async (newProduct: Product) => {
    try {
      await productService.create(newProduct);
      toast.success('Product created successfully');
      setIsFormVisible(false);
      fetchProducts(); // Listeyi yenile
    } catch (err) {
      toast.error('Failed to create product');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">{error}</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Products</h2>
        <div className="space-x-4">
          <button
            onClick={() => setIsHSCodeModalVisible(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Manage HS Codes
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsFormVisible(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add New Product
          </button>
        </div>
      </div>

      <Modal
        isOpen={isFormVisible}
        onClose={() => {
          setIsFormVisible(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? "Edit Product" : "Add New Product"}
      >
        <ProductForm
          initialData={editingProduct || undefined}
          onSubmit={editingProduct ? handleUpdate : handleCreate}
          submitButtonText={editingProduct ? "Update Product" : "Save Product"}
        />
      </Modal>

      <Modal
        isOpen={isHSCodeModalVisible}
        onClose={() => setIsHSCodeModalVisible(false)}
        title="Manage HS Codes"
      >
        <HSCodeList onClose={() => setIsHSCodeModalVisible(false)} />
      </Modal>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">HS Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Box Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Weight (kg)<br/><span className="text-xs font-normal">Gross / Net</span></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dimensions (cm)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.hsCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.boxQuantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {product.weights.gross} / {product.weights.net}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {product.boxDimensions.length} × {product.boxDimensions.width} × {product.boxDimensions.height}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id!)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        hasNextPage={pagination.hasNextPage}
        hasPrevPage={pagination.hasPrevPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}; 