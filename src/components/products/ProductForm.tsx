import React, { useState, useEffect } from 'react';
import type { Product, BoxVariant } from '../../types/Product';
import { hsCodeService } from '../../services/api';
import { toast } from 'react-toastify';
import { Modal } from '../common/Modal';
import { VariantForm } from './VariantForm';
import SlidePanel from '../common/SlidePanel';

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (product: Product) => Promise<void>;
  submitButtonText: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  submitButtonText
}) => {
  const [product, setProduct] = useState<Product>(
    initialData || {
      name: '',
      hsCode: '',
      variants: []
    }
  );

  const [hsCodes, setHsCodes] = useState<string[]>([]);
  const [customHSCode, setCustomHSCode] = useState('');
  const [isCustomHSCode, setIsCustomHSCode] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<BoxVariant | null>(null);

  useEffect(() => {
    const fetchHSCodes = async () => {
      try {
        const codes = await hsCodeService.getAll();
        setHsCodes(codes.filter(code => code && code.trim() !== ''));
      } catch (error) {
        toast.error('Failed to load HS Codes');
      }
    };
    fetchHSCodes();
  }, []);

  const formatHSCode = (code: string): string => {
    const numbers = code.replace(/\D/g, '');
    
    if (numbers.length !== 12) {
      throw new Error('HS Code must be exactly 12 digits');
    }

    return `${numbers.slice(0, 4)}.${numbers.slice(4, 6)}.${numbers.slice(6, 8)}.${numbers.slice(8, 10)}.${numbers.slice(10, 12)}`;
  };

  const handleHSCodeChange = async (value: string) => {
    if (value === 'custom') {
      setIsCustomHSCode(true);
      return;
    }

    setIsCustomHSCode(false);
    setProduct(prev => ({ ...prev, hsCode: value }));
  };

  const handleCustomHSCodeSubmit = async () => {
    try {
      const formattedHSCode = formatHSCode(customHSCode);
      
      if (!hsCodes.includes(formattedHSCode)) {
        await hsCodeService.add(formattedHSCode);
        setHsCodes(prev => [...prev, formattedHSCode]);
      }

      setProduct(prev => ({ ...prev, hsCode: formattedHSCode }));
      setCustomHSCode('');
      setIsCustomHSCode(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Invalid HS Code format');
      }
    }
  };

  const handleVariantSubmit = (variant: BoxVariant) => {
    let newVariants: BoxVariant[];
    
    if (editingVariant) {
      newVariants = product.variants.map(v => 
        v.id === editingVariant.id ? variant : v
      );
    } else {
      newVariants = [...product.variants, variant];
    }

    // Eğer bu varyant varsayılan olarak işaretlendiyse diğerlerini varsayılan olmaktan çıkar
    if (variant.isDefault) {
      newVariants = newVariants.map(v => ({
        ...v,
        isDefault: v.id === variant.id
      }));
    }

    // Eğer hiç varsayılan varyant yoksa ilk varyantı varsayılan yap
    if (!newVariants.some(v => v.isDefault)) {
      newVariants[0].isDefault = true;
    }

    setProduct(prev => ({
      ...prev,
      variants: newVariants
    }));

    setShowVariantForm(false);
    setEditingVariant(null);
  };

  const handleEditVariant = (variant: BoxVariant) => {
    setEditingVariant(variant);
    setShowVariantForm(true);
  };

  const handleDeleteVariant = (variantId: string) => {
    const newVariants = product.variants.filter(v => v.id !== variantId);
    
    // Eğer silinen varyant varsayılansa ve başka varyant varsa ilk varyantı varsayılan yap
    if (product.variants.find(v => v.id === variantId)?.isDefault && newVariants.length > 0) {
      newVariants[0].isDefault = true;
    }

    setProduct(prev => ({
      ...prev,
      variants: newVariants
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!product.hsCode) {
      toast.error('HS Code is required');
      return;
    }

    if (product.variants.length === 0) {
      toast.error('Product must have at least one variant');
      return;
    }

    try {
      await onSubmit(product);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save product');
      }
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Product Name
          </label>
          <input
            type="text"
            value={product.name}
            onChange={(e) => setProduct(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            HS Code
          </label>
          {isCustomHSCode ? (
            <div className="flex space-x-2">
              <input
                type="text"
                value={customHSCode}
                onChange={(e) => setCustomHSCode(e.target.value)}
                placeholder="Enter HS Code (12 digits)"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={handleCustomHSCodeSubmit}
                className="mt-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          ) : (
            <select
              value={product.hsCode}
              onChange={(e) => handleHSCodeChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select HS Code</option>
              {hsCodes.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
              <option value="custom">Enter Custom HS Code</option>
            </select>
          )}
        </div>

        {/* Variants List */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Variants</h3>
            <button
              type="button"
              onClick={() => setShowVariantForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Variant
            </button>
          </div>

          <div className="space-y-4">
            {product.variants.map((variant) => (
              <div
                key={variant.id}
                className="flex justify-between items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 dark:text-white">{variant.name}</span>
                    {variant.isDefault && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Box Qty: {variant.boxQuantity} | 
                    Weight: {variant.weights.gross}/{variant.weights.net} kg |
                    Dimensions: {variant.boxDimensions.length}×{variant.boxDimensions.width}×{variant.boxDimensions.height} cm
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEditVariant(variant)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVariant(variant.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            {submitButtonText}
          </button>
        </div>
      </form>

      {/* Modal yerine SlidePanel kullanıyoruz */}
      <SlidePanel
        isOpen={showVariantForm}
        onClose={() => {
          setShowVariantForm(false);
          setEditingVariant(null);
        }}
        title={editingVariant ? 'Edit Variant' : 'Add Variant'}
      >
        <VariantForm
          initialData={editingVariant || undefined}
          onSubmit={handleVariantSubmit}
          onCancel={() => {
            setShowVariantForm(false);
            setEditingVariant(null);
          }}
        />
      </SlidePanel>
    </div>
  );
}; 