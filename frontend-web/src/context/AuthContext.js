import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import apiClient from '../api/apiClient';

export const AuthContext = createContext({});

/**
 * MODO MOCK - COMPASSO V1
 * Autenticação simplificada para demo
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [tenant, setTenant] = useState('compasso');
    const [status, setStatus] = useState('loading');

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
            const response = await apiClient.get('/v1/auth/users/me');
            const fullUser = response.data;

            setUser(fullUser);
            setToken(tokenStr);
            setTenant('compasso');
            localStorage.setItem('tenantSlug', 'compasso');
            setStatus('authenticated');
            return fullUser;
        } catch (err) {
            console.error("[MOCK AUTH] Erro ao hidratar:", err);
            // MOCK FALLBACK - sempre autentica se tiver token
            if (tokenStr) {
                const mockUser = {
                    id: 1,
                    email: "admin@compasso.com",
                    name: "Admin Compasso",
                    is_superuser: true,
                    is_active: true,
                    memberships: [
                        { tenant: { id: 1, slug: 'compasso', name: 'Compasso Demo' }, role: 'admin' }
                    ]
                };
                setUser(mockUser);
                setToken(tokenStr);
                setTenant('compasso');
                setStatus('authenticated');
                return mockUser;
            }
            setStatus('unauthenticated');
            return null;
        }
    }, []);

    useEffect(() => {
        const recover = async () => {
            const storedToken = localStorage.getItem('token');

            if (storedToken) {
                await hydrateUserData(storedToken);
            } else {
                setStatus('unauthenticated');
            }
        };
        recover();
    }, [hydrateUserData]);

    const login = async (newToken) => {
        localStorage.setItem('token', newToken);
        await hydrateUserData(newToken);
    };

    const selectTenant = (slug) => {
        setTenant(slug);
        localStorage.setItem('tenantSlug', slug);
    };

    // Profile sempre admin no modo mock
    const profile = user?.is_superuser ? 'sysadmin' : 'admin';

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
            exitImpersonation,
            refreshUser: () => hydrateUserData(token)
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);