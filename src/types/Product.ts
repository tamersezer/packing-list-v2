export interface BoxDimensions {
  length: number;
  width: number;
  height: number;
}

export interface BoxWeights {
  gross: number;
  net: number;
}

export interface BoxVariant {
  id: string;
  name: string;
  boxQuantity: number;
  boxDimensions: BoxDimensions;
  weights: BoxWeights;
  isDefault: boolean;
}

export interface Product {
  id?: string;
  name: string;
  hsCode: string;
  variants: BoxVariant[];
}

// Yardımcı fonksiyonlar
export const calculateBoxVolume = (dimensions: BoxDimensions): number => {
  return dimensions.length * dimensions.width * dimensions.height;
};

export const calculateTotalWeight = (variant: BoxVariant, quantity: number): BoxWeights => {
  return {
    gross: Number((variant.weights.gross * quantity).toFixed(1)),
    net: Number((variant.weights.net * quantity).toFixed(1))
  };
};

export const getDefaultVariant = (product: Product): BoxVariant => {
  return product.variants.find(v => v.isDefault) || product.variants[0];
};

export const validateVariant = (variant: BoxVariant): string[] => {
  const errors: string[] = [];

  if (variant.boxQuantity <= 0) {
    errors.push('Box quantity must be greater than 0');
  }

  if (variant.weights.gross <= 0) {
    errors.push('Gross weight must be greater than 0');
  }

  if (variant.weights.net <= 0) {
    errors.push('Net weight must be greater than 0');
  }

  if (variant.weights.gross < variant.weights.net) {
    errors.push('Gross weight cannot be less than net weight');
  }

  if (variant.boxDimensions.length <= 0) {
    errors.push('Length must be greater than 0');
  }

  if (variant.boxDimensions.width <= 0) {
    errors.push('Width must be greater than 0');
  }

  if (variant.boxDimensions.height <= 0) {
    errors.push('Height must be greater than 0');
  }

  return errors;
}; 