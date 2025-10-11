import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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

async function checkRelationships() {
  try {
    const coachId = 'xUNdBxSD4RcHN4wRmm5fUmIrnkS2'; // scooby@gmail.com
    
    console.log('Checking relationships for coach ID:', coachId);
    
    // Get all relationships
    const relationshipsRef = collection(db, 'UserCoachRelationships');
    const allDocs = await getDocs(relationshipsRef);
    
    console.log('Total relationships found:', allDocs.docs.length);
    
    allDocs.docs.forEach(doc => {
      const data = doc.data();
      console.log('Relationship ID:', doc.id);
      console.log('Coach ID in document:', data.coach?.id);
      console.log('Client ID in document:', data.client?.id);
      console.log('Status:', data.status);
      console.log('---');
    });
    
    // Try the specific query that the app is using
    const q = query(relationshipsRef, where('coach.id', '==', coachId));
    const querySnapshot = await getDocs(q);
    
    console.log('Query results for coach.id ==', coachId, ':', querySnapshot.docs.length);
    
    querySnapshot.docs.forEach(doc => {
      console.log('Found relationship:', doc.id, doc.data());
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRelationships();
