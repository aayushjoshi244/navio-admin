import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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
    const abortController = new AbortController();
    timeoutId = setTimeout(() => {
      console.warn("Profile fetch timeout – aborting request");
      abortController.abort();
      setLoading(false);
    }, 10000);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      clearTimeoutId();

      if (error) {
        console.error("Profile fetch error:", error);
        if (error.code === "PGRST116") {
          // Create missing profile
          const { error: insertError } = await supabase
            .from("profiles")
            .insert([
              { id: authUser.id, user_type: "user", full_name: "", phone: "" },
            ]);
          if (insertError) {
            console.error("Failed to create profile:", insertError);
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }
          const { data: newData, error: refetchError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();
          if (refetchError) {
            console.error("Re-fetch error:", refetchError);
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }
          if (newData?.user_type === "admin") {
            setUser(authUser);
            setProfile(newData);
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
          return;
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
      }

      if (data?.user_type === "admin") {
        setUser(authUser);
        setProfile(data);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    } catch (err) {
      console.error("Unexpected error in fetchProfile:", err);
      setUser(null);
      setProfile(null);
      setLoading(false);
    } finally {
      clearTimeoutId();
    }
  };

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      setLoading(true);
      await fetchProfile(session.user);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Listen to tab visibility changes to re‑check session
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && mounted) {
        checkSession();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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
      },
    );

    checkSession();

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
