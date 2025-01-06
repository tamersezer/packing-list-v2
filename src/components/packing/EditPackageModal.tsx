import React, { useState, useEffect } from 'react';
import type { Product } from '../../types/Product';
import type { PackageRow } from '../../types/PackingList';
import { toast } from 'react-hot-toast';

interface EditPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPackage: PackageRow) => void;
  packageData: PackageRow;
  allProducts: Product[];
}

export const EditPackageModal: React.FC<EditPackageModalProps> = ({
  isOpen,
  onClose,
  onSave,
  packageData,
  allProducts
}) => {
  const [editedPackage, setEditedPackage] = useState<PackageRow>(packageData);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    setEditedPackage(packageData);
  }, [packageData]);

  const calculateWeights = (items: PackageRow['items']): { gross: number; net: number } => {
    const weights = items.reduce((acc, item) => ({
      gross: acc.gross + (item.product.weights.gross * item.quantity),
      net: acc.net + (item.product.weights.net * item.quantity)
    }), { gross: 0, net: 0 });

    // Palet ağırlığını ekle
    if (packageData.packageNo.indexOf('to') === -1) { // Palet kontrolü
      weights.gross += 24;
    }

    return {
      gross: Number(weights.gross.toFixed(1)),
      net: Number(weights.net.toFixed(1))
    };
  };

  const handleAddProduct = () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error('Please select a product and enter a valid quantity');
      return;
    }

    const newItems = [
      ...editedPackage.items,
      { product: selectedProduct, quantity }
    ];

    const weights = calculateWeights(newItems);

    if (weights.gross < weights.net) {
      toast.error('Gross weight cannot be less than net weight');
      return;
    }

    setEditedPackage(prev => ({
      ...prev,
      items: newItems,
      grossWeight: weights.gross,
      netWeight: weights.net
    }));

    setSelectedProduct(null);
    setQuantity(0);
  };

  const handleRemoveProduct = (index: number) => {
    setEditedPackage((prev: PackageRow) => ({
      ...prev,
      items: prev.items.filter((_: any, i: number) => i !== index)
    }));
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    setEditedPackage(prev => {
      const newItems = prev.items.map((item, i) => 
        i === index ? { ...item, quantity: newQuantity } : item
      );

      const weights = calculateWeights(newItems);

      return {
        ...prev,
        items: newItems,
        grossWeight: weights.gross,
        netWeight: weights.net
      };
    });
  };

  const handleDimensionsChange = (field: keyof PackageRow['dimensions'], value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedPackage((prev: PackageRow) => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [field]: numValue
      }
    }));
  };

  const handleWeightChange = (field: 'grossWeight' | 'netWeight', value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedPackage((prev: PackageRow) => ({
      ...prev,
      [field]: numValue
    }));
  };

  // Kaydetme öncesi validasyon
  const handleSave = () => {
    if (editedPackage.items.length === 0) {
      toast.error('Package must contain at least one product');
      return;
    }

    if (editedPackage.grossWeight < editedPackage.netWeight) {
      toast.error('Gross weight cannot be less than net weight');
      return;
    }

    onSave(editedPackage);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Edit Package {editedPackage.packageNo}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Products List */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Products</h3>
            <div className="space-y-2">
              {editedPackage.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{item.product.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.product.hsCode}</p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                    className="w-24 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleRemoveProduct(index)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Add Product */}
            <div className="mt-4 flex items-center space-x-2">
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const product = allProducts.find(p => p.id === e.target.value);
                  setSelectedProduct(product || null);
                  if (product) setQuantity(product.boxQuantity);
                }}
                className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select Product</option>
                {allProducts
                  .filter(product => !editedPackage.items.some(item => item.product.id === product.id))
                  .map(product => (
                    <option key={product.id} value={product.id} className="text-gray-900 dark:text-white">
                      {product.name}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-24 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Qty"
              />
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Weights */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gross Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={editedPackage.grossWeight}
                onChange={(e) => handleWeightChange('grossWeight', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Net Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={editedPackage.netWeight}
                onChange={(e) => handleWeightChange('netWeight', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Dimensions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dimensions (cm)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                step="0.1"
                value={editedPackage.dimensions.length}
                onChange={(e) => handleDimensionsChange('length', e.target.value)}
                placeholder="Length"
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                step="0.1"
                value={editedPackage.dimensions.width}
                onChange={(e) => handleDimensionsChange('width', e.target.value)}
                placeholder="Width"
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                step="0.1"
                value={editedPackage.dimensions.height}
                onChange={(e) => handleDimensionsChange('height', e.target.value)}
                placeholder="Height"
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 