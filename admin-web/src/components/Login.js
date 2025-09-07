// admin-web/src/components/Login.js - Enhanced with debugging
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login form submitted with:', { email, password: '***' });
    
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login...');
      const result = await login(email, password);
      console.log('Login result:', result);
      
      if (!result.success) {
        console.error('Login failed:', result.error);
        setError(result.error);
      } else {
        console.log('Login successful, should redirect now...');
      }
    } catch (err) {
      console.error('Login error caught:', err);
      setError(err.message || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Panel
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your admin account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="admin@tailorsmart.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="text-center">
          <div className="text-sm text-gray-600">
            <strong>Demo credentials:</strong><br />
            Superadmin: superadmin@tailorsmart.com / admin123<br />
            Admin: admin@tailorsmart.com / admin123
          </div>
        </div>

        {/* Debug info - remove in production */}
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <strong>Debug Info:</strong><br />
          API URL: {process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}<br />
          Current URL: {window.location.href}
        </div>
      </div>
    </div>
  );
};

export default Login;