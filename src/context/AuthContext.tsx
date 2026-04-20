import { createContext, useContext, useState, type ReactNode } from "react";

export type UserRole = "admin" | "user" | "planner";

interface User {
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
  ) => { success: boolean; error?: string };
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS = [
  {
    email: "admin@plansure.com",
    password: "password",
    role: "admin" as UserRole,
  },
  {
    email: "user@plansure.com",
    password: "password",
    role: "user" as UserRole,
  },
  {
    email: "planner@plansure.com",
    password: "password",
    role: "planner" as UserRole,
  },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("plansure_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (email: string, password: string) => {
    const foundUser = USERS.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password,
    );

    if (foundUser) {
      const userData = { email: foundUser.email, role: foundUser.role };
      setUser(userData);
      localStorage.setItem("plansure_user", JSON.stringify(userData));
      return { success: true };
    }

    return { success: false, error: "Invalid email or password" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("plansure_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
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
