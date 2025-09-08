import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import styles from "../theme/styles";

export default function HomeScreen({ route, navigation }) {
  const email = route.params?.email;

  return (
    <View style={[styles.screen, { padding: 24, justifyContent: "center", alignItems: "center" }]}>
      <Text style={[styles.title, { textAlign: "center" }]}>Hello{email ? `, ${email}` : ""} 👋</Text>
      <Text style={{ color: "#334155", marginTop: 8, textAlign: "center" }}>
        You’re signed in. Replace this with your app content.
      </Text>

      <TouchableOpacity
        onPress={() => navigation.reset({ index: 0, routes: [{ name: "SignIn" }] })}
        style={[styles.btn, { marginTop: 24 }]}
      >
        <Text style={styles.btnText}>Sign Out</Text>
      </TouchableOpacity>
      <StatusBar style="dark" />
    </View>
  );
}
