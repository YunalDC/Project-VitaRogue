import { db } from '../lib/firebaseApp';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, updateDoc } from 'firebase/firestore';

/**
 * Creates a new coach-client relationship in Firestore
 * @param {Object} params - The relationship parameters
 * @param {string} params.coachId - The coach's user ID
 * @param {string} params.clientId - The client's user ID
 * @param {Object} params.coachData - Additional coach data
 * @param {Object} params.requestData - Original request data (optional)
 * @returns {Promise<Object>} - Success status and relationship ID
 */
export const createCoachClientRelationship = async ({
  coachId,
  clientId,
  coachData = {},
  requestData = {}
}) => {
  try {
    console.log('[CoachClientRelationship] Creating relationship between coach:', coachId, 'and client:', clientId);

    // Validate required parameters
    if (!coachId || !clientId) {
      throw new Error('Both coachId and clientId are required');
    }

    // Get client data from users collection
    const clientDoc = await getDoc(doc(db, 'users', clientId));
    if (!clientDoc.exists()) {
      throw new Error('Client user data not found');
    }
    const clientData = clientDoc.data();
    
    console.log('[CoachClientRelationship] Raw client data:', JSON.stringify(clientData, null, 2));
    console.log('[CoachClientRelationship] Client age:', clientData.age, typeof clientData.age);

    // Get coach data from users collection (as backup if not provided)
    let completeCoachData = coachData;
    if (!coachData.name || !coachData.email) {
      const coachDoc = await getDoc(doc(db, 'users', coachId));
      if (coachDoc.exists()) {
        const dbCoachData = coachDoc.data();
        completeCoachData = {
          name: coachData.name || dbCoachData.name || dbCoachData.displayName,
          email: coachData.email || dbCoachData.email,
          photoURL: coachData.photoURL || dbCoachData.photoURL || dbCoachData.avatar,
          ...coachData
        };
      }
    }

    // Helper function to filter out undefined values
    const filterUndefined = (obj) => {
      const filtered = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined && obj[key] !== null) {
          if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            const nestedFiltered = filterUndefined(obj[key]);
            if (Object.keys(nestedFiltered).length > 0) {
              filtered[key] = nestedFiltered;
            }
          } else {
            filtered[key] = obj[key];
          }
        }
      });
      return filtered;
    };

    // Create the relationship document
    const relationshipRef = doc(collection(db, 'UserCoachRelationships'));
    const relationshipData = {
      coach: filterUndefined({
        id: coachId,
        name: completeCoachData.name || 'Coach',
        email: completeCoachData.email,
        photoURL: completeCoachData.photoURL || 'https://placehold.co/200x200/png'
      }),
      client: filterUndefined({
        id: clientId,
        name: clientData.name || clientData.displayName || 'Client',
        email: clientData.email,
        photoURL: clientData.photoURL || clientData.avatar || 'https://placehold.co/200x200/png',
        ...(clientData.age !== undefined && { age: clientData.age }),
        ...(clientData.gender !== undefined && { gender: clientData.gender }),
        ...(clientData.heightCm !== undefined && { heightCm: clientData.heightCm }),
        ...(clientData.weightKg !== undefined && { weightKg: clientData.weightKg }),
        ...(clientData.fitnessLevel !== undefined && { fitnessLevel: clientData.fitnessLevel }),
        ...(clientData.weightGoal !== undefined && { weightGoal: clientData.weightGoal }),
        fitnessGoals: clientData.fitnessGoals || []
      }),
      status: 'active',
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(), // Use ISO string instead of serverTimestamp for now
      lastUpdated: new Date().toISOString(), // Use ISO string instead of serverTimestamp for now
      currentGoals: clientData.fitnessGoals || [clientData.weightGoal || 'General Fitness'],
      currentPlan: 'Personalized Training Program',
      progress: {
        percentage: 0,
        goalsAchieved: 0,
        totalGoals: (clientData.fitnessGoals || []).length || 1,
        weightChange: 0,
        lastProgressUpdate: new Date().toISOString()
      },
      sessions: {
        total: 0,
        completed: 0,
        upcoming: 0,
        lastSession: null,
        nextSession: null
      },
      coachNotes: requestData.message || 'New client onboarded',
      lastContact: new Date().toISOString(), // Use ISO string instead of serverTimestamp for now
      lastMessage: 'Welcome! Looking forward to working together!',
      // Additional metadata
      relationshipSource: requestData.source || 'coach_request',
      onboardingComplete: false,
      communicationPreferences: {
        notifications: true,
        sessionReminders: true,
        progressUpdates: true
      }
    };

    console.log('[CoachClientRelationship] Writing relationship data:', relationshipData);
    console.log('[CoachClientRelationship] Client data in final object:', relationshipData.client);
    console.log('[CoachClientRelationship] Checking for undefined values in client:');
    Object.keys(relationshipData.client).forEach(key => {
      console.log(`  ${key}: ${relationshipData.client[key]} (${typeof relationshipData.client[key]})`);
    });
    
    await setDoc(relationshipRef, relationshipData);

    console.log('[CoachClientRelationship] Successfully created relationship with ID:', relationshipRef.id);

    return {
      success: true,
      relationshipId: relationshipRef.id,
      data: relationshipData
    };

  } catch (error) {
    console.error('[CoachClientRelationship] Error creating relationship:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Updates an existing coach-client relationship
 * @param {string} relationshipId - The relationship document ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} - Success status
 */
export const updateCoachClientRelationship = async (relationshipId, updates) => {
  try {
    console.log('[CoachClientRelationship] Updating relationship:', relationshipId, 'with:', updates);

    if (!relationshipId) {
      throw new Error('Relationship ID is required');
    }

    const relationshipRef = doc(db, 'UserCoachRelationships', relationshipId);
    
    // Add lastUpdated timestamp
    const updateData = {
      ...updates,
      lastUpdated: new Date().toISOString() // Use ISO string instead of serverTimestamp for now
    };

    await updateDoc(relationshipRef, updateData);

    console.log('[CoachClientRelationship] Successfully updated relationship');

    return {
      success: true,
      relationshipId
    };

  } catch (error) {
    console.error('[CoachClientRelationship] Error updating relationship:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Ends a coach-client relationship
 * @param {string} relationshipId - The relationship document ID
 * @param {string} reason - Reason for ending the relationship
 * @returns {Promise<Object>} - Success status
 */
export const endCoachClientRelationship = async (relationshipId, reason = 'Mutual agreement') => {
  try {
    console.log('[CoachClientRelationship] Ending relationship:', relationshipId);

    if (!relationshipId) {
      throw new Error('Relationship ID is required');
    }

    const relationshipRef = doc(db, 'UserCoachRelationships', relationshipId);
    
    await updateDoc(relationshipRef, {
      status: 'ended',
      endDate: new Date().toISOString(),
      endReason: reason,
      lastUpdated: new Date().toISOString() // Use ISO string instead of serverTimestamp for now
    });

    console.log('[CoachClientRelationship] Successfully ended relationship');

    return {
      success: true,
      relationshipId
    };

  } catch (error) {
    console.error('[CoachClientRelationship] Error ending relationship:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Updates client progress in the relationship
 * @param {string} relationshipId - The relationship document ID
 * @param {Object} progressData - Progress update data
 * @returns {Promise<Object>} - Success status
 */
export const updateClientProgress = async (relationshipId, progressData) => {
  try {
    console.log('[CoachClientRelationship] Updating client progress for:', relationshipId);

    if (!relationshipId || !progressData) {
      throw new Error('Relationship ID and progress data are required');
    }

    const relationshipRef = doc(db, 'UserCoachRelationships', relationshipId);
    
    await updateDoc(relationshipRef, {
      'progress.percentage': progressData.percentage || 0,
      'progress.goalsAchieved': progressData.goalsAchieved || 0,
      'progress.weightChange': progressData.weightChange || 0,
      'progress.lastProgressUpdate': new Date().toISOString(),
      lastUpdated: new Date().toISOString() // Use ISO string instead of serverTimestamp for now
    });

    console.log('[CoachClientRelationship] Successfully updated client progress');

    return {
      success: true,
      relationshipId
    };

  } catch (error) {
    console.error('[CoachClientRelationship] Error updating progress:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Adds a coach note to the relationship
 * @param {string} relationshipId - The relationship document ID
 * @param {string} note - The note to add
 * @returns {Promise<Object>} - Success status
 */
export const addCoachNote = async (relationshipId, note) => {
  try {
    console.log('[CoachClientRelationship] Adding coach note to:', relationshipId);

    if (!relationshipId || !note) {
      throw new Error('Relationship ID and note are required');
    }

    const relationshipRef = doc(db, 'UserCoachRelationships', relationshipId);
    
    // Get current notes and append new one
    const relationshipDoc = await getDoc(relationshipRef);
    if (!relationshipDoc.exists()) {
      throw new Error('Relationship not found');
    }

    const currentData = relationshipDoc.data();
    const existingNotes = currentData.coachNotes || '';
    const timestamp = new Date().toLocaleDateString();
    const newNotes = existingNotes + `\n[${timestamp}] ${note}`;

    await updateDoc(relationshipRef, {
      coachNotes: newNotes,
      lastUpdated: new Date().toISOString() // Use ISO string instead of serverTimestamp for now
    });

    console.log('[CoachClientRelationship] Successfully added coach note');

    return {
      success: true,
      relationshipId
    };

  } catch (error) {
    console.error('[CoachClientRelationship] Error adding coach note:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
