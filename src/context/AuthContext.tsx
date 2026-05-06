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
        // Check if it's an axios error with response data
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as {
            response?: {
              data?: {
                success?: boolean;
                errors?: { field: string; message: string }[];
                message?: string;
              };
              status?: number;
            };
          };

          // Handle field-specific validation errors from backend
          if (axiosError.response?.data?.errors && Array.isArray(axiosError.response.data.errors)) {
            return {
              success: false,
              errors: axiosError.response.data.errors,
            };
          }

          // Handle general error message from backend
          if (axiosError.response?.data?.message) {
            return {
              success: false,
              error: axiosError.response.data.message,
            };
          }

          // Handle HTTP status errors without specific message
          if (axiosError.response?.status) {
            const status = axiosError.response.status;
            if (status === 401) {
              return { success: false, error: "Invalid credentials" };
            }
            if (status === 403) {
              return { success: false, error: "Access denied" };
            }
            if (status >= 500) {
              return { success: false, error: "Server error. Please try again later." };
            }
          }
        }

        // Network error or server not reachable
        if (error && typeof error === "object" && "code" in error) {
          const networkError = error as { code?: string };
          if (networkError.code === "ERR_NETWORK") {
            return {
              success: false,
              error: "Unable to connect to server. Please check your connection.",
            };
          }
        }

        return {
          success: false,
          error: "An unexpected error occurred. Please try again.",
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
