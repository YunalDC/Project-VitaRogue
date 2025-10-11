const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');

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
  console.log('🔍 Checking all data...');
  
  try {
    // Check all relationships
    console.log('\n📊 Checking coachClientRelationships...');
    const relationshipsRef = collection(db, 'coachClientRelationships');
    const relationshipsSnapshot = await getDocs(relationshipsRef);
    
    console.log(`Found ${relationshipsSnapshot.docs.length} total relationships:`);
    
    for (const relationshipDoc of relationshipsSnapshot.docs) {
      const data = relationshipDoc.data();
      console.log('🔗 Relationship:', {
        id: relationshipDoc.id,
        coachId: data.coachId,
        clientId: data.clientId,
        status: data.status,
        startDate: data.startDate,
        createdAt: data.createdAt
      });
    }
    
    // Check coaches collection
    console.log('\n👨‍🏫 Checking coaches...');
    const coachesRef = collection(db, 'coaches');
    const coachesSnapshot = await getDocs(coachesRef);
    
    console.log(`Found ${coachesSnapshot.docs.length} coaches:`);
    for (const coachDoc of coachesSnapshot.docs) {
      const data = coachDoc.data();
      console.log('👨‍🏫 Coach:', {
        id: coachDoc.id,
        email: data.email,
        name: data.name || data.displayName,
        status: data.status,
        public: data.public
      });
    }
    
    // Check users collection
    console.log('\n👤 Checking users...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`Found ${usersSnapshot.docs.length} users:`);
    for (const userDoc of usersSnapshot.docs) {
      const data = userDoc.data();
      console.log('👤 User:', {
        id: userDoc.id,
        email: data.email,
        name: data.name || data.displayName,
        role: data.role,
        fitnessGoals: data.fitnessGoals
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkData();
