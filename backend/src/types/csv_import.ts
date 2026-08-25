export interface ImportError {
  row: number; // 1-based index (header is row 1, first data row is 2)
  column?: string; // DB field or CSV header name that failed
  messages: string[]; // Array of Zod / parsing error messages
  data?: Record<string, unknown>; // Raw row values for debugging in the UI
}

export interface ImportSamplePreview {
  headers: string[];
  sampleRows: Record<string, string>[];
  detectedType?: string;
  totalRows: number;
  sizeBytes: number;
}

export type FieldDataType = 
  | 'string' 
  | 'number' 
  | 'date' 
  | 'enum' 
  | 'enum_array' 
  | 'reference';

export interface FieldDefinition {
  name: string;
  type: FieldDataType;
  required: boolean;
  options?: string[];
  referenceTarget?: string;
}

export type ExpectedFields = Record<string, FieldDefinition>;

export interface ImportCommitRequest {
  /**
   * Key: Target Database Field Name (e.g. "tag_number")
   * Value: Uploaded CSV Header Name (e.g. "Tag ID")
   */
  columnMap: Record<string, string>;
}

export interface ImportCommitResponse {
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: ImportError[];
}