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

export const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
  try {
    const res = await axios.get(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
    );

    const data = res.data;
    if (Array.isArray(data) && data.length > 0) {
      const location = data[0];
      if (location?.local_names?.en) {
        return location.local_names.en;
      }
      if (location?.name) {
        return location.name;
      }
    }

    return null;
  } catch (error: any) {
    console.warn('reverseGeocode error:', error?.response?.data || error.message);
    return null;
  }
};
