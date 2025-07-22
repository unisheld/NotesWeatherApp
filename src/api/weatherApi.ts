import axios from 'axios';
import Config from 'react-native-config';

const weatherInstance = axios.create({
  baseURL: Config.OPENWEATHER_BASE_URL,
  params: {
    appid: Config.OPENWEATHER_API_KEY,
    units: 'metric',
  },
});

const geoInstance = axios.create({
  baseURL: 'https://api.openweathermap.org/geo/1.0',
  params: {
    appid: Config.OPENWEATHER_API_KEY,
  },
});

export const getWeatherByCity = (city: string) =>
  weatherInstance.get('/weather', { params: { q: city } });

export const getWeatherByCoords = (lat: number, lon: number) =>
  weatherInstance.get('/weather', { params: { lat, lon } });

export const reverseGeocode = (lat: number, lon: number) =>
  geoInstance.get('/reverse', { params: { lat, lon, limit: 1 } });


