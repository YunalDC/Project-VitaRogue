import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    StatusBar as RNStatusBar,
    Platform,
    Image,
    TextInput,
    KeyboardAvoidingView,
    Alert,
    Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
    bg: "#0B1220",
    card: "#111827",
    card2: "#0f172a",
    border: "#1f2937",
    text: "#e5e7eb",
    muted: "#94a3b8",
    primary: "#10B981",
    secondary: "#60a5fa",
    accent: "#f59e0b",
    success: "#22c55e",
    warning: "#eab308",
    danger: "#ef4444",
};

const screenWidth = Dimensions.get("window").width;

// Mock data for messages
const MOCK_MESSAGES = [
    {
        id: 1,
        text: "Hi coach! I completed today's workout. The deadlifts felt really good - I think I'm getting stronger!",
        timestamp: "10:30 AM",
        isFromCoach: false,
        isRead: true,
        type: "text"
    },
    {
        id: 2,
        text: "That's fantastic Mike! I can definitely see the improvement in your form. How did the squats feel?",
        timestamp: "10:35 AM",
        isFromCoach: true,
        isRead: true,
        type: "text"
    },
    {
        id: 3,
        text: "The squats were challenging but manageable. I managed to do all 3 sets with good form.",
        timestamp: "10:38 AM",
        isFromCoach: false,
        isRead: true,
        type: "text"
    },
    {
        id: 4,
        text: "Perfect! For tomorrow's session, we'll increase the weight slightly. Also, make sure you're getting enough protein - aim for at least 150g per day.",
        timestamp: "10:42 AM",
        isFromCoach: true,
        isRead: true,
        type: "text"
    },
    {
        id: 5,
        text: "Got it! Should I send you my meal photos like usual?",
        timestamp: "11:15 AM",
        isFromCoach: false,
        isRead: true,
        type: "text"
    },
    {
        id: 6,
        text: "Yes, please do! It helps me track your nutrition progress. You're doing great with your consistency 👍",
        timestamp: "11:18 AM",
        isFromCoach: true,
        isRead: false,
        type: "text"
    }
];

const QUICK_REPLIES = [
    "Great job!",
    "Keep it up!",
    "How are you feeling?",
    "Send me a progress photo",
    "Let's schedule a call",
    "Increase weight next time"
];

