import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../lib/firebaseApp";

export default function CoachPendingApproval({ navigation }) {
  return (
    <View style={{flex:1, backgroundColor:"#0b1220", alignItems:"center", justifyContent:"center", padding:24}}>
      <Text style={{color:"#e5e7eb", fontSize:22, fontWeight:"800", marginBottom:8}}>
        Coach profile under review
      </Text>
      <Text style={{color:"#9ca3af", textAlign:"center", lineHeight:20, marginBottom:24}}>
        Thanks for submitting your documents. Our team will review and approve your coach account shortly.
        You’ll get access to coach features as soon as it’s approved.
      </Text>
      <TouchableOpacity
        onPress={async () => { await signOut(firebaseAuth); navigation.reset({index:0, routes:[{name:"Auth"}]}); }}
        style={{backgroundColor:"#10b981", paddingVertical:14, paddingHorizontal:20, borderRadius:12}}
      >
        <Text style={{color:"#0b1220", fontWeight:"800"}}>Return to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}
