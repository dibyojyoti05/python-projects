import axios from 'axios';
import { 
  CurrentWeather, 
  HourlyForecast, 
  DailyForecast, 
  LocationSearchItem,
  FavoriteCityItem,
  AlertRuleItem,
  TriggeredAlertItem,
  AirQualityData
} from '@/types/weather';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
});

export const weatherApi = {
  getCurrentWeather: async (lat: number, lon: number, units: string): Promise<CurrentWeather> => {
    const res = await api.get('/weather/current', { params: { lat, lon, units } });
    return res.data;
  },
  
  getHourlyForecast: async (lat: number, lon: number, units: string): Promise<HourlyForecast> => {
    const res = await api.get('/weather/hourly', { params: { lat, lon, units } });
    return res.data;
  },
  
  getDailyForecast: async (lat: number, lon: number, units: string): Promise<DailyForecast> => {
    const res = await api.get('/weather/daily', { params: { lat, lon, units } });
    return res.data;
  },

  getAirQuality: async (lat: number, lon: number): Promise<AirQualityData> => {
    const res = await api.get('/weather/air-quality', { params: { lat, lon } });
    return res.data;
  },
};

export const geoApi = {
  searchLocations: async (query: string): Promise<LocationSearchItem[]> => {
    const res = await api.get('/geocoding/search', { params: { query } });
    return res.data;
  },
};

export const favoritesApi = {
  getFavorites: async (): Promise<FavoriteCityItem[]> => {
    const res = await api.get('/favorites/');
    return res.data;
  },

  addFavorite: async (data: Omit<FavoriteCityItem, 'id' | 'created_at'>): Promise<FavoriteCityItem> => {
    const res = await api.post('/favorites/', data);
    return res.data;
  },

  deleteFavorite: async (id: number): Promise<void> => {
    await api.delete(`/favorites/${id}`);
  },
};

export const alertsApi = {
  getAlerts: async (): Promise<AlertRuleItem[]> => {
    const res = await api.get('/alerts/');
    return res.data;
  },

  createAlert: async (data: { city_name: string; latitude: number; longitude: number; condition_type: string; threshold: number }): Promise<AlertRuleItem> => {
    const res = await api.post('/alerts/', data);
    return res.data;
  },

  deleteAlert: async (id: number): Promise<void> => {
    await api.delete(`/alerts/${id}`);
  },

  checkAlerts: async (): Promise<TriggeredAlertItem[]> => {
    const res = await api.get('/alerts/check');
    return res.data;
  },
};

export const aiApi = {
  ask: async (query: string, weatherContext: string): Promise<string> => {
    const res = await api.post('/ai/ask', { query, weather_context: weatherContext });
    return res.data.response;
  },
};
