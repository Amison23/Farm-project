export type UserRole = 'owner' | 'vet';

export interface Farm {
  id: string;
  name: string;
  location?: string | null;
  created_by: string;
  created_at: string;
  role?: UserRole;
}

export interface FarmMember {
  id: string;
  farm_id: string;
  user_id: string;
  role: UserRole;
  invited_at: string;
  accepted_at?: string | null;
  profile?: {
    id: string;
    full_name: string;
    phone?: string | null;
  };
}
