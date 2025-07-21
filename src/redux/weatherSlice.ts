import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { getWeatherByCity, getWeatherByCoords, reverseGeocode } from '../api/weatherApi';

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

export const fetchWeatherByCity = createAsyncThunk(
  'weather/fetchByCity',
  async (city: string, { rejectWithValue }) => {
    try {
      const response = await getWeatherByCity(city);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchWeatherByCoords = createAsyncThunk(
  'weather/fetchByCoords',
  async (
    coords: { lat: number; lon: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await getWeatherByCoords(coords.lat, coords.lon);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

export const fetchCityByCoords = createAsyncThunk(
  'weather/fetchCityByCoords',
  async (
    coords: { lat: number; lon: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await reverseGeocode(coords.lat, coords.lon);
      const data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        const location = data[0];
        return location?.local_names?.en || location?.name || null;
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);

const weatherSlice = createSlice({
  name: 'weather',
  initialState,
  reducers: {
    setCity(state, action: PayloadAction<string>) {
      state.city = action.payload;
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder     
      .addCase(fetchWeatherByCity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeatherByCity.fulfilled, (state, action) => {
        state.current = action.payload;
        state.city = action.payload.name;
        state.loading = false;
      })
      .addCase(fetchWeatherByCity.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })

      .addCase(fetchWeatherByCoords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeatherByCoords.fulfilled, (state, action) => {
        state.current = action.payload;
        state.city = action.payload.name;
        state.loading = false;
      })
      .addCase(fetchWeatherByCoords.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })
     
      .addCase(fetchCityByCoords.pending, (state) => {        
      })
      .addCase(fetchCityByCoords.fulfilled, (state, action) => {
        if (action.payload) {
          state.city = action.payload;
        }
      })
      .addCase(fetchCityByCoords.rejected, (state, action) => {       
      });
  },
});

export const { setCity, clearError } = weatherSlice.actions;
export default weatherSlice.reducer;
