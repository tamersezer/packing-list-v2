import React, { useEffect, useState } from 'react';
import { productService } from '../../services/api';
import type { Product } from '../../types/Product';
import { toast } from 'react-toastify';
import { ProductForm } from './ProductForm';
import { Modal } from '../common/Modal';
import { HSCodeList } from './HSCodeList';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Menu } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isHSCodeModalVisible, setIsHSCodeModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      toast.error('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = async (product: Product) => {
    try {
      await productService.create(product);
      toast.success('Product created successfully');
      setIsFormVisible(false);
      fetchProducts();
    } catch (err) {
      toast.error('Failed to create product');
    }
  };

  const handleUpdate = async (product: Product) => {
    try {
      await productService.update(product.id!, product);
      toast.success('Product updated successfully');
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error('Failed to update product');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.delete(id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (err) {
        toast.error('Failed to delete product');
      }
    }
  };

  const ActionMenu: React.FC<{ product: Product }> = ({ product }) => (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
        <EllipsisVerticalIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      </Menu.Button>
      <Menu.Items className="absolute right-0 mt-2 w-36 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
        <Menu.Item>
          {({ active }) => (
            <button
              onClick={() => setEditingProduct(product)}
              className={`${
                active ? 'bg-gray-100 dark:bg-gray-700' : ''
              } group flex w-full items-center px-4 py-2 text-sm text-blue-600 dark:text-blue-400`}
            >
              Edit
            </button>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <button
              onClick={() => handleDelete(product.id!)}
              className={`${
                active ? 'bg-gray-100 dark:bg-gray-700' : ''
              } group flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400`}
            >
              Delete
            </button>
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );

  if (isLoading) {
    return <LoadingSpinner text="Loading products..." />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="w-full sm:w-96">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setIsHSCodeModalVisible(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Manage HS Codes
          </button>
          <button
            onClick={() => setIsFormVisible(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Variants
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProducts.map((product) => (
              <React.Fragment key={product.id}>
                {product.variants.map((variant, variantIndex) => (
                  <tr 
                    key={`${product.id}-${variant.id}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                  >
                    {variantIndex === 0 && (
                      <td rowSpan={product.variants.length} className="px-6 py-4 whitespace-nowrap align-top">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{product.hsCode}</p>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-start">
                        {variant.isDefault && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-2">
                            Default
                          </span>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{variant.name}</p>
                          <div className="space-y-1 mt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Box Qty: <span className="text-gray-700 dark:text-gray-300">{variant.boxQuantity}</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Dimensions: <span className="text-gray-700 dark:text-gray-300">
                                {variant.boxDimensions.length} × {variant.boxDimensions.width} × {variant.boxDimensions.height} cm
                              </span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Weight: <span className="text-gray-700 dark:text-gray-300">
                                {variant.weights.gross} / {variant.weights.net} kg
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    {variantIndex === 0 && (
                      <td rowSpan={product.variants.length} className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                        <ActionMenu product={product} />
                      </td>
                    )}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isFormVisible || !!editingProduct}
        onClose={() => {
          setIsFormVisible(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <ProductForm
          initialData={editingProduct || undefined}
          onSubmit={editingProduct ? handleUpdate : handleCreate}
          submitButtonText={editingProduct ? 'Update Product' : 'Create Product'}
        />
      </Modal>

      <Modal
        isOpen={isHSCodeModalVisible}
        onClose={() => setIsHSCodeModalVisible(false)}
        title="Manage HS Codes"
        size="md"
      >
        <HSCodeList onClose={() => setIsHSCodeModalVisible(false)} />
      </Modal>
    </div>
  );
}; 