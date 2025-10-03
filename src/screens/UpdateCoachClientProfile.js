const [clientPlans, setClientPlans] = useState({
    workout: [],
    nutrition: []
});

// Add this useEffect to load plans from route params if they're passed back
useEffect(() => {
    if (route?.params?.newPlan) {
        const { planType, planData } = route.params.newPlan;
        setClientPlans(prev => ({
            ...prev,
            [planType]: [...prev[planType], planData]
        }));
    }
}, [route?.params?.newPlan]);

const renderPlans = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
        {/* Workout Plans */}
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Workout Plans</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('WorkoutNutritionPlans', { client: clientData })}
                >
                    <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {clientPlans.workout.length === 0 ? (
                <View style={styles.emptyPlanCard}>
                    <Ionicons name="barbell-outline" size={40} color={COLORS.muted} />
                    <Text style={styles.emptyPlanText}>No workout plans yet</Text>
                </View>
            ) : (
                clientPlans.workout.map((plan, index) => (
                    <TouchableOpacity key={index} style={styles.planCard}>
                        <View style={styles.planIcon}>
                            <Ionicons name="barbell" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.planInfo}>
                            <Text style={styles.planName}>{plan.name}</Text>
                            <Text style={styles.planDetails}>
                                {Object.values(plan.schedule).reduce((sum, day) => sum + day.length, 0)} exercises •
                                {Object.values(plan.schedule).filter(day => day.length > 0).length} days/week
                            </Text>
                            <Text style={styles.planDate}>Created {plan.createdDate}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
                    </TouchableOpacity>
                ))
            )}
        </View>

        {/* Nutrition Plans */}
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Nutrition Plans</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('WorkoutNutritionPlans', { client: clientData })}
                >
                    <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {clientPlans.nutrition.length === 0 ? (
                <View style={styles.emptyPlanCard}>
                    <Ionicons name="nutrition-outline" size={40} color={COLORS.muted} />
                    <Text style={styles.emptyPlanText}>No nutrition plans yet</Text>
                </View>
            ) : (
                clientPlans.nutrition.map((plan, index) => (
                    <TouchableOpacity key={index} style={styles.planCard}>
                        <View style={[styles.planIcon, { backgroundColor: COLORS.accent + "20" }]}>
                            <Ionicons name="nutrition" size={24} color={COLORS.accent} />
                        </View>
                        <View style={styles.planInfo}>
                            <Text style={styles.planName}>{plan.name}</Text>
                            <Text style={styles.planDetails}>
                                {plan.calorieTarget} cal • P: {plan.proteinTarget}g • C: {plan.carbsTarget}g • F: {plan.fatsTarget}g
                            </Text>
                            <Text style={styles.planDate}>Created {plan.createdDate}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
                    </TouchableOpacity>
                ))
            )}
        </View>

        {/* Quick Action */}
        <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('WorkoutNutritionPlans', { client: clientData })}
        >
            <Text style={styles.actionButtonText}>Create New Plan</Text>
        </TouchableOpacity>
    </ScrollView>
);