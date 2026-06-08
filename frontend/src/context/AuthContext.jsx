import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, getToken, setToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap: if there is a token in storage, validate it.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api
      .me()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const signIn = useCallback(async (email, password) => {
    const res = await api.login({ email, password });

    const token = res.access_token;
    const u = res.user;

    setToken(token);
    setUser(u);

    return u;
  }, []);
  const signUp = useCallback(async (payload) => {
    const res = await api.signup(payload);

    const token = res.access_token;
    const u = res.user;

    setToken(token);
    setUser(u);

    return u;
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const refreshed = await api.updateProfile(payload);
    setUser(refreshed);
    return refreshed;
  }, []);

  const changePassword = useCallback(async (payload) => {
    await api.changePassword(payload);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      changePassword,
      isAdmin: user?.role === "admin",
    }),
    [user, loading, signIn, signUp, signOut, updateProfile, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
