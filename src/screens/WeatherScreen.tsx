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
  fetchWeatherStart,
  fetchWeatherSuccess,
  fetchWeatherFailure,
  setCity,
} from '../redux/weatherSlice';
import { RootState, AppDispatch } from '../redux/store';
import {
  fetchWeatherByCity,
  fetchWeatherByCoords,
  reverseGeocode,
} from '../api/weatherApi';

import AnimatedButton from '../components/AnimatedButton';
import { useTheme } from '../theme/useTheme';
import WeatherMap from '../components/WeatherMap';
import { requestLocationPermission } from '../utils/permissions';

export default function WeatherScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { current, city, loading, error } = useSelector(
    (state: RootState) => state.weather,
  );

  const theme = useTheme();
  const styles = createStyles(theme);

  const [inputCity, setInputCity] = useState(city ?? '');
  const [selectedCoords, setSelectedCoords] = useState<LatLng | null>(null);

  const loadWeatherByLocation = async () => {
    const granted = await requestLocationPermission();
    if (!granted) {
      dispatch(fetchWeatherFailure('Location permission not granted'));
      console.error('Permission denied: Location permission is required to get weather for your location.');
      return;
    }

    dispatch(fetchWeatherStart());

    Geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await fetchWeatherByCoords(
            position.coords.latitude,
            position.coords.longitude,
          );
          dispatch(fetchWeatherSuccess(data));
          dispatch(setCity(data.name));
          setInputCity(data.name);
          setSelectedCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } catch (e: unknown) {
          if (e instanceof Error) {
            dispatch(fetchWeatherFailure(e.message));
            console.error('Error fetching weather:', e.message);
          } else {
            dispatch(fetchWeatherFailure('Error fetching weather'));
            console.error('Failed to fetch weather data for current location.');
          }
        }
      },
      (error) => {
        dispatch(fetchWeatherFailure(error.message));
        console.error('Geolocation error:', error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const loadWeatherByCity = async (cityNameParam?: string) => {
    const cityName = cityNameParam ?? inputCity.trim();
    if (!cityName) {
      dispatch(fetchWeatherFailure('Please enter a city name'));
      console.error('Validation error: Please enter a city name');
      return;
    }

    dispatch(fetchWeatherStart());

    try {
      const data = await fetchWeatherByCity(cityName);
      dispatch(fetchWeatherSuccess(data));
      dispatch(setCity(cityName));
      setSelectedCoords({
        latitude: data.coord.lat,
        longitude: data.coord.lon,
      });
      setInputCity(cityName);
    } catch (e: unknown) {
      if (selectedCoords) {
        await loadWeatherByMapCoords(selectedCoords.latitude, selectedCoords.longitude);
      } else if (e instanceof Error) {
        dispatch(fetchWeatherFailure(e.message));
        console.error('Error fetching weather by city:', e.message);
      } else {
        dispatch(fetchWeatherFailure('City not found'));
        console.error('City not found');
      }
    }
  };

  const loadWeatherByMapCoords = async (lat: number, lon: number) => {
    dispatch(fetchWeatherStart());

    try {
      const data = await fetchWeatherByCoords(lat, lon);
      dispatch(fetchWeatherSuccess(data));
      dispatch(setCity(data.name));
      setInputCity(data.name);
      setSelectedCoords({ latitude: lat, longitude: lon });
    } catch (e: unknown) {
      if (e instanceof Error) {
        dispatch(fetchWeatherFailure(e.message));
        console.error('Error fetching weather from map:', e.message);
      } else {
        dispatch(fetchWeatherFailure('Error fetching weather from map'));
        console.error('Failed to fetch weather data for selected location.');
      }
    }
  };

  const onMapPress = async (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    const cityName = await reverseGeocode(latitude, longitude);
    console.log('reverseGeocode cityName:', cityName);

    if (cityName) {
      setInputCity(cityName);
      setSelectedCoords({ latitude, longitude });
      await loadWeatherByCity(cityName);
    } else {
      setSelectedCoords({ latitude, longitude });
      await loadWeatherByMapCoords(latitude, longitude);
    }
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
          onSubmitEditing={() => loadWeatherByCity()}
        />

        <WeatherMap
          selectedCoords={selectedCoords}
          onPress={onMapPress}
          onMarkerDragEnd={async (coords) => {
            setSelectedCoords(coords);
            const cityName = await reverseGeocode(coords.latitude, coords.longitude);
            if (cityName) {
              setInputCity(cityName);
              await loadWeatherByCity(cityName);
            } else {
              await loadWeatherByMapCoords(coords.latitude, coords.longitude);
            }
          }}
        />

        <View style={styles.buttonsRow}>
          <AnimatedButton
            title='Search'
            onPress={() => loadWeatherByCity()}
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
