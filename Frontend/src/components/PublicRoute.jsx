import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (token && role) {
    const roleRoutes = {
      'Manager': '/admin',
      'Resident': '/resident',
      'Technician': '/technician'
    };
    
    return <Navigate to={roleRoutes[role] || '/'} replace />;
  }
  return <Outlet />;
};

export default PublicRoute;