export default function CoachClientMessaging({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef(null);

    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [inputText, setInputText] = useState("");
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    // Get client data from route params
    const client = route?.params?.client || {
        id: 1,
        name: "Mike Johnson",
        avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
        status: "active",
        lastSeen: "2 hours ago"
    };

    useEffect(() => {
        // Scroll to bottom when messages change
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const sendMessage = (text = inputText) => {
        if (!text.trim()) return;

        const newMessage = {
            id: messages.length + 1,
            text: text.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isFromCoach: true,
            isRead: false,
            type: "text"
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText("");
        setShowQuickReplies(false);

        // Simulate client typing and response (for demo purposes)
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            const responses = [
                "Thanks coach!",
                "Will do!",
                "Sounds good!",
                "I'll work on that",
                "Got it, thanks for the advice!"
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            const clientResponse = {
                id: messages.length + 2,
                text: randomResponse,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isFromCoach: false,
                isRead: true,
                type: "text"
            };
            setMessages(prev => [...prev, clientResponse]);
        }, 1500);
    };

    const onQuickReply = (reply) => {
        sendMessage(reply);
    };

    const onAttachment = () => {
        Alert.alert(
            "Send Attachment",
            "Choose attachment type:",
            [
                { text: "Camera", onPress: () => Alert.alert("Camera", "Camera functionality would open here") },
                { text: "Gallery", onPress: () => Alert.alert("Gallery", "Photo gallery would open here") },
                { text: "File", onPress: () => Alert.alert("File", "File picker would open here") },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const onCall = () => {
        Alert.alert("Call Client", `Start a call with ${client.name}?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Call", onPress: () => Alert.alert("Calling", `Calling ${client.name}...`) }
        ]);
    };

    const onVideoCall = () => {
        Alert.alert("Video Call", `Start a video call with ${client.name}?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Video Call", onPress: () => Alert.alert("Video Call", `Starting video call with ${client.name}...`) }
        ]);
    };

    const renderMessage = (message) => {
        const isFromCoach = message.isFromCoach;

        return (
            <View
                key={message.id}
                style={[
                    styles.messageContainer,
                    isFromCoach ? styles.coachMessage : styles.clientMessage
                ]}
            >
                {!isFromCoach && (
                    <Image
                        source={{ uri: client.avatar }}
                        style={styles.messageAvatar}
                    />
                )}

                <View style={[
                    styles.messageBubble,
                    isFromCoach ? styles.coachBubble : styles.clientBubble
                ]}>
                    <Text style={[
                        styles.messageText,
                        isFromCoach ? styles.coachText : styles.clientText
                    ]}>
                        {message.text}
                    </Text>
                    <Text style={[
                        styles.messageTime,
                        isFromCoach ? styles.coachTime : styles.clientTime
                    ]}>
                        {message.timestamp}
                    </Text>
                </View>

                {isFromCoach && (
                    <View style={styles.messageStatus}>
                        <Ionicons
                            name={message.isRead ? "checkmark-done" : "checkmark"}
                            size={14}
                            color={message.isRead ? COLORS.primary : COLORS.muted}
                        />
                    </View>
                )}
            </View>
        );
    };

    const renderTypingIndicator = () => {
        if (!isTyping) return null;

        return (
            <View style={[styles.messageContainer, styles.clientMessage]}>
                <Image
                    source={{ uri: client.avatar }}
                    style={styles.messageAvatar}
                />
                <View style={[styles.messageBubble, styles.clientBubble, styles.typingBubble]}>
                    <View style={styles.typingIndicator}>
                        <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                        <View style={[styles.typingDot, { animationDelay: '150ms' }]} />
                        <View style={[styles.typingDot, { animationDelay: '300ms' }]} />
                    </View>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <StatusBar style="light" backgroundColor={COLORS.bg} />
            {Platform.OS === "android" && <RNStatusBar barStyle="light-content" />}

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <Image source={{ uri: client.avatar }} style={styles.headerAvatar} />
                    <View style={styles.headerText}>
                        <Text style={styles.headerName}>{client.name}</Text>
                        <Text style={styles.headerStatus}>
                            {client.status === "active" ? "Online" : `Last seen ${client.lastSeen}`}
                        </Text>
                    </View>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerButton} onPress={onCall}>
                        <Ionicons name="call" size={20} color={COLORS.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton} onPress={onVideoCall}>
                        <Ionicons name="videocam" size={20} color={COLORS.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton}>
                        <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.map(renderMessage)}
                {renderTypingIndicator()}
            </ScrollView>

            {/* Quick Replies */}
            {showQuickReplies && (
                <View style={styles.quickRepliesContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.quickRepliesContent}
                    >
                        {QUICK_REPLIES.map((reply, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.quickReplyButton}
                                onPress={() => onQuickReply(reply)}
                            >
                                <Text style={styles.quickReplyText}>{reply}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Input */}
            <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
                <TouchableOpacity
                    style={styles.attachmentButton}
                    onPress={onAttachment}
                >
                    <Ionicons name="add" size={24} color={COLORS.primary} />
                </TouchableOpacity>

                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Type a message..."
                        placeholderTextColor={COLORS.muted}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={styles.quickReplyToggle}
                        onPress={() => setShowQuickReplies(!showQuickReplies)}
                    >
                        <Ionicons
                            name="chatbox-ellipses-outline"
                            size={20}
                            color={showQuickReplies ? COLORS.primary : COLORS.muted}
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        { backgroundColor: inputText.trim() ? COLORS.primary : COLORS.border }
                    ]}
                    onPress={() => sendMessage()}
                    disabled={!inputText.trim()}
                >
                    <Ionicons
                        name="send"
                        size={20}
                        color={inputText.trim() ? "white" : COLORS.muted}
                    />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerInfo: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.card2,
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    headerName: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.text,
    },
    headerStatus: {
        fontSize: 12,
        color: COLORS.muted,
        marginTop: 2,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerButton: {
        padding: 8,
        marginLeft: 4,
    },
    messagesContainer: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 8,
    },
    messageContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: 12,
    },
    coachMessage: {
        justifyContent: "flex-end",
    },
    clientMessage: {
        justifyContent: "flex-start",
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.card2,
        marginRight: 8,
    },
    messageBubble: {
        maxWidth: screenWidth * 0.7,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    coachBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
        marginLeft: 40,
    },
    clientBubble: {
        backgroundColor: COLORS.card,
        borderBottomLeftRadius: 4,
        marginRight: 40,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
        marginBottom: 4,
    },
    coachText: {
        color: "white",
    },
    clientText: {
        color: COLORS.text,
    },
    messageTime: {
        fontSize: 11,
        fontWeight: "500",
    },
    coachTime: {
        color: "rgba(255, 255, 255, 0.7)",
        alignSelf: "flex-end",
    },
    clientTime: {
        color: COLORS.muted,
        alignSelf: "flex-start",
    },
    messageStatus: {
        marginLeft: 4,
        alignSelf: "flex-end",
        marginBottom: 4,
    },
    typingBubble: {
        paddingVertical: 12,
    },
    typingIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.muted,
    },
    quickRepliesContainer: {
        backgroundColor: COLORS.card,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingVertical: 12,
    },
    quickRepliesContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    quickReplyButton: {
        backgroundColor: COLORS.primary + "20",
        borderColor: COLORS.primary,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    quickReplyText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: "600",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        padding: 16,
        backgroundColor: COLORS.card,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: 12,
    },
    attachmentButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: COLORS.primary + "20",
        borderColor: COLORS.primary,
        borderWidth: 1,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-end",
        backgroundColor: COLORS.bg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
    },
    textInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 16,
        maxHeight: 80,
        textAlignVertical: "center",
    },
    quickReplyToggle: {
        padding: 4,
        marginLeft: 8,
    },
    sendButton: {
        padding: 12,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
});