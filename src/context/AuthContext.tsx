import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { authAPI } from "../services/api";

export type UserRole = "admin" | "user" | "planner";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface LoginResponse {
  success: boolean;
  errors?: { field: string; message: string }[];
  error?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("plansure_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("plansure_token");
  });

  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResponse> => {
      setIsLoading(true);
      try {
        const response = await authAPI.login(email, password);

        if (response.success) {
          const userData: User = {
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            role: response.user.role as UserRole,
          };

          setUser(userData);
          setToken(response.token);
          localStorage.setItem("plansure_user", JSON.stringify(userData));
          localStorage.setItem("plansure_token", response.token);

          return { success: true };
        }

        return { success: false, error: response.message || "Login failed" };
      } catch (error: unknown) {
        const err = error as {
          response?: { data?: { errors?: { field: string; message: string }[]; message?: string } };
        };

        // Handle field-specific validation errors
        if (err.response?.data?.errors) {
          return {
            success: false,
            errors: err.response.data.errors,
          };
        }

        // Handle general error message
        if (err.response?.data?.message) {
          return {
            success: false,
            error: err.response.data.message,
          };
        }

        return {
          success: false,
          error: "Unable to connect to server. Please try again.",
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Call logout API if we have a token
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      // Even if API call fails, still clear local state
      console.error("Logout API error:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("plansure_user");
      localStorage.removeItem("plansure_token");
      setIsLoading(false);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
