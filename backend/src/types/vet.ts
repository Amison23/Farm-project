export type TreatmentRoute = 'oral' | 'injection' | 'topical' | 'other';

export interface VetRecord {
  id: string;
  farm_id: string;
  animal_id: string;
  treatment_date: string;
  product_name: string;
  batch_number: string | null;
  quantity_administered: string | null;
  route: TreatmentRoute;
  reason: string | null;
  administered_by: string | null;
  withdrawal_period_days: number;
  veterinarian_name: string | null;
  outcome: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface VetRecordWithAnimal extends VetRecord {
  animal?: {
    id: string;
    sheep_id: string;
    sex: string;
    breed: string;
    status: string;
  } | null;
}

export interface CreateVetRecordDTO {
  animal_id: string;
  treatment_date: string;
  product_name: string;
  batch_number?: string | null;
  quantity_administered?: string | null;
  route: TreatmentRoute;
  reason?: string | null;
  administered_by?: string | null;
  withdrawal_period_days?: number;
  veterinarian_name?: string | null;
  outcome?: string | null;
  notes?: string | null;
}

export interface UpdateVetRecordDTO {
  animal_id?: string;
  treatment_date?: string;
  product_name?: string;
  batch_number?: string | null;
  quantity_administered?: string | null;
  route?: TreatmentRoute;
  reason?: string | null;
  administered_by?: string | null;
  withdrawal_period_days?: number;
  veterinarian_name?: string | null;
  outcome?: string | null;
  notes?: string | null;
}

export interface VetRecordFilters {
  animal_id?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface WithdrawalStatusInfo {
  vet_record_id: string;
  animal_id: string;
  farm_id: string;
  withdrawal_end_date: string;
  is_withdrawal_active: boolean;
  animal?: {
    id: string;
    sheep_id: string;
    sex: string;
    breed: string;
    status: string;
  } | null;
}
