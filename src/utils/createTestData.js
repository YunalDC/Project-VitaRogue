// Create test data directly in the app
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { firebaseApp } from '../lib/firebaseApp';

const db = getFirestore(firebaseApp);

export const createTestUserCoachRelationships = async () => {
  try {
    console.log('🚀 Creating test UserCoachRelationships...');
    
    const COACH_ID = 'F0BM7CLs4OgNztqzQ7aJ3n3hH1B3';
    const CLIENT_ID = 'pObN5USEu7NWAUqH7HDKmbdru2F2';
    
    const relationshipData = {
      id: `${COACH_ID}_${CLIENT_ID}`,
      status: 'active',
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      
      coach: {
        id: COACH_ID,
        name: 'Romesh Hathara',
        email: 'romeshtest@gmail.com',
        photoURL: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400'
      },
      
      client: {
        id: CLIENT_ID,
        name: 'Hirun Kavinda',
        email: 'hirun@example.com',
        photoURL: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
        fitnessGoals: ['Build muscle', 'Weight Gain'],
        weightGoal: 'Build muscle',
        age: 21,
        gender: 'Male',
        heightCm: 181,
        weightKg: 65,
        fitnessLevel: 'Light activity'
      },
      
      sessions: {
        total: 5,
        completed: 3,
        upcoming: 2,
        lastSession: 'Yesterday',
        nextSession: 'Tomorrow 10:00 AM'
      },
      
      progress: {
        percentage: 78,
        weightChange: 2.5,
        goalsAchieved: 1,
        totalGoals: 2
      },
      
      lastMessage: 'Great progress this week!',
      lastContact: new Date().toISOString(),
      coachNotes: 'Client is motivated and consistent with workouts.',
      currentGoals: ['Build muscle', 'Weight Gain'],
      currentPlan: 'Strength Training Program'
    };
    
    await setDoc(doc(db, 'UserCoachRelationships', relationshipData.id), relationshipData);
    console.log('✅ Created UserCoachRelationship:', relationshipData.id);
    
    // Create second test relationship
    const CLIENT_ID_2 = 'example_client_2';
    const relationshipData2 = {
      ...relationshipData,
      id: `${COACH_ID}_${CLIENT_ID_2}`,
      client: {
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
      },
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
      }
    };
    
    await setDoc(doc(db, 'UserCoachRelationships', relationshipData2.id), relationshipData2);
    console.log('✅ Created second UserCoachRelationship:', relationshipData2.id);
    
    return true;
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    return false;
  }
};
