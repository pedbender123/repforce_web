import React, { useState } from 'react';
import { useSysAdminAuth } from '../../context/SysAdminAuthContext';
import { useNavigate } from 'react-router-dom';

export default function SysAdminLogin() {
  const { login } = useSysAdminAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ username: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(data.username, data.password);
      navigate('/sysadmin/dashboard');
    } catch (err) {
      alert('Acesso negado');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-lg w-96 border-t-4 border-red-600">
        <h2 className="text-2xl font-bold mb-6 text-center text-red-600">SysAdmin Access</h2>
        <input className="w-full border p-2 mb-4 rounded" placeholder="Admin User" onChange={e => setData({...data, username: e.target.value})} />
        <input className="w-full border p-2 mb-6 rounded" type="password" placeholder="Password" onChange={e => setData({...data, password: e.target.value})} />
        <button className="w-full bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700">Acessar Sistema</button>
      </form>
    </div>
  );
}