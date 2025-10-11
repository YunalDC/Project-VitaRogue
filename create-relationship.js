// Create relationship using correct Firebase config
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCHUKT4E8sP6WYWCXNlLcZ0yMayhn0O7pU",
  authDomain: "vitarogue-d74f9.firebaseapp.com",
  projectId: "vitarogue-d74f9",
  storageBucket: "vitarogue-d74f9.appspot.com",
  messagingSenderId: "661558221830",
  appId: "1:661558221830:web:170e9bf6fed3339dc7f787",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createRelationship() {
  try {
    console.log('🔗 Creating coach-client relationship...');
    
    // Using the IDs from the terminal logs
    const COACH_ID = 'F0BM7CLs4OgNztqzQ7aJ3n3hH1B3'; // Romesh Hathara
    const CLIENT_ID = 'pObN5USEu7NWAUqH7HDKmbdru2F2'; // Hirun Kavinda
    
    const relationshipId = `rel_${Date.now()}`;
    
    await setDoc(doc(db, 'coachClientRelationships', relationshipId), {
      coachId: COACH_ID,
      clientId: CLIENT_ID,
      status: 'active',
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Created relationship:', relationshipId);
    
    // Verify creation
    const relationshipsRef = collection(db, 'coachClientRelationships');
    const snapshot = await getDocs(relationshipsRef);
    
    console.log('🔍 All relationships:');
    snapshot.docs.forEach(relDoc => {
      const data = relDoc.data();
      console.log({
        id: relDoc.id,
        coachId: data.coachId,
        clientId: data.clientId,
        status: data.status
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createRelationship();
