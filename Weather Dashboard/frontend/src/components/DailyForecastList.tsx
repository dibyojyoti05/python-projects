"use client";

import React from 'react';
import { format } from 'date-fns';
import { DailyForecast } from '@/types/weather';
import { Droplets, CloudSun, Sun, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';

interface Props {
  data: DailyForecast;
}

const getIcon = (condition: string, size = 24) => {
  const iconStr = condition.toLowerCase();
  if (iconStr.includes('rain') || iconStr.includes('drizzle')) return <CloudRain size={size} className="text-blue-400" />;
  if (iconStr.includes('snow')) return <CloudSnow size={size} className="text-blue-200" />;
  if (iconStr.includes('thunder')) return <CloudLightning size={size} className="text-yellow-400" />;
  if (iconStr.includes('cloud') || iconStr.includes('overcast') || iconStr.includes('fog')) return <CloudSun size={size} className="text-gray-400" />;
  return <Sun size={size} className="text-yellow-500" />;
};

export function DailyForecastList({ data }: Props) {
  return (
    <div className="space-y-4 mt-4">
      {data.days.map((day, i) => (
        <div key={day.time} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors">
          <div className="w-24 font-medium">
            {i === 0 ? 'Today' : format(new Date(day.time), 'EEE, MMM d')}
          </div>
          
          <div className="flex items-center justify-center w-12">
            {getIcon(day.condition, 24)}
          </div>
          
          <div className="flex items-center gap-1 w-20 text-sm text-blue-300">
            <Droplets size={14} />
            {day.precipitation_probability}%
          </div>
          
          <div className="flex justify-end gap-3 w-32 font-semibold">
            <span>{Math.round(day.temp_max)}°</span>
            <span className="text-slate-500">{Math.round(day.temp_min)}°</span>
          </div>
        </div>
      ))}
    </div>
  );
}
