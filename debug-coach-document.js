import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyByh5AQl2qU95HGX_cq7mTqLOOLPLCYpWA",
  authDomain: "vitarogue-d74f9.firebaseapp.com",
  projectId: "vitarogue-d74f9",
  storageBucket: "vitarogue-d74f9.firebasestorage.app",
  messagingSenderId: "1034734491924",
  appId: "1:1034734491924:web:94b8d6e7eb75ee0ad2c503",
  measurementId: "G-WGCL0CFPXH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCoachDocument() {
  try {
    const coachId = 'xUNdBxSD4RcHN4wRmm5fUmIrnkS2'; // scooby@gmail.com
    
    console.log('Checking coach document for ID:', coachId);
    
    const coachRef = doc(db, 'coaches', coachId);
    const coachSnap = await getDoc(coachRef);
    
    console.log('Coach document exists:', coachSnap.exists());
    
    if (coachSnap.exists()) {
      console.log('Coach data:', coachSnap.data());
    } else {
      console.log('Coach document does not exist');
      
      // Check if user document exists
      const userRef = doc(db, 'users', coachId);
      const userSnap = await getDoc(userRef);
      console.log('User document exists:', userSnap.exists());
      if (userSnap.exists()) {
        console.log('User data:', userSnap.data());
      }
    }
    
    // Also check the relationship that was created
    const relationshipRef = doc(db, 'UserCoachRelationships', 'JblFGXIMReDw4ul0NxAu');
    const relationshipSnap = await getDoc(relationshipRef);
    console.log('Relationship document exists:', relationshipSnap.exists());
    if (relationshipSnap.exists()) {
      console.log('Relationship data:', relationshipSnap.data());
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCoachDocument();
