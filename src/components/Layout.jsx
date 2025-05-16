import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';

function Layout() {
  return (
    <div className="min-h-screen bg-gray-200">
      <NavBar />
      <main className="w-full px-1 py-1">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
