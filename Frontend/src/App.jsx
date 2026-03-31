import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResidentPage from './pages/resident/ResidentPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import BuildingManagement from './pages/admin/BuildingManagement';
import ApartmentManagement from './pages/admin/ApartmentManagement';
import ServiceManagement from './pages/admin/ServiceManagement';
import TechnicianManagement from './pages/admin/TechnicianManagement';
import AccountManagement from './pages/admin/AccountManagement';
import ResidentManagement from './pages/admin/ResidentManagement';
import UtilityManagement from './pages/admin/UtilityManagement';
import ContractManagement from './pages/admin/ContractManagement';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import InvoiceManagement from './pages/admin/InvoiceManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import ResidentDashboard from './pages/resident/ResidentDashboard';
import ResidentLayout from './components/ResidentLayout';
import ResidentProfile from './pages/resident/ResidentProfile';

import FirstLoginSetup from './pages/FirstLoginSetup';
import MaintenanceRequest from './pages/resident/MaintenanceRequest';

function App() {
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'role') {
        const newRole = e.newValue;

        if (!newRole) {
          window.location.href = '/login';
          return;
        }
        const roleRoutes = {
          'Manager': '/admin',
          'Resident': '/resident',
          'Technician': '/technician'
        };
        window.location.href = roleRoutes[newRole] || '/';
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/first-login-setup" element={<FirstLoginSetup />} />
        </Route>
        <Route element={<ProtectedRoute allowedRole="Resident" />}>
          <Route path="/resident" element={<ResidentLayout />}>
            <Route index element={<ResidentPage />} />
            <Route path="dashboard" element={<ResidentDashboard />} />
            <Route path="profile" element={<ResidentProfile />} />

            <Route path="maintenance" element={<MaintenanceRequest />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRole="Manager" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="buildings" element={<BuildingManagement />} />
            <Route path="apartments" element={<ApartmentManagement />} />
            <Route path="services" element={<ServiceManagement />} />
            <Route path="accounts" element={<AccountManagement />} />
            <Route path="technicians" element={<TechnicianManagement />} />
            <Route path="residents" element={<ResidentManagement />} />
            <Route path="utilities" element={<UtilityManagement />} />
            <Route path="contracts" element={<ContractManagement />} />
            <Route path="invoices" element={<InvoiceManagement />} />
            <Route path="payments" element={<PaymentManagement />} />
          </Route>
        </Route>
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </BrowserRouter>
  );
}
export default App;