import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { MapPressEvent, LatLng } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';

import {
  fetchWeatherByCity,
  fetchWeatherByCoords,
  fetchCityByCoords,
  setCity,
} from '../redux/weatherSlice';
import { RootState, AppDispatch } from '../redux/store';

import AnimatedButton from '../components/AnimatedButton';
import { useTheme } from '../hooks/useTheme';
import WeatherMap from '../components/WeatherMap';
import { requestLocationPermission } from '../utils/permissions';

export default function WeatherScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { current, city, loading, error } = useSelector(
    (state: RootState) => state.weather,
  );

  const theme = useTheme();
  const styles = createStyles(theme);

  const [inputCity, setInputCity] = useState<string>(city ?? '');
  const [selectedCoords, setSelectedCoords] = useState<LatLng | null>(null);

  const loadWeatherByLocation = async () => {
    const granted = await requestLocationPermission();
    if (!granted) {      
      console.error('Permission denied: Location permission is required to get weather for your location.');
      return;
    }

    Geolocation.getCurrentPosition(
      async (position: Geolocation.GeoPosition) => {
        try {
          await dispatch(
            fetchWeatherByCoords({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            }),
          ).unwrap();

          setSelectedCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          const cityName = await dispatch(
            fetchCityByCoords({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            }),
          ).unwrap();

          if (cityName) {
            setInputCity(cityName);
            dispatch(setCity(cityName));
          }
        } catch (e: any) {
          console.error('Error fetching weather or city by location:', e);
        }
      },
      (error: Geolocation.GeoError) => {
        console.error('Geolocation error:', error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const loadWeatherByCityName = async (cityNameParam?: string) => {
    const cityName = cityNameParam ?? inputCity.trim();
    if (!cityName) {
      console.error('Validation error: Please enter a city name');
      return;
    }

    try {
      await dispatch(fetchWeatherByCity(cityName)).unwrap();
      
      const currentState = (await dispatch(fetchWeatherByCity(cityName)).unwrap()) as any;
      setInputCity(cityName);
      setSelectedCoords({
        latitude: currentState.coord.lat,
        longitude: currentState.coord.lon,
      });
    } catch (e: any) {
      console.error('Error fetching weather by city:', e);
    }
  };

  const loadWeatherByMapCoords = async (lat: number, lon: number) => {
    try {
      await dispatch(fetchWeatherByCoords({ lat, lon })).unwrap();
      setSelectedCoords({ latitude: lat, longitude: lon });

      const cityName = await dispatch(fetchCityByCoords({ lat, lon })).unwrap();
      if (cityName) {
        setInputCity(cityName);
        dispatch(setCity(cityName));
      }
    } catch (e: any) {
      console.error('Error fetching weather or city by map coords:', e);
    }
  };

  const onMapPress = async (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    await loadWeatherByMapCoords(latitude, longitude);
  };

  useEffect(() => {
    loadWeatherByLocation();
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps='handled'
      >
        <TextInput
          placeholder='Enter city'
          placeholderTextColor={theme.text + '99'}
          value={inputCity}
          onChangeText={setInputCity}
          style={styles.input}
          returnKeyType='search'
          onSubmitEditing={() => loadWeatherByCityName()}
        />

        <WeatherMap
          selectedCoords={selectedCoords}
          onPress={onMapPress}
          onMarkerDragEnd={async (coords: LatLng) => {
            setSelectedCoords(coords);
            await loadWeatherByMapCoords(coords.latitude, coords.longitude);
          }}
        />

        <View style={styles.buttonsRow}>
          <AnimatedButton
            title='Search'
            onPress={() => loadWeatherByCityName()}
            backgroundColor={theme.primary}
            color='#fff'
            style={{ flex: 1, marginRight: 10 }}
          />
          <AnimatedButton
            title='Use Current Location'
            onPress={loadWeatherByLocation}
            backgroundColor={theme.primary}
            color='#fff'
            style={{ flex: 1 }}
          />
        </View>

        {loading && (
          <ActivityIndicator
            size='large'
            color={theme.primary}
            style={{ marginVertical: 20 }}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {current && current.main && current.weather && current.weather.length > 0 ? (
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherText}>City: {current.name}</Text>
            <Text style={styles.weatherText}>Temperature: {current.main.temp}°C</Text>
            <Text style={styles.weatherText}>Weather: {current.weather[0].description}</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContainer: {
      padding: 16,
      flexGrow: 1,
    },
    input: {
      borderWidth: 2,
      borderColor: theme.primary,
      color: theme.text,
      backgroundColor: theme.background === '#ffffff' ? '#fff' : '#1e1e1e',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      fontSize: 16,
      marginBottom: 16,
    },
    buttonsRow: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    error: {
      fontSize: 14,
      marginBottom: 10,
      textAlign: 'center',
      color: '#ff6b6b',
    },
    weatherInfo: {
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 12,
      padding: 20,
      backgroundColor: theme.background === '#ffffff' ? '#f9f9f9' : '#222',
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },
    weatherText: {
      fontSize: 18,
      marginBottom: 6,
      color: theme.text,
    },
  });
