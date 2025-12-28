import { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

// 1. Exportação do Contexto
export const AuthContext = createContext({});

// 2. Exportação do Provider
// 2. Exportação do Provider
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [tenant, setTenant] = useState(null); // Selected Tenant
    const [loading, setLoading] = useState(true);

    const hydrateUserData = async (tokenStr) => {
        try {
            // Use relative URL via fetch or apiClient. Here using fetch relative to origin (via Nginx proxy)
            const response = await fetch('/api/auth/users/me', {
                headers: { 'Authorization': `Bearer ${tokenStr}` }
            });

            if (response.ok) {
                const fullUser = await response.json();
                setUser(fullUser);
            } else {
                console.error("Error hydrating user", response.status);
                // Don't logout immediately, might be network error. But if 401, yes.
                if (response.status === 401) logout();
                else {
                    const decoded = jwtDecode(tokenStr);
                    setUser(decoded);
                }
            }
        } catch (err) {
            console.error("Error fetching /me", err);
            const decoded = jwtDecode(tokenStr);
            setUser(decoded);
        }
    }

    const selectTenant = (slug) => {
        setTenant(slug);
        localStorage.setItem('tenantSlug', slug);
        // Optimistically update profile/role if needed, or rely on next API call
    };

    useEffect(() => {
        const recoverUser = async () => {
            const storedToken = localStorage.getItem('token');
            const storedTenant = localStorage.getItem('tenantSlug');

            if (storedToken) {
                try {
                    const decoded = jwtDecode(storedToken);
                    const currentTime = Date.now() / 1000;
                    if (decoded.exp && decoded.exp < currentTime) {
                        logout();
                    } else {
                        setToken(storedToken);
                        if (storedTenant) setTenant(storedTenant);
                        await hydrateUserData(storedToken);
                    }
                } catch (error) {
                    logout();
                }
            }
            setLoading(false);
        };

        recoverUser();
    }, []);

    const login = async (newToken, access_token) => { // Accept object or string? Login page sends string.
        const t = newToken || access_token;
        localStorage.setItem('token', t);
        setToken(t);
        await hydrateUserData(t);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('tenantSlug');
        setToken(null);
        setUser(null);
        setTenant(null);
    };

    return (
        <AuthContext.Provider value={{
            authenticated: !!user,
            user,
            token,
            tenant,
            userProfile: user?.profile, // Legacy support if field exists
            isSysAdmin: user?.is_sysadmin,
            selectTenant,
            login,
            logout,
            isLoadingAuth: loading,
            refreshUser: () => hydrateUserData(token)
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. Exportação do Hook Personalizado
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};