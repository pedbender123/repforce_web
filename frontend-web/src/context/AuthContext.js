import { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

// 1. Exportação do Contexto
export const AuthContext = createContext({});

// 2. Exportação do Provider
// 2. Exportação do Provider
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Função auxiliar para hidratar dados completos do usuário
    const hydrateUserData = async (tokenStr) => {
        try {
            // 1. Decodifica básico para não bloquear UX imediata (opcional)
            // const decoded = jwtDecode(tokenStr);
            // setUser(decoded); // Se quiser mostrar algo rápido

            // 2. Busca dados completos da API (/me)
            // Precisamos importar o sysAdminApiClient (ou criar um client genérico, mas sysAdminClient pode não ter o header correto setado ainda se não for singleton com interceptor dinâmico)
            // Melhor usar fetch direto ou garantir que o client use o token passado
            const response = await fetch('http://localhost:8000/auth/users/me', {
                headers: { 'Authorization': `Bearer ${tokenStr}` }
            });

            if (response.ok) {
                const fullUser = await response.json();
                // Garante que profile venha correto (priority: Role Name > Profile > 'sales_rep')
                // Mas o backend já manda role_obj.
                setUser(fullUser);
            } else {
                // Fallback para o token decode se API falhar? Ou logout?
                // Se falhar /me, provavelmente token inválido ou erro server. Melhor logout ou retry.
                console.error("Erro ao hidratar usuário via /me", response.status);
                const decoded = jwtDecode(tokenStr);
                setUser(decoded); // Fallback parcial
            }
        } catch (err) {
            console.error("Erro fetch /me", err);
            // Fallback
            const decoded = jwtDecode(tokenStr);
            setUser(decoded);
        }
    }

    useEffect(() => {
        const recoverUser = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    const decoded = jwtDecode(storedToken);
                    const currentTime = Date.now() / 1000;
                    if (decoded.exp && decoded.exp < currentTime) {
                        logout();
                    } else {
                        setToken(storedToken);
                        // AQUI: Chama hidratação em vez de apenas setUser(decoded)
                        await hydrateUserData(storedToken);
                    }
                } catch (error) {
                    console.error("Token inválido", error);
                    logout();
                }
            }
            setLoading(false);
        };

        recoverUser();
    }, []);

    const login = async (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        // AQUI: Chama hidratação também
        await hydrateUserData(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            authenticated: !!user,
            user,
            token,
            userProfile: user?.profile,
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