import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';

// Ícone de placeholder para o logo
const LogoPlaceholder = () => (
  <div className="text-center">
    <span className="text-4xl font-bold text-repforce-primary tracking-wider">
      REPFORCE
    </span>
    {/* O círculo azul vibrante no 'O' pode ser feito com CSS, 
        mas um SVG ou texto simples é mais fácil aqui. */}
  </div>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login, token, userProfile } = useAuth();
  const navigate = useNavigate();

  // Se já estiver logado, redireciona
  if (token) {
    const redirectTo = userProfile === 'admin' ? '/admin' : '/app';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const profile = await login(email, password);
      // Redireciona com base no perfil
      const redirectTo = profile === 'admin' ? '/admin' : '/app';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError('Falha no login. Verifique seu e-mail e senha.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Lado Esquerdo: Imagem ou Cor Sólida (Identidade Visual) */}
      <div className="hidden lg:flex lg:w-1/2 bg-repforce-dark items-center justify-center p-12">
        <div className="text-white text-left max-w-md">
          <h1 className="text-5xl font-bold mb-6">
            Tecnologia que entende quem vende.
          </h1>
          <p className="text-xl text-gray-300">
            Acesse seu painel para organizar rotas, acompanhar clientes e controlar tudo que importa.
          </p>
        </div>
      </div>

      {/* Lado Direito: Formulário de Login */}
      <div className="flex-1 flex flex-col justify-center items-center bg-repforce-light lg:w-1/2 p-8">
        <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-lg shadow-xl">
          <div className="mb-10">
            <LogoPlaceholder />
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
            Acesse sua conta
          </h2>

          <form onSubmit={handleSubmit}>
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700"
              >
                E-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary"
                />
              </div>
            </div>

            <div className="mt-4">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700"
              >
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-8">
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-repforce-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-repforce-primary"
              >
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}