"use client";

import React, { useEffect, useState } from 'react';
import { Sun, Sunset, Wind, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { CurrentWeather, DailyForecast } from '@/types/weather';
import { weatherApi } from '@/lib/api';

interface Props {
  current: CurrentWeather;
  daily: DailyForecast;
  lat: number;
  lon: number;
}

export function WeatherDetails({ current, daily, lat, lon }: Props) {
  const [aqi, setAqi] = useState<{ european_aqi?: number } | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    weatherApi.getAirQuality(lat, lon)
      .then(data => {
        if (isMounted) setAqi(data);
      })
      .catch(err => console.error("AQI error", err));
      
    return () => { isMounted = false; };
  }, [lat, lon]);

  const today = daily.days[0];
  if (!today) return null;

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <Sun className="w-4 h-4" />
          <span className="text-sm font-medium uppercase tracking-wider">UV Index</span>
        </div>
        <div className="text-2xl font-bold">{current.uv_index !== null ? current.uv_index : today.uv_index}</div>
        <div className="text-xs text-slate-500 mt-1">Max today: {today.uv_index}</div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <Sunset className="w-4 h-4" />
          <span className="text-sm font-medium uppercase tracking-wider">Sun</span>
        </div>
        <div className="flex flex-col gap-1 text-sm font-semibold">
          <div className="flex justify-between items-center"><ArrowUp className="w-3 h-3 text-orange-400"/> {formatTime(today.sunrise)}</div>
          <div className="flex justify-between items-center"><ArrowDown className="w-3 h-3 text-purple-400"/> {formatTime(today.sunset)}</div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium uppercase tracking-wider">Air Quality</span>
        </div>
        <div className="text-2xl font-bold">{aqi?.european_aqi ?? '--'}</div>
        <div className="text-xs text-slate-500 mt-1">{(aqi?.european_aqi ?? 0) > 50 ? 'Moderate' : 'Good'}</div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <Wind className="w-4 h-4" />
          <span className="text-sm font-medium uppercase tracking-wider">Pressure</span>
        </div>
        <div className="text-xl font-bold">{current.pressure} <span className="text-sm font-normal">hPa</span></div>
      </div>
    </div>
  );
}
