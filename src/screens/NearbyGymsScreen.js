import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

// Get API key from app.json configuration
const GOOGLE_PLACES_API_KEY = 
  Constants.expoConfig?.extra?.GOOGLE_PLACES_API_KEY ||
  Constants.manifest?.extra?.GOOGLE_PLACES_API_KEY;

const SEARCH_RADIUS = 5000; // 5km radius in meters (adjustable: 1000-50000)

const NearbyGymsScreen = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGym, setSelectedGym] = useState(null);
  const [showList, setShowList] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Request location permission and get location
  const requestLocationPermission = async () => {
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find nearby gyms.');
        setLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      const currentLoc = { latitude, longitude };
      setCurrentLocation(currentLoc);
      fetchNearbyGyms(latitude, longitude);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Unable to get your location. Please check your location settings.');
      setLoading(false);
    }
  };

  // Fetch nearby gyms using Google Places API
  const fetchNearbyGyms = async (latitude, longitude) => {
    try {
      // Check if API key is configured
      if (!GOOGLE_PLACES_API_KEY) {
        Alert.alert(
          'API Key Missing',
          'Google Places API key is not configured. Please add it to your app.json file under extra.GOOGLE_PLACES_API_KEY'
        );
        setLoading(false);
        return;
      }

      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${SEARCH_RADIUS}&type=gym&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const gymData = data.results.map((gym) => ({
          id: gym.place_id,
          name: gym.name,
          latitude: gym.geometry.location.lat,
          longitude: gym.geometry.location.lng,
          address: gym.vicinity,
          rating: gym.rating || 'N/A',
          isOpen: gym.opening_hours?.open_now,
        }));

        // Calculate distance for each gym
        const gymsWithDistance = gymData.map((gym) => ({
          ...gym,
          distance: calculateDistance(latitude, longitude, gym.latitude, gym.longitude),
        }));

        // Sort by distance
        gymsWithDistance.sort((a, b) => a.distance - b.distance);

        setGyms(gymsWithDistance);
      } else if (data.status === 'ZERO_RESULTS') {
        Alert.alert('No Gyms Found', `No gyms found within ${SEARCH_RADIUS / 1000}km of your location.`);
      } else if (data.status === 'REQUEST_DENIED') {
        Alert.alert('API Error', 'Please check your Google Places API key configuration.');
      } else {
        Alert.alert('Error', `Error fetching gyms: ${data.status}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch nearby gyms. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return parseFloat(distance.toFixed(2));
  };

  const toRad = (value) => {
    return (value * Math.PI) / 180;
  };

  // Center map on selected gym
  const onGymPress = (gym) => {
    setSelectedGym(gym);
    mapRef.current?.animateToRegion({
      latitude: gym.latitude,
      longitude: gym.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Finding nearby gyms...</Text>
      </View>
    );
  }

  if (!currentLocation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to get your location</Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestLocationPermission}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Search radius circle */}
        <Circle
          center={currentLocation}
          radius={SEARCH_RADIUS}
          strokeColor="rgba(76, 175, 80, 0.5)"
          fillColor="rgba(76, 175, 80, 0.1)"
        />

        {/* Gym markers */}
        {gyms.map((gym) => (
          <Marker
            key={gym.id}
            coordinate={{ latitude: gym.latitude, longitude: gym.longitude }}
            title={gym.name}
            description={`${gym.distance}km away • Rating: ${gym.rating}`}
            pinColor="#FF6B6B"
            onPress={() => setSelectedGym(gym)}
          />
        ))}
      </MapView>

      {/* Header with gym count */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {gyms.length} Gyms within {SEARCH_RADIUS / 1000}km
        </Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowList(!showList)}
        >
          <Text style={styles.toggleButtonText}>
            {showList ? 'Hide List' : 'Show List'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selected gym info card */}
      {selectedGym && !showList && (
        <View style={styles.infoCard}>
          <Text style={styles.gymName}>{selectedGym.name}</Text>
          <Text style={styles.gymDetails}>📍 {selectedGym.address}</Text>
          <Text style={styles.gymDetails}>📏 {selectedGym.distance} km away</Text>
          <Text style={styles.gymDetails}>⭐ Rating: {selectedGym.rating}</Text>
          {selectedGym.isOpen !== undefined && (
            <Text style={[styles.gymDetails, selectedGym.isOpen ? styles.openNow : styles.closed]}>
              {selectedGym.isOpen ? '🟢 Open Now' : '🔴 Closed'}
            </Text>
          )}
        </View>
      )}

      {/* Gym list */}
      {showList && (
        <View style={styles.listContainer}>
          <ScrollView style={styles.gymList}>
            {gyms.map((gym) => (
              <TouchableOpacity
                key={gym.id}
                style={styles.gymItem}
                onPress={() => {
                  onGymPress(gym);
                  setShowList(false);
                }}
              >
                <View style={styles.gymItemContent}>
                  <Text style={styles.gymItemName}>{gym.name}</Text>
                  <Text style={styles.gymItemAddress}>{gym.address}</Text>
                  <View style={styles.gymItemStats}>
                    <Text style={styles.gymItemDistance}>📏 {gym.distance} km</Text>
                    <Text style={styles.gymItemRating}>⭐ {gym.rating}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gymName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  gymDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  openNow: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  closed: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  listContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gymList: {
    padding: 20,
  },
  gymItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  gymItemContent: {
    flex: 1,
  },
  gymItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  gymItemAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  gymItemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gymItemDistance: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  gymItemRating: {
    fontSize: 14,
    color: '#FFA000',
    fontWeight: '600',
  },
});

export default NearbyGymsScreen;