"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-slate-800 rounded-3xl animate-pulse"></div>
});

interface Props {
  lat: number;
  lon: number;
  name: string;
}

export function WeatherMap({ lat, lon, name }: Props) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl mt-6">
      <h3 className="text-xl font-bold mb-4">Location Map</h3>
      <div className="rounded-2xl overflow-hidden h-64">
        <DynamicMap lat={lat} lon={lon} name={name} />
      </div>
    </div>
  );
}
