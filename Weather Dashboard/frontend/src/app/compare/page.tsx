"use client";

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { weatherApi, favoritesApi } from '@/lib/api';
import { ArrowLeft, Loader2, Sparkles, MapPin } from 'lucide-react';
import { CurrentWeather, LocationSearchItem } from '@/types/weather';
import Link from 'next/link';

const FALLBACK_CITIES: LocationSearchItem[] = [
  { id: 2643743, name: "London", admin1: "England", country: "United Kingdom", latitude: 51.50853, longitude: -0.12574, timezone: "Europe/London" },
  { id: 5128581, name: "New York", admin1: "New York", country: "United States", latitude: 40.71427, longitude: -74.00597, timezone: "America/New_York" },
  { id: 1850147, name: "Tokyo", admin1: "Tokyo", country: "Japan", latitude: 35.6895, longitude: 139.69171, timezone: "Asia/Tokyo" },
  { id: 2988507, name: "Paris", admin1: "Île-de-France", country: "France", latitude: 48.85341, longitude: 2.3488, timezone: "Europe/Paris" }
];

export default function ComparePage() {
  const recentSearches = useAppStore(state => state.recentSearches);
  const currentLocation = useAppStore(state => state.currentLocation);
  const units = useAppStore(state => state.units);
  const [compareData, setCompareData] = useState<Record<string, CurrentWeather>>({});
  const [activeLocations, setActiveLocations] = useState<LocationSearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchComparison = async () => {
      setLoading(true);
      
      let candidateLocations: LocationSearchItem[] = [...recentSearches];
      if (currentLocation && !candidateLocations.find(l => l.id === currentLocation.id)) {
        candidateLocations.unshift(currentLocation);
      }

      // If fewer than 2 locations, pull favorites or fallbacks
      if (candidateLocations.length < 2) {
        try {
          const dbFavs = await favoritesApi.getFavorites();
          const mappedFavs: LocationSearchItem[] = dbFavs.map(f => ({
            id: f.id,
            name: f.name,
            admin1: f.admin1 || null,
            country: f.country,
            latitude: f.latitude,
            longitude: f.longitude,
            timezone: f.timezone
          }));
          candidateLocations = [...candidateLocations, ...mappedFavs];
        } catch {
          // Ignore
        }
      }

      if (candidateLocations.length < 2) {
        candidateLocations = [...candidateLocations, ...FALLBACK_CITIES];
      }

      // Deduplicate by name + country
      const seen = new Set<string>();
      const deduped: LocationSearchItem[] = [];
      for (const loc of candidateLocations) {
        const key = `${loc.name.toLowerCase()}_${loc.country.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(loc);
        }
        if (deduped.length >= 4) break;
      }

      const newCompareData: Record<string, CurrentWeather> = {};
      
      try {
        await Promise.all(
          deduped.map(async (loc) => {
            const data = await weatherApi.getCurrentWeather(loc.latitude, loc.longitude, units);
            newCompareData[loc.id.toString()] = data;
          })
        );
        if (isMounted) {
          setActiveLocations(deduped);
          setCompareData(newCompareData);
        }
      } catch (err) {
        console.error("Failed to fetch comparison data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchComparison();
    return () => { isMounted = false; };
  }, [recentSearches, currentLocation, units]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-sm">Back to Dashboard</span>
          </Link>
          <div className="text-right">
            <h1 className="text-2xl font-bold tracking-tight">Weather Comparison</h1>
            <p className="text-xs text-slate-400">Side-by-side meteorological analytics</p>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
            <span className="text-sm text-slate-400">Comparing atmospheric metrics...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeLocations.map(loc => {
              const data = compareData[loc.id.toString()];
              if (!data) return null;
              
              return (
                <div key={loc.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative group hover:border-blue-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-blue-400 text-xs mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{loc.admin1 || loc.country}</span>
                    </div>
                    <h3 className="text-2xl font-bold truncate">{loc.name}</h3>
                    <p className="text-slate-400 text-xs mb-6 truncate">{loc.country}</p>
                    
                    <div className="text-5xl font-black mb-2 tracking-tight">
                      {Math.round(data.temperature)}°
                    </div>
                    <div className="text-sm font-semibold text-blue-300 mb-6">{data.condition}</div>
                  </div>
                  
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-400">Feels Like</span>
                      <span className="font-semibold">{Math.round(data.feels_like)}°</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-400">Wind</span>
                      <span className="font-semibold">{data.wind_speed} {units === 'metric' ? 'km/h' : 'mph'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-400">Humidity</span>
                      <span className="font-semibold">{data.humidity}%</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-400">Pressure</span>
                      <span className="font-semibold">{data.pressure} hPa</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
