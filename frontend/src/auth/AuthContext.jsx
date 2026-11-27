import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchCurrentUser, postAuthRequest } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const refreshUser = useCallback(async () => {
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    setAuthError("");
    return currentUser;
  }, []);

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
          setAuthError("");
        }
      })
      .catch((error) => {
        if (active) {
          setAuthError(error.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const response = await postAuthRequest("login", credentials);
    setUser(response.user);
    setAuthError("");
    return response.user;
  }, []);

  const signUp = useCallback(async (details) => {
    const response = await postAuthRequest("signup", details);
    setUser(response.user);
    setAuthError("");
    return response.user;
  }, []);

  const signOut = useCallback(async () => {
    await postAuthRequest("logout");
    setUser(null);
    setAuthError("");
  }, []);

  const value = {
    user,
    loading,
    authError,
    refreshUser,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return context;
}
