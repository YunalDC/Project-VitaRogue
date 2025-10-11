// Check UserCoachRelationships collection
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function checkUserCoachRelationships() {
  try {
    console.log('🔍 Checking UserCoachRelationships collection...');
    
    const snapshot = await getDocs(collection(db, 'UserCoachRelationships'));
    console.log('📊 Found', snapshot.docs.length, 'documents in UserCoachRelationships');
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log('📄 Document ID:', doc.id);
      console.log('   - Coach:', data.coach?.name || 'Unknown');
      console.log('   - Client:', data.client?.name || 'Unknown');
      console.log('   - Status:', data.status);
      console.log('   ---');
    });
    
    if (snapshot.docs.length === 0) {
      console.log('⚠️ No documents found. Running migration...');
      
      // If no documents, create them directly
      const { doc, setDoc } = require('firebase/firestore');
      
      const COACH_ID = 'F0BM7CLs4OgNztqzQ7aJ3n3hH1B3';
      const CLIENT_ID = 'pObN5USEu7NWAUqH7HDKmbdru2F2';
      
      const relationshipData = {
        id: `${COACH_ID}_${CLIENT_ID}`,
        status: 'active',
        startDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        coach: {
          id: COACH_ID,
          name: 'Romesh Hathara',
          email: 'romeshtest@gmail.com'
        },
        client: {
          id: CLIENT_ID,
          name: 'Hirun Kavinda',
          email: 'hirun@example.com',
          fitnessGoals: ['Build muscle', 'Weight Gain'],
          age: 21,
          gender: 'Male',
          heightCm: 181,
          weightKg: 65
        },
        sessions: {
          total: 5,
          completed: 3,
          lastSession: 'Yesterday'
        },
        progress: {
          percentage: 78
        }
      };
      
      await setDoc(doc(db, 'UserCoachRelationships', relationshipData.id), relationshipData);
      console.log('✅ Created relationship:', relationshipData.id);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUserCoachRelationships();
