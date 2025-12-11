import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ username: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(data.username, data.password);
      navigate('/app');
    } catch (err) {
      alert('Login falhou');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-200">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">RepForce Login</h2>
        <input className="w-full border p-2 mb-4 rounded" placeholder="Usuário" onChange={e => setData({...data, username: e.target.value})} />
        <input className="w-full border p-2 mb-6 rounded" type="password" placeholder="Senha" onChange={e => setData({...data, password: e.target.value})} />
        <button className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Entrar</button>
      </form>
    </div>
  );
}