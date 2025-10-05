import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseApp';

const COACH_ID = '07TWKdZkkRRvLucCAaGVR3XUEP72';

async function updateCoach() {
    try {
        const coachRef = doc(db, 'coaches', COACH_ID);
        
        // First get existing data
        const coachSnap = await getDoc(coachRef);
        const existingData = coachSnap.data();

        // Prepare update data while preserving existing fields
        const updateData = {
            ...existingData,
            title: existingData.title || "Certified Personal Trainer",
            specialization: existingData.specialization || "Fitness Coach",
            rating: existingData.rating || 0,
            experience: existingData.experience || 0,
            clients: existingData.clients || [],
            sessions: existingData.sessions || [],
            certifications: existingData.certifications || [],
            active: existingData.active !== undefined ? existingData.active : true,
            bio: existingData.bio || "",
            verificationStatus: existingData.verificationStatus || "unverified",
            verificationSubmitted: existingData.verificationSubmitted || false,
            verificationData: existingData.verificationData || {
                certificationFiles: [],
                idProof: "",
                certificationNumber: "",
                issuingAuthority: "",
                yearOfCertification: "",
                professionalInsurance: "",
                submissionDate: null,
                reviewDate: null,
                reviewStatus: "pending"
            },
            availability: existingData.availability || {
                monday: [],
                tuesday: [],
                wednesday: [],
                thursday: [],
                friday: [],
                saturday: [],
                sunday: []
            }
        };

        // Update the document
        await updateDoc(coachRef, updateData);
        console.log('Coach profile updated successfully!');
        return true;
    } catch (error) {
        console.error('Error updating coach profile:', error);
        return false;
    }
}

// Export the function so we can call it
export { updateCoach };
