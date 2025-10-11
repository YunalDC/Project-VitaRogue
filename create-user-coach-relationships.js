// Create UserCoachRelationship collection with embedded client data
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDoc, getDocs } = require('firebase/firestore');

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

async function createUserCoachRelationships() {
  try {
    console.log('🔗 Creating UserCoachRelationship collection with embedded client data...');
    
    // Get the existing relationship
    const relationshipsRef = collection(db, 'coachClientRelationships');
    const relationshipsSnapshot = await getDocs(relationshipsRef);
    
    console.log(`Found ${relationshipsSnapshot.docs.length} existing relationships`);
    
    for (const relationshipDoc of relationshipsSnapshot.docs) {
      const relationshipData = relationshipDoc.data();
      const { coachId, clientId, status, startDate, createdAt } = relationshipData;
      
      console.log(`\n📝 Processing relationship: Coach ${coachId} -> Client ${clientId}`);
      
      // Fetch client data from users collection
      let clientData = {};
      try {
        const clientRef = doc(db, 'users', clientId);
        const clientSnap = await getDoc(clientRef);
        
        if (clientSnap.exists()) {
          const userData = clientSnap.data();
          console.log('✅ Found client user data:', {
            name: userData.name,
            displayName: userData.displayName,
            firstName: userData.firstName,
            email: userData.email,
            photoURL: userData.photoURL,
            fitnessGoals: userData.fitnessGoals,
            weightGoal: userData.weightGoal
          });
          
          clientData = {
            id: clientId,
            name: userData.displayName || userData.name || userData.firstName || 'Unknown Client',
            email: userData.email || '',
            photoURL: userData.photoURL || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
            fitnessGoals: userData.fitnessGoals || [],
            weightGoal: userData.weightGoal || 'General Fitness',
            age: userData.age || null,
            gender: userData.gender || null,
            heightCm: userData.heightCm || null,
            weightKg: userData.weightKg || null,
            fitnessLevel: userData.fitnessLevel || null,
            lastLogin: userData.lastLogin || null
          };
        } else {
          console.log('⚠️ Client user data not found, using fallback');
          clientData = {
            id: clientId,
            name: `Client ${clientId.substring(0, 8)}`,
            email: 'Contact via app',
            photoURL: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
            fitnessGoals: ['General Fitness'],
            weightGoal: 'Fitness Goals'
          };
        }
      } catch (error) {
        console.log('⚠️ Error fetching client data, using fallback:', error.message);
        clientData = {
          id: clientId,
          name: `Client ${clientId.substring(0, 8)}`,
          email: 'Contact via app',
          photoURL: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
          fitnessGoals: ['General Fitness'],
          weightGoal: 'Fitness Goals'
        };
      }
      
      // Fetch coach data
      let coachData = {};
      try {
        const coachRef = doc(db, 'users', coachId);
        const coachSnap = await getDoc(coachRef);
        
        if (coachSnap.exists()) {
          const userData = coachSnap.data();
          coachData = {
            id: coachId,
            name: userData.displayName || userData.name || userData.firstName || 'Coach',
            email: userData.email || '',
            photoURL: userData.photoURL || 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400'
          };
        } else {
          coachData = {
            id: coachId,
            name: 'Coach',
            email: '',
            photoURL: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400'
          };
        }
      } catch (error) {
        console.log('⚠️ Error fetching coach data:', error.message);
        coachData = {
          id: coachId,
          name: 'Coach',
          email: '',
          photoURL: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400'
        };
      }
      
      // Create the UserCoachRelationship document
      const relationshipId = `${coachId}_${clientId}`;
      const userCoachRelationshipData = {
        // Relationship metadata
        id: relationshipId,
        status: status || 'active',
        startDate: startDate || createdAt || new Date().toISOString(),
        createdAt: createdAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        
        // Coach information
        coach: coachData,
        
        // Client information (embedded for easy access)
        client: clientData,
        
        // Session and progress data
        sessions: {
          total: 0,
          completed: 0,
          upcoming: 0,
          lastSession: null,
          nextSession: null
        },
        
        // Progress tracking
        progress: {
          percentage: Math.floor(Math.random() * 40) + 60, // Random for now
          weightChange: 0,
          goalsAchieved: 0,
          totalGoals: clientData.fitnessGoals ? clientData.fitnessGoals.length : 1
        },
        
        // Communication
        lastMessage: null,
        lastContact: null,
        
        // Notes and goals
        coachNotes: '',
        currentGoals: clientData.fitnessGoals || ['General Fitness'],
        currentPlan: null
      };
      
      console.log('💾 Creating UserCoachRelationship with client name:', clientData.name);
      
      await setDoc(doc(db, 'UserCoachRelationships', relationshipId), userCoachRelationshipData);
      
      console.log('✅ Created UserCoachRelationship:', relationshipId);
    }
    
    console.log('\n🎉 UserCoachRelationship collection created successfully!');
    
    // Verify the creation
    console.log('\n🔍 Verifying created relationships...');
    const userCoachRelationshipsRef = collection(db, 'UserCoachRelationships');
    const userCoachSnapshot = await getDocs(userCoachRelationshipsRef);
    
    console.log(`Found ${userCoachSnapshot.docs.length} UserCoachRelationships:`);
    userCoachSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`📋 ${doc.id}: Coach "${data.coach.name}" -> Client "${data.client.name}" (${data.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error creating UserCoachRelationships:', error);
  }
}

createUserCoachRelationships();
