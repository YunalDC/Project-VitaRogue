import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Alert, 
    ActivityIndicator,
    TextInput 
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebaseApp';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
    bg: "#0B1220",
    card: "#111827",
    border: "#1f2937",
    text: "#e5e7eb",
    muted: "#94a3b8",
    primary: "#10B981",
    error: "#ef4444"
};

const CoachVerificationScreen = ({ navigation, route }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        nic: '',
        certificationNumber: '',
        issuingAuthority: '',
        yearOfCertification: '',
        gymAffiliation: '',
        experience: '',
        specializations: '',
        educationBackground: '',
        emergencyContact: ''
    });
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.pickMultiple({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true
            });
            setFiles([...files, ...result]);
        } catch (err) {
            if (!DocumentPicker.isCancel(err)) {
                Alert.alert('Error', 'Failed to pick document');
                console.error('Document picker error:', err);
            }
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        const required = ['fullName', 'nic', 'certificationNumber', 'issuingAuthority', 'yearOfCertification'];
        const missing = required.filter(field => !formData[field]);
        
        if (missing.length > 0 || files.length === 0) {
            Alert.alert(
                'Missing Information', 
                'Please fill in all required fields (*) and upload at least one document.'
            );
            return false;
        }
        return true;
    };

    const submitVerification = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const storageRef = ref(storage, `verification/${route.params.coachId}/${file.name}`);
                const response = await fetch(file.uri);
                const blob = await response.blob();
                await uploadBytes(storageRef, blob);
                return getDownloadURL(storageRef);
            });

            const fileUrls = await Promise.all(uploadPromises);

            const verificationData = {
                ...formData,
                certificationFiles: fileUrls,
                submissionDate: new Date().toISOString(),
                reviewStatus: 'pending',
                idProof: fileUrls[0]
            };

            await updateDoc(doc(db, 'coaches', route.params.coachId), {
                verificationSubmitted: true,
                verificationStatus: 'pending',
                verificationData: verificationData
            });

            Alert.alert(
                'Verification Submitted',
                'Your verification documents have been submitted for review. We will notify you once the review is complete.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Verification submission error:', error);
            Alert.alert('Error', 'Failed to submit verification. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Uploading documents...</Text>
            </View>
        );
    }

    const renderInput = (label, field, placeholder, required = true, keyboardType = 'default', multiline = false) => (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
                value={formData[field]}
                onChangeText={(value) => updateField(field, value)}
                style={[
                    styles.input,
                    multiline && { height: 80, textAlignVertical: 'top' }
                ]}
                placeholder={placeholder}
                placeholderTextColor={COLORS.muted}
                keyboardType={keyboardType}
                multiline={multiline}
            />
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.headerContainer}>
                    <Ionicons name="shield-checkmark" size={40} color={COLORS.primary} />
                    <Text style={styles.header}>Coach Verification</Text>
                    <Text style={styles.description}>
                        Please provide your credentials and certifications for verification.
                        All submissions will be reviewed by our team.
                    </Text>
                </View>

                {renderInput('Full Name', 'fullName', 'Enter your full name as per NIC')}
                {renderInput('NIC Number', 'nic', 'Enter your NIC number')}
                {renderInput('Certification Number', 'certificationNumber', 'Enter your certification number')}
                {renderInput('Issuing Authority/Institute', 'issuingAuthority', 'E.g., SLISM, NASM, ACE, etc.')}
                {renderInput('Year of Certification', 'yearOfCertification', 'YYYY', true, 'numeric')}
                {renderInput('Current Gym Affiliation', 'gymAffiliation', 'Enter gym name if affiliated', false)}
                {renderInput('Years of Experience', 'experience', 'Number of years as a fitness coach', true, 'numeric')}
                {renderInput('Specializations', 'specializations', 'E.g., Strength Training, Weight Loss, etc.', false, 'default', true)}
                {renderInput('Educational Background', 'educationBackground', 'Relevant education and qualifications', false, 'default', true)}
                {renderInput('Emergency Contact', 'emergencyContact', 'Contact number for emergencies')}

                <View style={styles.uploadSection}>
                    <Text style={styles.uploadHeader}>Required Documents</Text>
                    <Text style={styles.uploadDescription}>Please upload clear copies of:</Text>
                    <View style={styles.bulletPoints}>
                        <Text style={styles.bulletPoint}>• NIC (front and back)</Text>
                        <Text style={styles.bulletPoint}>• Certification documents</Text>
                        <Text style={styles.bulletPoint}>• Professional insurance (if any)</Text>
                        <Text style={styles.bulletPoint}>• Recent passport-size photo</Text>
                    </View>

                    <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                        <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
                        <Text style={styles.buttonText}>Upload Documents</Text>
                    </TouchableOpacity>

                    {files.length > 0 && (
                        <View style={styles.filesContainer}>
                            <Text style={styles.filesHeader}>Selected Documents:</Text>
                            {files.map((file, index) => (
                                <Text key={index} style={styles.fileName}>
                                    <Ionicons name="document-outline" size={16} color={COLORS.primary} />
                                    {" "}{file.name}
                                </Text>
                            ))}
                        </View>
                    )}
                </View>

                <TouchableOpacity 
                    style={styles.submitButton}
                    onPress={submitVerification}
                >
                    <Text style={styles.buttonText}>Submit for Verification</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    content: {
        padding: 20,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginVertical: 10,
    },
    description: {
        color: COLORS.muted,
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 10,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    required: {
        color: COLORS.error,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.text,
        backgroundColor: COLORS.card,
        marginTop: 4,
    },
    uploadSection: {
        marginTop: 20,
        marginBottom: 30,
    },
    uploadHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 10,
    },
    uploadDescription: {
        color: COLORS.muted,
        marginBottom: 10,
    },
    bulletPoints: {
        marginBottom: 15,
    },
    bulletPoint: {
        color: COLORS.text,
        marginBottom: 5,
        fontSize: 14,
    },
    uploadButton: {
        backgroundColor: COLORS.card,
        padding: 15,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 8,
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    filesContainer: {
        marginTop: 15,
        padding: 15,
        backgroundColor: COLORS.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filesHeader: {
        fontWeight: 'bold',
        marginBottom: 10,
        color: COLORS.text,
    },
    fileName: {
        color: COLORS.text,
        marginBottom: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.bg,
    },
    loadingText: {
        marginTop: 10,
        color: COLORS.text,
    },
});

export default CoachVerificationScreen;
