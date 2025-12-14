import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          const decodedToken = jwtDecode(storedToken);
          
          if (decodedToken.exp * 1000 < Date.now()) {
            throw new Error("Token expirado");
          }

          // Este é o apiClient PADRÃO
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setToken(storedToken);
          setUserProfile(decodedToken.profile);
        } else {
          setToken(null);
          setUserProfile(null);
          delete apiClient.defaults.headers.common['Authorization'];
        }
      } catch (error) {
        console.error("Falha ao inicializar autenticação:", error.message);
        localStorage.removeItem('token');
        setToken(null);
        setUserProfile(null);
        delete apiClient.defaults.headers.common['Authorization'];
      } finally {
        setIsLoadingAuth(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => { // Manteve 'email' aqui, mas o back usa 'username'
    // ATENÇÃO: O FORM de login normal agora deve enviar 'username'
    // Vamos manter a variável como 'email' aqui por enquanto,
    // mas ela será o 'username' no backend.
    try {
      const formData = new URLSearchParams();
      formData.append('username', email); // O backend espera 'username'
      formData.append('password', password);

      // Bate no endpoint /auth/token (o normal)
      const response = await apiClient.post('/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      const decodedToken = jwtDecode(access_token);
      const profile = decodedToken.profile;

      localStorage.setItem('token', access_token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setToken(access_token);
      setUserProfile(profile);

      return profile; 
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUserProfile(null);
    delete apiClient.defaults.headers.common['Authorization'];
    window.location.replace('/login'); // Força ida ao login normal
  };

  const value = {
    token,
    userProfile,
    login,
    logout,
    isLoadingAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};