// Test data creation script for VitaRogue coach-client relationships
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

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

async function createTestData() {
  try {
    console.log('🔧 Creating test coach-client relationships...');
    
    // Coach and client IDs that match existing accounts from the logs
    const COACH_ID = 'F0BM7CLs4OgNztqzQ7aJ3n3hH1B3'; // Romesh Hathara
    const CLIENT_ID = 'pObN5USEu7NWAUqH7HDKmbdru2F2'; // Hirun Kavinda
    
    console.log('👨‍🏫 Using coach ID:', COACH_ID);
    console.log('👤 Using client ID:', CLIENT_ID);
    
    // Verify coach exists
    const coachDoc = await getDoc(doc(db, 'users', COACH_ID));
    if (!coachDoc.exists()) {
      console.log('❌ Coach not found');
      return;
    }
    
    // Verify client exists  
    const clientDoc = await getDoc(doc(db, 'users', CLIENT_ID));
    if (!clientDoc.exists()) {
      console.log('❌ Client not found');
      return;
    }
    
    console.log('✅ Both users exist');
    
    // Check if relationship already exists
    console.log('🔗 Checking existing relationships...');
    const relationshipsRef = collection(db, 'coachClientRelationships');
    const existingQuery = query(
      relationshipsRef,
      where('coachId', '==', COACH_ID),
      where('clientId', '==', CLIENT_ID)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      console.log('⚠️ Relationship already exists. Updating it...');
      const existingDoc = existingSnapshot.docs[0];
      await setDoc(doc(db, 'coachClientRelationships', existingDoc.id), {
        coachId: COACH_ID,
        clientId: CLIENT_ID,
        status: 'active',
        startDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('✅ Updated existing relationship');
    } else {
      // Create new relationship
      console.log('🔗 Creating new coach-client relationship...');
      const relationshipId = `rel_${COACH_ID}_${CLIENT_ID}_${Date.now()}`;
      
      await setDoc(doc(db, 'coachClientRelationships', relationshipId), {
        coachId: COACH_ID,
        clientId: CLIENT_ID,
        status: 'active',
        startDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      
      console.log('✅ Created relationship:', relationshipId);
    }
    
    // Verify the relationship was created
    console.log('🔍 Verifying relationships...');
    const allRelationships = await getDocs(collection(db, 'coachClientRelationships'));
    console.log(`Found ${allRelationships.docs.length} total relationships:`);
    
    allRelationships.docs.forEach(relDoc => {
      const data = relDoc.data();
      console.log('🔗', {
        id: relDoc.id,
        coachId: data.coachId,
        clientId: data.clientId,
        status: data.status
      });
    });
    
    console.log('🎉 Test data creation completed!');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

// Also create a cleanup function
async function cleanupTestData() {
  try {
    console.log('🧹 Cleaning up test relationships...');
    const relationshipsRef = collection(db, 'coachClientRelationships');
    const snapshot = await getDocs(relationshipsRef);
    
    console.log(`Found ${snapshot.docs.length} relationships to clean up`);
    
    for (const relationshipDoc of snapshot.docs) {
      await deleteDoc(doc(db, 'coachClientRelationships', relationshipDoc.id));
      console.log('🗑️ Deleted relationship:', relationshipDoc.id);
    }
    
    console.log('✅ Cleanup completed!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run based on command line argument
const action = process.argv[2];
if (action === 'cleanup') {
  cleanupTestData();
} else {
  createTestData();
}
