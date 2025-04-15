// App.js
import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Layout from './components/Layout';
import { Dashboard } from './Pages/Dashboard';
import { Clock } from './Pages/Clock';
import { Logs } from './Pages/Logs';
import { Analytics } from './Pages/Analytics';
import Login from './Pages/login';
import { useAuth } from './context/useAuth';
import { useQuery, useMutation, gql } from "@apollo/client";
import Profile from './Pages/Profile';
const CREATE_USER = gql`
  mutation CreateUser($name: String!, $email: String!, $password: String, $role: String) {
    createUser(name: $name, email: $email, password: $password, role: $role) {
      user_id
      role
      token
    }
  }
`;
function App() {
  const { isAuthenticated, getAccessTokenSilently, user, isLoading } = useAuth0();
  const [userRole, setUserRole] = useState("");
const {login,role}=useAuth();

const [createUser, { loading: createLoading, error: createError }] = useMutation(CREATE_USER, {
  onCompleted: (data) => {
    
    const { user_id, token, role } = data.createUser;
    login(user_id, token, role); // Store token in LiefContext
  },
});



  useEffect(() => {
    if (isAuthenticated && user && !userRole) {
      const getAccessTokenAndFetchRole = async () => {
        try {
          // const accessToken = await getAccessTokenSilently();
          const name = user.name || user.nickname || user.given_name || "Unknown User";
          const variables = {
            name,
            email: user.email,
            role: "careworker",
            password: null,
          };
          console.log("Sending createUser mutation with variables:", variables);

          // Optional: Log Auth0 token for debugging
          const accessToken = await getAccessTokenSilently();
          console.log("Auth0 Access Token:", accessToken);

          await createUser({ variables });
        
        } catch (error) {
          console.error('Error getting access token:', error);
        }
      };
      getAccessTokenAndFetchRole();
    }
  }, [isAuthenticated, getAccessTokenSilently, user, userRole]);

  const router = createBrowserRouter([
    {
      path: '/',
      element:  <Layout/> ,
      children: [
        {
          path: 'dashboard',
          element: isAuthenticated && role === 'manager' ? <Dashboard /> : <Navigate to="/clock" replace />,
        },
        {
          path: 'clock',
          element: isAuthenticated ? <Clock /> : <Navigate to="/login" replace />,
        },
        {
          path: 'logs',
          element: isAuthenticated && role === 'manager' ? <Logs /> : <Navigate to="/clock" replace />,
        },
       
        {
          path: 'profile',
          element: isAuthenticated ? <Profile /> : <Navigate to="/login" replace />,
        },
        {
          path: 'analytics',
          element: isAuthenticated && role === 'manager' ? <Analytics /> : <Navigate to="/clock" replace />,
        },
      ],
    },
    {
      path: '/login',
      element: <div className="flex justify-center items-center h-screen"><Login /></div>,
    },
  ]);



  return <RouterProvider router={router} />;
}

export default App;