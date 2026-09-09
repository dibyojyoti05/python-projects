"use client";

import { useEffect, useState, useCallback } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { useAppStore } from '@/store/appStore';
import { weatherApi, favoritesApi, alertsApi } from '@/lib/api';
import { 
  CurrentWeather, 
  HourlyForecast, 
  DailyForecast, 
  LocationSearchItem, 
  FavoriteCityItem,
  TriggeredAlertItem
} from '@/types/weather';
import { 
  Loader2, 
  Droplets, 
  Wind, 
  Sun, 
  Star, 
  Layers, 
  Bell, 
  MapPin, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudSun, 
  Cloud 
} from 'lucide-react';
import { HourlyChart } from '@/components/HourlyChart';
import { DailyForecastList } from '@/components/DailyForecastList';
import { AIAssistant } from '@/components/AIAssistant';
import { WeatherDetails } from '@/components/WeatherDetails';
import { WeatherMap } from '@/components/WeatherMap';
import Link from 'next/link';

const DEFAULT_LOCATION: LocationSearchItem = {
  id: 2643743,
  name: "London",
  admin1: "England",
  country: "United Kingdom",
  latitude: 51.50853,
  longitude: -0.12574,
  timezone: "Europe/London"
};

const getWeatherIcon = (condition: string) => {
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className="w-40 h-40 text-blue-400/20 -mr-10 -mt-10" />;
  if (c.includes('snow')) return <CloudSnow className="w-40 h-40 text-sky-200/20 -mr-10 -mt-10" />;
  if (c.includes('thunder')) return <CloudLightning className="w-40 h-40 text-yellow-400/20 -mr-10 -mt-10" />;
  if (c.includes('cloud') || c.includes('overcast')) return <Cloud className="w-40 h-40 text-slate-400/20 -mr-10 -mt-10" />;
  if (c.includes('clear') || c.includes('sun')) return <Sun className="w-40 h-40 text-amber-400/20 -mr-10 -mt-10" />;
  return <CloudSun className="w-40 h-40 text-blue-300/20 -mr-10 -mt-10" />;
};

