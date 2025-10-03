import React, { useState } from "react";
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

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

const RECIPES_LIBRARY = [
    {
        id: 1,
        name: "Grilled Chicken & Rice",
        type: "Lunch",
        calories: 520,
        protein: 45,
        carbs: 55,
        fats: 12,
        dietary: ["High Protein"],
    },
    {
        id: 2,
        name: "Oatmeal with Berries",
        type: "Breakfast",
        calories: 320,
        protein: 12,
        carbs: 58,
        fats: 6,
        dietary: ["Vegetarian"],
    },
    {
        id: 3,
        name: "Salmon with Sweet Potato",
        type: "Dinner",
        calories: 580,
        protein: 42,
        carbs: 48,
        fats: 22,
        dietary: ["High Protein", "Omega-3"],
    },
    {
        id: 4,
        name: "Greek Yogurt & Nuts",
        type: "Snack",
        calories: 250,
        protein: 18,
        carbs: 15,
        fats: 14,
        dietary: ["High Protein", "Vegetarian"],
    },
    {
        id: 5,
        name: "Turkey Sandwich",
        type: "Lunch",
        calories: 420,
        protein: 32,
        carbs: 45,
        fats: 12,
        dietary: ["High Protein"],
    },
    {
        id: 6,
        name: "Protein Smoothie",
        type: "Breakfast",
        calories: 280,
        protein: 30,
        carbs: 32,
        fats: 6,
        dietary: ["High Protein", "Quick"],
    },
    {
        id: 7,
        name: "Stir Fry Vegetables",
        type: "Dinner",
        calories: 380,
        protein: 15,
        carbs: 52,
        fats: 14,
        dietary: ["Vegetarian", "Vegan"],
    },
    {
        id: 8,
        name: "Protein Bar",
        type: "Snack",
        calories: 200,
        protein: 20,
        carbs: 22,
        fats: 7,
        dietary: ["High Protein", "Quick"],
    },
    {
        id: 9,
        name: "Egg White Omelet",
        type: "Breakfast",
        calories: 220,
        protein: 28,
        carbs: 8,
        fats: 8,
        dietary: ["High Protein", "Low Carb"],
    },
    {
        id: 10,
        name: "Beef & Broccoli",
        type: "Dinner",
        calories: 480,
        protein: 38,
        carbs: 35,
        fats: 20,
        dietary: ["High Protein"],
    },
];

const DIETARY_FILTERS = [
    { id: "all", name: "All" },
    { id: "High Protein", name: "High Protein" },
    { id: "Vegetarian", name: "Vegetarian" },
    { id: "Vegan", name: "Vegan" },
    { id: "Low Carb", name: "Low Carb" },
];

