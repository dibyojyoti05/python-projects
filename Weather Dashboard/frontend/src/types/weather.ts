export interface CurrentWeather {
  temperature: number;
  feels_like: number;
  condition: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  pressure: number;
  visibility: number | null;
  cloud_cover: number;
  uv_index: number | null;
}

export interface HourlyForecastItem {
  time: string;
  temperature: number;
  feels_like: number;
  condition: string;
  icon: string;
  precipitation_probability: number;
  precipitation_amount: number;
  wind_speed: number;
  uv_index: number | null;
}

export interface HourlyForecast {
  hours: HourlyForecastItem[];
}

export interface DailyForecastItem {
  time: string;
  temp_max: number;
  temp_min: number;
  condition: string;
  icon: string;
  precipitation_probability: number;
  precipitation_amount: number;
  wind_speed: number;
  uv_index: number | null;
  sunrise: string;
  sunset: string;
}

export interface DailyForecast {
  days: DailyForecastItem[];
}

export interface LocationSearchItem {
  id: number;
  name: string;
  admin1: string | null;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface FavoriteCityItem {
  id: number;
  name: string;
  admin1?: string | null;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  notes?: string | null;
  created_at: string;
}

export interface AlertRuleItem {
  id: number;
  city_name: string;
  latitude: number;
  longitude: number;
  condition_type: string;
  threshold: number;
  is_active: boolean;
  created_at: string;
}

export interface TriggeredAlertItem {
  rule_id: number;
  city_name: string;
  condition_type: string;
  threshold: number;
  current_value: number;
  message: string;
}

export interface AirQualityData {
  european_aqi?: number;
  pm10?: number;
  pm2_5?: number;
  nitrogen_dioxide?: number;
  ozone?: number;
  sulphur_dioxide?: number;
}
