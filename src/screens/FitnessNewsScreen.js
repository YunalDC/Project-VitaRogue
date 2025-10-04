import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Linking, // Note: This is now only used for the Alert message as a fallback, but the main press uses internal logic.
  ActivityIndicator,
  Alert,
  Modal, // <-- ADDED: For displaying the WebView content
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
// You will need to install this package: npm install react-native-webview
import { WebView } from 'react-native-webview'; // <-- ADDED: For displaying the webpage content

// --- Theme Colors ---
const BG = "#0B1220";
const CARD = "#111827";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const SUCCESS = "#10B981";
const BORDER = "#1f2937";

// --- Your API Key ---
const API_KEY = "757eee66081c431783fad422591eeabc";
const NEWS_API_URL = "https://newsapi.org/v2/everything";

export default function FitnessNewsScreen() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  // State to hold the URL of the article to show in the WebView
  const [selectedUrl, setSelectedUrl] = useState(null); 

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);

        // 1. Refined Query for better targeting (kept broad to cover all angles)
        const query = "fitness OR workout OR exercise OR nutrition OR well-being";

        // 2. Focused Domains (Replaces 'sources' with highly specific fitness/health publishers)
        // Using 'domains' is more reliable for specialized sites than 'sources' IDs.
        const domains = "menshealth.com,womenshealthmag.com,runnersworld.com,self.com,greatist.com";
        
        // 3. Construct the URL using 'domains'
        const url = `${NEWS_API_URL}?q=${encodeURIComponent(query)}&domains=${domains}&language=en&sortBy=publishedAt&apiKey=${API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'ok') {
          // Filter out articles without an image to ensure a consistent UI.
          const articlesWithImages = data.articles.filter(article => article.urlToImage);
          setNews(articlesWithImages);
        } else {
          Alert.alert("API Error", data.message || "Failed to fetch news.");
        }
      } catch (error) {
        console.error("News fetch error:", error);
        Alert.alert("Network Error", "Could not connect to the news server. Please check your internet connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // New function to handle opening the article internally
  const handleArticlePress = (url) => {
    setSelectedUrl(url); 
  };
  
  // New function to close the WebView modal
  const handleCloseModal = () => {
    setSelectedUrl(null); 
  };

  const renderNewsItem = ({ item }) => {
    // Only render the card if the item and its required properties exist
    if (!item || !item.urlToImage || !item.title || !item.source || !item.source.name) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.newsCard}
        // MODIFIED: Changed Linking.openURL to the internal handler
        onPress={() => handleArticlePress(item.url)} 
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.urlToImage }}
          style={styles.newsImage}
        />
        <View style={styles.textContainer}>
          <Text style={styles.newsSource}>{item.source.name}</Text>
          <Text style={styles.newsTitle}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={SUCCESS} />
            <Text style={styles.loadingText}>Fetching the latest fitness news...</Text>
          </View>
        ) : news.length > 0 ? (
          <FlatList
            data={news}
            renderItem={renderNewsItem}
            keyExtractor={(item) => item.url}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={50} color={MUTED} />
            <Text style={styles.emptyText}>No news articles found. Please try again later.</Text>
          </View>
        )}
      </SafeAreaView>

      {/* NEW COMPONENT: WebView Modal for in-app browsing */}
      <Modal 
        visible={!!selectedUrl} 
        onRequestClose={handleCloseModal}
        animationType="slide"
      >
        <SafeAreaView style={styles.webViewContainer}>
          {/* Custom Header/Close Button */}
          <TouchableOpacity 
            onPress={handleCloseModal} 
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={28} color={TEXT} />
            <Text style={styles.closeButtonText}>Close Article</Text>
          </TouchableOpacity>
          
          {/* The WebView */}
          {selectedUrl && (
            <WebView 
              source={{ uri: selectedUrl }} 
              style={styles.webView}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={SUCCESS} />
                  <Text style={styles.loadingText}>Loading Article...</Text>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  listContent: {
    padding: 16,
    paddingTop: 10,
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  newsImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  textContainer: {
    flex: 1,
    padding: 12,
  },
  newsTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  newsSource: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG, // Match background for seamless look
  },
  loadingText: {
    marginTop: 10,
    color: MUTED,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 10,
    color: MUTED,
    textAlign: 'center',
  },
  // --- NEW STYLES FOR MODAL/WEBVIEW ---
  webViewContainer: {
    flex: 1,
    backgroundColor: BG, // Modal background
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  closeButtonText: {
    marginLeft: 8,
    color: TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
  webView: {
    flex: 1,
    backgroundColor: TEXT, // Background of the WebView area itself
  }
});