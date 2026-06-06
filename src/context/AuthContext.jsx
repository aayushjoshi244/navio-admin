import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  let timeoutId = null;

  const clearTimeoutId = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const fetchProfile = async (authUser) => {
    clearTimeoutId();
    // Set a timeout to avoid infinite loading
    timeoutId = setTimeout(() => {
      console.warn('Profile fetch timeout – resetting loading');
      setLoading(false);
    }, 10000);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    clearTimeoutId();

    if (!error && data?.user_type === 'admin') {
      setUser(authUser);
      setProfile(data);
    } else {
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  };

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setLoading(true);
      await fetchProfile(session.user);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        checkSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        if (session?.user) {
          setLoading(true);
          await fetchProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    });

    checkSession();

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      listener?.subscription.unsubscribe();
      clearTimeoutId();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);