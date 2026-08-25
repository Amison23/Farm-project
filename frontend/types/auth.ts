export interface UserProfile {
  id: string;
  full_name: string;
  phone?: string | null;
  created_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
}
