import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import api from "../utils/api";

interface AuthContextType {
  token: string | null;
  userId: string | null;
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userId: string, user: any) => void;
  logout: () => void;
  refreshUser: () => void;
}

let _globalToken: string | null = null;

export const setGlobalToken = (t: string | null) => {
  _globalToken = t;
};
export const getGlobalToken = () => _globalToken;

const AuthContext = createContext<AuthContextType>({
  token: null,
  userId: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    // Rehydrate token from localStorage immediately on mount.
    // Without this, _globalToken stays null after every fresh page
    // load/refresh, so the very first API call (validate-token) goes
    // out with no Authorization header and fails even though a valid
    // token exists in localStorage.
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      setToken(null);
      setGlobalToken(null);
      setUserId(null);
      setUser(null);
      localStorage.removeItem("userId");
      localStorage.removeItem("user");
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    setGlobalToken(storedToken);

    api
      .get("/auth/validate-token")
      .then((res) => {
        const userData = res.data?.user || res.data?.data?.user;
        if (userData) {
          const id = String(userData._id || userData.id);
          setUserId(id);
          setUser(userData);
          localStorage.setItem("userId", id);
          localStorage.setItem("user", JSON.stringify(userData));
        }
      })
      .catch(() => {
        // Token was invalid/expired (or missing) — clear it so
        // isAuthenticated actually reflects reality instead of
        // hanging onto a stale/bad token.
        setToken(null);
        setGlobalToken(null);
        localStorage.removeItem("token");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    (newToken: string, newUserId: string, newUser: any) => {
      setToken(newToken);
      setGlobalToken(newToken);
      setUserId(newUserId);
      setUser(newUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("token", newToken);
        localStorage.setItem("userId", newUserId);
        localStorage.setItem("user", JSON.stringify(newUser));
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setGlobalToken(null);
    setUserId(null);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("user");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("starredCases");
      localStorage.removeItem("starredPapers");
      localStorage.removeItem("pinnedPapers");
      document.cookie = "token=; Path=/; Max-Age=0; SameSite=Lax";
      document.cookie = "auth_status=; Path=/; Max-Age=0; SameSite=Lax";
    }
  }, []);

  const refreshUser = useCallback(() => {
    if (typeof window === "undefined") return;

    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      setToken(null);
      setGlobalToken(null);
      setUserId(null);
      setUser(null);
      localStorage.removeItem("userId");
      localStorage.removeItem("user");
      return;
    }

    setToken(storedToken);
    setGlobalToken(storedToken);

    api
      .get("/auth/validate-token")
      .then((res) => {
        const userData = res.data?.user || res.data?.data?.user;
        if (userData) {
          const id = String(userData._id || userData.id);
          setUserId(id);
          setUser(userData);
          if (typeof window !== "undefined") {
            localStorage.setItem("userId", id);
            localStorage.setItem("user", JSON.stringify(userData));
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,
        user,
        isAuthenticated: !!token || !!userId,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
