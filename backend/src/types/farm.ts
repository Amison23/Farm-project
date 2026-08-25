export type UserRole = 'owner' | 'vet';

export interface Profile {
  id: string;
  full_name: string;
  phone?: string | null;
  created_at: string;
}

export interface Farm {
  id: string;
  name: string;
  location?: string | null;
  created_by: string;
  created_at: string;
}

export interface FarmMember {
  id: string;
  farm_id: string;
  user_id: string;
  role: UserRole;
  invited_at: string;
  accepted_at?: string | null;
  profile?: Profile;
}

export interface CreateFarmDto {
  name: string;
  location?: string;
}

export interface InviteMemberDto {
  email: string;
  role: UserRole;
}
