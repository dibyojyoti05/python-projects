import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LocationSearchItem } from '@/types/weather';

interface AppState {
  currentLocation: LocationSearchItem | null;
  favorites: LocationSearchItem[];
  recentSearches: LocationSearchItem[];
  units: 'metric' | 'imperial';
  theme: 'dark' | 'light' | 'system';
  
  setCurrentLocation: (location: LocationSearchItem) => void;
  addFavorite: (location: LocationSearchItem) => void;
  removeFavorite: (id: number) => void;
  addRecentSearch: (location: LocationSearchItem) => void;
  setUnits: (units: 'metric' | 'imperial') => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentLocation: null,
      favorites: [],
      recentSearches: [],
      units: 'metric',
      theme: 'system',

      setCurrentLocation: (location) => set({ currentLocation: location }),
      
      addFavorite: (location) => set((state) => ({
        favorites: state.favorites.some((fav) => fav.id === location.id) 
          ? state.favorites 
          : [...state.favorites, location]
      })),
      
      removeFavorite: (id) => set((state) => ({
        favorites: state.favorites.filter((fav) => fav.id !== id)
      })),
      
      addRecentSearch: (location) => set((state) => {
        const filtered = state.recentSearches.filter((item) => item.id !== location.id);
        return { recentSearches: [location, ...filtered].slice(0, 5) };
      }),
      
      setUnits: (units) => set({ units }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'weather-storage',
    }
  )
);
