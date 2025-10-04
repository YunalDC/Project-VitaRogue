import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BG = "#0B1220";
const CARD = "#111827";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const SUCCESS = "#10B981";

export default function ArticleDetailScreen({ route, navigation }) {
  const { article } = route.params;

  const openArticleUrl = () => {
    if (article.url) {
      Linking.openURL(article.url).catch(err => console.error("Couldn't load page", err));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{article.source.name}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {article.urlToImage && <Image source={{ uri: article.urlToImage }} style={styles.image} />}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.meta}>
            By {article.author || 'Unknown Author'} • {new Date(article.publishedAt).toDateString()}
          </Text>
          <Text style={styles.description}>{article.description || "No description available."}</Text>
          <TouchableOpacity style={styles.readMoreButton} onPress={openArticleUrl}>
            <Text style={styles.readMoreButtonText}>Read Full Story</Text>
            <Ionicons name="open-outline" size={20} color={BG} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: CARD,
  },
  backButton: { padding: 4 },
  headerTitle: { color: TEXT, fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  contentContainer: { paddingBottom: 32 },
  image: { width: '100%', height: 220 },
  textContainer: { padding: 16 },
  title: { color: TEXT, fontSize: 22, fontWeight: '800', marginBottom: 12, lineHeight: 28 },
  meta: { color: MUTED, fontSize: 13, marginBottom: 16 },
  description: { color: TEXT, fontSize: 16, lineHeight: 24 },
  readMoreButton: {
    backgroundColor: SUCCESS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  readMoreButtonText: {
    color: BG,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
});