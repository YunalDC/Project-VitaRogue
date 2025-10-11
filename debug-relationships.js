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

async function checkRelationships() {
  console.log('🔍 Checking coachClientRelationships...');
  
  try {
    // First, find the coach user document
    const usersRef = collection(db, 'users');
    const coachQuery = query(usersRef, where('email', '==', 'hiluncoach@gmail.com'));
    const coachSnapshot = await getDocs(coachQuery);
    
    if (coachSnapshot.empty) {
      console.log('❌ Coach not found with email hiluncoach@gmail.com');
      return;
    }
    
    const coachDoc = coachSnapshot.docs[0];
    const coachData = coachDoc.data();
    const coachId = coachDoc.id;
    
    console.log('👨‍🏫 Coach found:', {
      id: coachId,
      email: coachData.email,
      name: coachData.name || coachData.displayName
    });
    
    // Find the client user document
    const clientQuery = query(usersRef, where('email', '==', 'usersupreme@gmail.com'));
    const clientSnapshot = await getDocs(clientQuery);
    
    if (clientSnapshot.empty) {
      console.log('❌ Client not found with email usersupreme@gmail.com');
      return;
    }
    
    const clientDoc = clientSnapshot.docs[0];
    const clientData = clientDoc.data();
    const clientId = clientDoc.id;
    
    console.log('👤 Client found:', {
      id: clientId,
      email: clientData.email,
      name: clientData.name || clientData.displayName
    });
    
    // Now check relationships
    const relationshipsRef = collection(db, 'coachClientRelationships');
    
    // Check for any relationships with this coach
    const coachRelQuery = query(relationshipsRef, where('coachId', '==', coachId));
    const coachRelSnapshot = await getDocs(coachRelQuery);
    
    console.log(`📊 Found ${coachRelSnapshot.docs.length} relationships for coach ${coachId}`);
    
    coachRelSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('🔗 Relationship:', {
        id: doc.id,
        coachId: data.coachId,
        clientId: data.clientId,
        status: data.status,
        startDate: data.startDate,
        createdAt: data.createdAt
      });
    });
    
    // Check specifically for the client-coach relationship
    const specificQuery = query(
      relationshipsRef,
      where('coachId', '==', coachId),
      where('clientId', '==', clientId)
    );
    const specificSnapshot = await getDocs(specificQuery);
    
    if (specificSnapshot.empty) {
      console.log(`❌ No relationship found between coach ${coachId} and client ${clientId}`);
    } else {
      console.log(`✅ Found specific relationship between coach and client:`);
      specificSnapshot.docs.forEach(doc => {
        console.log(doc.id, doc.data());
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRelationships();
