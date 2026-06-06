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

  const fetchProfile = async (authUser, showLoading = true) => {
    console.log('🔍 Fetching profile for:', authUser.id);
    clearTimeoutId();
    
    // Safety timeout to avoid infinite loading if connection hangs (30 seconds)
    timeoutId = setTimeout(() => {
      console.warn('Profile fetch timeout – forcing loading=false');
      setLoading(false);
    }, 30000);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      clearTimeoutId();

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
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
      setUser(null);
      setProfile(null);
      setLoading(false);
    } finally {
      clearTimeoutId();
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log('🔄 Auth State Changed:', event, session?.user?.email);
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

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
      clearTimeoutId();
    };
  }, []);

  const signOut = async () => {
    clearTimeoutId();
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