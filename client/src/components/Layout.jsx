// components/MainLayout.js
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth0 } from '@auth0/auth0-react';
function Layout() {
  const { isAuthenticated } = useAuth0();
  const navigate=useNavigate();
  if (!isAuthenticated)navigate("/login")
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
    {isAuthenticated && <Navbar/>}
      <main className="flex-grow pt-14 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;