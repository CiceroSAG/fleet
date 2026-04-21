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
import RealTimeTracking from './pages/RealTimeTracking';
import DriverBehavior from './pages/DriverBehavior';
import FuelManagement from './pages/FuelManagement';
import MaintenanceScheduling from './pages/MaintenanceScheduling';
import ComplianceRegistry from './pages/ComplianceRegistry';
import AssetUtilization from './pages/AssetUtilization';
import Reports from './pages/Reports';
import PartsInventory from './pages/PartsInventory';
import UserManagement from './pages/UserManagement';
import Technicians from './pages/Technicians';
import FieldServiceReports from './pages/FieldServiceReports';
import Inspections from './pages/Inspections';
import Workshop from './pages/Workshop';
import TireInventory from './pages/TireInventory';
import OperatorScorecards from './pages/OperatorScorecards';
import InstallPWA from './components/InstallPWA';
import CommandPalette from './components/CommandPalette';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: import.meta.env.VITE_SUPABASE_URL ? 3 : false,
      refetchOnWindowFocus: false,
    },
  },
});

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
          <InstallPWA />
          <CommandPalette />
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
              <Route path="parts" element={<PartsInventory />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="repairs" element={<Repairs />} />
              <Route path="incidents" element={<Incidents />} />
              <Route path="settings" element={<Settings />} />
              <Route path="tracking" element={<RealTimeTracking />} />
              <Route path="driver-behavior" element={<DriverBehavior />} />
              <Route path="fuel-management" element={<FuelManagement />} />
              <Route path="maintenance-scheduling" element={<MaintenanceScheduling />} />
              <Route path="compliance" element={<ComplianceRegistry />} />
              <Route path="operator-scorecards" element={<OperatorScorecards />} />
              <Route path="utilization" element={<AssetUtilization />} />
              <Route path="reports" element={<Reports />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="technicians" element={<Technicians />} />
              <Route path="field-service-reports" element={<FieldServiceReports />} />
              <Route path="inspections" element={<Inspections />} />
              <Route path="workshop" element={<Workshop />} />
              <Route path="tires" element={<TireInventory />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}




