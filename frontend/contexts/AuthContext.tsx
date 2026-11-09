import React, { createContext, useContext, useState } from 'react';
// import { AppState } from 'react-native';
// import { supabase } from '../services/supabase';
// import { api } from '../services/api';
import { UserProfile } from '../types/auth';

interface AuthContextType {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user and session for UI preview
const MOCK_USER: UserProfile = {
  id: 'dev-farmer-id',
  full_name: 'Demo Farmer',
  created_at: new Date().toISOString(),
};

const MOCK_SESSION: any = {
  access_token: 'mock-dev-token',
  refresh_token: 'mock-dev-refresh-token',
  user: {
    id: 'dev-farmer-id',
    email: 'farmer@example.com',
    user_metadata: { full_name: 'Demo Farmer' },
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth logic commented out for UI preview - using mock user & session
  const [session, setSession] = useState<any | null>(MOCK_SESSION);
  const [user, setUser] = useState<UserProfile | null>(MOCK_USER);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /*
  const fetchProfile = async (sessionUser: any, tokenOverride?: string) => {
    if (!sessionUser) {
      setUser(null);
      return;
    }
    try {
      const headers = tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : {};
      const res = await api.get('/auth/me', { headers });
      setUser(res.data.data);
    } catch (err) {
      setUser({
        id: sessionUser.id,
        full_name: sessionUser.user_metadata?.full_name || sessionUser.email || 'Farmer',
        created_at: sessionUser.created_at,
      });
    }
  };

  useEffect(() => {
    // Proactive auto refresh based on AppState (Supabase RN Best Practices)
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    // Initial session load
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      if (initSession?.user) {
        fetchProfile(initSession.user, initSession.access_token).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen to Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        await fetchProfile(currentSession.user, currentSession.access_token);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      appStateSubscription.remove();
      subscription.unsubscribe();
    };
  }, []);
  */

  const signIn = async (_email: string, _password: string) => {
    /*
    const res = await api.post('/auth/login', { email, password });
    const sess = res.data?.data?.session;
    const sessionUser = res.data?.data?.user;
    if (sess) {
      await supabase.auth.setSession({
        access_token: sess.access_token,
        refresh_token: sess.refresh_token,
      });
      setSession(sess);
      if (sessionUser) {
        await fetchProfile(sessionUser, sess.access_token);
      }
    }
    */
    setSession(MOCK_SESSION);
    setUser(MOCK_USER);
  };

  const signUp = async (_email: string, _password: string, fullName: string) => {
    /*
    const res = await api.post('/auth/signup', { email, password, full_name: fullName });
    const sess = res.data?.data?.session;
    const sessionUser = res.data?.data?.user;
    if (sess) {
      await supabase.auth.setSession({
        access_token: sess.access_token,
        refresh_token: sess.refresh_token,
      });
      setSession(sess);
      if (sessionUser) {
        await fetchProfile(sessionUser, sess.access_token);
      }
    }
    */
    setSession(MOCK_SESSION);
    setUser({ ...MOCK_USER, full_name: fullName || 'Demo Farmer' });
  };

  const signOut = async () => {
    /*
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthContext] SignOut error:', err);
    } finally {
      setSession(null);
      setUser(null);
    }
    */
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
