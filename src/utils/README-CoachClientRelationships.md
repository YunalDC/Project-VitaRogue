# Coach-Client Relationship Management System

This system provides a comprehensive set of utilities for managing coach-client relationships in Firestore. It handles the creation, updating, and management of coaching relationships with proper data structure and real-time updates.

## Files

- `coachClientRelationship.js` - Main utility functions
- `coachClientRelationshipExamples.js` - Usage examples and workflows
- This README - Documentation

## Core Functions

### `createCoachClientRelationship(params)`

Creates a new coach-client relationship in Firestore.

**Parameters:**
```javascript
{
  coachId: string,        // Coach's Firebase Auth UID
  clientId: string,       // Client's Firebase Auth UID
  coachData: {           // Optional coach data
    name: string,
    email: string,
    photoURL: string
  },
  requestData: {         // Optional request context
    message: string,
    source: string
  }
}
```

**Returns:**
```javascript
{
  success: boolean,
  relationshipId: string, // Document ID if successful
  data: object,          // Created relationship data
  error: string          // Error message if failed
}
```

### `updateCoachClientRelationship(relationshipId, updates)`

Updates an existing relationship with new data.

**Example:**
```javascript
await updateCoachClientRelationship('relationship-id', {
  currentPlan: 'Advanced Training',
  'progress.percentage': 80,
  onboardingComplete: true
});
```

### `endCoachClientRelationship(relationshipId, reason)`

Ends a coaching relationship and marks it as inactive.

### `updateClientProgress(relationshipId, progressData)`

Updates client progress metrics.

**Progress Data:**
```javascript
{
  percentage: number,     // Overall progress percentage
  goalsAchieved: number, // Number of goals completed
  weightChange: number   // Weight change (positive = gain, negative = loss)
}
```

### `addCoachNote(relationshipId, note)`

Adds a timestamped note to the relationship.

## Data Structure

The system creates documents in the `UserCoachRelationships` collection with this structure:

```javascript
{
  // Core relationship data
  coach: {
    id: string,           // Coach's Firebase Auth UID
    name: string,
    email: string,
    photoURL: string
  },
  client: {
    id: string,           // Client's Firebase Auth UID
    name: string,
    email: string,
    photoURL: string,
    age: number,
    gender: string,
    heightCm: number,
    weightKg: number,
    fitnessLevel: string,
    weightGoal: string,
    fitnessGoals: array
  },
  
  // Relationship status
  status: 'active' | 'ended' | 'paused',
  startDate: string,
  endDate: string,        // Only if ended
  endReason: string,      // Only if ended
  
  // Goals and progress
  currentGoals: array,
  currentPlan: string,
  progress: {
    percentage: number,
    goalsAchieved: number,
    totalGoals: number,
    weightChange: number,
    lastProgressUpdate: string
  },
  
  // Session tracking
  sessions: {
    total: number,
    completed: number,
    upcoming: number,
    lastSession: string,
    nextSession: string
  },
  
  // Communication
  coachNotes: string,     // Timestamped notes
  lastContact: timestamp,
  lastMessage: string,
  
  // Settings
  onboardingComplete: boolean,
  communicationPreferences: {
    notifications: boolean,
    sessionReminders: boolean,
    progressUpdates: boolean
  },
  
  // Metadata
  createdAt: timestamp,
  lastUpdated: timestamp,
  relationshipSource: string
}
```

## Integration with Dashboard

The CoachDashboardScreen automatically listens for changes in the `UserCoachRelationships` collection and updates the UI in real-time when:

1. New relationships are created (active clients count increases)
2. Relationships are ended (active clients count decreases)
3. Progress is updated (metrics refresh)

## Usage Examples

### Creating a Relationship (Coach accepts request)

```javascript
import { createCoachClientRelationship } from '../utils/coachClientRelationship';

const acceptCoachRequest = async (request) => {
  const result = await createCoachClientRelationship({
    coachId: firebaseAuth.currentUser.uid,
    clientId: request.senderId,
    coachData: {
      name: coach.name,
      email: coach.email,
      photoURL: coach.photoURL
    },
    requestData: {
      message: 'Welcome to your fitness journey!',
      source: 'coach_request'
    }
  });

  if (result.success) {
    // Update UI, show success message
    console.log('New client added:', result.relationshipId);
  }
};
```

### Updating Client Progress

```javascript
import { updateClientProgress } from '../utils/coachClientRelationship';

const updateProgress = async (client) => {
  await updateClientProgress(client.relationshipId, {
    percentage: 75,
    goalsAchieved: 3,
    weightChange: -5.2 // Lost 5.2kg
  });
};
```

### Adding Coach Notes

```javascript
import { addCoachNote } from '../utils/coachClientRelationship';

const addSessionNote = async (client, note) => {
  await addCoachNote(
    client.relationshipId,
    'Great session today! Client increased bench press by 5kg.'
  );
};
```

## Security Rules

Make sure your Firestore security rules allow coaches to read/write their own relationships:

```javascript
// Firestore Security Rules
match /UserCoachRelationships/{relationshipId} {
  allow read, write: if request.auth != null && 
    (resource.data.coach.id == request.auth.uid || 
     resource.data.client.id == request.auth.uid);
}
```

## Real-time Updates

The dashboard uses `onSnapshot` listeners to provide real-time updates:

```javascript
// In CoachDashboardScreen.js
const q = query(
  collection(db, 'UserCoachRelationships'),
  where('coach.id', '==', authUid),
  where('status', '==', 'active')
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  const relationships = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  setRealClients(relationships);
  setActiveClientsCount(relationships.length);
});
```

## Benefits

1. **Modular**: Reusable functions across the app
2. **Type-safe**: Clear parameter structures
3. **Error handling**: Comprehensive error reporting
4. **Real-time**: Automatic UI updates via Firestore listeners
5. **Scalable**: Easily extensible for new features
6. **Consistent**: Standardized data structure
7. **Documented**: Clear examples and usage patterns

## Future Extensions

The system can be easily extended to support:

- Session scheduling and management
- Payment processing integration
- Advanced progress tracking
- Communication features
- File sharing (photos, workout plans)
- Calendar integration
- Performance analytics
