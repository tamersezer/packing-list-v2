import React, { useState } from 'react';
import type { BoxVariant } from '../../types/Product';
import { validateVariant } from '../../types/Product';
import { toast } from 'react-toastify';

interface VariantFormProps {
  initialData?: BoxVariant;
  onSubmit: (variant: BoxVariant) => void;
  onCancel: () => void;
}

const emptyVariant: BoxVariant = {
  id: '',
  name: '',
  boxQuantity: 0,
  weights: {
    gross: 0,
    net: 0
  },
  boxDimensions: {
    length: 0,
    width: 0,
    height: 0
  },
  isDefault: false
};

export const VariantForm: React.FC<VariantFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const [variant, setVariant] = useState<BoxVariant>(initialData || { ...emptyVariant });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateVariant(variant);
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    onSubmit({
      ...variant,
      id: variant.id || crypto.randomUUID()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Variant Name
          </label>
          <input
            type="text"
            value={variant.name}
            onChange={(e) => setVariant(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Box Quantity
          </label>
          <input
            type="number"
            min="1"
            value={variant.boxQuantity}
            onChange={(e) => setVariant(prev => ({ 
              ...prev, 
              boxQuantity: parseInt(e.target.value) || 0 
            }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Gross Weight (kg)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={variant.weights.gross}
            onChange={(e) => setVariant(prev => ({
              ...prev,
              weights: {
                ...prev.weights,
                gross: parseFloat(e.target.value) || 0
              }
            }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Net Weight (kg)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={variant.weights.net}
            onChange={(e) => setVariant(prev => ({
              ...prev,
              weights: {
                ...prev.weights,
                net: parseFloat(e.target.value) || 0
              }
            }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Length (cm)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={variant.boxDimensions.length}
            onChange={(e) => setVariant(prev => ({
              ...prev,
              boxDimensions: {
                ...prev.boxDimensions,
                length: parseFloat(e.target.value) || 0
              }
            }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Width (cm)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={variant.boxDimensions.width}
            onChange={(e) => setVariant(prev => ({
              ...prev,
              boxDimensions: {
                ...prev.boxDimensions,
                width: parseFloat(e.target.value) || 0
              }
            }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Height (cm)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={variant.boxDimensions.height}
            onChange={(e) => setVariant(prev => ({
              ...prev,
              boxDimensions: {
                ...prev.boxDimensions,
                height: parseFloat(e.target.value) || 0
              }
            }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={variant.isDefault}
          onChange={(e) => setVariant(prev => ({ 
            ...prev, 
            isDefault: e.target.checked 
          }))}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          Set as default variant
        </label>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {initialData ? 'Update Variant' : 'Add Variant'}
        </button>
      </div>
    </form>
  );
}; 