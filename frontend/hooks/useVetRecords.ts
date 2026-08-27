import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  VetRecordWithAnimal,
  VetRecordFilters,
  CreateVetRecordPayload,
  UpdateVetRecordPayload,
  WithdrawalStatusInfo,
} from '../types/vet';

export function useVetRecords(farmId: string | undefined, initialFilters: VetRecordFilters = {}) {
  const [records, setRecords] = useState<VetRecordWithAnimal[]>([]);
  const [meta, setMeta] = useState<{ page: number; limit: number; total: number }>({
    page: 1,
    limit: 25,
    total: 0,
  });
  const [filters, setFilters] = useState<VetRecordFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchRecords = useCallback(async () => {
    if (!farmId) return;

    try {
      setIsLoading(true);
      setError('');

      const params: Record<string, any> = {};
      if (filters.animal_id) params.animal_id = filters.animal_id;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.search) params.search = filters.search;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;

      const res = await api.get(`/farms/${farmId}/vet-records`, { params });
      setRecords(res.data.data || []);
      if (res.data.meta) {
        setMeta(res.data.meta);
      }
    } catch (err: any) {
      console.error('[useVetRecords] Fetch failed:', err);
      setError(err.message || 'Failed to load vet records.');
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
    filters,
    setFilters,
    isLoading,
    error,
    refetch: fetchRecords,
  };
}

export function useVetRecordDetail(farmId: string | undefined, recordId: string | undefined) {
  const [record, setRecord] = useState<VetRecordWithAnimal | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchDetail = useCallback(async () => {
    if (!farmId || !recordId) return;

    try {
      setIsLoading(true);
      setError('');
      const res = await api.get(`/farms/${farmId}/vet-records/${recordId}`);
      setRecord(res.data.data || null);
    } catch (err: any) {
      if (err.status !== 404 && err.code !== 'VET_RECORD_NOT_FOUND') {
        console.error('[useVetRecordDetail] Fetch error:', err);
      }
      setError(err.message || 'Failed to load vet record details.');
    } finally {
      setIsLoading(false);
    }
  }, [farmId, recordId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { record, isLoading, error, refetch: fetchDetail };
}

export function useWithdrawalStatus(farmId: string | undefined) {
  const [activeWithdrawals, setActiveWithdrawals] = useState<WithdrawalStatusInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchWithdrawals = useCallback(async () => {
    if (!farmId) return;

    try {
      setIsLoading(true);
      setError('');
      const res = await api.get(`/farms/${farmId}/vet-records/withdrawal-status`);
      setActiveWithdrawals(res.data.data || []);
    } catch (err: any) {
      console.error('[useWithdrawalStatus] Fetch error:', err);
      setError(err.message || 'Failed to load active withdrawal watchlist.');
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  return { activeWithdrawals, isLoading, error, refetch: fetchWithdrawals };
}

export async function createVetRecord(
  farmId: string,
  payload: CreateVetRecordPayload
): Promise<VetRecordWithAnimal> {
  const res = await api.post(`/farms/${farmId}/vet-records`, payload);
  return res.data.data;
}

export async function updateVetRecord(
  farmId: string,
  recordId: string,
  payload: UpdateVetRecordPayload
): Promise<VetRecordWithAnimal> {
  const res = await api.patch(`/farms/${farmId}/vet-records/${recordId}`, payload);
  return res.data.data;
}

export async function deleteVetRecord(farmId: string, recordId: string): Promise<void> {
  await api.delete(`/farms/${farmId}/vet-records/${recordId}`);
}
