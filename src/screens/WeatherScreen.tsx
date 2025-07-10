import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, ActivityIndicator } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWeatherStart, fetchWeatherSuccess, fetchWeatherFailure, setCity } from '../redux/weatherSlice';
import { RootState, AppDispatch } from '../redux/store';
import { fetchWeatherByCity, fetchWeatherByCoords } from '../api/weatherApi';
import { PermissionsAndroid, Platform } from 'react-native';

export default function WeatherScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { current, city, loading, error } = useSelector((state: RootState) => state.weather);
  const [inputCity, setInputCity] = useState(city);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const loadWeatherByLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      dispatch(fetchWeatherFailure('Location permission denied'));
      return;
    }

    dispatch(fetchWeatherStart());
    Geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
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
    dispatch(fetchWeatherStart());
    try {
      const data = await fetchWeatherByCity(inputCity);
      dispatch(fetchWeatherSuccess(data));
      dispatch(setCity(inputCity));
    } catch (e) {
      dispatch(fetchWeatherFailure('City not found'));
    }
  };

  useEffect(() => {
    loadWeatherByLocation();
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        placeholder="Enter city"
        value={inputCity}
        onChangeText={setInputCity}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12 }}
      />
      <Button title="Search" onPress={loadWeatherByCity} />
      <Button title="Use Current Location" onPress={loadWeatherByLocation} />
      {loading && <ActivityIndicator size="large" />}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      {current && (
        <View style={{ marginTop: 20 }}>
          <Text>City: {current.name}</Text>
          <Text>Temperature: {current.main.temp}°C</Text>
          <Text>Weather: {current.weather[0].description}</Text>
        </View>
      )}
    </View>
  );
}
