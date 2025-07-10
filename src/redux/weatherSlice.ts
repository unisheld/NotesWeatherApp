import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WeatherState {
  current: any | null;
  city: string;
  loading: boolean;
  error: string | null;
}

const initialState: WeatherState = {
  current: null,
  city: '',
  loading: false,
  error: null,
};

const weatherSlice = createSlice({
  name: 'weather',
  initialState,
  reducers: {
    fetchWeatherStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchWeatherSuccess: (state, action: PayloadAction<any>) => {
      state.current = action.payload;
      state.loading = false;
    },
    fetchWeatherFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setCity: (state, action: PayloadAction<string>) => {
      state.city = action.payload;
    },
  },
});

export const { fetchWeatherStart, fetchWeatherSuccess, fetchWeatherFailure, setCity } = weatherSlice.actions;
export default weatherSlice.reducer;
