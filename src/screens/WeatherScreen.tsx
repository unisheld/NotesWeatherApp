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
import { useDispatch, useSelector } from 'react-redux';

import {
  fetchWeatherStart,
  fetchWeatherSuccess,
  fetchWeatherFailure,
  setCity,
} from '../redux/weatherSlice';
import { RootState, AppDispatch } from '../redux/store';
import { fetchWeatherByCity, fetchWeatherByCoords } from '../api/weatherApi';

import AnimatedButton from '../components/AnimatedButton';
import { useTheme } from '../theme/useTheme';

export default function WeatherScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { current, city, loading, error } = useSelector((state: RootState) => state.weather);

  const theme = useTheme();
  const styles = createStyles(theme);

  const [inputCity, setInputCity] = useState(city);

  const loadWeatherByLocation = async () => {
    dispatch(fetchWeatherStart());

    Geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await fetchWeatherByCoords(
            position.coords.latitude,
            position.coords.longitude
          );
          dispatch(fetchWeatherSuccess(data));
          dispatch(setCity(data.name));
          setInputCity(data.name);
        } catch (e) {
          dispatch(fetchWeatherFailure('Error fetching weather'));
        }
      },
      (error) => dispatch(fetchWeatherFailure(error.message)),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const loadWeatherByCity = async () => {
    if (!inputCity.trim()) {
      dispatch(fetchWeatherFailure('Please enter a city name'));
      return;
    }

    dispatch(fetchWeatherStart());
    try {
      const data = await fetchWeatherByCity(inputCity.trim());
      dispatch(fetchWeatherSuccess(data));
      dispatch(setCity(inputCity.trim()));
    } catch (e) {
      dispatch(fetchWeatherFailure('City not found'));
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
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          placeholder="Enter city"
          placeholderTextColor={theme.text + '99'}
          value={inputCity}
          onChangeText={setInputCity}
          style={styles.input}
        />

        <View style={styles.buttonsRow}>
          <AnimatedButton
            title="Search"
            onPress={loadWeatherByCity}
            backgroundColor={theme.primary}
            color="#fff"
            style={{ flex: 1, marginRight: 10 }}
          />
          <AnimatedButton
            title="Use Current Location"
            onPress={loadWeatherByLocation}
            backgroundColor={theme.primary}
            color="#fff"
            style={{ flex: 1 }}
          />
        </View>

        {loading && (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginVertical: 20 }}
          />
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {current && (
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherText}>City: {current.name}</Text>
            <Text style={styles.weatherText}>
              Temperature: {current.main.temp}°C
            </Text>
            <Text style={styles.weatherText}>
              Weather: {current.weather[0].description}
            </Text>
          </View>
        )}
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
