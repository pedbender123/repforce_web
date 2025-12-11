import React, { createContext, useContext, useState } from 'react';
import sysAdminApiClient from '../api/sysAdminApiClient';
import { jwtDecode } from 'jwt-decode';

const SysAdminAuthContext = createContext();
export const useSysAdminAuth = () => useContext(SysAdminAuthContext);

export const SysAdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('sysadmin_token'));
  const [userProfile, setUserProfile] = useState(token ? jwtDecode(token).profile : null);

  const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const { data } = await sysAdminApiClient.post('/auth/sysadmin/token', formData);
    localStorage.setItem('sysadmin_token', data.access_token);
    setToken(data.access_token);
    setUserProfile('sysadmin');
  };

  const logout = () => {
    localStorage.removeItem('sysadmin_token');
    setToken(null);
    setUserProfile(null);
  };

  return <SysAdminAuthContext.Provider value={{ token, userProfile, login, logout }}>{children}</SysAdminAuthContext.Provider>;
};