import axios from 'axios';

const API_KEY = 'd374e7139740f8a3c1424caaf1724874'; // OpenWeatherMap

export const fetchWeatherByCoords = async (lat: number, lon: number) => {
  const res = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
  );
  return res.data;
};

export const fetchWeatherByCity = async (city: string) => {
  const res = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
  );
  return res.data;
};
