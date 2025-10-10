import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BG = "#0B1220";
const CARD = "#111827";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const SUCCESS = "#10B981";
const ACCENT = "#3B82F6";

const GEMINI_API_KEY = "AIzaSyBYk-O6RFxd5zZfGXaTXnXoiE-r1htaNgQ";

export default function DiscoverScreen({ navigation }) {
  // THIS IS THE CORRECT URL - SAME AS FOOD SCANNER
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "👋 Hi! I'm your AI Health & Fitness Assistant. I can help you with:\n\n• Workout recommendations\n• Nutrition advice\n• Exercise form tips\n• Motivation & goal setting\n• Health questions\n\nWhat would you like to know?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);

  const quickActions = [
    { id: '1', icon: 'barbell-outline', text: 'Workout Plan', prompt: 'Create a 30-minute full body workout for me' },
    { id: '2', icon: 'nutrition-outline', text: 'Meal Ideas', prompt: 'Suggest a healthy high-protein meal for lunch' },
    { id: '3', icon: 'fitness-outline', text: 'Exercise Tips', prompt: 'How can I improve my squat form?' },
    { id: '4', icon: 'bulb-outline', text: 'Motivation', prompt: 'Give me some motivation to work out today' },
  ];

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const callGeminiAPI = async (userMessage) => {
    try {
      console.log('=== GEMINI API CALL START ===');
      console.log('🔍 Using URL:', GEMINI_URL);
      console.log('✅ Model: gemini-2.5-flash (SAME AS FOOD SCANNER)');
      
      const requestBody = {
        contents: [{
          parts: [{
            text: `You are a knowledgeable health and fitness assistant. Provide helpful, accurate, and encouraging advice about fitness, nutrition, exercise, and wellness. Keep responses concise but informative. User question: ${userMessage}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      };
      
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const aiText = data.candidates[0].content.parts[0].text;
        console.log('✅ SUCCESS - Got response from AI');
        return aiText;
      } else {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      console.error('=== GEMINI API ERROR ===');
      console.error('Error:', error.message);
      return "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";
    }
  };

  const handleSendMessage = async (messageText = inputText) => {
    if (!messageText.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: messageText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    Keyboard.dismiss();

    const aiResponse = await callGeminiAPI(messageText.trim());

    const aiMessage = {
      id: (Date.now() + 1).toString(),
      text: aiResponse,
      isUser: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMessage]);
    setLoading(false);
  };

  const handleQuickAction = (prompt) => {
    handleSendMessage(prompt);
  };

  const renderMessage = (message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage
      ]}
    >
      {!message.isUser && (
        <View style={styles.aiIcon}>
          <Ionicons name="sparkles" size={16} color={SUCCESS} />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.aiBubble
        ]}
      >
        <Text style={[styles.messageText, message.isUser && styles.userMessageText]}>
          {message.text}
        </Text>
        <Text style={[styles.timestamp, message.isUser && styles.userTimestamp]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="sparkles" size={24} color={SUCCESS} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>AI Health Assistant</Text>
              <Text style={styles.headerSubtitle}>Powered by Gemini 2.5</Text>
            </View>
          </View>

          {messages.length === 1 && (
            <View style={styles.quickActionsContainer}>
              <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
              <View style={styles.quickActionsGrid}>
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.quickActionButton}
                    onPress={() => handleQuickAction(action.prompt)}
                  >
                    <Ionicons name={action.icon} size={24} color={SUCCESS} />
                    <Text style={styles.quickActionText}>{action.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map(renderMessage)}
            {loading && (
              <View style={styles.loadingContainer}>
                <View style={styles.aiIcon}>
                  <Ionicons name="sparkles" size={16} color={SUCCESS} />
                </View>
                <View style={styles.loadingBubble}>
                  <ActivityIndicator color={SUCCESS} size="small" />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me anything about health & fitness..."
                placeholderTextColor={MUTED}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={() => handleSendMessage()}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || loading) && styles.sendButtonDisabled
                ]}
                onPress={() => handleSendMessage()}
                disabled={!inputText.trim() || loading}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() && !loading ? TEXT : MUTED}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SUCCESS + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  quickActionsContainer: {
    padding: 16,
    backgroundColor: BG,
  },
  quickActionsTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SUCCESS + '30',
  },
  quickActionText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: SUCCESS + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: SUCCESS,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: CARD,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  messageText: {
    color: TEXT,
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#ffffff',
  },
  timestamp: {
    color: MUTED,
    fontSize: 10,
    marginTop: 4,
  },
  userTimestamp: {
    color: '#ffffff',
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  loadingText: {
    color: MUTED,
    fontSize: 14,
    marginLeft: 8,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: BG,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  input: {
    flex: 1,
    color: TEXT,
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SUCCESS + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: 'transparent',
  },
});