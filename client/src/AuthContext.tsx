
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import axios from "axios";
import { api, setAccessToken } from "./api";

export interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
        try {
    const response = await api.post("/auth/refresh", {});

    if (!active) return;

    setAccessToken(response.data.accessToken);

    const userResponse = await api.get("/auth/me");

    if (!active) return;

        setUser(userResponse.data.user);
        } catch {
        setAccessToken(null);
        } finally {
        if (active) setLoading(false);
        }
    }

    restoreSession();

    const handleLogout = () => {
      setAccessToken(null);
      setUser(null);
    };

    window.addEventListener("auth:logout", handleLogout);

    return () => {
      active = false;
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []);

  async function login(email: string, password: string) {

    const response = await api.post("/auth/login", { email, password });

    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
  }

  async function register(
    name: string,
    email: string,
    password: string
  ) {
    await api.post("/auth/register", { name, email, password });
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      if (!axios.isAxiosError(error)) throw error;
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
