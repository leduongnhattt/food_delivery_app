import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';

interface RegistryStatus {
  success: boolean;
  message: string;
  counts?: {
    restaurants: number;
    foods: number;
    categories: number;
  };
  error?: string;
}

const DataRegistry: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<RegistryStatus | null>(null);
  const [currentCounts, setCurrentCounts] = useState<{
    restaurants: number;
    foods: number;
    categories: number;
  } | null>(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/registry', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setCurrentCounts(data.counts);
      setStatus({
        success: data.success,
        message: data.message,
        counts: data.counts
      });
    } catch (error) {
      setStatus({
        success: false,
        message: 'Failed to check database status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const registerData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/registry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setStatus({
        success: data.success,
        message: data.message,
        counts: data.data
      });
      
      if (data.success) {
        setCurrentCounts(data.data);
      }
    } catch (error) {
      setStatus({
        success: false,
        message: 'Failed to register sample data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearStatus = () => {
    setStatus(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            🗄️ Database Registry
          </CardTitle>
          <p className="text-gray-600">
            Manage sample data for restaurants, foods, and categories
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Current Database Status</h3>
            {currentCounts ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{currentCounts.restaurants}</div>
                  <div className="text-sm text-gray-600">Restaurants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{currentCounts.foods}</div>
                  <div className="text-sm text-gray-600">Foods</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{currentCounts.categories}</div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Click "Check Status" to see current data</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={checkStatus}
              disabled={loading}
              className="flex-1"
              variant="outline"
            >
              {loading ? <Loading /> : 'Check Status'}
            </Button>
            <Button
              onClick={registerData}
              disabled={loading}
              className="flex-1"
              variant="default"
            >
              {loading ? <Loading /> : 'Register Sample Data'}
            </Button>
          </div>

          {/* Status Message */}
          {status && (
            <div className={`p-4 rounded-lg ${
              status.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className={`font-semibold ${
                    status.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {status.success ? '✅ Success' : '❌ Error'}
                  </h4>
                  <p className={`mt-1 ${
                    status.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {status.message}
                  </p>
                  {status.counts && (
                    <div className="mt-2 text-sm">
                      <p>Registered: {status.counts.restaurants} restaurants, {status.counts.foods} foods, {status.counts.categories} categories</p>
                    </div>
                  )}
                  {status.error && (
                    <p className="mt-1 text-sm text-red-600">
                      Error: {status.error}
                    </p>
                  )}
                </div>
                <button
                  onClick={clearStatus}
                  className="text-gray-400 hover:text-gray-600 ml-4"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Check Status:</strong> View current data counts in the database</li>
              <li>• <strong>Register Sample Data:</strong> Add sample restaurants, foods, and categories</li>
              <li>• Data will only be registered if the database is empty</li>
              <li>• This is useful for development and testing purposes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataRegistry;
