"use client";

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { geoApi } from '@/lib/api';
import { LocationSearchItem } from '@/types/weather';
import { useAppStore } from '@/store/appStore';
import { useGeolocation } from '@/hooks/useGeolocation';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const setCurrentLocation = useAppStore(state => state.setCurrentLocation);
  const addRecentSearch = useAppStore(state => state.addRecentSearch);
  const recentSearches = useAppStore(state => state.recentSearches);
  
  const { getDeviceLocation, loading: geoLoading } = useGeolocation();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setIsSearching(true);
        try {
          const res = await geoApi.searchLocations(query);
          setResults(res);
          setShowDropdown(true);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (location: LocationSearchItem) => {
    setCurrentLocation(location);
    addRecentSearch(location);
    setQuery('');
    setShowDropdown(false);
  };

  const handleDeviceLocation = async () => {
    const loc = await getDeviceLocation();
    if (loc) {
      setCurrentLocation(loc);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto z-50">
      <div className="relative flex items-center">
        <Search className="absolute left-3 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search city..."
          className="w-full pl-10 pr-12 py-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.length >= 2 || recentSearches.length > 0) setShowDropdown(true);
          }}
        />
        <button 
          onClick={handleDeviceLocation}
          className="absolute right-3 text-gray-300 hover:text-white transition-colors"
          title="Use my location"
        >
          {geoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
        </button>
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-2 w-full bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {isSearching && (
            <div className="p-4 flex items-center justify-center text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Searching...
            </div>
          )}
          
          {!isSearching && results.length > 0 && (
            <ul>
              {results.map(res => (
                <li key={res.id}>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-white/10 text-white transition-colors flex flex-col"
                    onClick={() => handleSelect(res)}
                  >
                    <span className="font-semibold">{res.name}</span>
                    <span className="text-xs text-gray-400">
                      {res.admin1 ? `${res.admin1}, ` : ''}{res.country}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!isSearching && results.length === 0 && query.length < 2 && recentSearches.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Searches</div>
              <ul>
                {recentSearches.map(res => (
                  <li key={`recent-${res.id}`}>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-white/10 text-white transition-colors flex flex-col"
                      onClick={() => handleSelect(res)}
                    >
                      <span className="font-semibold">{res.name}</span>
                      <span className="text-xs text-gray-400">
                        {res.admin1 ? `${res.admin1}, ` : ''}{res.country}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
