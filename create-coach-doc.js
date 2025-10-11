// Create coach document for the logged-in coach
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

async function createCoachDoc() {
  try {
    const COACH_ID = 'F0BM7CLs4OgNztqzQ7aJ3n3hH1B3'; // Romesh Hathara
    
    console.log('🏋️ Creating coach document...');
    
    await setDoc(doc(db, 'coaches', COACH_ID), {
      email: "romeshtest@gmail.com",
      name: "Romesh Hathara",
      displayName: "Romesh Hathara",
      title: "Personal Trainer",
      specialization: "Strength Training",
      status: "approved",
      public: true,
      coachApproved: true,
      experienceYears: 5,
      rating: 4.8,
      photoURL: "https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400",
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Coach document created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createCoachDoc();
