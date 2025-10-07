import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getOrCreateOneToOneChat } from '../lib/chatUtils';

// Deprecated mock messaging screen. Redirects to unified Chat screen.
export default function CoachClientMessaging({ route, navigation }) {
    const clientIdFromClientObj = route?.params?.client?.id;
    const explicitClientId = route?.params?.clientId;
    const clientId = explicitClientId || clientIdFromClientObj;

    useEffect(() => {
        let cancelled = false;
        const ensure = async () => {
            try {
                const auth = getAuth();
                const me = auth.currentUser;
                if (!me || !clientId) return;
                const chat = await getOrCreateOneToOneChat(me.uid, clientId);
                if (!cancelled) {
                    navigation.replace('Chat', { chatId: chat.id, otherUser: chat.participantDetails[clientId] });
                }
            } catch (e) {
                console.warn('[CoachClientMessaging redirect] error', e);
            }
        };
        ensure();
        return () => { cancelled = true; };
    }, [clientId, navigation]);

    return (
        <View style={styles.root}>
            <Text style={styles.text}>Preparing chat…</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#0B1220' },
    text: { color:'#fff', fontWeight:'600' }
});