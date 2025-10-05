import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseApp';

const AdminCoachVerification = () => {
    const [pendingCoaches, setPendingCoaches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingVerifications();
    }, []);

    const fetchPendingVerifications = async () => {
        try {
            const q = query(
                collection(db, 'coaches'),
                where('verificationStatus', '==', 'pending')
            );
            const querySnapshot = await getDocs(q);
            const coaches = [];
            querySnapshot.forEach((doc) => {
                coaches.push({ id: doc.id, ...doc.data() });
            });
            setPendingCoaches(coaches);
        } catch (error) {
            console.error('Error fetching pending verifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (coachId, approved) => {
        try {
            await updateDoc(doc(db, 'coaches', coachId), {
                verificationStatus: approved ? 'verified' : 'rejected',
                verificationData: {
                    ...pendingCoaches.find(coach => coach.id === coachId).verificationData,
                    reviewDate: new Date().toISOString(),
                    reviewStatus: approved ? 'approved' : 'rejected'
                }
            });
            // Refresh the list
            fetchPendingVerifications();
        } catch (error) {
            console.error('Error updating verification status:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Coach Verification Dashboard</h1>
            
            {pendingCoaches.length === 0 ? (
                <p>No pending verifications</p>
            ) : (
                <div className="grid gap-4">
                    {pendingCoaches.map((coach) => (
                        <div key={coach.id} className="border p-4 rounded-lg">
                            <h2 className="text-xl font-semibold">{coach.name}</h2>
                            <div className="mt-2">
                                <p><strong>Certification Number:</strong> {coach.verificationData.certificationNumber}</p>
                                <p><strong>Authority:</strong> {coach.verificationData.issuingAuthority}</p>
                                <p><strong>Year:</strong> {coach.verificationData.yearOfCertification}</p>
                                <p><strong>Insurance:</strong> {coach.verificationData.professionalInsurance}</p>
                            </div>
                            
                            <div className="mt-4">
                                <h3 className="font-semibold">Documents:</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {coach.verificationData.certificationFiles.map((url, index) => (
                                        <a 
                                            key={index}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline"
                                        >
                                            Document {index + 1}
                                        </a>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => handleVerification(coach.id, true)}
                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleVerification(coach.id, false)}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminCoachVerification;
