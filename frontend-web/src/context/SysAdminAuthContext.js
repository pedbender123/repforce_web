import React, { createContext, useContext, useState, useEffect } from 'react';
import sysAdminApiClient from '../api/sysAdminApiClient'; 
import { jwtDecode } from 'jwt-decode';

const SYSADMIN_TOKEN_KEY = 'sysadmin_token';

// CORREÇÃO: Adicionado 'export' aqui. Isso resolve o erro do build.
export const SysAdminAuthContext = createContext(null);

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

      const response = await sysAdminApiClient.post('/auth/sysadmin/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      const decodedToken = jwtDecode(access_token);
      const profile = decodedToken.profile;

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