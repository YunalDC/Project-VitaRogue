const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, getDoc } = require('firebase/firestore');

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

async function checkCurrentData() {
  console.log('🔍 Checking current UserCoachRelationships...');
  
  try {
    const coachId = 'F0BM7CLs4OgNztqzQ7aJ3n3hH1B3';
    const clientId = 'pObN5USEu7NWAUqH7HDKmbdru2F2';
    
    // Check UserCoachRelationships collection
    console.log('\n📊 UserCoachRelationships Collection:');
    const userCoachRelRef = collection(db, 'UserCoachRelationships');
    const userCoachSnapshot = await getDocs(userCoachRelRef);
    
    console.log(`Found ${userCoachSnapshot.docs.length} documents in UserCoachRelationships`);
    userCoachSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('📄 Document:', doc.id);
      console.log('   Coach ID:', data.coach?.id);
      console.log('   Client ID:', data.client?.id);
      console.log('   Client Name:', data.client?.name);
      console.log('   Status:', data.status);
      console.log('   Created:', data.createdAt);
      console.log('');
    });
    
    // Check for relationships with our specific coach
    console.log(`\n🎯 Relationships for coach ${coachId}:`);
    const coachRelQuery = query(userCoachRelRef, where('coach.id', '==', coachId));
    const coachRelSnapshot = await getDocs(coachRelQuery);
    
    console.log(`Found ${coachRelSnapshot.docs.length} relationships for this coach`);
    coachRelSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('✅ Relationship:', doc.id);
      console.log('   Client:', data.client?.name);
      console.log('   Status:', data.status);
    });

    // Check users collection for these IDs
    console.log(`\n👤 User Details:`);
    
    const coachDoc = await getDoc(doc(db, 'users', coachId));
    if (coachDoc.exists()) {
      const coachData = coachDoc.data();
      console.log('Coach:', coachData.name || coachData.displayName, '- Email:', coachData.email);
    } else {
      console.log('❌ Coach document not found');
    }
    
    const clientDoc = await getDoc(doc(db, 'users', clientId));
    if (clientDoc.exists()) {
      const clientData = clientDoc.data();
      console.log('Client:', clientData.name || clientData.displayName, '- Email:', clientData.email);
    } else {
      console.log('❌ Client document not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCurrentData();
