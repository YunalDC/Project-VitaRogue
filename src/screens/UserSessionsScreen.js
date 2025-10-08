import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { db } from '../lib/firebaseApp';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const BG = '#0B1220';
const CARD = '#111827';
const TEXT = '#e5e7eb';
const MUTED = '#94a3b8';
const ACCENT = '#60a5fa';
const SUCCESS = '#10B981';
const DANGER = '#ef4444';

export default function UserSessionsScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const me = auth.currentUser?.uid;

  useEffect(() => {
    if(!me) { setLoading(false); return; }
    const col = collection(db,'sessions');
    const q = query(col, where('clientId','==',me), orderBy('startTime','asc'));
    const unsub = onSnapshot(q, snap => {
      const list = []; snap.forEach(d=> list.push({ id: d.id, ...d.data() }));
      setSessions(list);
      setLoading(false);
    }, err => { console.warn('sessions listen failed', err); setLoading(false); });
    return () => unsub();
  }, [me]);

  const confirmSession = async (s) => {
    try {
      await updateDoc(doc(db,'sessions', s.id), { clientConfirmed: true });
    } catch(e){ Alert.alert('Error','Failed to confirm'); }
  };
  const cancelSession = async (s) => {
    Alert.alert('Cancel Session','Are you sure?', [
      { text: 'No', style:'cancel' },
      { text: 'Yes', style:'destructive', onPress: async () => {
        try { await updateDoc(doc(db,'sessions', s.id), { status: 'cancelledByClient' }); } catch(e){ Alert.alert('Error','Failed to cancel'); }
      } }
    ]);
  };

  const renderItem = ({ item }) => {
    const start = item.startTime?.toDate?.() || null;
    const timeStr = start ? start.toLocaleString() : 'TBD';
    return (
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent:'space-between' }}>
          <Text style={styles.title}>{item.type || 'Session'}</Text>
          <Text style={[styles.status, statusStyle(item.status)]}>{item.status}</Text>
        </View>
        <Text style={styles.time}>{timeStr}</Text>
        <Text style={styles.meta}>Coach: {item.coachId}</Text>
        {item.status === 'scheduled' && !item.clientConfirmed && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: SUCCESS }]} onPress={()=>confirmSession(item)}>
              <Text style={styles.btnText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: DANGER }]} onPress={()=>cancelSession(item)}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        {item.clientConfirmed && <Text style={styles.confirmed}>Confirmed</Text>}
      </View>
    );
  };

  const statusStyle = (status) => ({ color: status?.includes('cancel') ? DANGER : status === 'completed' ? SUCCESS : ACCENT, fontWeight:'600', fontSize:12 });

  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} size='large' color={SUCCESS} /> : (
        <FlatList
          data={sessions}
          keyExtractor={i=>i.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{ color: MUTED, textAlign:'center', marginTop:40 }}>No sessions yet</Text>}
          contentContainerStyle={{ padding:16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: BG },
  card: { backgroundColor: CARD, padding:16, borderRadius:16, marginBottom:16 },
  title: { color: TEXT, fontSize:16, fontWeight:'700' },
  time: { color: MUTED, fontSize:12, marginTop:4 },
  meta: { color: MUTED, fontSize:12, marginTop:4 },
  status: { textTransform:'capitalize' },
  actions: { flexDirection:'row', gap:12, marginTop:12 },
  btn: { paddingVertical:8, paddingHorizontal:16, borderRadius:8 },
  btnText: { color: '#0B1220', fontWeight:'700', fontSize:12 },
  confirmed: { color: SUCCESS, fontSize:12, marginTop:8, fontWeight:'600' }
});
