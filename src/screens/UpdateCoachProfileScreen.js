import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { updateCoach } from '../utils/updateExistingCoach';

export default function UpdateCoachProfileScreen({ navigation }) {
    const [updating, setUpdating] = useState(false);

    const handleUpdate = async () => {
        try {
            setUpdating(true);
            const success = await updateCoach();
            if (success) {
                Alert.alert(
                    'Success',
                    'Your coach profile has been updated with all required fields.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Error', 'Failed to update coach profile. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred while updating the profile.');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Update Coach Profile</Text>
            <Text style={styles.description}>
                This will update your coach profile with any missing required fields.
            </Text>
            <TouchableOpacity 
                style={[styles.button, updating && styles.buttonDisabled]}
                onPress={handleUpdate}
                disabled={updating}
            >
                <Text style={styles.buttonText}>
                    {updating ? 'Updating...' : 'Update Profile'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B1220',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 32,
    },
    button: {
        backgroundColor: '#10B981',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
