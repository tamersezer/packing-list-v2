import { firebaseService } from './firebaseService';

// Packing List Service
export const packingListService = {
  getAll: firebaseService.getAllPackingLists,
  getById: firebaseService.getPackingListById,
  create: firebaseService.createPackingList,
  update: firebaseService.updatePackingList,
  delete: firebaseService.deletePackingList
};

// Product Service
export const productService = {
  getAll: firebaseService.getAllProducts,
  create: firebaseService.createProduct,
  update: firebaseService.updateProduct,
  delete: firebaseService.deleteProduct
};

// HS Code Service
export const hsCodeService = {
  getAll: firebaseService.getAllHSCodes,
  add: firebaseService.addHSCode,
  delete: firebaseService.deleteHSCode
}; 