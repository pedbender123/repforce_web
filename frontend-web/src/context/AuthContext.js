import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

// Exportação NOMEADA (Isso corrige o erro do build)
export const AuthContext = createContext({});

// Exportação do Provider
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const recoverUser = () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Tenta decodificar o token se existir
                    const decoded = jwtDecode(token);
                    // Verifica se o token não expirou (opcional, mas recomendado)
                    const currentTime = Date.now() / 1000;
                    if (decoded.exp && decoded.exp < currentTime) {
                        logout();
                    } else {
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

    const login = (token) => {
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        setUser(decoded);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ authenticated: !!user, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};