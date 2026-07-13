import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  getCurrentUserApi,
  loginApi,
  logoutApi,
  refreshApi,
  registerApi,
  type LoginInput,
  type RegisterInput,
  type User
} from "../lib/api";

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const refreshResponse = await refreshApi();
      const nextAccessToken = refreshResponse.data.accessToken;
      const currentUserResponse = await getCurrentUserApi(nextAccessToken);

      setAccessToken(nextAccessToken);
      setUser(currentUserResponse.data.user);
    } catch {
      clearAuthState();
    }
  }, [clearAuthState]);

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        await refreshSession();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [refreshSession]);

  const login = useCallback(async (input: LoginInput) => {
    const response = await loginApi(input);

    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const response = await registerApi(input);

    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    accessToken,
    isAuthenticated: Boolean(user && accessToken),
    isLoading,
    login,
    register,
    logout,
    refreshSession
  }), [accessToken, isLoading, login, logout, refreshSession, register, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
