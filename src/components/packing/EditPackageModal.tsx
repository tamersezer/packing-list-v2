import React, { useState, useEffect, useCallback } from 'react';
import type { Product, BoxVariant } from '../../types/Product';
import type { PackageRow, PackageItem } from '../../types/PackingList';
import { calculatePackageWeights } from '../../types/PackingList';
import { Modal } from '../common/Modal';
import { toast } from 'react-toastify';

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
  const [selectedVariant, setSelectedVariant] = useState<BoxVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [previewWeights, setPreviewWeights] = useState({ gross: 0, net: 0 });

  // Paket sayısını hesapla
  const boxCount = packageData.packageRange 
    ? packageData.packageRange.end - packageData.packageRange.start + 1 
    : 1;

  // Ürün seçildiğinde varsayılan varyantı seç
  useEffect(() => {
    if (selectedProduct) {
      const defaultVariant = selectedProduct.variants.find(v => v.isDefault);
      if (defaultVariant) {
        setSelectedVariant(defaultVariant);
        setQuantity(defaultVariant.boxQuantity); // Varsayılan varyantın koli adedini set et
      }
    }
  }, [selectedProduct]);

  // Varyant değiştiğinde koli adedini güncelle
  useEffect(() => {
    if (selectedVariant) {
      setQuantity(selectedVariant.boxQuantity);
    }
  }, [selectedVariant]);

  // Ağırlık hesaplama önizlemesi
  useEffect(() => {
    if (selectedVariant && quantity > 0) {
      // Tam koli sayısı yerine oransal hesaplama
      const weightRatio = quantity / selectedVariant.boxQuantity;
      setPreviewWeights({
        gross: Number((weightRatio * selectedVariant.weights.gross).toFixed(1)),
        net: Number((weightRatio * selectedVariant.weights.net).toFixed(1))
      });
    } else {
      setPreviewWeights({ gross: 0, net: 0 });
    }
  }, [selectedVariant, quantity]);

  // Varyant seçildiğinde sadece quantity'yi güncelle
  useEffect(() => {
    if (selectedVariant && !packageData.items.length) {
      if (packageData.packageRange) {
        setQuantity(selectedVariant.boxQuantity * boxCount);
      } else {
        setQuantity(selectedVariant.boxQuantity);
      }
    }
  }, [selectedVariant, packageData.packageRange, boxCount, packageData.items.length]);

  const handleAddItem = useCallback(() => {
    if (!selectedProduct || !selectedVariant || quantity <= 0) {
      toast.error('Please select product, variant and quantity');
      return;
    }

    const newItem: PackageItem = {
      product: selectedProduct,
      variant: selectedVariant,
      quantity
    };

    const updatedPackage = {
      ...editedPackage,
      items: [...editedPackage.items, newItem]
    };

    const isPallet = updatedPackage.dimensions.length === 80 && updatedPackage.dimensions.width === 120;
    
    if (!isPallet && updatedPackage.items.length === 1) {
      updatedPackage.dimensions = {
        length: selectedVariant.boxDimensions.length,
        width: selectedVariant.boxDimensions.width,
        height: selectedVariant.boxDimensions.height
      };
    }

    const weights = calculatePackageWeights(updatedPackage.items, isPallet);
    updatedPackage.grossWeight = weights.gross;
    updatedPackage.netWeight = weights.net;

    setEditedPackage(updatedPackage);
    setSelectedProduct(null);
    setSelectedVariant(null);
    setQuantity(0);
  }, [selectedProduct, selectedVariant, quantity, editedPackage]);

  const handleRemoveItem = (index: number) => {
    const updatedItems = editedPackage.items.filter((_, i) => i !== index);
    const isPallet = editedPackage.dimensions.length === 80 && editedPackage.dimensions.width === 120;
    const weights = calculatePackageWeights(updatedItems, isPallet);
    
    setEditedPackage({
      ...editedPackage,
      items: updatedItems,
      grossWeight: weights.gross,
      netWeight: weights.net
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} 
      title={`Edit Package ${
        packageData.packageRange 
          ? `${packageData.packageRange.start} to ${packageData.packageRange.end}`
          : packageData.packageNo
      }`} 
      size="xl"
    >
      <div className="space-y-6">
        {/* Ürün Ekleme Formu */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Ürün Seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product
              </label>
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const product = allProducts.find(p => p.id === e.target.value);
                  setSelectedProduct(product || null);
                }}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Product</option>
                {allProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Varyant Seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Variant
              </label>
              <select
                value={selectedVariant?.id || ''}
                onChange={(e) => {
                  const variant = selectedProduct?.variants.find(v => v.id === e.target.value);
                  setSelectedVariant(variant || null);
                }}
                disabled={!selectedProduct}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Variant</option>
                {selectedProduct?.variants.map(variant => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} ({variant.boxQuantity} pcs/box)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Miktar ve Ağırlık Önizleme */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity {packageData.packageRange ? `(Total for ${boxCount} boxes)` : ''}
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const newQuantity = parseInt(e.target.value) || 0;
                  setQuantity(newQuantity);
                }}
                disabled={!selectedVariant}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Ağırlık Önizleme */}
            {selectedVariant && quantity > 0 && (
              <div className="flex items-end">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    Boxes: {
                      packageData.packageRange 
                        ? `${packageData.packageRange.start} to ${packageData.packageRange.end}` 
                        : (quantity / selectedVariant.boxQuantity).toFixed(1)
                    }
                  </div>
                  <div>Weight to be added: {previewWeights.gross} / {previewWeights.net} kg</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAddItem}
              disabled={!selectedProduct || !selectedVariant || quantity <= 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Add Item
            </button>
          </div>
        </div>

        {/* Eklenen Ürünler Listesi */}
        <div className="space-y-2">
          {editedPackage.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {item.product.name} - {item.variant.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {item.quantity} pcs ({Math.ceil(item.quantity / item.variant.boxQuantity)} boxes)
                </div>
              </div>
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Paket Boyutları */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Length (cm)
            </label>
            <input
              type="number"
              value={editedPackage.dimensions.length}
              onChange={(e) => setEditedPackage(prev => ({
                ...prev,
                dimensions: { ...prev.dimensions, length: parseInt(e.target.value) || 0 }
              }))}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Width (cm)
            </label>
            <input
              type="number"
              value={editedPackage.dimensions.width}
              onChange={(e) => setEditedPackage(prev => ({
                ...prev,
                dimensions: { ...prev.dimensions, width: parseInt(e.target.value) || 0 }
              }))}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Height (cm)
            </label>
            <input
              type="number"
              value={editedPackage.dimensions.height}
              onChange={(e) => setEditedPackage(prev => ({
                ...prev,
                dimensions: { ...prev.dimensions, height: parseInt(e.target.value) || 0 }
              }))}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Toplam Ağırlıklar */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Gross Weight</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {Number(editedPackage.grossWeight).toFixed(1)} kg
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Net Weight</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {Number(editedPackage.netWeight).toFixed(1)} kg
              </div>
            </div>
          </div>
        </div>

        {/* Kaydet ve İptal Butonları */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedPackage)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}; 