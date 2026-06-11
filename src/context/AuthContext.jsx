import React, { createContext, useContext, useEffect, useState } from 'react';
import { getProfile } from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    console.log('🔍 AuthProvider: token exists?', !!token, 'token value:', token);
    if (!token) {
      console.log('❌ No token found, setting loading=false');
      setLoading(false);
      return;
    }

    console.log('🔄 Fetching profile...');
    getProfile()
      .then(data => {
        console.log('✅ Profile data received:', data);
        if (data && data.user_type === 'admin') {
          setUser({ id: data.id, email: data.email });
          setProfile(data);
        } else {
          console.warn('⚠️ Profile fetched but user is not admin:', data?.user_type);
          localStorage.removeItem('admin_token');
        }
      })
      .catch(err => {
        console.error('❌ Profile fetch error:', err);
        localStorage.removeItem('admin_token');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const signOut = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);