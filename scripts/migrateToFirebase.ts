import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = {
    apiKey: "AIzaSyCZtucCXaZMbX-ugld-FF66gJLRVeUEeLA",
    authDomain: "packing-list-app-62774.firebaseapp.com",
    projectId: "packing-list-app-62774",
    storageBucket: "packing-list-app-62774.firebasestorage.app",
    messagingSenderId: "237009362471",
    appId: "1:237009362471:web:d2bf404bf2047e6d433802"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateData() {
  try {
    const data = JSON.parse(fs.readFileSync('./packing-list-api/db.json', 'utf8'));
    
    console.log('Starting migration...');

    // Products
    console.log('Migrating products...');
    for (const product of data.products) {
      await addDoc(collection(db, 'products'), product);
    }

    // Packing Lists
    console.log('Migrating packing lists...');
    for (const list of data.packingLists) {
      await addDoc(collection(db, 'packingLists'), list);
    }

    // HS Codes
    console.log('Migrating HS codes...');
    for (const hsCode of data.hsCodes) {
      await addDoc(collection(db, 'hsCodes'), { code: hsCode.code });
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateData(); 