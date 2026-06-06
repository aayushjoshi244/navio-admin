import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (authUser, showLoading = true) => {
    console.log('🔍 Fetching profile for:', authUser.id);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('❌ Profile fetch error:', error);
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    console.log('✅ Profile data:', data);
    if (data?.user_type === 'admin') {
      setUser(authUser);
      setProfile(data);
    } else {
      console.warn('⚠️ User is not admin');
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  };

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setLoading(true);
      await fetchProfile(session.user, true);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        let shouldShowLoading = false;
        setUser((currUser) => {
          if (!currUser || currUser.id !== session.user.id) {
            shouldShowLoading = true;
          }
          return currUser;
        });

        if (shouldShowLoading) {
          setLoading(true);
        }
        await fetchProfile(session.user, shouldShowLoading);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    checkSession();

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
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