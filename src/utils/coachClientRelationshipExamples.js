// Example usage of the Coach-Client Relationship System
// This file demonstrates how to use the utility functions

import { 
  createCoachClientRelationship, 
  updateCoachClientRelationship, 
  endCoachClientRelationship,
  updateClientProgress,
  addCoachNote 
} from '../utils/coachClientRelationship';

/**
 * Example: Creating a new coach-client relationship
 */
export const exampleCreateRelationship = async () => {
  const result = await createCoachClientRelationship({
    coachId: 'coach-firebase-uid',
    clientId: 'client-firebase-uid',
    coachData: {
      name: 'John Smith',
      email: 'coach@example.com',
      photoURL: 'https://example.com/coach-photo.jpg'
    },
    requestData: {
      message: 'Looking forward to working together!',
      source: 'coach_request'
    }
  });

  if (result.success) {
    console.log('Relationship created with ID:', result.relationshipId);
    return result.relationshipId;
  } else {
    console.error('Failed to create relationship:', result.error);
  }
};

/**
 * Example: Updating client progress
 */
export const exampleUpdateProgress = async (relationshipId) => {
  const result = await updateClientProgress(relationshipId, {
    percentage: 75,
    goalsAchieved: 3,
    weightChange: -5.2 // lost 5.2 kg
  });

  if (result.success) {
    console.log('Progress updated successfully');
  } else {
    console.error('Failed to update progress:', result.error);
  }
};

/**
 * Example: Adding a coach note
 */
export const exampleAddNote = async (relationshipId) => {
  const result = await addCoachNote(
    relationshipId,
    'Client is showing great improvement in strength training. Increased weights by 10% this week.'
  );

  if (result.success) {
    console.log('Note added successfully');
  } else {
    console.error('Failed to add note:', result.error);
  }
};

/**
 * Example: Updating relationship settings
 */
export const exampleUpdateSettings = async (relationshipId) => {
  const result = await updateCoachClientRelationship(relationshipId, {
    currentPlan: 'Advanced Strength Training Program',
    'communicationPreferences.sessionReminders': false,
    'communicationPreferences.progressUpdates': true,
    onboardingComplete: true
  });

  if (result.success) {
    console.log('Settings updated successfully');
  } else {
    console.error('Failed to update settings:', result.error);
  }
};

/**
 * Example: Ending a relationship
 */
export const exampleEndRelationship = async (relationshipId) => {
  const result = await endCoachClientRelationship(
    relationshipId,
    'Client achieved all fitness goals and graduated from the program'
  );

  if (result.success) {
    console.log('Relationship ended successfully');
  } else {
    console.error('Failed to end relationship:', result.error);
  }
};

/**
 * Example: Complete workflow - from request to active coaching
 */
export const exampleCompleteWorkflow = async () => {
  try {
    // Step 1: Create relationship (when coach accepts request)
    const createResult = await createCoachClientRelationship({
      coachId: 'coach-uid-123',
      clientId: 'client-uid-456',
      coachData: {
        name: 'Sarah Johnson',
        email: 'sarah@fitnessstudio.com',
        photoURL: 'https://example.com/sarah.jpg'
      },
      requestData: {
        message: 'Welcome to your fitness journey!',
        source: 'marketplace_request'
      }
    });

    if (!createResult.success) {
      throw new Error(createResult.error);
    }

    const relationshipId = createResult.relationshipId;
    console.log('✓ Relationship created:', relationshipId);

    // Step 2: Complete onboarding
    await updateCoachClientRelationship(relationshipId, {
      onboardingComplete: true,
      currentPlan: 'Beginner Weight Loss Program'
    });
    console.log('✓ Onboarding completed');

    // Step 3: Add initial assessment note
    await addCoachNote(
      relationshipId,
      'Initial assessment complete. Client goals: lose 10kg, improve cardio fitness. Starting with 3x/week training.'
    );
    console.log('✓ Initial note added');

    // Step 4: Update progress after first month
    await updateClientProgress(relationshipId, {
      percentage: 25,
      goalsAchieved: 1,
      weightChange: -2.5
    });
    console.log('✓ First month progress updated');

    // Step 5: Add progress note
    await addCoachNote(
      relationshipId,
      'Excellent progress after one month! Client has lost 2.5kg and significantly improved cardio endurance. Moving to intermediate program.'
    );
    console.log('✓ Progress note added');

    // Step 6: Update to intermediate program
    await updateCoachClientRelationship(relationshipId, {
      currentPlan: 'Intermediate Weight Loss + Strength Program'
    });
    console.log('✓ Program upgraded');

    console.log('🎉 Complete workflow finished successfully!');
    return relationshipId;

  } catch (error) {
    console.error('❌ Workflow failed:', error);
    throw error;
  }
};

// Usage in React components:
/*
import { exampleCreateRelationship, exampleUpdateProgress } from './path/to/this/file';

// In your component
const handleAcceptRequest = async (request) => {
  const relationshipId = await exampleCreateRelationship();
  if (relationshipId) {
    // Relationship created successfully
    setActiveClients(prev => prev + 1);
  }
};

const handleProgressUpdate = async (client, progressData) => {
  await exampleUpdateProgress(client.relationshipId);
};
*/
