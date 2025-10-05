import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseApp';

export async function updateExistingCoachProfile(coachId) {
    try {
        const coachRef = doc(db, 'coaches', coachId);
        await updateDoc(coachRef, {
            title: "Certified Personal Trainer",
            specialization: "Fitness Coach",
            rating: 0,
            experience: 0,
            clients: [],
            sessions: [],
            certifications: [],
            active: true,
            bio: "",
            availability: {
                monday: [],
                tuesday: [],
                wednesday: [],
                thursday: [],
                friday: [],
                saturday: [],
                sunday: []
            }
        });
        return true;
    } catch (error) {
        console.error('Error updating coach profile:', error);
        return false;
    }
}
