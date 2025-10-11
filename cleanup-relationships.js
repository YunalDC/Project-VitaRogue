// Script to clean up existing coach-client relationships for fresh testing
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Firebase config (from your firebaseApp.js)
const firebaseConfig = {
  apiKey: "AIzaSyBiUEuZJekGlCz5-r5hJD0vBKJtSBpOJnI",
  authDomain: "vitarogue-d74f9.firebaseapp.com",
  projectId: "vitarogue-d74f9",
  storageBucket: "vitarogue-d74f9.firebasestorage.app",
  messagingSenderId: "647695892516",
  appId: "1:647695892516:web:84b3b5dc99b49c5defc6cf",
  measurementId: "G-TC63NRHMQG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupRelationships() {
  try {
    console.log('🧹 Cleaning up existing coach-client relationships...');
    
    // Get all relationships
    const relationshipsRef = collection(db, 'coachClientRelationships');
    const snapshot = await getDocs(relationshipsRef);
    
    console.log(`Found ${snapshot.docs.length} relationships to delete`);
    
    // Delete each relationship
    const deletePromises = snapshot.docs.map(relationshipDoc => {
      console.log(`Deleting relationship: ${relationshipDoc.id}`, relationshipDoc.data());
      return deleteDoc(doc(db, 'coachClientRelationships', relationshipDoc.id));
    });
    
    await Promise.all(deletePromises);
    
    console.log('✅ All relationships deleted successfully!');
    console.log('🚀 Ready for fresh testing - you can now make new coach requests');
    
  } catch (error) {
    console.error('❌ Error cleaning up relationships:', error);
  }
}

// Run the cleanup
cleanupRelationships();
