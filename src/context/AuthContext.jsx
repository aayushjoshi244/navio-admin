import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (authUser) => {
      console.log('🔍 fetchProfile called for user ID:', authUser.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      console.log('📦 Profile data:', data);
      console.log('⚠️ Profile error:', error);
      if (mounted) {
        if (!error && data?.user_type === 'admin') {
          console.log('✅ User is admin, setting user and profile');
          setUser(authUser);
          setProfile(data);
        } else {
          console.log('❌ User is NOT admin or profile missing');
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔄 Auth state changed, event:', _event, 'session:', session?.user?.email);
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

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔎 Existing session:', session?.user?.email);
      if (mounted) {
        if (session?.user) {
          setLoading(true);
          await fetchProfile(session.user);
        } else {
          setLoading(false);
        }
      }
    };

    checkUser();

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('🚪 Signing out');
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