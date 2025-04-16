// components/Navbar.js
import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useAuth } from '../../src/Context/useAuth';
function Navbar() {
  const { isAuthenticated, getAccessTokenSilently, logout } = useAuth0();
  const [userRole, setUserRole] = useState(null);
  const [navLinks, setNavLinks] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const {userId, token, role}=useAuth();
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated) {
        try {
          const accessToken = await getAccessTokenSilently();
          const response = await axios.get('/api/user', { // Your backend API endpoint
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          setUserRole(response.data.role);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    if (role === 'manager') {
      setNavLinks([
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/logs', label: 'Logs' },
        { to: '/analytics', label: 'Analytics' },
        { to: '/profile', label: 'Profile' },
      ]);
    } else {
      setNavLinks([
        { to: '/clock', label: 'Clock In' },
        { to: '/profile', label: 'Profile' },
      ]);
    }
  }, [role]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow text-blue-800 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src='/logo.png' className='h-10 w-10 mr-2'/>
              <span className="font-semibold text-xl text-blue-800">Hr-Portal</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-gray-700 hover:text-indigo-500 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && (
                <button
                  onClick={() => logout({ returnTo: window.location.origin })}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Log Out
                </button>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={toggleMobileMenu}
              type="button"
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-blue-800`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="bg-blue-900 text-gray-100 block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <button
              onClick={() =>{localStorage.clear(); logout({ returnTo: window.location.origin })}}
              className="bg-red-500 hover:bg-red-700 text-white block w-full text-left py-2 px-3 rounded-md font-medium focus:outline-none focus:shadow-outline"
            >
              Log Out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;