import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const VerificationBanner = ({ status, onVerifyPress }) => {
    const getBannerColor = () => {
        switch (status) {
            case 'verified':
                return '#32cd32';
            case 'pending':
                return '#ffd700';
            default:
                return '#ff6b6b';
        }
    };

    const getBannerText = () => {
        switch (status) {
            case 'verified':
                return 'Verified Coach ✓';
            case 'pending':
                return 'Verification Under Review';
            default:
                return 'Unverified Coach - Click to Verify';
        }
    };

    return (
        <TouchableOpacity 
            style={[styles.banner, { backgroundColor: getBannerColor() }]}
            onPress={status === 'unverified' ? onVerifyPress : null}
            disabled={status !== 'unverified'}
        >
            <Text style={styles.bannerText}>{getBannerText()}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    banner: {
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
        marginHorizontal: 15,
        marginTop: 15,
    },
    bannerText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default VerificationBanner;
