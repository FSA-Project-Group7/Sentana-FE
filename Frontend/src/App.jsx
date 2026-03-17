import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import ResidentPage from './pages/ResidentPage';
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

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<ProtectedRoute allowedRole="Resident" />}>
          <Route path="/resident" element={<ResidentPage />} />
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
    </BrowserRouter>
  );
}
export default App;