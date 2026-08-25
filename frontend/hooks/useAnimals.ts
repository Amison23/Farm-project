import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  AnimalWithParents,
  AnimalFilters,
  CreateAnimalPayload,
  UpdateAnimalPayload,
  LineageNode,
} from '../types/animal';

export function useAnimals(farmId: string | undefined, initialFilters: AnimalFilters = {}) {
  const [animals, setAnimals] = useState<AnimalWithParents[]>([]);
  const [meta, setMeta] = useState<{ page: number; limit: number; total: number }>({
    page: 1,
    limit: 25,
    total: 0,
  });
  const [filters, setFilters] = useState<AnimalFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchAnimals = useCallback(async () => {
    if (!farmId) return;

    try {
      setIsLoading(true);
      setError('');

      const params: Record<string, any> = {};
      if (filters.status) params.status = filters.status;
      if (filters.breed) params.breed = filters.breed;
      if (filters.sex) params.sex = filters.sex;
      if (filters.search) params.search = filters.search;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;

      const res = await api.get(`/farms/${farmId}/animals`, { params });
      setAnimals(res.data.data || []);
      if (res.data.meta) {
        setMeta(res.data.meta);
      }
    } catch (err: any) {
      console.error('[useAnimals] Fetch failed:', err);
      setError(err.message || 'Failed to load animals.');
    } finally {
      setIsLoading(false);
    }
  }, [farmId, filters]);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  return {
    animals,
    meta,
    filters,
    setFilters,
    isLoading,
    error,
    refetch: fetchAnimals,
  };
}

export function useAnimalDetail(farmId: string | undefined, animalId: string | undefined) {
  const [animal, setAnimal] = useState<AnimalWithParents | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchDetail = useCallback(async () => {
    if (!farmId || !animalId) return;

    try {
      setIsLoading(true);
      setError('');
      const res = await api.get(`/farms/${farmId}/animals/${animalId}`);
      setAnimal(res.data.data || null);
    } catch (err: any) {
      if (err.status !== 404 && err.code !== 'ANIMAL_NOT_FOUND') {
        console.error('[useAnimalDetail] Fetch error:', err);
      }
      setError(err.message || 'Failed to load animal details.');
    } finally {
      setIsLoading(false);
    }
  }, [farmId, animalId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { animal, isLoading, error, refetch: fetchDetail };
}

export function useAnimalLineage(farmId: string | undefined, animalId: string | undefined) {
  const [lineage, setLineage] = useState<LineageNode | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchLineage = useCallback(async () => {
    if (!farmId || !animalId) return;

    try {
      setIsLoading(true);
      setError('');
      const res = await api.get(`/farms/${farmId}/animals/${animalId}/lineage`);
      setLineage(res.data.data || null);
    } catch (err: any) {
      if (err.status !== 404 && err.code !== 'ANIMAL_NOT_FOUND') {
        console.error('[useAnimalLineage] Fetch error:', err);
      }
      setError(err.message || 'Failed to load pedigree lineage.');
    } finally {
      setIsLoading(false);
    }
  }, [farmId, animalId]);

  useEffect(() => {
    fetchLineage();
  }, [fetchLineage]);

  return { lineage, isLoading, error, refetch: fetchLineage };
}

export async function createAnimal(farmId: string, payload: CreateAnimalPayload): Promise<AnimalWithParents> {
  const res = await api.post(`/farms/${farmId}/animals`, payload);
  return res.data.data;
}

export async function updateAnimal(
  farmId: string,
  animalId: string,
  payload: UpdateAnimalPayload
): Promise<AnimalWithParents> {
  const res = await api.patch(`/farms/${farmId}/animals/${animalId}`, payload);
  return res.data.data;
}

export async function deleteAnimal(farmId: string, animalId: string): Promise<void> {
  await api.delete(`/farms/${farmId}/animals/${animalId}`);
}
