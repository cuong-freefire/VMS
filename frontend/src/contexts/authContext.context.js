import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { userService } from "../services/user.service.js";
import { authService } from "../services/auth.service.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initializeUser = useCallback(async () => {
    try {
      const res = await userService.getMe();
      const userData = res.data?.user || res.data;
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  const login = async (data) => {
    const res = await authService.login(data);
    const userData = res.data?.user || res.data;
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout API failed, clearing local state:", error.message);
    } finally {
      setUser(null);
    }
  };

  const updateUser = (data) => {
    setUser((prev) => ({ ...prev, ...data }));
  };

  const roleId = user?.role_id;
  const roleName = user?.role_name;

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    roleId,
    roleName,
    isVolunteer: roleName === 'VOLUNTEER',
    isStaff: roleName === 'STAFF',
    isManager: roleName === 'MANAGER',
    isAdmin: roleName === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return authContext;
}
