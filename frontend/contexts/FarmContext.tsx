import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { Farm } from '../types/farm';

interface FarmContextType {
  farms: Farm[];
  activeFarm: Farm | null;
  isLoadingFarms: boolean;
  selectFarm: (farmId: string) => void;
  createFarm: (name: string, location?: string) => Promise<Farm>;
  refreshFarms: () => Promise<void>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeFarm, setActiveFarm] = useState<Farm | null>(null);
  const [isLoadingFarms, setIsLoadingFarms] = useState<boolean>(true);

  const refreshFarms = async () => {
    if (!session) {
      setFarms([]);
      setActiveFarm(null);
      setIsLoadingFarms(false);
      return;
    }

    try {
      setIsLoadingFarms(true);
      const res = await api.get('/farms');
      const farmList: Farm[] = res.data.data || [];
      setFarms(farmList);

      // Auto-select first farm if activeFarm is not set or not in list
      if (farmList.length > 0) {
        if (!activeFarm || !farmList.find(f => f.id === activeFarm.id)) {
          setActiveFarm(farmList[0]);
        }
      } else {
        setActiveFarm(null);
      }
    } catch (err) {
      console.error('[FarmContext] refreshFarms failed:', err);
    } finally {
      setIsLoadingFarms(false);
    }
  };

  useEffect(() => {
    refreshFarms();
  }, [session]);

  const selectFarm = (farmId: string) => {
    const found = farms.find(f => f.id === farmId);
    if (found) {
      setActiveFarm(found);
    }
  };

  const createFarm = async (name: string, location?: string): Promise<Farm> => {
    const res = await api.post('/farms', { name, location });
    const newFarm: Farm = res.data.data;
    await refreshFarms();
    setActiveFarm(newFarm);
    return newFarm;
  };

  return (
    <FarmContext.Provider value={{ farms, activeFarm, isLoadingFarms, selectFarm, createFarm, refreshFarms }}>
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = (): FarmContextType => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
