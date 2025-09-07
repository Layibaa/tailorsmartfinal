// admin-web/src/components/ConnectionTest.js - Test API connectivity
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConnectionTest = () => {
  const [tests, setTests] = useState({});
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

  const runTests = async () => {
    setLoading(true);
    const results = {};

    // Test 1: Basic connectivity
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test', password: 'test' })
      });
      
      results.connectivity = {
        success: true,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      results.connectivity = {
        success: false,
        error: error.message
      };
    }

    // Test 2: Login with demo credentials
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@tailorsmart.com',
        password: 'admin123'
      });
      
      results.adminLogin = {
        success: true,
        data: response.data
      };
    } catch (error) {
      results.adminLogin = {
        success: false,
        error: error.response?.data || error.message
      };
    }

    // Test 3: Check environment
    results.environment = {
      apiUrl: API_URL,
      nodeEnv: process.env.NODE_ENV,
      reactAppApiUrl: process.env.REACT_APP_API_URL
    };

    setTests(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const formatResult = (test) => {
    if (typeof test === 'object') {
      return <pre className="text-xs">{JSON.stringify(test, null, 2)}</pre>;
    }
    return test;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">API Connection Test</h2>
          <button
            onClick={runTests}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Run Tests'}
          </button>
        </div>

        {Object.entries(tests).map(([testName, result]) => (
          <div key={testName} className="mb-6 p-4 border rounded">
            <h3 className="font-semibold mb-2 capitalize">
              {testName.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            
            {testName === 'environment' ? (
              <div className="space-y-1 text-sm">
                <div><strong>API URL:</strong> {result.apiUrl}</div>
                <div><strong>Node Env:</strong> {result.nodeEnv || 'undefined'}</div>
                <div><strong>React App API URL:</strong> {result.reactAppApiUrl || 'undefined'}</div>
              </div>
            ) : (
              <div className={`p-3 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? '✅ Success' : '❌ Failed'}
                </div>
                <div className="mt-2">
                  {formatResult(result.success ? result : result.error)}
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="mt-6 p-4 bg-yellow-50 rounded">
          <h3 className="font-semibold text-yellow-800 mb-2">Troubleshooting Tips:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Make sure your server is running on http://localhost:8000</li>
            <li>• Check if the .env file has REACT_APP_API_URL=http://localhost:8000/api/v1</li>
            <li>• Verify that admin users exist (run: npm run seed in server directory)</li>
            <li>• Check browser console for CORS errors</li>
            <li>• Ensure MongoDB is running and connected</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConnectionTest;