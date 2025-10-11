// Quick test to check Firebase relationships
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCI5RUHJlG1dVZy9CmEGAHPHR8khqLhY3Q",
  authDomain: "vitarogue-e2b2c.firebaseapp.com",
  projectId: "vitarogue-e2b2c",
  storageBucket: "vitarogue-e2b2c.firebasestorage.app",
  messagingSenderId: "1027041624426",
  appId: "1:1027041624426:web:b6ca4fb8b7a9e1f3e8f7ea"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkData() {
  try {
    console.log('🔍 Checking coachClientRelationships...');
    const snapshot = await getDocs(collection(db, 'coachClientRelationships'));
    console.log(`Found ${snapshot.docs.length} relationships:`);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log({
        id: doc.id,
        coachId: data.coachId,
        clientId: data.clientId,
        status: data.status,
        createdAt: data.createdAt,
        startDate: data.startDate
      });
    });
    
    console.log('\n🔍 Checking users...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`Found ${usersSnapshot.docs.length} users:`);
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.email && (data.email.includes('hilun') || data.email.includes('supreme'))) {
        console.log({
          id: doc.id,
          email: data.email,
          name: data.name || data.displayName,
          userType: data.userType || 'unknown'
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();
