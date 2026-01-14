import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../api/apiClient';

export const AuthContext = createContext({});

/**
 * PROTOCOLO ANTI-LOOP V1.0
 * Status: loading | authenticated | unauthenticated
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [tenant, setTenant] = useState(null);
    const [status, setStatus] = useState('loading'); // loading, authenticated, unauthenticated

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('tenantSlug');
        setToken(null);
        setUser(null);
        setTenant(null);
        setStatus('unauthenticated');
    }, []);

    const hydrateUserData = useCallback(async (tokenStr) => {
        try {
            // Using apiClient ensures base URL /api and interceptors are used
            const response = await apiClient.get('/v1/auth/users/me', {
                headers: { 'Authorization': `Bearer ${tokenStr}` }
            });

            const fullUser = response.data;

            // AUTO-SELECT TENANT: If user has exactly 1 membership, select it automatically
            if (fullUser.memberships && fullUser.memberships.length === 1) {
                const singleTenant = fullUser.memberships[0].tenant.slug;
                setTenant(singleTenant);
                localStorage.setItem('tenantSlug', singleTenant);
            }

            setUser(fullUser);
            setToken(tokenStr);
            setStatus('authenticated');
            return fullUser;
        } catch (err) {
            console.error("Critical Auth Error:", err);

            if (err.response?.status === 401) {
                logout();
                return null;
            }

            // Fallback to token data if token exists and is valid-ish
            try {
                const decoded = jwtDecode(tokenStr);
                if (decoded) {
                    setUser(decoded);
                    setToken(tokenStr);
                    setStatus('authenticated');
                } else {
                    setStatus('unauthenticated');
                }
            } catch (jwtErr) {
                console.error("JWT Decode Error during fallback:", jwtErr);
                logout();
            }
        }
    }, [logout]);

    useEffect(() => {
        const recover = async () => {
            const storedToken = localStorage.getItem('token');
            const storedTenant = localStorage.getItem('tenantSlug');

            if (storedToken) {
                try {
                    const decoded = jwtDecode(storedToken);
                    const currentTime = Date.now() / 1000;
                    if (decoded.exp && decoded.exp < currentTime) {
                        logout();
                    } else {
                        if (storedTenant) setTenant(storedTenant);
                        await hydrateUserData(storedToken);
                    }
                } catch (error) {
                    logout();
                }
            } else {
                setStatus('unauthenticated');
            }
        };
        recover();
    }, [hydrateUserData, logout]);

    const login = async (newToken) => {
        localStorage.setItem('token', newToken);
        await hydrateUserData(newToken);
    };

    const selectTenant = (slug) => {
        setTenant(slug);
        localStorage.setItem('tenantSlug', slug);
    };

    // Deterministic Profile Calculation based on selected tenant
    const activeMembership = user?.memberships?.find(m => m.tenant.slug === tenant);
    const profile = user?.is_superuser ? 'sysadmin' : (activeMembership?.role || 'representante');

    const exitImpersonation = () => {
        setTenant(null);
        localStorage.removeItem('tenantSlug');
    };

    return (
        <AuthContext.Provider value={{
            status,
            authenticated: status === 'authenticated',
            user,
            token,
            tenant,
            userProfile: profile,
            isSysAdmin: !!user?.is_superuser,
            isLoadingAuth: status === 'loading',
            selectTenant,
            login,
            logout,
            exitImpersonation, // New function for SysAdmin
            refreshUser: () => hydrateUserData(token)
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);