/**
 * Backend shared types — Phase 0
 *
 * Add domain types here as phases complete:
 * - Phase 1: Farm, FarmMember, UserRole
 * - Phase 2: Animal, AnimalStatus, AnimalSex
 * - Phase 3: VetRecord, TreatmentRoute
 * - Phase 4: FeedRecord
 * - Phase 5: ImportPreview, ImportCommitBody
 * - Phase 6: Notification, NotificationType
 */

/** Standard API error envelope returned by all error responses */
export interface ApiError {
  code: string;
  message: string;
}

/** Standard success envelope for all API responses */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}
