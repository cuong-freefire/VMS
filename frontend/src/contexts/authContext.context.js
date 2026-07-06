import { createContext, useContext, useEffect, useState } from "react";
import { userService } from "../services/user.service.js";
import { authService } from "../services/auth.service.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const initializeUser = async () => {
        try {
            const res = await userService.getMe();
            setUser(res.data)
        }
        catch {
            setUser(null)
        }
        finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        initializeUser()
    }, [])

    const login = async (data) => {
        const res = await authService.login(data);

        setUser(res.data);

        return res.data;
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout API failed, clearing local state anyway:', error.message);
        } finally {
            setUser(null);
            window.location.href = '/';
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isAuthenticated: !!user
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const authContext = useContext(AuthContext)
    if (!authContext) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return authContext;
}