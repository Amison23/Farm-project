import { useState } from 'react';
import { Platform } from 'react-native';
import { api } from '../services/api';

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

  const buildFormData = async (fileObj: any, columnMap?: Record<string, string>): Promise<FormData> => {
    const formData = new FormData();

    if (fileObj instanceof File || fileObj instanceof Blob) {
      formData.append('file', fileObj, (fileObj as any).name || 'import.csv');
    } else if (Platform.OS === 'web' && fileObj?.uri) {
      try {
        const resp = await fetch(fileObj.uri);
        const blob = await resp.blob();
        formData.append('file', blob, fileObj.name || 'import.csv');
      } catch (err) {
        console.warn('[useImport] Fetch blob failed, falling back to object:', err);
        formData.append('file', fileObj);
      }
    } else if (typeof fileObj === 'object' && fileObj.uri) {
      formData.append('file', {
        uri: fileObj.uri,
        name: fileObj.name || 'import.csv',
        type: fileObj.type || 'text/csv',
      } as any);
    } else {
      formData.append('file', fileObj);
    }

    if (columnMap) {
      formData.append('columnMap', JSON.stringify(columnMap));
    }

    return formData;
  };

  const previewCsv = async (fileObj: any): Promise<ImportPreviewData> => {
    if (!farmId) throw new Error('Farm ID is missing.');

    console.log('[DEBUG_FILE_OBJ]', {
      typeofFileObj: typeof fileObj,
      isInstanceofFile: typeof File !== 'undefined' && fileObj instanceof File,
      isInstanceofBlob: typeof Blob !== 'undefined' && fileObj instanceof Blob,
      uri: fileObj?.uri,
      keys: fileObj && typeof fileObj === 'object' ? Object.keys(fileObj) : [],
      fileObj,
    });

    try {
      setIsUploading(true);
      setError(null);

      const formData = await buildFormData(fileObj);
      const res = await api.post(`/farms/${farmId}/import/preview`, formData);

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
    fileObj: any,
    columnMap: Record<string, string>
  ): Promise<ImportCommitResult> => {
    if (!farmId) throw new Error('Farm ID is missing.');

    try {
      setIsUploading(true);
      setError(null);

      const formData = await buildFormData(fileObj, columnMap);
      const res = await api.post(`/farms/${farmId}/import/commit`, formData);

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
