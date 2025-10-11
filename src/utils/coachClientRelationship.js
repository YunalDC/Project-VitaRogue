import { db } from '../lib/firebaseApp';
import { doc, getDoc, setDoc, collection, updateDoc, getDocs, query, where } from 'firebase/firestore';

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

    if (!coachId || !clientId) {
      throw new Error('Both coachId and clientId are required');
    }

    const nowISO = new Date().toISOString();

    const relationshipsRef = collection(db, 'UserCoachRelationships');
    let existingRelationshipDoc = null;

    try {
      const existingQuery = query(
        relationshipsRef,
        where('coachId', '==', coachId),
        where('clientId', '==', clientId)
      );
      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        existingRelationshipDoc = existingSnapshot.docs[0];
      }
    } catch (error) {
      console.warn('[CoachClientRelationship] Unable to query existing relationship by coachId/clientId', error);
    }

    if (!existingRelationshipDoc) {
      try {
        const fallbackQuery = query(relationshipsRef, where('coach.id', '==', coachId));
        const fallbackSnapshot = await getDocs(fallbackQuery);
        fallbackSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (!existingRelationshipDoc && data.client?.id === clientId) {
            existingRelationshipDoc = docSnap;
          }
        });
      } catch (fallbackError) {
        console.warn('[CoachClientRelationship] Fallback relationship query failed', fallbackError);
        if (fallbackError.code === 'failed-precondition') {
          try {
            const allSnapshot = await getDocs(relationshipsRef);
            allSnapshot.docs.forEach((docSnap) => {
              const data = docSnap.data();
              if (!existingRelationshipDoc && data.coach?.id === coachId && data.client?.id === clientId) {
                existingRelationshipDoc = docSnap;
              }
            });
          } catch (fullScanError) {
            console.warn('[CoachClientRelationship] Full scan fallback failed', fullScanError);
          }
        }
      }
    }

    if (existingRelationshipDoc) {
      const existingData = existingRelationshipDoc.data();
      const existingStatus = existingData.status || 'active';
      const relationshipRef = doc(db, 'UserCoachRelationships', existingRelationshipDoc.id);

      if (existingStatus !== 'active') {
        const reactivationUpdates = {
          status: 'active',
          endDate: null,
          endReason: null,
          lastUpdated: nowISO,
          relationshipSource: requestData.source || existingData.relationshipSource || 'coach_request',
        };
        await updateDoc(relationshipRef, reactivationUpdates);

        return {
          success: true,
          relationshipId: existingRelationshipDoc.id,
          data: { ...existingData, ...reactivationUpdates },
          alreadyExisted: true,
          reactivated: true,
        };
      }

      return {
        success: true,
        relationshipId: existingRelationshipDoc.id,
        data: existingData,
        alreadyExisted: true,
      };
    }

    let clientData = null;
    try {
      const clientDocRef = doc(db, 'users', clientId);
      const clientDoc = await getDoc(clientDocRef);
      if (clientDoc.exists()) {
        clientData = clientDoc.data();
      }
    } catch (clientError) {
      console.warn('[CoachClientRelationship] Failed to read client profile', clientError);
    }

    const fallbackClient = requestData.clientFallback || {};
    if (!clientData) {
      console.warn('[CoachClientRelationship] Client user data not found; using fallback information if available');
      clientData = {};
    }
    const mergedClientData = { ...fallbackClient, ...clientData };

    const clientName = mergedClientData.name || mergedClientData.displayName || requestData.requesterName || 'Client';
    const clientEmail = mergedClientData.email || requestData.requesterEmail || null;
    const clientPhoto = mergedClientData.photoURL || mergedClientData.avatar || requestData.requesterPhotoURL || 'https://placehold.co/200x200/png';

    const clientFitnessGoals = Array.isArray(mergedClientData.fitnessGoals) && mergedClientData.fitnessGoals.length > 0
      ? mergedClientData.fitnessGoals
      : Array.isArray(requestData.requesterFitnessGoals) && requestData.requesterFitnessGoals.length > 0
        ? requestData.requesterFitnessGoals
        : (requestData.requesterWeightGoal ? [requestData.requesterWeightGoal] : []);
    const clientWeightGoal = mergedClientData.weightGoal || requestData.requesterWeightGoal || clientFitnessGoals[0] || 'General Fitness';

    console.log('[CoachClientRelationship] Resolved client data:', {
      name: clientName,
      email: clientEmail,
      weightGoal: clientWeightGoal,
      fitnessGoals: clientFitnessGoals,
    });

    let completeCoachData = coachData;
    if (!coachData.name || !coachData.email) {
      const coachDoc = await getDoc(doc(db, 'users', coachId));
      if (coachDoc.exists()) {
        const dbCoachData = coachDoc.data();
        completeCoachData = {
          name: coachData.name || dbCoachData.name || dbCoachData.displayName,
          email: coachData.email || dbCoachData.email,
          photoURL: coachData.photoURL || dbCoachData.photoURL || dbCoachData.avatar,
          ...coachData,
        };
      }
    }

    const filterUndefined = (obj) => {
      const filtered = {};
      Object.keys(obj).forEach((key) => {
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

    const relationshipRef = doc(collection(db, 'UserCoachRelationships'));
    const relationshipData = {
      coachId,
      clientId,
      coach: filterUndefined({
        id: coachId,
        name: completeCoachData.name || 'Coach',
        email: completeCoachData.email,
        photoURL: completeCoachData.photoURL || 'https://placehold.co/200x200/png',
      }),
      client: filterUndefined({
        id: clientId,
        name: clientName,
        email: clientEmail,
        photoURL: clientPhoto,
        ...(mergedClientData.age !== undefined && { age: mergedClientData.age }),
        ...(mergedClientData.gender !== undefined && { gender: mergedClientData.gender }),
        ...(mergedClientData.heightCm !== undefined && { heightCm: mergedClientData.heightCm }),
        ...(mergedClientData.weightKg !== undefined && { weightKg: mergedClientData.weightKg }),
        ...(mergedClientData.fitnessLevel !== undefined && { fitnessLevel: mergedClientData.fitnessLevel }),
        weightGoal: clientWeightGoal,
        fitnessGoals: clientFitnessGoals,
      }),
      status: 'active',
      startDate: nowISO,
      createdAt: nowISO,
      lastUpdated: nowISO,
      currentGoals: clientFitnessGoals.length > 0 ? clientFitnessGoals : [clientWeightGoal],
      currentPlan: 'Personalized Training Program',
      progress: {
        percentage: 0,
        goalsAchieved: 0,
        totalGoals: clientFitnessGoals.length || 1,
        weightChange: 0,
        lastProgressUpdate: nowISO,
      },
      sessions: {
        total: 0,
        completed: 0,
        upcoming: 0,
        lastSession: null,
        nextSession: null,
      },
      coachNotes: requestData.message || 'New client onboarded',
      lastContact: nowISO,
      lastMessage: 'Welcome! Looking forward to working together!',
      relationshipSource: requestData.source || 'coach_request',
      onboardingComplete: false,
      communicationPreferences: {
        notifications: true,
        sessionReminders: true,
        progressUpdates: true,
      },
    };

    const requestMetadata = filterUndefined({
      message: requestData.message,
      source: requestData.source,
      notificationId: requestData.notificationId,
      requesterId: requestData.requesterId || requestData.senderId || mergedClientData.id || clientId,
      requestedAt: requestData.requestedAt,
    });
    if (Object.keys(requestMetadata).length > 0) {
      relationshipData.requestMetadata = requestMetadata;
    }

    console.log('[CoachClientRelationship] Writing relationship data:', relationshipData);

    await setDoc(relationshipRef, relationshipData);

    console.log('[CoachClientRelationship] Successfully created relationship with ID:', relationshipRef.id);

    return {
      success: true,
      relationshipId: relationshipRef.id,
      data: relationshipData,
    };

  } catch (error) {
    console.error('[CoachClientRelationship] Error creating relationship:', error);
    return {
      success: false,
      error: error.message,
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
