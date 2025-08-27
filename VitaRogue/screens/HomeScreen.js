import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Wrap SVG Circle so Animated can drive its props
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const VitaRogueHomeScreen = ({ 
  onOpenSidebar, 
  userGender = 'male', 
  caloriesConsumed = 1450,
  caloriesGoal = 2000 
}) => {
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const progressPercentage = (caloriesConsumed / caloriesGoal) * 100;
  const caloriesDeficit = ((caloriesGoal - caloriesConsumed) / 100).toFixed(1);

  useEffect(() => {
    // Animate progress value 0 -> %
    Animated.timing(progressAnimation, {
      toValue: progressPercentage,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    // Subtle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, { toValue: 1.02, duration: 2500, useNativeDriver: true }),
        Animated.timing(pulseAnimation, { toValue: 1, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, [progressPercentage]);

  // Responsive dimensions
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 414;

  const getResponsiveDimensions = () => {
    if (isSmallScreen) {
      return {
        circleSize: 280,
        radius: 110,
        strokeWidth: 25,
        imageSize: 120,
        fontSize: { large: 32, medium: 16, small: 12 },
        padding: 15,
      };
    } else if (isMediumScreen) {
      return {
        circleSize: 320,
        radius: 130,
        strokeWidth: 30,
        imageSize: 140,
        fontSize: { large: 36, medium: 18, small: 14 },
        padding: 20,
      };
    } else {
      return {
        circleSize: 360,
        radius: 150,
        strokeWidth: 35,
        imageSize: 160,
        fontSize: { large: 40, medium: 18, small: 14 },
        padding: 20,
      };
    }
  };

  const dimensions = getResponsiveDimensions();
  const circumference = 2 * Math.PI * dimensions.radius;

  const strokeDashoffset = progressAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const actionButtons = [
    { icon: '🏃', label: 'Workout' },
    { icon: '🍎', label: 'Nutrition' },
    { icon: '💧', label: 'Hydration' },
    { icon: '😴', label: 'Sleep' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        
        {/* Navigation Bar */}
        <View style={[styles.navbar, { paddingHorizontal: dimensions.padding }]}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/VitaRogue.png')} 
              style={[styles.logo, { width: isSmallScreen ? 40 : 45, height: isSmallScreen ? 40 : 45 }]}
              resizeMode="contain"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={onOpenSidebar}
          >
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Main Progress Circle */}
          <View style={styles.mainContent}>
            <View style={styles.progressContainer}>
              {/* Gradient Progress Circle */}
              <Svg 
                width={dimensions.circleSize} 
                height={dimensions.circleSize} 
                style={styles.progressCircle}
              >
                <Defs>
                  <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FFD700" />
                    <Stop offset="50%" stopColor="#FFA500" />
                    <Stop offset="100%" stopColor="#8B4513" />
                  </SvgLinearGradient>
                </Defs>
                
                {/* Background track */}
                <Circle
                  cx={dimensions.circleSize / 2}
                  cy={dimensions.circleSize / 2}
                  r={dimensions.radius}
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth={dimensions.strokeWidth}
                />
                
                {/* Animated progress with gradient */}
                <AnimatedCircle
                  cx={dimensions.circleSize / 2}
                  cy={dimensions.circleSize / 2}
                  r={dimensions.radius}
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth={dimensions.strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(-90 ${dimensions.circleSize / 2} ${dimensions.circleSize / 2})`}
                />
              </Svg>

              {/* Silhouette Figure */}
              <Animated.View style={[
                styles.figureContainer,
                { 
                  transform: [{ scale: pulseAnimation }],
                  width: dimensions.imageSize,
                  height: dimensions.imageSize,
                }
              ]}>
                <View style={styles.silhouetteContainer}>
                  <Image 
                    source={userGender === 'male' 
                      ? require('../assets/images/male.png') 
                      : require('../assets/images/female.png')
                    }
                    style={[styles.silhouetteImage, {
                      width: dimensions.imageSize * 0.8,
                      height: dimensions.imageSize * 0.8,
                    }]}
                    resizeMode="contain"
                  />
                </View>
              </Animated.View>
            </View>

            {/* Calorie Information */}
            <View style={styles.calorieInfo}>
              <Text style={[styles.caloriesNumber, { fontSize: dimensions.fontSize.large }]}>
                {caloriesDeficit} Calories
              </Text>
              <Text style={[styles.deficitLabel, { fontSize: dimensions.fontSize.medium }]}>
                Deficit
              </Text>
            </View>
          </View>

          {/* Action Buttons Grid */}
          <View style={[styles.buttonGrid, { paddingHorizontal: dimensions.padding }]}>
            <View style={styles.buttonRow}>
              {actionButtons.slice(0, 2).map((button, index) => (
                <TouchableOpacity key={index} style={styles.actionButton}>
                  <LinearGradient
                    colors={['#60A5FA', '#3B82F6']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.buttonIcon}>{button.icon}</Text>
                    <Text style={styles.buttonLabel}>{button.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.buttonRow}>
              {actionButtons.slice(2, 4).map((button, index) => (
                <TouchableOpacity key={index} style={styles.actionButton}>
                  <LinearGradient
                    colors={['#A78BFA', '#8B5CF6']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.buttonIcon}>{button.icon}</Text>
                    <Text style={styles.buttonLabel}>{button.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 15,
    paddingBottom: 10,
  },
  logoContainer: {
    alignItems: 'flex-start',
  },
  logo: {
    borderRadius: 8,
  },
  menuButton: {
    width: 35,
    height: 35,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 8,
  },
  menuLine: {
    width: 25,
    height: 3,
    backgroundColor: '#1F2937',
    borderRadius: 2,
  },
  mainContent: { 
    alignItems: 'center',
    paddingVertical: 20,
  },
  progressContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'relative',
    marginBottom: 30,
  },
  progressCircle: { 
    // No additional styles needed
  },
  figureContainer: { 
    position: 'absolute',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  silhouetteContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  silhouetteImage: {
    tintColor: '#000000', // Makes the image black silhouette
  },
  calorieInfo: {
    alignItems: 'center',
  },
  caloriesNumber: { 
    fontWeight: 'bold', 
    color: '#2563EB',
    marginBottom: 5,
  },
  deficitLabel: { 
    color: '#1F2937',
    fontWeight: '600',
  },
  buttonGrid: {
    paddingVertical: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  buttonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default VitaRogueHomeScreen;