import { useState } from 'react';
import {api} from '../services/api';

export interface ImportPreviewData {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
  sizeBytes: number;
}

export interface ImportErrorItem {
  row: number;
  column?: string;
  messages: string[];
  data?: Record<string, unknown>;
}

export interface ImportCommitResult {
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: ImportErrorItem[];
}

export function useImport(farmId?: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewCsv = async (fileObj: { uri: string; name: string; type: string } | File): Promise<ImportPreviewData> => {
    if (!farmId) throw new Error('Farm ID is missing.');

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      if ('uri' in fileObj) {
        formData.append('file', fileObj as any);
      } else {
        formData.append('file', fileObj);
      }

      const res = await api.post(`/farms/${farmId}/import/preview`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return res.data;
    } catch (err: any) {
      console.error('[useImport.previewCsv] Error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to parse CSV preview.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const commitImport = async (
    fileObj: { uri: string; name: string; type: string } | File,
    columnMap: Record<string, string>
  ): Promise<ImportCommitResult> => {
    if (!farmId) throw new Error('Farm ID is missing.');

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      if ('uri' in fileObj) {
        formData.append('file', fileObj as any);
      } else {
        formData.append('file', fileObj);
      }
      formData.append('columnMap', JSON.stringify(columnMap));

      const res = await api.post(`/farms/${farmId}/import/commit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return res.data;
    } catch (err: any) {
      console.error('[useImport.commitImport] Error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to commit CSV import.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    error,
    previewCsv,
    commitImport,
  };
}
