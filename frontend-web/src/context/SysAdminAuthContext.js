import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { jwtDecode } from 'jwt-decode';

// CHAVE SEPARADA NO LOCALSTORAGE
const SYSADMIN_TOKEN_KEY = 'sysadmin_token';

const SysAdminAuthContext = createContext(null);

export const useSysAdminAuth = () => useContext(SysAdminAuthContext);

export const SysAdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem(SYSADMIN_TOKEN_KEY));
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem(SYSADMIN_TOKEN_KEY);
        if (storedToken) {
          const decodedToken = jwtDecode(storedToken);
          
          if (decodedToken.exp * 1000 < Date.now()) {
            throw new Error("Token expirado");
          }

          // AQUI NÃO PRECISAMOS SETAR O apiClient DEFAULT
          // O apiClient do SysAdmin será separado.
          setToken(storedToken);
          setUserProfile(decodedToken.profile);
        } else {
          setToken(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Falha ao inicializar auth SysAdmin:", error.message);
        localStorage.removeItem(SYSADMIN_TOKEN_KEY);
        setToken(null);
        setUserProfile(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      // BATE NO ENDPOINT SEPARADO
      const response = await apiClient.post('/auth/sysadmin/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      const decodedToken = jwtDecode(access_token);
      const profile = decodedToken.profile;

      // Salva no localStorage com a chave separada
      localStorage.setItem(SYSADMIN_TOKEN_KEY, access_token);
      setToken(access_token);
      setUserProfile(profile);

      return profile;
    } catch (error) {
      console.error('Erro no login SysAdmin:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(SYSADMIN_TOKEN_KEY);
    setToken(null);
    setUserProfile(null);
    // O PrivateRoute cuidará do redirecionamento
  };

  const value = {
    token,
    userProfile,
    login,
    logout,
    isLoadingAuth,
  };

  return <SysAdminAuthContext.Provider value={value}>{children}</SysAdminAuthContext.Provider>;
};