import { useState, useEffect, useCallback } from 'react';
import {api} from '../services/api';
import {
  FeedRecordWithAnimal,
  CreateFeedRecordPayload,
  UpdateFeedRecordPayload,
  FeedRecordFilters,
} from '../types/feed';

export function useFeedRecords(farmId?: string, initialFilters?: FeedRecordFilters) {
  const [records, setRecords] = useState<FeedRecordWithAnimal[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FeedRecordFilters>(initialFilters || {});

  const fetchRecords = useCallback(async () => {
    if (!farmId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params: Record<string, any> = {};
      if (filters.animal_id) params.animal_id = filters.animal_id;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;

      const res = await api.get(`/farms/${farmId}/feed`, { params });
      setRecords(res.data.data || []);
      if (res.data.meta) {
        setMeta(res.data.meta);
      }
    } catch (err: any) {
      if (err.status !== 404) {
        console.error('[useFeedRecords] Fetch error:', err);
      }
      setError(err.message || 'Failed to load feed records.');
    } finally {
      setIsLoading(false);
    }
  }, [farmId, filters]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return {
    records,
    meta,
    isLoading,
    error,
    refetch: fetchRecords,
    setFilters,
  };
}

export function useAnimalFeedHistory(farmId?: string, animalId?: string) {
  const [history, setHistory] = useState<FeedRecordWithAnimal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!farmId || !animalId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get(`/farms/${farmId}/animals/${animalId}/feed`);
      setHistory(res.data || []);
    } catch (err: any) {
      if (err.status !== 404) {
        console.error('[useAnimalFeedHistory] Fetch error:', err);
      }
      setError(err.message || 'Failed to load feed history.');
    } finally {
      setIsLoading(false);
    }
  }, [farmId, animalId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}

export function useFeedRecordDetail(farmId?: string, id?: string) {
  const [record, setRecord] = useState<FeedRecordWithAnimal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!farmId || !id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get(`/farms/${farmId}/feed/${id}`);
      setRecord(res.data || null);
    } catch (err: any) {
      if (err.status !== 404) {
        console.error('[useFeedRecordDetail] Fetch error:', err);
      }
      setError(err.message || 'Failed to load feed record details.');
    } finally {
      setIsLoading(false);
    }
  }, [farmId, id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    record,
    isLoading,
    error,
    refetch: fetchDetail,
  };
}

export async function createFeedRecord(farmId: string, payload: CreateFeedRecordPayload): Promise<FeedRecordWithAnimal> {
  const res = await api.post(`/farms/${farmId}/feed`, payload);
  return res.data;
}

export async function updateFeedRecord(farmId: string, id: string, payload: UpdateFeedRecordPayload): Promise<FeedRecordWithAnimal> {
  const res = await api.patch(`/farms/${farmId}/feed/${id}`, payload);
  return res.data;
}

export async function deleteFeedRecord(farmId: string, id: string): Promise<void> {
  await api.delete(`/farms/${farmId}/feed/${id}`);
}
