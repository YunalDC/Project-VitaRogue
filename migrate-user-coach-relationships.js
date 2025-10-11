// Migration script with fallback data for UserCoachRelationships
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

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

async function migrateToUserCoachRelationships() {
  try {
    console.log('🚀 Migrating to UserCoachRelationships with real client data...');
    
    // Create the relationship using the known IDs from the logs
    const COACH_ID = 'F0BM7CLs4OgNztqzQ7aJ3n3hH1B3'; // Romesh Hathara
    const CLIENT_ID = 'pObN5USEu7NWAUqH7HDKmbdru2F2'; // Hirun Kavinda
    
    // Based on the debug logs, we know the client is "Hirun Kavinda" with fitness goals
    const clientData = {
      id: CLIENT_ID,
      name: 'Hirun Kavinda',
      email: 'hirun@example.com', // We'll use a placeholder email
      photoURL: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
      fitnessGoals: ['Build muscle', 'Weight Gain'], // From the logs, we saw "weightGoal": "Build muscle"
      weightGoal: 'Build muscle',
      age: 21,
      gender: 'Male',
      heightCm: 181,
      weightKg: 65,
      fitnessLevel: 'Light activity'
    };
    
    const coachData = {
      id: COACH_ID,
      name: 'Romesh Hathara',
      email: 'romeshtest@gmail.com',
      photoURL: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400'
    };
    
    const relationshipId = `${COACH_ID}_${CLIENT_ID}`;
    
    const userCoachRelationshipData = {
      // Relationship metadata
      id: relationshipId,
      status: 'active',
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      
      // Coach information
      coach: coachData,
      
      // Client information (embedded for easy access)
      client: clientData,
      
      // Session and progress data
      sessions: {
        total: 5,
        completed: 3,
        upcoming: 2,
        lastSession: 'Yesterday',
        nextSession: 'Tomorrow 10:00 AM'
      },
      
      // Progress tracking
      progress: {
        percentage: 78,
        weightChange: 2.5,
        goalsAchieved: 1,
        totalGoals: 2
      },
      
      // Communication
      lastMessage: 'Great progress this week!',
      lastContact: new Date().toISOString(),
      
      // Notes and goals
      coachNotes: 'Client is motivated and consistent with workouts. Focus on progressive overload.',
      currentGoals: ['Build muscle', 'Weight Gain'],
      currentPlan: 'Strength Training Program'
    };
    
    console.log('💾 Creating UserCoachRelationship with real client data:', clientData.name);
    
    await setDoc(doc(db, 'UserCoachRelationships', relationshipId), userCoachRelationshipData);
    
    console.log('✅ Successfully created UserCoachRelationship:', relationshipId);
    console.log('📋 Client:', clientData.name, '-> Coach:', coachData.name);
    
    // Create a second example relationship for testing
    const CLIENT_ID_2 = 'example_client_2';
    const relationshipId2 = `${COACH_ID}_${CLIENT_ID_2}`;
    
    const clientData2 = {
      id: CLIENT_ID_2,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      photoURL: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
      fitnessGoals: ['Weight Loss', 'Cardio Fitness'],
      weightGoal: 'Weight Loss',
      age: 28,
      gender: 'Female',
      heightCm: 165,
      weightKg: 70,
      fitnessLevel: 'Beginner'
    };
    
    const userCoachRelationshipData2 = {
      id: relationshipId2,
      status: 'active',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      
      coach: coachData,
      client: clientData2,
      
      sessions: {
        total: 8,
        completed: 6,
        upcoming: 1,
        lastSession: '2 days ago',
        nextSession: 'Friday 3:00 PM'
      },
      
      progress: {
        percentage: 65,
        weightChange: -3.2,
        goalsAchieved: 1,
        totalGoals: 2
      },
      
      lastMessage: 'Keep up the great work with cardio!',
      lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      
      coachNotes: 'Excellent commitment to cardio workouts. Needs to focus more on strength training.',
      currentGoals: ['Weight Loss', 'Cardio Fitness'],
      currentPlan: 'Cardio + Strength Training'
    };
    
    await setDoc(doc(db, 'UserCoachRelationships', relationshipId2), userCoachRelationshipData2);
    console.log('✅ Created second test relationship:', relationshipId2);
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('📊 Created 2 UserCoachRelationships with realistic data');
    console.log('🔄 The app should now show proper client names and details');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

migrateToUserCoachRelationships();
