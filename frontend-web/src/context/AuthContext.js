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
          // Decodifica o token para pegar o perfil
          const decodedToken = jwtDecode(storedToken);
          
          // Verifica se o token expirou
          if (decodedToken.exp * 1000 < Date.now()) {
            throw new Error("Token expirado");
          }

          // Configura o token no apiClient e no estado
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setToken(storedToken);
          setUserProfile(decodedToken.profile);
        } else {
          // Garante que o estado está limpo se não houver token
          setToken(null);
          setUserProfile(null);
          delete apiClient.defaults.headers.common['Authorization'];
        }
      } catch (error) {
        // Se o token for inválido ou expirado, limpa tudo
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
  }, []); // Executa apenas na montagem inicial

  const login = async (email, password) => {
    try {
      // O backend espera dados de formulário (OAuth2PasswordRequestForm)
      const formData = new URLSearchParams();
      formData.append('username', email); // 'username' é o email
      formData.append('password', password);

      const response = await apiClient.post('/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      
      // Decodifica o token para extrair o perfil
      const decodedToken = jwtDecode(access_token);
      const profile = decodedToken.profile;

      // Salva no localStorage, no estado e no header do apiClient
      localStorage.setItem('token', access_token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setToken(access_token);
      setUserProfile(profile);

      return profile; // Retorna o perfil para o componente de Login redirecionar
    } catch (error) {
      console.error('Erro no login:', error);
      throw error; // Lança o erro para a página de Login tratar
    }
  };

  const logout = () => {
    // Limpa tudo
    localStorage.removeItem('token');
    setToken(null);
    setUserProfile(null);
    delete apiClient.defaults.headers.common['Authorization'];
    // Redireciona para /login (o PrivateRoute cuidará disso)
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