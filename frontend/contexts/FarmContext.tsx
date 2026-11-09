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
    /* Auth condition commented out for UI preview
    if (!session) {
      setFarms([]);
      setActiveFarm(null);
      setIsLoadingFarms(false);
      return;
    }
    */

    try {
      setIsLoadingFarms(true);
      const res = await api.get('/farms');
      const farmList: Farm[] = res.data.data || [];
      if (farmList.length > 0) {
        setFarms(farmList);
        if (!activeFarm || !farmList.find(f => f.id === activeFarm.id)) {
          setActiveFarm(farmList[0]);
        }
      } else {
        // Fallback demo farm for UI preview
        const demoFarms: Farm[] = [
          {
            id: 'demo-farm-1',
            name: 'Green Valley Farm',
            location: 'Rift Valley, Kenya',
            role: 'owner',
            created_at: new Date().toISOString(),
          },
        ];
        setFarms(demoFarms);
        setActiveFarm(demoFarms[0]);
      }
    } catch (err) {
      console.warn('[FarmContext] refreshFarms failed, using demo farm for UI preview:', err);
      const demoFarms: Farm[] = [
        {
          id: 'demo-farm-1',
          name: 'Green Valley Farm',
          location: 'Rift Valley, Kenya',
          role: 'owner',
          created_at: new Date().toISOString(),
        },
      ];
      setFarms(demoFarms);
      setActiveFarm(demoFarms[0]);
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
