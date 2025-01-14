import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import type { PackingList } from '../types/PackingList';
import type { Product } from '../types/Product';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firebase bağlantısını kontrol et
console.log('Firebase Config:', {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? 'exists' : 'missing',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? 'exists' : 'missing',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? 'exists' : 'missing',
  // ... diğer config değerleri
});

export const firebaseService = {
  // Packing Lists
  async getAllPackingLists(): Promise<PackingList[]> {
    try {
      const querySnapshot = await getDocs(query(collection(db, 'packingLists'), orderBy('createdAt', 'desc')));
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as PackingList[];
    } catch (error) {
      console.error('Firebase error:', error);
      throw error;
    }
  },

  async getPackingListById(id: string): Promise<PackingList | null> {
    const docRef = doc(db, 'packingLists', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as PackingList;
    }
    return null;
  },

  async createPackingList(packingList: PackingList): Promise<string> {
    const docRef = await addDoc(collection(db, 'packingLists'), packingList);
    return docRef.id;
  },

  async updatePackingList(id: string, packingList: PackingList): Promise<void> {
    const docRef = doc(db, 'packingLists', id);
    await updateDoc(docRef, { ...packingList });
  },

  async deletePackingList(id: string): Promise<void> {
    await deleteDoc(doc(db, 'packingLists', id));
  },

  // Products
  async getAllProducts(): Promise<Product[]> {
    const querySnapshot = await getDocs(collection(db, 'products'));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Product[];
  },

  async getProductById(id: string): Promise<Product | null> {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as Product;
    }
    return null;
  },

  async createProduct(product: Product): Promise<string> {
    const docRef = await addDoc(collection(db, 'products'), product);
    return docRef.id;
  },

  async updateProduct(id: string, product: Product): Promise<void> {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, { ...product });
  },

  async deleteProduct(id: string): Promise<void> {
    await deleteDoc(doc(db, 'products', id));
  }
}; 