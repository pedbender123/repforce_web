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

    useEffect(() => {
        const recoverUser = () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    const decoded = jwtDecode(storedToken);
                    const currentTime = Date.now() / 1000;
                    if (decoded.exp && decoded.exp < currentTime) {
                        logout();
                    } else {
                        setToken(storedToken);
                        setUser(decoded);
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

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        try {
            const decoded = jwtDecode(newToken);
            setUser(decoded);
        } catch (error) {
            console.error("Erro ao decodificar token no login", error);
        }
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
            isLoadingAuth: loading 
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