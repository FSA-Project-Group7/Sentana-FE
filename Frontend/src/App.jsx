import React from 'react';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/resident" element={<ResidentPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="buildings" element={<BuildingManagement />} />
          <Route path="apartments" element={<ApartmentManagement />} />
          <Route path="services" element={<ServiceManagement />} />
          <Route path="accounts" element={<AccountManagement />} />
          <Route path="technicians" element={<TechnicianManagement />} />
          <Route path="residents" element={<ResidentManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;