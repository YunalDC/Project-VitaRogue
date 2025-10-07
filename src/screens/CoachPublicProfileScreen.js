import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseApp';
import { getAuth } from 'firebase/auth';
import { getOrCreateOneToOneChat } from '../lib/chatUtils';

const C = {
  bg:'#0B1220', card:'#111b29', border:'#1f2937', text:'#e5e7eb', muted:'#94a3b8', accent:'#10B981'
};

export default function CoachPublicProfileScreen({ route, navigation }) {
  const { coachId } = route.params || {};
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!coachId) return;
        const snap = await getDoc(doc(db,'coaches', coachId));
        if (alive) setCoach(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch(e){ console.warn('[CoachPublicProfile] load error', e); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive=false; };
  }, [coachId]);

  const startChat = async () => {
    try {
      if (!currentUser) { navigation.navigate('SignIn'); return; }
      if (currentUser.uid === coachId) return; // no self-chat
      const chat = await getOrCreateOneToOneChat(currentUser.uid, coachId);
      navigation.navigate('Chat', { chatId: chat.id, otherUser: chat.participantDetails[coachId] });
    } catch(e) { console.warn('[CoachPublicProfile] startChat error', e); }
  };

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator color={C.accent} size='large' /></SafeAreaView>;
  }
  if (!coach) {
    return <SafeAreaView style={styles.center}><Text style={styles.muted}>Coach not found.</Text></SafeAreaView>;
  }

  const avatar = coach.photoURL || coach.avatar || 'https://placehold.co/200x200/png';
  const name = coach.name || coach.displayName || 'Coach';
  const bio = coach.shortBio || coach.bio || 'No bio provided yet.';
  const spec = coach.specialization || coach.focus || 'Fitness';
  const rating = coach.rating || 0;
  const reviews = coach.reviewsList || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:40 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name='chevron-back' size={22} color={C.text} />
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <View style={{ flex:1, marginLeft:16 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.spec}>{spec}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name='star' size={14} color='#facc15' />
              <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{bio}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
          {reviews.length === 0 && <Text style={styles.muted}>No reviews yet.</Text>}
          {reviews.map(r => (
            <View key={r.id} style={styles.reviewItem}>
              <Text style={styles.reviewLine}><Text style={styles.reviewAuthor}>{r.reviewer||'User'}</Text> {r.stars?`(${r.stars}⭐)`:''}</Text>
              <Text style={styles.reviewText}>{r.comment}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {currentUser?.uid !== coachId && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.messageBtn} onPress={startChat}>
            <Ionicons name='chatbubbles' size={18} color={C.bg} />
            <Text style={styles.messageText}>Message</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:C.bg },
  center:{ flex:1, backgroundColor:C.bg, alignItems:'center', justifyContent:'center' },
  muted:{ color:C.muted },
  backBtn:{ width:36, height:36, borderRadius:18, backgroundColor:'#102133', alignItems:'center', justifyContent:'center', marginBottom:12, borderWidth:1, borderColor:C.border },
  headerCard:{ flexDirection:'row', backgroundColor:C.card, padding:16, borderRadius:16, borderWidth:1, borderColor:C.border, marginBottom:16 },
  avatar:{ width:72, height:72, borderRadius:16, backgroundColor:'#1e293b' },
  name:{ color:C.text, fontSize:22, fontWeight:'900' },
  spec:{ color:C.muted, marginTop:4, fontWeight:'600' },
  ratingRow:{ flexDirection:'row', alignItems:'center', gap:6, marginTop:8, backgroundColor:'#132338', paddingHorizontal:10, height:30, borderRadius:15, alignSelf:'flex-start', borderWidth:1, borderColor:C.border },
  ratingText:{ color:C.text, fontWeight:'800', marginLeft:4 },
  section:{ marginBottom:20 },
  sectionTitle:{ color:C.text, fontWeight:'800', fontSize:16, marginBottom:8 },
  bio:{ color:C.text, lineHeight:20, fontSize:13 },
  reviewItem:{ backgroundColor:'#0e1a2b', borderWidth:1, borderColor:C.border, padding:10, borderRadius:10, marginBottom:8 },
  reviewLine:{ color:C.text, fontSize:12, fontWeight:'600', marginBottom:4 },
  reviewAuthor:{ color:'#facc15' },
  reviewText:{ color:C.text, fontSize:12 },
  footer:{ position:'absolute', left:0, right:0, bottom:0, padding:16, backgroundColor:'rgba(11,18,32,0.9)', borderTopWidth:1, borderTopColor:C.border },
  messageBtn:{ flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:C.accent, paddingVertical:14, borderRadius:14 },
  messageText:{ color:C.bg, fontWeight:'800', marginLeft:8, fontSize:15 },
});
