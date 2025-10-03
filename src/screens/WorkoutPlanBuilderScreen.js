import React, { useState, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    StatusBar as RNStatusBar,
    Platform,
    TextInput,
    Modal,
    FlatList,
    Alert,
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

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const EXERCISE_CATEGORIES = [
    { id: "all", name: "All Exercises", icon: "fitness" },
    { id: "chest", name: "Chest", icon: "body" },
    { id: "back", name: "Back", icon: "body" },
    { id: "legs", name: "Legs", icon: "walk" },
    { id: "shoulders", name: "Shoulders", icon: "body" },
    { id: "arms", name: "Arms", icon: "barbell" },
    { id: "core", name: "Core", icon: "body" },
];

const EXERCISES_LIBRARY = [
    { id: 1, name: "Bench Press", category: "chest", equipment: "Barbell" },
    { id: 2, name: "Incline Dumbbell Press", category: "chest", equipment: "Dumbbell" },
    { id: 3, name: "Cable Flyes", category: "chest", equipment: "Cable" },
    { id: 4, name: "Push-ups", category: "chest", equipment: "Bodyweight" },
    { id: 5, name: "Squat", category: "legs", equipment: "Barbell" },
    { id: 6, name: "Leg Press", category: "legs", equipment: "Machine" },
    { id: 7, name: "Romanian Deadlift", category: "legs", equipment: "Barbell" },
    { id: 8, name: "Leg Curls", category: "legs", equipment: "Machine" },
    { id: 9, name: "Deadlift", category: "back", equipment: "Barbell" },
    { id: 10, name: "Pull-ups", category: "back", equipment: "Bodyweight" },
    { id: 11, name: "Barbell Rows", category: "back", equipment: "Barbell" },
    { id: 12, name: "Lat Pulldowns", category: "back", equipment: "Cable" },
    { id: 13, name: "Overhead Press", category: "shoulders", equipment: "Barbell" },
    { id: 14, name: "Lateral Raises", category: "shoulders", equipment: "Dumbbell" },
    { id: 15, name: "Face Pulls", category: "shoulders", equipment: "Cable" },
    { id: 16, name: "Barbell Curls", category: "arms", equipment: "Barbell" },
    { id: 17, name: "Tricep Dips", category: "arms", equipment: "Bodyweight" },
    { id: 18, name: "Hammer Curls", category: "arms", equipment: "Dumbbell" },
    { id: 19, name: "Plank", category: "core", equipment: "Bodyweight" },
    { id: 20, name: "Russian Twists", category: "core", equipment: "Bodyweight" },
];

const REST_TIMES = ["30s", "45s", "60s", "90s", "2min", "3min", "5min"];

export default function WorkoutPlanBuilderScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const [planName, setPlanName] = useState(route?.params?.templateName || "");
    const [selectedDay, setSelectedDay] = useState(0);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [workoutPlan, setWorkoutPlan] = useState({
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
    });
    const [editingExercise, setEditingExercise] = useState(null);

    const client = route?.params?.client || { name: "Client" };

    const currentDayExercises = workoutPlan[DAYS[selectedDay]];

    const filteredExercises = EXERCISES_LIBRARY.filter(
        (ex) => selectedCategory === "all" || ex.category === selectedCategory
    );

    const addExerciseToDay = (exercise) => {
        const newExercise = {
            id: Date.now(),
            exerciseId: exercise.id,
            name: exercise.name,
            category: exercise.category,
            equipment: exercise.equipment,
            sets: 3,
            reps: "10-12",
            rest: "60s",
            notes: "",
        };

        setWorkoutPlan({
            ...workoutPlan,
            [DAYS[selectedDay]]: [...currentDayExercises, newExercise],
        });
        setShowExerciseModal(false);
    };

    const removeExercise = (exerciseId) => {
        setWorkoutPlan({
            ...workoutPlan,
            [DAYS[selectedDay]]: currentDayExercises.filter((ex) => ex.id !== exerciseId),
        });
    };

    const updateExercise = (exerciseId, field, value) => {
        setWorkoutPlan({
            ...workoutPlan,
            [DAYS[selectedDay]]: currentDayExercises.map((ex) =>
                ex.id === exerciseId ? { ...ex, [field]: value } : ex
            ),
        });
    };

    const toggleRestDay = () => {
        if (currentDayExercises.length === 0) {
            Alert.alert("Rest Day", "This day is already empty (rest day)");
        } else {
            Alert.alert("Mark as Rest Day", "Remove all exercises from this day?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes",
                    onPress: () => setWorkoutPlan({ ...workoutPlan, [DAYS[selectedDay]]: [] }),
                },
            ]);
        }
    };

    const savePlan = () => {
        if (!planName.trim()) {
            Alert.alert("Plan Name Required", "Please enter a name for this workout plan");
            return;
        }

        const totalExercises = Object.values(workoutPlan).reduce(
            (sum, day) => sum + day.length,
            0
        );

        if (totalExercises === 0) {
            Alert.alert("Empty Plan", "Please add at least one exercise to the plan");
            return;
        }

        Alert.alert(
            "Save Workout Plan",
            `Save "${planName}" for ${client.name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Save as Template",
                    onPress: () => {
                        Alert.alert("Success", "Plan saved as template!");
                        navigation.navigate('CoachClientProfile', {
                            client: client,
                            existingPlans: route?.params?.existingPlans || [],
                            newPlan: {
                                type: "workout",
                                name: planName,
                                createdDate: new Date().toISOString().split('T')[0],
                                duration: "Custom",
                                details: `${totalExercises} total exercises`
                            }
                        });
                    },
                },
                {
                    text: "Assign to Client",
                    onPress: () => {
                        Alert.alert("Success", `Plan assigned to ${client.name}!`);
                        navigation.navigate('CoachClientProfile', {
                            client: client,
                            existingPlans: route?.params?.existingPlans || [],
                            newPlan: {
                                type: "workout",
                                name: planName,
                                createdDate: new Date().toISOString().split('T')[0],
                                duration: "Custom",
                                details: `${totalExercises} total exercises`
                            }
                        });
                    },
                },
            ]
        );
    };

    const renderExerciseCard = (exercise) => (
        <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
                <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseEquipment}>{exercise.equipment}</Text>
                </View>
                <TouchableOpacity onPress={() => removeExercise(exercise.id)}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                </TouchableOpacity>
            </View>

            <View style={styles.exerciseParams}>
                {/* Sets */}
                <View style={styles.paramGroup}>
                    <Text style={styles.paramLabel}>Sets</Text>
                    <View style={styles.paramControl}>
                        <TouchableOpacity
                            style={styles.paramButton}
                            onPress={() => updateExercise(exercise.id, "sets", Math.max(1, exercise.sets - 1))}
                        >
                            <Ionicons name="remove" size={16} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.paramValue}>{exercise.sets}</Text>
                        <TouchableOpacity
                            style={styles.paramButton}
                            onPress={() => updateExercise(exercise.id, "sets", exercise.sets + 1)}
                        >
                            <Ionicons name="add" size={16} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Reps */}
                <View style={styles.paramGroup}>
                    <Text style={styles.paramLabel}>Reps</Text>
                    <TextInput
                        style={styles.paramInput}
                        value={exercise.reps}
                        onChangeText={(text) => updateExercise(exercise.id, "reps", text)}
                        placeholder="8-12"
                        placeholderTextColor={COLORS.muted}
                        keyboardType="default"
                    />
                </View>

                {/* Rest */}
                <View style={styles.paramGroup}>
                    <Text style={styles.paramLabel}>Rest</Text>
                    <TouchableOpacity
                        style={styles.paramPicker}
                        onPress={() => setEditingExercise(exercise)}
                    >
                        <Text style={styles.paramPickerText}>{exercise.rest}</Text>
                        <Ionicons name="chevron-down" size={16} color={COLORS.muted} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Notes */}
            <TextInput
                style={styles.notesInput}
                value={exercise.notes}
                onChangeText={(text) => updateExercise(exercise.id, "notes", text)}
                placeholder="Add notes (technique cues, substitutions...)"
                placeholderTextColor={COLORS.muted}
                multiline
            />
        </View>
    );

    const renderExerciseLibraryItem = ({ item }) => (
        <TouchableOpacity
            style={styles.libraryItem}
            onPress={() => addExerciseToDay(item)}
            activeOpacity={0.7}
        >
            <View>
                <Text style={styles.libraryItemName}>{item.name}</Text>
                <Text style={styles.libraryItemDetails}>
                    {item.category} • {item.equipment}
                </Text>
            </View>
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={COLORS.bg} />
            {Platform.OS === "android" && <RNStatusBar barStyle="light-content" />}

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Workout Builder</Text>
                <TouchableOpacity style={styles.saveButton} onPress={savePlan}>
                    <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
            </View>

            {/* Plan Name */}
            <View style={styles.planNameContainer}>
                <TextInput
                    style={styles.planNameInput}
                    value={planName}
                    onChangeText={setPlanName}
                    placeholder="Enter workout plan name..."
                    placeholderTextColor={COLORS.muted}
                />
            </View>

            {/* Day Selector */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.daySelector}
                contentContainerStyle={styles.daySelectorContent}
            >
                {DAYS.map((day, index) => (
                    <TouchableOpacity
                        key={day}
                        style={[styles.dayButton, selectedDay === index && styles.dayButtonActive]}
                        onPress={() => setSelectedDay(index)}
                    >
                        <Text
                            style={[styles.dayButtonText, selectedDay === index && styles.dayButtonTextActive]}
                        >
                            {day.substring(0, 3)}
                        </Text>
                        <View
                            style={[
                                styles.dayBadge,
                                { backgroundColor: workoutPlan[day].length > 0 ? COLORS.primary : COLORS.border },
                            ]}
                        >
                            <Text style={styles.dayBadgeText}>{workoutPlan[day].length}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Exercises List */}
            <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
                <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{DAYS[selectedDay]}</Text>
                    <TouchableOpacity onPress={toggleRestDay}>
                        <Text style={styles.restDayButton}>
                            {currentDayExercises.length === 0 ? "Rest Day" : "Clear All"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {currentDayExercises.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="fitness-outline" size={64} color={COLORS.muted} />
                        <Text style={styles.emptyTitle}>No exercises added</Text>
                        <Text style={styles.emptyDesc}>Tap the + button below to add exercises</Text>
                    </View>
                ) : (
                    currentDayExercises.map((exercise) => renderExerciseCard(exercise))
                )}
            </ScrollView>

            {/* Add Exercise Button */}
            <TouchableOpacity
                style={[styles.addButton, { marginBottom: insets.bottom + 16 }]}
                onPress={() => setShowExerciseModal(true)}
            >
                <Ionicons name="add" size={24} color="white" />
                <Text style={styles.addButtonText}>Add Exercise</Text>
            </TouchableOpacity>

            {/* Exercise Library Modal */}
            <Modal
                visible={showExerciseModal}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowExerciseModal(false)}
            >
                <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Exercise Library</Text>
                        <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                            <Ionicons name="close" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Category Filter */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryFilter}
                        contentContainerStyle={styles.categoryFilterContent}
                    >
                        {EXERCISE_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === cat.id && styles.categoryChipActive,
                                ]}
                                onPress={() => setSelectedCategory(cat.id)}
                            >
                                <Ionicons
                                    name={cat.icon}
                                    size={16}
                                    color={selectedCategory === cat.id ? "white" : COLORS.primary}
                                />
                                <Text
                                    style={[
                                        styles.categoryChipText,
                                        selectedCategory === cat.id && styles.categoryChipTextActive,
                                    ]}
                                >
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Exercise List */}
                    <FlatList
                        data={filteredExercises}
                        renderItem={renderExerciseLibraryItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.libraryList}
                    />
                </View>
            </Modal>

            {/* Rest Time Picker Modal */}
            <Modal
                visible={editingExercise !== null}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setEditingExercise(null)}
            >
                <View style={styles.pickerModalOverlay}>
                    <View style={styles.pickerModalContent}>
                        <Text style={styles.pickerTitle}>Select Rest Time</Text>
                        {REST_TIMES.map((time) => (
                            <TouchableOpacity
                                key={time}
                                style={styles.pickerOption}
                                onPress={() => {
                                    updateExercise(editingExercise.id, "rest", time);
                                    setEditingExercise(null);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.pickerOptionText,
                                        editingExercise?.rest === time && { color: COLORS.primary },
                                    ]}
                                >
                                    {time}
                                </Text>
                                {editingExercise?.rest === time && (
                                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.pickerCancel}
                            onPress={() => setEditingExercise(null)}
                        >
                            <Text style={styles.pickerCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
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
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: COLORS.bg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.text,
        flex: 1,
        textAlign: "center",
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "white",
    },
    planNameContainer: {
        padding: 16,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    planNameInput: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.text,
        padding: 12,
        backgroundColor: COLORS.bg,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    daySelector: {
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    daySelectorContent: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 8,
    },
    dayButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        minWidth: 70,
    },
    dayButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    dayButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.muted,
        marginBottom: 4,
    },
    dayButtonTextActive: {
        color: "white",
    },
    dayBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    dayBadgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.text,
    },
    exercisesList: {
        flex: 1,
        padding: 16,
    },
    dayHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    dayTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.text,
    },
    restDayButton: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.danger,
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.text,
        marginTop: 16,
    },
    emptyDesc: {
        fontSize: 14,
        color: COLORS.muted,
        marginTop: 8,
        textAlign: "center",
    },
    exerciseCard: {
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    exerciseHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 4,
    },
    exerciseEquipment: {
        fontSize: 13,
        color: COLORS.muted,
    },
    exerciseParams: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    paramGroup: {
        flex: 1,
    },
    paramLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.muted,
        marginBottom: 6,
    },
    paramControl: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.bg,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
    },
    paramButton: {
        padding: 8,
        backgroundColor: COLORS.card2,
    },
    paramValue: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.text,
        textAlign: "center",
    },
    paramInput: {
        backgroundColor: COLORS.bg,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 8,
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.text,
        textAlign: "center",
    },
    paramPicker: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.bg,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 8,
    },
    paramPickerText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.text,
    },
    notesInput: {
        backgroundColor: COLORS.bg,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        fontSize: 14,
        color: COLORS.text,
        minHeight: 60,
        textAlignVertical: "top",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "white",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.text,
    },
    categoryFilter: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    categoryFilterContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    categoryChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + "20",
        gap: 6,
    },
    categoryChipActive: {
        backgroundColor: COLORS.primary,
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.primary,
    },
    categoryChipTextActive: {
        color: "white",
    },
    libraryList: {
        padding: 16,
    },
    libraryItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    libraryItemName: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 4,
    },
    libraryItemDetails: {
        fontSize: 13,
        color: COLORS.muted,
    },
    pickerModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    pickerModalContent: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        width: "100%",
        maxWidth: 300,
        overflow: "hidden",
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.text,
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    pickerOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    pickerOptionText: {
        fontSize: 16,
        color: COLORS.text,
    },
    pickerCancel: {
        padding: 16,
        alignItems: "center",
        backgroundColor: COLORS.card2,
    },
    pickerCancelText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.danger,
    },
});