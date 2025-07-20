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
    if (data && data.length > 0) {
      if (data[0].local_names && data[0].local_names.en) {
        return data[0].local_names.en;
      }
      return data[0].name;
    }
    return null;
  } catch (error) {    
    console.warn('reverseGeocode error:', error);
    return null;
  }
};
