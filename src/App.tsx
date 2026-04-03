/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/EquipmentList';
import EquipmentDetails from './pages/EquipmentDetails';
import OperatorsList from './pages/OperatorsList';
import FuelLogs from './pages/FuelLogs';
import Maintenance from './pages/Maintenance';
import Repairs from './pages/Repairs';
import Incidents from './pages/Incidents';
import Settings from './pages/Settings';
import Login from './pages/Login';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!session) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="equipment" element={<EquipmentList />} />
              <Route path="equipment/:id" element={<EquipmentDetails />} />
              <Route path="operators" element={<OperatorsList />} />
              <Route path="fuel" element={<FuelLogs />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="repairs" element={<Repairs />} />
              <Route path="incidents" element={<Incidents />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}