export default function Home() {
  const currentLocation = useAppStore(state => state.currentLocation);
  const setCurrentLocation = useAppStore(state => state.setCurrentLocation);
  const units = useAppStore(state => state.units);
  const setUnits = useAppStore(state => state.setUnits);
  
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyForecast | null>(null);
  const [daily, setDaily] = useState<DailyForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PostgreSQL Favorites & Alerts
  const [dbFavorites, setDbFavorites] = useState<FavoriteCityItem[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<TriggeredAlertItem[]>([]);
  const [isFavoriting, setIsFavoriting] = useState(false);

  // Load favorites from DB
  const loadFavorites = useCallback(async () => {
    try {
      const list = await favoritesApi.getFavorites();
      setDbFavorites(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  // Check active alerts
  const checkAlerts = useCallback(async () => {
    try {
      const alerts = await alertsApi.checkAlerts();
      setActiveAlerts(alerts);
    } catch {
      // Fallback silently
    }
  }, []);

  // Initialize on mount: load favorites from PostgreSQL, check alerts, and set default location if empty
  useEffect(() => {
    let isMounted = true;

    const initializeDashboard = async () => {
      const [favs] = await Promise.all([
        loadFavorites(),
        checkAlerts()
      ]);

      if (!isMounted) return;

      // If no location is currently selected, pick user's first saved favorite or the default city
      if (!useAppStore.getState().currentLocation) {
        if (favs && favs.length > 0) {
          const first = favs[0];
          setCurrentLocation({
            id: first.id,
            name: first.name,
            admin1: first.admin1 || null,
            country: first.country,
            latitude: first.latitude,
            longitude: first.longitude,
            timezone: first.timezone
          });
        } else {
          setCurrentLocation(DEFAULT_LOCATION);
        }
      }
    };

    initializeDashboard();
    return () => { isMounted = false; };
  }, [loadFavorites, checkAlerts, setCurrentLocation]);

  // Fetch weather whenever currentLocation or units change
  useEffect(() => {
    if (!currentLocation) return;
    
    let isMounted = true;
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const [currRes, hourRes, dailyRes] = await Promise.all([
          weatherApi.getCurrentWeather(currentLocation.latitude, currentLocation.longitude, units),
          weatherApi.getHourlyForecast(currentLocation.latitude, currentLocation.longitude, units),
          weatherApi.getDailyForecast(currentLocation.latitude, currentLocation.longitude, units),
        ]);
        
        if (isMounted) {
          setCurrent(currRes);
          setHourly(hourRes);
          setDaily(dailyRes);
        }
      } catch {
        if (isMounted) setError("Failed to load weather data. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWeather();
    return () => { isMounted = false; };
  }, [currentLocation, units]);

  // Check if current location is in DB favorites
  const isFavorite = currentLocation ? dbFavorites.some(
    f => f.name.toLowerCase() === currentLocation.name.toLowerCase() && 
         f.country.toLowerCase() === currentLocation.country.toLowerCase()
  ) : false;

  const toggleFavorite = async () => {
    if (!currentLocation || isFavoriting) return;
    setIsFavoriting(true);
    try {
      if (isFavorite) {
        const existing = dbFavorites.find(
          f => f.name.toLowerCase() === currentLocation.name.toLowerCase() &&
               f.country.toLowerCase() === currentLocation.country.toLowerCase()
        );
        if (existing) {
          await favoritesApi.deleteFavorite(existing.id);
          setDbFavorites(prev => prev.filter(f => f.id !== existing.id));
        }
      } else {
        const newFav = await favoritesApi.addFavorite({
          name: currentLocation.name,
          admin1: currentLocation.admin1 || null,
          country: currentLocation.country,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          timezone: currentLocation.timezone || "UTC",
          notes: null,
        });
        setDbFavorites(prev => [newFav, ...prev]);
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleSelectFavorite = (fav: FavoriteCityItem) => {
    setCurrentLocation({
      id: fav.id,
      name: fav.name,
      admin1: fav.admin1 || null,
      country: fav.country,
      latitude: fav.latitude,
      longitude: fav.longitude,
      timezone: fav.timezone
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Search */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10">
              <Sun className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Weather Intelligence</h1>
              <p className="text-xs text-slate-400">Live PostgreSQL & Gemini AI Powered</p>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-md">
            <SearchBar />
          </div>

          <div className="flex items-center gap-2">
            <Link 
              href="/compare"
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 p-2.5 px-4 rounded-2xl border border-white/10 transition-colors text-sm font-medium shadow-sm"
            >
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Compare</span>
            </Link>

            <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-white/10">
              <button 
                onClick={() => setUnits('metric')}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  units === 'metric' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                °C
              </button>
              <button 
                onClick={() => setUnits('imperial')}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  units === 'imperial' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                °F
              </button>
            </div>
          </div>
        </header>

        {/* Saved Favorites Quick-Bar */}
        {dbFavorites.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium whitespace-nowrap pr-2 border-r border-white/10">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>Saved Cities:</span>
            </div>
            <div className="flex items-center gap-2">
              {dbFavorites.map(fav => {
                const isActive = currentLocation?.name.toLowerCase() === fav.name.toLowerCase();
                return (
                  <button
                    key={fav.id}
                    onClick={() => handleSelectFavorite(fav)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
                      isActive
                        ? 'bg-blue-600/30 border-blue-500/60 text-blue-200 shadow-sm shadow-blue-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    {fav.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Alerts Banner */}
        {activeAlerts.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
            <Bell className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">Weather Alert: </span>
              {activeAlerts.map(a => a.message).join(' | ')}
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-28 space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
            <span className="text-sm text-slate-400">Loading accurate weather data...</span>
          </div>
        )}

        {/* Error View */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-2xl text-center">
            {error}
          </div>
        )}

        {/* Main Dashboard Content */}
        {!loading && !error && current && currentLocation && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Current Weather Card & AI Assistant */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity">
                  {getWeatherIcon(current.condition)}
                </div>
                
                {/* City Title & Favorite Toggle */}
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">{currentLocation.name}</h2>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {currentLocation.admin1 ? `${currentLocation.admin1}, ` : ''}{currentLocation.country}
                    </p>
                  </div>
                  <button
                    onClick={toggleFavorite}
                    disabled={isFavoriting}
                    title={isFavorite ? "Remove from Favorites" : "Save to Favorites (PostgreSQL)"}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      isFavorite 
                        ? 'bg-amber-400/20 border-amber-400/40 text-amber-400 shadow-md shadow-amber-400/10' 
                        : 'bg-white/5 border-white/10 hover:bg-white/15 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>
                
                {/* Temperature & Condition */}
                <div className="flex items-baseline gap-4 my-8 relative z-10">
                  <span className="text-7xl font-black tracking-tighter">
                    {Math.round(current.temperature)}°
                  </span>
                  <div className="flex flex-col">
                    <span className="text-2xl font-semibold text-blue-300">{current.condition}</span>
                    <span className="text-slate-400 text-sm">Feels like {Math.round(current.feels_like)}°</span>
                  </div>
                </div>

                {/* Quick Wind & Humidity Stats */}
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <div className="bg-white/5 p-3.5 rounded-2xl flex items-center gap-3 border border-white/5">
                    <Wind className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Wind Speed</div>
                      <div className="font-semibold text-sm">{current.wind_speed} {units === 'metric' ? 'km/h' : 'mph'}</div>
                    </div>
                  </div>
                  <div className="bg-white/5 p-3.5 rounded-2xl flex items-center gap-3 border border-white/5">
                    <Droplets className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Humidity</div>
                      <div className="font-semibold text-sm">{current.humidity}%</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Parameters (UV, Sunrise, Pressure, AQI) */}
                {daily && (
                  <WeatherDetails 
                    current={current} 
                    daily={daily} 
                    lat={currentLocation.latitude} 
                    lon={currentLocation.longitude} 
                  />
                )}
              </div>

              {/* Gemini AI Assistant Widget */}
              <AIAssistant 
                weatherContext={{ 
                  city: currentLocation.name,
                  country: currentLocation.country,
                  temperature: `${current.temperature}°${units === 'metric' ? 'C' : 'F'}`,
                  condition: current.condition,
                  humidity: `${current.humidity}%`,
                  wind: `${current.wind_speed} ${units === 'metric' ? 'km/h' : 'mph'}`,
                  hourly_trend: hourly?.hours.slice(0, 8).map(h => `${h.time}: ${h.temperature}° - ${h.condition}`)
                }} 
              />
            </div>

            {/* Right Column: 24h Hourly Forecast, 7-Day Forecast & Live Map */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* 24-Hour Forecast Chart */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold">24-Hour Trend & Precipitation</h3>
                  <span className="text-xs text-slate-400">Interactive hourly forecast</span>
                </div>
                {hourly ? <HourlyChart data={hourly} /> : <div className="animate-pulse h-64 bg-white/5 rounded-2xl"></div>}
              </div>

              {/* 7-Day Daily Forecast List */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold">7-Day Forecast</h3>
                  <span className="text-xs text-slate-400">Extended weekly outlook</span>
                </div>
                {daily ? <DailyForecastList data={daily} /> : <div className="animate-pulse h-64 bg-white/5 rounded-2xl"></div>}
              </div>

              {/* Interactive Radar & Location Map */}
              <WeatherMap 
                lat={currentLocation.latitude} 
                lon={currentLocation.longitude} 
                name={currentLocation.name} 
              />
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