export default function NutritionPlanBuilderScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const [planName, setPlanName] = useState(route?.params?.templateName || "");
    const [selectedDay, setSelectedDay] = useState(0);
    const [showRecipeModal, setShowRecipeModal] = useState(false);
    const [selectedMealType, setSelectedMealType] = useState(null);
    const [selectedDietaryFilter, setSelectedDietaryFilter] = useState("all");

    // Macro targets
    const [calorieTarget, setCalorieTarget] = useState(2200);
    const [proteinTarget, setProteinTarget] = useState(165);
    const [carbsTarget, setCarbsTarget] = useState(250);
    const [fatsTarget, setFatsTarget] = useState(70);

    const [nutritionPlan, setNutritionPlan] = useState({
        Monday: { Breakfast: [], Lunch: [], Dinner: [], Snack: [] },
        Tuesday: { Breakfast: [], Lunch: [], Dinner: [], Snack: [] },
        Wednesday: { Breakfast: [], Lunch: [], Dinner: [], Snack: [] },
        Thursday: { Breakfast: [], Lunch: [], Dinner: [], Snack: [] },
        Friday: { Breakfast: [], Lunch: [], Dinner: [], Snack: [] },
        Saturday: { Breakfast: [], Lunch: [], Dinner: [], Snack: [] },
        Sunday: { Breakfast: [], Lunch: [], Dinner: [], Snack: [] },
    });

    const client = route?.params?.client || { name: "Client" };

    const currentDayPlan = nutritionPlan[DAYS[selectedDay]];

    const calculateDayTotals = () => {
        let totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
        Object.values(currentDayPlan).forEach((meals) => {
            meals.forEach((meal) => {
                totals.calories += meal.calories;
                totals.protein += meal.protein;
                totals.carbs += meal.carbs;
                totals.fats += meal.fats;
            });
        });
        return totals;
    };

    const dayTotals = calculateDayTotals();

    const addMealToDay = (recipe) => {
        const meal = {
            id: Date.now(),
            ...recipe,
        };

        setNutritionPlan({
            ...nutritionPlan,
            [DAYS[selectedDay]]: {
                ...currentDayPlan,
                [selectedMealType]: [...currentDayPlan[selectedMealType], meal],
            },
        });
        setShowRecipeModal(false);
    };

    const removeMeal = (mealType, mealId) => {
        setNutritionPlan({
            ...nutritionPlan,
            [DAYS[selectedDay]]: {
                ...currentDayPlan,
                [mealType]: currentDayPlan[mealType].filter((meal) => meal.id !== mealId),
            },
        });
    };

    const findAlternatives = (meal) => {
        const alternatives = RECIPES_LIBRARY.filter(
            (recipe) =>
                recipe.id !== meal.id &&
                recipe.type === meal.type &&
                Math.abs(recipe.calories - meal.calories) < 100
        );

        if (alternatives.length === 0) {
            Alert.alert("No Alternatives", "No similar meals found in the library");
            return;
        }

        Alert.alert(
            "Meal Alternatives",
            `Found ${alternatives.length} similar meal(s):\n\n${alternatives
                .map((alt) => `• ${alt.name} (${alt.calories} cal)`)
                .join("\n")}`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "View Library", onPress: () => showRecipeLibrary(meal.type) },
            ]
        );
    };

    const showRecipeLibrary = (mealType) => {
        setSelectedMealType(mealType);
        setShowRecipeModal(true);
    };

    const savePlan = () => {
        if (!planName.trim()) {
            Alert.alert("Plan Name Required", "Please enter a name for this nutrition plan");
            return;
        }

        Alert.alert("Save Nutrition Plan", `Save "${planName}" for ${client.name}?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Save as Template",
                onPress: () => {
                    Alert.alert("Success", "Nutrition plan saved as template!");
                    navigation.navigate('CoachClientProfile', {
                        client: client,
                        existingPlans: route?.params?.existingPlans || [],
                        newPlan: {
                            type: "nutrition",
                            name: planName,
                            createdDate: new Date().toISOString().split('T')[0],
                            duration: "7 days",
                            details: `${calorieTarget} cal, P:${proteinTarget}g C:${carbsTarget}g F:${fatsTarget}g`
                        }
                    });
                },
            },
            {
                text: "Assign to Client",
                onPress: () => {
                    Alert.alert("Success", `Nutrition plan assigned to ${client.name}!`);
                    navigation.navigate('CoachClientProfile', {
                        client: client,
                        existingPlans: route?.params?.existingPlans || [],
                        newPlan: {
                            type: "nutrition",
                            name: planName,
                            createdDate: new Date().toISOString().split('T')[0],
                            duration: "7 days",
                            details: `${calorieTarget} cal, P:${proteinTarget}g C:${carbsTarget}g F:${fatsTarget}g`
                        }
                    });
                },
            },
        ]);
    };

    const getProgressColor = (current, target) => {
        const percentage = (current / target) * 100;
        if (percentage < 90) return COLORS.warning;
        if (percentage > 110) return COLORS.danger;
        return COLORS.success;
    };

    const filteredRecipes = RECIPES_LIBRARY.filter((recipe) => {
        if (!selectedMealType) return true;
        const matchesMealType = recipe.type === selectedMealType;
        const matchesDietary =
            selectedDietaryFilter === "all" || recipe.dietary.includes(selectedDietaryFilter);
        return matchesMealType && matchesDietary;
    });

    const renderMealCard = (meal, mealType) => (
        <View key={meal.id} style={styles.mealCard}>
            <View style={styles.mealHeader}>
                <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealCalories}>{meal.calories} calories</Text>
                </View>
                <View style={styles.mealActions}>
                    <TouchableOpacity onPress={() => findAlternatives(meal)} style={styles.mealActionButton}>
                        <Ionicons name="swap-horizontal" size={18} color={COLORS.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => removeMeal(mealType, meal.id)}
                        style={styles.mealActionButton}
                    >
                        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>P</Text>
                    <Text style={styles.macroValue}>{meal.protein}g</Text>
                </View>
                <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>C</Text>
                    <Text style={styles.macroValue}>{meal.carbs}g</Text>
                </View>
                <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>F</Text>
                    <Text style={styles.macroValue}>{meal.fats}g</Text>
                </View>
            </View>
        </View>
    );

    const renderMealSection = (mealType) => (
        <View key={mealType} style={styles.mealSection}>
            <View style={styles.mealSectionHeader}>
                <Text style={styles.mealSectionTitle}>{mealType}</Text>
                <TouchableOpacity onPress={() => showRecipeLibrary(mealType)}>
                    <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
            {currentDayPlan[mealType].length === 0 ? (
                <TouchableOpacity
                    style={styles.emptyMealSlot}
                    onPress={() => showRecipeLibrary(mealType)}
                >
                    <Text style={styles.emptyMealText}>+ Add {mealType.toLowerCase()}</Text>
                </TouchableOpacity>
            ) : (
                currentDayPlan[mealType].map((meal) => renderMealCard(meal, mealType))
            )}
        </View>
    );

    const renderRecipeItem = ({ item }) => (
        <TouchableOpacity
            style={styles.recipeItem}
            onPress={() => addMealToDay(item)}
            activeOpacity={0.7}
        >
            <View style={styles.recipeInfo}>
                <Text style={styles.recipeName}>{item.name}</Text>
                <Text style={styles.recipeCalories}>{item.calories} cal</Text>
                <View style={styles.recipeMacros}>
                    <Text style={styles.recipeMacro}>P: {item.protein}g</Text>
                    <Text style={styles.recipeMacro}>C: {item.carbs}g</Text>
                    <Text style={styles.recipeMacro}>F: {item.fats}g</Text>
                </View>
            </View>
            <Ionicons name="add-circle" size={28} color={COLORS.primary} />
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
                <Text style={styles.headerTitle}>Nutrition Builder</Text>
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
                    placeholder="Enter nutrition plan name..."
                    placeholderTextColor={COLORS.muted}
                />
            </View>

            {/* Macro Targets */}
            <View style={styles.macroTargetsCard}>
                <Text style={styles.macroTargetsTitle}>Daily Targets</Text>
                <View style={styles.macroTargetsGrid}>
                    <View style={styles.macroTargetItem}>
                        <Text style={styles.macroTargetLabel}>Calories</Text>
                        <TextInput
                            style={styles.macroTargetInput}
                            value={String(calorieTarget)}
                            onChangeText={(text) => setCalorieTarget(Number(text) || 0)}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.macroTargetItem}>
                        <Text style={styles.macroTargetLabel}>Protein (g)</Text>
                        <TextInput
                            style={styles.macroTargetInput}
                            value={String(proteinTarget)}
                            onChangeText={(text) => setProteinTarget(Number(text) || 0)}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.macroTargetItem}>
                        <Text style={styles.macroTargetLabel}>Carbs (g)</Text>
                        <TextInput
                            style={styles.macroTargetInput}
                            value={String(carbsTarget)}
                            onChangeText={(text) => setCarbsTarget(Number(text) || 0)}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.macroTargetItem}>
                        <Text style={styles.macroTargetLabel}>Fats (g)</Text>
                        <TextInput
                            style={styles.macroTargetInput}
                            value={String(fatsTarget)}
                            onChangeText={(text) => setFatsTarget(Number(text) || 0)}
                            keyboardType="numeric"
                        />
                    </View>
                </View>
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
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Daily Progress */}
            <View style={styles.dailyProgress}>
                <View style={styles.progressItem}>
                    <Text style={styles.progressLabel}>Calories</Text>
                    <Text style={[styles.progressValue, { color: getProgressColor(dayTotals.calories, calorieTarget) }]}>
                        {dayTotals.calories} / {calorieTarget}
                    </Text>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: `${Math.min((dayTotals.calories / calorieTarget) * 100, 100)}%`,
                                    backgroundColor: getProgressColor(dayTotals.calories, calorieTarget),
                                },
                            ]}
                        />
                    </View>
                </View>
                <View style={styles.progressRow}>
                    <View style={styles.progressItemSmall}>
                        <Text style={styles.progressLabelSmall}>P: {dayTotals.protein}/{proteinTarget}g</Text>
                        <View style={styles.progressBarSmall}>
                            <View
                                style={[
                                    styles.progressBarFillSmall,
                                    {
                                        width: `${Math.min((dayTotals.protein / proteinTarget) * 100, 100)}%`,
                                        backgroundColor: getProgressColor(dayTotals.protein, proteinTarget),
                                    },
                                ]}
                            />
                        </View>
                    </View>
                    <View style={styles.progressItemSmall}>
                        <Text style={styles.progressLabelSmall}>C: {dayTotals.carbs}/{carbsTarget}g</Text>
                        <View style={styles.progressBarSmall}>
                            <View
                                style={[
                                    styles.progressBarFillSmall,
                                    {
                                        width: `${Math.min((dayTotals.carbs / carbsTarget) * 100, 100)}%`,
                                        backgroundColor: getProgressColor(dayTotals.carbs, carbsTarget),
                                    },
                                ]}
                            />
                        </View>
                    </View>
                    <View style={styles.progressItemSmall}>
                        <Text style={styles.progressLabelSmall}>F: {dayTotals.fats}/{fatsTarget}g</Text>
                        <View style={styles.progressBarSmall}>
                            <View
                                style={[
                                    styles.progressBarFillSmall,
                                    {
                                        width: `${Math.min((dayTotals.fats / fatsTarget) * 100, 100)}%`,
                                        backgroundColor: getProgressColor(dayTotals.fats, fatsTarget),
                                    },
                                ]}
                            />
                        </View>
                    </View>
                </View>
            </View>

            {/* Meal Sections */}
            <ScrollView style={styles.mealsList} showsVerticalScrollIndicator={false}>
                {MEAL_TYPES.map((mealType) => renderMealSection(mealType))}
            </ScrollView>

            {/* Recipe Library Modal */}
            <Modal
                visible={showRecipeModal}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowRecipeModal(false)}
            >
                <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {selectedMealType ? `${selectedMealType} Recipes` : "Recipe Library"}
                        </Text>
                        <TouchableOpacity onPress={() => setShowRecipeModal(false)}>
                            <Ionicons name="close" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Dietary Filter */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.dietaryFilter}
                        contentContainerStyle={styles.dietaryFilterContent}
                    >
                        {DIETARY_FILTERS.map((filter) => (
                            <TouchableOpacity
                                key={filter.id}
                                style={[
                                    styles.dietaryChip,
                                    selectedDietaryFilter === filter.id && styles.dietaryChipActive,
                                ]}
                                onPress={() => setSelectedDietaryFilter(filter.id)}
                            >
                                <Text
                                    style={[
                                        styles.dietaryChipText,
                                        selectedDietaryFilter === filter.id && styles.dietaryChipTextActive,
                                    ]}
                                >
                                    {filter.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Recipe List */}
                    <FlatList
                        data={filteredRecipes}
                        renderItem={renderRecipeItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.recipeList}
                    />
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
    macroTargetsCard: {
        backgroundColor: COLORS.card,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    macroTargetsTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 12,
    },
    macroTargetsGrid: {
        flexDirection: "row",
        gap: 12,
    },
    macroTargetItem: {
        flex: 1,
    },
    macroTargetLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.muted,
        marginBottom: 6,
    },
    macroTargetInput: {
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
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: COLORS.border,
        minWidth: 70,
        alignItems: "center",
    },
    dayButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    dayButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.muted,
    },
    dayButtonTextActive: {
        color: "white",
    },
    dailyProgress: {
        backgroundColor: COLORS.card,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    progressItem: {
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 6,
    },
    progressValue: {
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 6,
    },
    progressBar: {
        height: 8,
        backgroundColor: COLORS.border,
        borderRadius: 4,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 4,
    },
    progressRow: {
        flexDirection: "row",
        gap: 12,
    },
    progressItemSmall: {
        flex: 1,
    },
    progressLabelSmall: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.muted,
        marginBottom: 4,
    },
    progressBarSmall: {
        height: 6,
        backgroundColor: COLORS.border,
        borderRadius: 3,
        overflow: "hidden",
    },
    progressBarFillSmall: {
        height: "100%",
        borderRadius: 3,
    },
    mealsList: {
        flex: 1,
        padding: 16,
    },
    mealSection: {
        marginBottom: 20,
    },
    mealSectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    mealSectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.text,
    },
    emptyMealSlot: {
        backgroundColor: COLORS.card,
        padding: 20,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: "dashed",
        alignItems: "center",
    },
    emptyMealText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.muted,
    },
    mealCard: {
        backgroundColor: COLORS.card,
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    mealHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    mealInfo: {
        flex: 1,
    },
    mealName: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 4,
    },
    mealCalories: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: "600",
    },
    mealActions: {
        flexDirection: "row",
        gap: 8,
    },
    mealActionButton: {
        padding: 6,
    },
    macroRow: {
        flexDirection: "row",
        gap: 16,
    },
    macroItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    macroLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.muted,
    },
    macroValue: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.text,
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
    dietaryFilter: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    dietaryFilterContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    dietaryChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + "20",
    },
    dietaryChipActive: {
        backgroundColor: COLORS.primary,
    },
    dietaryChipText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.primary,
    },
    dietaryChipTextActive: {
        color: "white",
    },
    recipeList: {
        padding: 16,
    },
    recipeItem: {
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
    recipeInfo: {
        flex: 1,
    },
    recipeName: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 6,
    },
    recipeCalories: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: "600",
        marginBottom: 6,
    },
    recipeMacros: {
        flexDirection: "row",
        gap: 12,
    },
    recipeMacro: {
        fontSize: 12,
        color: COLORS.muted,
        fontWeight: "500",
    },
});