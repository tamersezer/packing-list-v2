import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
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

// Debug için log ekleyelim
console.log('Firebase Config:', {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? 'exists' : 'missing',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? 'exists' : 'missing',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? 'exists' : 'missing',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? 'exists' : 'missing',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? 'exists' : 'missing',
  appId: process.env.REACT_APP_FIREBASE_APP_ID ? 'exists' : 'missing'
});

// Firebase bağlantısını test edelim
try {
  const testDoc = await getDocs(collection(db, 'products'));
  console.log('Firebase connection test:', testDoc.empty ? 'No products' : 'Products exist');
} catch (error) {
  console.error('Firebase connection error:', error);
}

export const firebaseService = {
  // Packing Lists
  getAllPackingLists: async (): Promise<PackingList[]> => {
    const querySnapshot = await getDocs(query(collection(db, 'packingLists'), orderBy('createdAt', 'desc')));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as PackingList[];
  },

  getPackingListById: async (id: string): Promise<PackingList | null> => {
    const docRef = doc(db, 'packingLists', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as PackingList;
    }
    return null;
  },

  createPackingList: async (packingList: PackingList): Promise<string> => {
    const docRef = await addDoc(collection(db, 'packingLists'), packingList);
    return docRef.id;
  },

  updatePackingList: async (id: string, packingList: PackingList): Promise<void> => {
    const docRef = doc(db, 'packingLists', id);
    await updateDoc(docRef, { ...packingList });
  },

  deletePackingList: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'packingLists', id));
  },

  // Products
  getAllProducts: async (): Promise<Product[]> => {
    const querySnapshot = await getDocs(collection(db, 'products'));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Product[];
  },

  createProduct: async (product: Product): Promise<string> => {
    const docRef = await addDoc(collection(db, 'products'), product);
    return docRef.id;
  },

  updateProduct: async (id: string, product: Product): Promise<void> => {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, { ...product });
  },

  deleteProduct: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'products', id));
  },

  // HS Codes
  getAllHSCodes: async (): Promise<string[]> => {
    const querySnapshot = await getDocs(collection(db, 'hsCodes'));
    return querySnapshot.docs.map(doc => doc.data().code);
  },

  addHSCode: async (code: string): Promise<void> => {
    await addDoc(collection(db, 'hsCodes'), { code });
  },

  deleteHSCode: async (code: string): Promise<void> => {
    const q = query(collection(db, 'hsCodes'), where('code', '==', code));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
  }
}; 