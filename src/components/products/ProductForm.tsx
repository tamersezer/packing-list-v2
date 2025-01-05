import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Product } from '../../types/Product';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { hsCodeService } from '../../services/api';
import { toast } from 'react-hot-toast';

// Input alanları için ortak className'i bir değişkene alalım
const inputClassName = "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white";

const productSchema = yup.object().shape({
  name: yup.string().required('Product name is required'),
  hsCode: yup.string().required('HS Code is required'),
  boxQuantity: yup.number()
    .required('Box quantity is required')
    .integer('Box quantity must be a whole number')
    .min(1, 'Box quantity must be at least 1'),
  boxDimensions: yup.object().shape({
    length: yup.number()
      .required('Length is required')
      .test('is-half-step', 'Length must be in 0.5 steps', value => {
        if (!value) return false;
        return (value * 10) % 5 === 0; // 0.5'in katları kontrolü
      })
      .min(0.5, 'Length must be at least 0.5')
      .transform((value) => Number(value.toFixed(1))), // Bir ondalık basamağa yuvarla
    width: yup.number()
      .required('Width is required')
      .test('is-half-step', 'Width must be in 0.5 steps', value => {
        if (!value) return false;
        return (value * 10) % 5 === 0;
      })
      .min(0.5, 'Width must be at least 0.5')
      .transform((value) => Number(value.toFixed(1))),
    height: yup.number()
      .required('Height is required')
      .test('is-half-step', 'Height must be in 0.5 steps', value => {
        if (!value) return false;
        return (value * 10) % 5 === 0;
      })
      .min(0.5, 'Height must be at least 0.5')
      .transform((value) => Number(value.toFixed(1)))
  }),
  weights: yup.object().shape({
    net: yup.number()
      .required('Net weight is required')
      .min(0.1, 'Net weight must be at least 0.1')
      .transform((value) => Number(value.toFixed(1))), // Bir ondalık basamağa yuvarla
    gross: yup.number()
      .required('Gross weight is required')
      .min(0.1, 'Gross weight must be at least 0.1')
      .test('is-greater-than-net', 'Gross weight must be greater than or equal to net weight', 
        function(value) {
          const net = this.parent.net;
          if (!value || !net) return true; // Diğer validasyonlar zaten required kontrolü yapıyor
          return value >= net;
        }
      )
      .transform((value) => Number(value.toFixed(1)))
  })
});

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: Product) => Promise<void>;
  submitButtonText?: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({ 
  initialData, 
  onSubmit,
  submitButtonText = 'Save Product'
}) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<Product>({
    defaultValues: initialData || {
      name: '',
      hsCode: '',
      boxQuantity: 1,
      boxDimensions: {
        length: 0.1,
        width: 0.1,
        height: 0.1
      },
      weights: {
        net: 0.1,
        gross: 0.1
      }
    },
    resolver: yupResolver(productSchema)
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hsCodes, setHsCodes] = useState<string[]>([]);

  useEffect(() => {
    const loadHsCodes = async () => {
      try {
        const codes = await hsCodeService.getAll();
        setHsCodes(codes);
      } catch (error) {
        toast.error('Failed to load HS Codes');
      }
    };

    loadHsCodes();
  }, []);

  const handleFormSubmit = async (data: Product) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      if (!initialData) {
        reset();
      }
      if (!hsCodes.includes(data.hsCode)) {
        await hsCodeService.add(data.hsCode);
        setHsCodes([...hsCodes, data.hsCode]);
      }
    } catch (error) {
      // Hata yönetimi
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-8">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label 
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Product Name
            </label>
            <input
              id="name"
              {...register('name', { required: 'Product name is required' })}
              className={inputClassName}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label 
              htmlFor="hsCode"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              HS Code
            </label>
            <input
              id="hsCode"
              list="hsCodes"
              {...register('hsCode', { required: 'HS Code is required' })}
              className={inputClassName}
              placeholder="Select or type HS Code"
            />
            <datalist id="hsCodes">
              {hsCodes.map((code) => (
                <option key={code} value={code} />
              ))}
            </datalist>
            {errors.hsCode && <p className="text-red-500 text-sm mt-1">{errors.hsCode.message}</p>}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Box Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="boxQuantity"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Box Quantity
              </label>
              <input
                id="boxQuantity"
                type="number"
                min="1"
                step="1"
                {...register('boxQuantity')}
                className={inputClassName}
              />
              {errors.boxQuantity && <p className="text-red-500 text-sm mt-1">{errors.boxQuantity.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label 
                htmlFor="grossWeight"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Gross Weight (kg)
              </label>
              <input
                id="grossWeight"
                type="number"
                step="0.1"
                {...register('weights.gross')}
                className={inputClassName}
              />
              {errors.weights?.gross && 
                <p className="text-red-500 text-sm mt-1">{errors.weights.gross.message}</p>
              }
            </div>
            <div>
              <label 
                htmlFor="netWeight"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Net Weight (kg)
              </label>
              <input
                id="netWeight"
                type="number"
                step="0.1"
                {...register('weights.net')}
                className={inputClassName}
              />
              {errors.weights?.net && 
                <p className="text-red-500 text-sm mt-1">{errors.weights.net.message}</p>
              }
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label 
                htmlFor="length"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Length (cm)
              </label>
              <input
                id="length"
                type="number"
                step="0.5"
                {...register('boxDimensions.length')}
                className={inputClassName}
              />
              {errors.boxDimensions?.length && 
                <p className="text-red-500 text-sm mt-1">{errors.boxDimensions.length.message}</p>
              }
            </div>
            <div>
              <label 
                htmlFor="width"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Width (cm)
              </label>
              <input
                id="width"
                type="number"
                step="0.5"
                {...register('boxDimensions.width')}
                className={inputClassName}
              />
              {errors.boxDimensions?.width && 
                <p className="text-red-500 text-sm mt-1">{errors.boxDimensions.width.message}</p>
              }
            </div>
            <div>
              <label 
                htmlFor="height"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Height (cm)
              </label>
              <input
                id="height"
                type="number"
                step="0.5"
                {...register('boxDimensions.height')}
                className={inputClassName}
              />
              {errors.boxDimensions?.height && 
                <p className="text-red-500 text-sm mt-1">{errors.boxDimensions.height.message}</p>
              }
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              submitButtonText
            )}
          </button>
        </div>
      </form>
    </div>
  );
}; 